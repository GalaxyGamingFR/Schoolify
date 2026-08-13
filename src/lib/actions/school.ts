"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";
import { emailDomain, generateJoinCode, matchesSchoolDomain, normalizeDomain } from "@/lib/school";
import { enforceRateLimit, joinCodeLimiter, sensitiveActionLimiter } from "@/lib/rate-limit";

const MAX_JOIN_CODE_ATTEMPTS = 5;

async function requireActiveStaff(userId: string, schoolId: string) {
  const staff = await prisma.schoolStaff.findFirst({
    where: { schoolId, userId, status: "ACTIVE" },
  });
  if (!staff) throw new Error("You're not staff at this school");
  return staff;
}

/**
 * Registering a school proves the registrant controls *an* inbox at that
 * domain (via Clerk's own email verification, already trusted by
 * User.email) — it does not prove they're actually authorized to represent
 * the institution. See roadmap.md: real school partnerships still need a
 * manual verification step, same honesty pattern as the COPPA gate.
 */
export async function registerSchool(input: { name: string; domain: string }) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  await enforceRateLimit(sensitiveActionLimiter, user.id);
  if (!input.name.trim()) throw new Error("School name is required");

  const domain = normalizeDomain(input.domain);
  if (!domain.includes(".")) throw new Error("Enter a real domain, e.g. lincolnhigh.edu");
  if (emailDomain(user.email) !== domain) {
    throw new Error("Your account email must be on that domain to register the school");
  }

  let school;
  try {
    school = await prisma.$transaction(async (tx) => {
      const created = await tx.school.create({ data: { name: input.name.trim(), domain } });
      await tx.schoolStaff.create({
        data: { schoolId: created.id, userId: user.id, email: user.email, role: "PRINCIPAL", status: "ACTIVE" },
      });
      return created;
    });
  } catch {
    throw new Error("That domain is already registered to a school");
  }

  revalidatePath("/school");
  return school;
}

/** Auto-claims any INVITED staff rows addressed to the current user's email. Call on /school load. */
export async function claimSchoolInvites() {
  const user = await getCurrentDbUser();
  if (!user) return;

  await prisma.schoolStaff.updateMany({
    where: { email: user.email, status: "INVITED", userId: null },
    data: { userId: user.id, status: "ACTIVE" },
  });
}

export async function inviteTeacher(schoolId: string, teacherEmail: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  await enforceRateLimit(sensitiveActionLimiter, user.id);
  const staff = await requireActiveStaff(user.id, schoolId);
  if (staff.role !== "PRINCIPAL") throw new Error("Only a principal can invite teachers");

  const school = await prisma.school.findUniqueOrThrow({ where: { id: schoolId } });
  const email = teacherEmail.trim().toLowerCase();
  if (!matchesSchoolDomain(email, school.domain)) {
    throw new Error(`Teacher email must be on ${school.domain}`);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  try {
    await prisma.schoolStaff.create({
      data: {
        schoolId,
        email,
        role: "TEACHER",
        userId: existingUser?.id,
        status: existingUser ? "ACTIVE" : "INVITED",
      },
    });
  } catch {
    throw new Error("That email is already staff (or invited) at this school");
  }

  revalidatePath(`/school/${schoolId}`);
}

export async function removeStaff(staffId: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");

  const target = await prisma.schoolStaff.findUnique({ where: { id: staffId } });
  if (!target) return;
  await requireActiveStaff(user.id, target.schoolId).then((s) => {
    if (s.role !== "PRINCIPAL") throw new Error("Only a principal can remove staff");
  });

  if (target.role === "PRINCIPAL") {
    const otherPrincipals = await prisma.schoolStaff.count({
      where: { schoolId: target.schoolId, role: "PRINCIPAL", status: "ACTIVE", id: { not: staffId } },
    });
    if (otherPrincipals === 0) throw new Error("A school needs at least one principal");
  }

  await prisma.schoolStaff.delete({ where: { id: staffId } });
  revalidatePath(`/school/${target.schoolId}`);
}

export async function createSchoolCourse(input: { schoolId: string; name: string }) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (!input.name.trim()) throw new Error("Course name is required");
  await requireActiveStaff(user.id, input.schoolId);

  for (let attempt = 0; attempt < MAX_JOIN_CODE_ATTEMPTS; attempt++) {
    try {
      const course = await prisma.course.create({
        data: {
          schoolId: input.schoolId,
          teacherId: user.id,
          name: input.name.trim(),
          joinCode: generateJoinCode(),
        },
      });
      revalidatePath(`/school/${input.schoolId}`);
      return course;
    } catch {
      // joinCode collision — vanishingly rare at 33^6, just retry.
    }
  }
  throw new Error("Couldn't generate a unique join code — try again");
}

export async function regenerateJoinCode(courseId: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !course.schoolId) throw new Error("Course not found");
  const staff = await requireActiveStaff(user.id, course.schoolId);
  if (course.teacherId !== user.id && staff.role !== "PRINCIPAL") {
    throw new Error("Only the course's teacher or a principal can regenerate its code");
  }

  for (let attempt = 0; attempt < MAX_JOIN_CODE_ATTEMPTS; attempt++) {
    try {
      await prisma.course.update({ where: { id: courseId }, data: { joinCode: generateJoinCode() } });
      revalidatePath(`/school/${course.schoolId}`);
      return;
    } catch {
      // collision — retry
    }
  }
  throw new Error("Couldn't generate a unique join code — try again");
}

export async function joinCourseByCode(rawCode: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  // Tighter than the other limiters on purpose — this is the one endpoint
  // where the rate limit is load-bearing security, not just spam control:
  // without it, an account could brute-force guess a valid 6-character
  // join code (33^6 possibilities, but zero cost per guess otherwise).
  await enforceRateLimit(joinCodeLimiter, user.id);

  const code = rawCode.trim().toUpperCase();
  if (!code) throw new Error("Enter a join code");

  const course = await prisma.course.findUnique({
    where: { joinCode: code },
    include: { school: true },
  });
  if (!course || !course.school) throw new Error("No class found for that code");

  if (!matchesSchoolDomain(user.email, course.school.domain)) {
    throw new Error(`Your account email must be on ${course.school.domain} to join this class`);
  }

  try {
    await prisma.enrollment.create({ data: { studentId: user.id, courseId: course.id } });
  } catch {
    throw new Error("You're already enrolled in that class");
  }

  revalidatePath("/courses");
  return course;
}
