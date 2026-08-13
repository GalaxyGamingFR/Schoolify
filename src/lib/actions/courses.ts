"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";

export async function createCourse(name: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (!name.trim()) throw new Error("Course name is required");

  const course = await prisma.course.create({
    data: {
      name: name.trim(),
      enrollments: { create: { studentId: user.id } },
    },
  });

  revalidatePath("/courses");
  return course;
}

// A school-managed course (teacherId set — see roadmap.md's school-onboarding
// phase) is owned by its teacher, not by whichever students happen to be
// enrolled — otherwise any classmate could rename or delete the whole
// class's course out from under everyone else. A self-tracked course
// (teacherId null) keeps the original "any enrolled student owns it" rule,
// since for those the enrolled student *is* the sole owner by construction.
function ownershipWhere(courseId: string, userId: string) {
  return {
    id: courseId,
    OR: [{ teacherId: userId }, { teacherId: null, enrollments: { some: { studentId: userId } } }],
  };
}

export async function renameCourse(courseId: string, name: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (!name.trim()) throw new Error("Course name is required");

  await prisma.course.updateMany({
    where: ownershipWhere(courseId, user.id),
    data: { name: name.trim() },
  });

  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
}

export async function deleteCourse(courseId: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");

  // Assignments under the course are uncategorized (courseId set null), not
  // deleted — see the ON DELETE SET NULL in the schema.
  const owned = await prisma.course.findFirst({
    where: ownershipWhere(courseId, user.id),
    select: { id: true },
  });
  if (!owned) return;

  await prisma.course.delete({ where: { id: courseId } });

  revalidatePath("/courses");
  revalidatePath("/dashboard");
}
