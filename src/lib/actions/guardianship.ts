"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";
import { enforceRateLimit, sensitiveActionLimiter } from "@/lib/rate-limit";

// Acceptance authority always sits with the student — it's their data being
// shared, so they're the one who has to consent, regardless of who
// initiated the link. The one exception: a student inviting their own
// parent auto-accepts, because inviting *is* the consent in that direction.
// See roadmap.md Phase 6.

async function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new Error("Enter an email address");
  const target = await prisma.user.findUnique({ where: { email: normalized } });
  if (!target) {
    throw new Error("No Schoolify account found for that email yet — they need to sign up first");
  }
  return target;
}

/** Student invites a parent/guardian by email. Auto-accepted. */
export async function inviteGuardian(parentEmail: string) {
  const student = await getCurrentDbUser();
  if (!student) throw new Error("Not signed in");
  await enforceRateLimit(sensitiveActionLimiter, student.id);

  const parent = await findUserByEmail(parentEmail);
  if (parent.id === student.id) throw new Error("You can't link yourself as your own guardian");

  try {
    await prisma.guardianship.create({
      data: { parentId: parent.id, studentId: student.id, status: "ACCEPTED" },
    });
  } catch {
    throw new Error("That guardian is already linked (or already invited)");
  }

  revalidatePath("/parent");
  revalidatePath("/dashboard");
}

/** Parent requests to link a student by email. Requires the student's acceptance. */
export async function requestStudentLink(studentEmail: string) {
  const parent = await getCurrentDbUser();
  if (!parent) throw new Error("Not signed in");
  await enforceRateLimit(sensitiveActionLimiter, parent.id);

  const student = await findUserByEmail(studentEmail);
  if (student.id === parent.id) throw new Error("You can't link yourself as your own student");

  try {
    await prisma.guardianship.create({
      data: { parentId: parent.id, studentId: student.id, status: "PENDING" },
    });
  } catch {
    throw new Error("That student is already linked (or already invited)");
  }

  revalidatePath("/parent");
}

export async function acceptGuardianship(guardianshipId: string) {
  const student = await getCurrentDbUser();
  if (!student) throw new Error("Not signed in");

  await prisma.guardianship.updateMany({
    where: { id: guardianshipId, studentId: student.id, status: "PENDING" },
    data: { status: "ACCEPTED" },
  });

  revalidatePath("/dashboard");
  revalidatePath("/parent");
}

export async function declineGuardianship(guardianshipId: string) {
  const student = await getCurrentDbUser();
  if (!student) throw new Error("Not signed in");

  await prisma.guardianship.deleteMany({
    where: { id: guardianshipId, studentId: student.id, status: "PENDING" },
  });

  revalidatePath("/dashboard");
  revalidatePath("/parent");
}

/** Either side of an accepted (or still-pending) link can remove it at any time. */
export async function removeGuardianship(guardianshipId: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");

  await prisma.guardianship.deleteMany({
    where: { id: guardianshipId, OR: [{ studentId: user.id }, { parentId: user.id }] },
  });

  revalidatePath("/dashboard");
  revalidatePath("/parent");
}
