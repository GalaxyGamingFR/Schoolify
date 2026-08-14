"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";
import type { Role } from "@prisma/client";

/** Polled by the syncing screen while waiting for the Clerk user.created webhook to land. */
export async function isAccountSynced() {
  const clerkUser = await currentUser();
  if (!clerkUser) return false;
  const dbUser = await prisma.user.findUnique({ where: { clerkId: clerkUser.id }, select: { id: true } });
  return !!dbUser;
}

export async function completeOnboarding(input: { role: Role; dateOfBirth?: string }) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (input.role !== "STUDENT" && input.role !== "PARENT") {
    throw new Error("Choose Student or Parent to continue");
  }

  // DOB only matters for students (it drives the under-13 gate) — a parent
  // account never collects it, there's nothing to gate on for an adult.
  let dateOfBirth: Date | undefined;
  if (input.role === "STUDENT") {
    if (!input.dateOfBirth) throw new Error("Date of birth is required for a student account");
    dateOfBirth = new Date(input.dateOfBirth);
    if (Number.isNaN(dateOfBirth.getTime())) throw new Error("Invalid date of birth");
    if (dateOfBirth > new Date()) throw new Error("Date of birth can't be in the future");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      role: input.role,
      ...(dateOfBirth ? { dateOfBirth } : {}),
      onboardingCompletedAt: new Date(),
    },
  });

  return { role: input.role };
}
