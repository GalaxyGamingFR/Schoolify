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

export async function renameCourse(courseId: string, name: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (!name.trim()) throw new Error("Course name is required");

  await prisma.course.updateMany({
    where: { id: courseId, enrollments: { some: { studentId: user.id } } },
    data: { name: name.trim() },
  });

  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
}

export async function deleteCourse(courseId: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");

  // Only delete if the current user is actually enrolled — enforces
  // ownership without a separate permission lookup. Assignments under the
  // course are uncategorized (courseId set null), not deleted — see the
  // ON DELETE SET NULL in the schema.
  const owned = await prisma.course.findFirst({
    where: { id: courseId, enrollments: { some: { studentId: user.id } } },
    select: { id: true },
  });
  if (!owned) return;

  await prisma.course.delete({ where: { id: courseId } });

  revalidatePath("/courses");
  revalidatePath("/dashboard");
}
