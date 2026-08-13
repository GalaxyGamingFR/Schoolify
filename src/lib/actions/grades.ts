"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";

async function assertOwnsCourse(userId: string, courseId: string) {
  const owned = await prisma.course.findFirst({
    where: { id: courseId, enrollments: { some: { studentId: userId } } },
    select: { id: true },
  });
  if (!owned) throw new Error("Not your course");
}

export async function createGradeCategory(input: {
  courseId: string;
  name: string;
  weight: number;
  dropLowestN: number;
}) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (!input.name.trim()) throw new Error("Name is required");
  await assertOwnsCourse(user.id, input.courseId);

  await prisma.gradeCategory.create({
    data: {
      courseId: input.courseId,
      name: input.name.trim(),
      weight: input.weight,
      dropLowestN: input.dropLowestN,
    },
  });

  revalidatePath(`/courses/${input.courseId}/grades`);
  revalidatePath("/grades");
}

export async function deleteGradeCategory(categoryId: string, courseId: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  await assertOwnsCourse(user.id, courseId);

  await prisma.gradeCategory.delete({ where: { id: categoryId } });

  revalidatePath(`/courses/${courseId}/grades`);
  revalidatePath("/grades");
}

export async function createGradeEntry(input: {
  categoryId: string;
  courseId: string;
  label: string;
  pointsEarned: number;
  pointsPossible: number;
}) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (!input.label.trim()) throw new Error("Label is required");
  if (input.pointsPossible <= 0) throw new Error("Points possible must be greater than 0");
  await assertOwnsCourse(user.id, input.courseId);

  await prisma.gradeEntry.create({
    data: {
      categoryId: input.categoryId,
      label: input.label.trim(),
      pointsEarned: input.pointsEarned,
      pointsPossible: input.pointsPossible,
    },
  });

  revalidatePath(`/courses/${input.courseId}/grades`);
  revalidatePath("/grades");
}

export async function deleteGradeEntry(entryId: string, courseId: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  await assertOwnsCourse(user.id, courseId);

  await prisma.gradeEntry.delete({ where: { id: entryId } });

  revalidatePath(`/courses/${courseId}/grades`);
  revalidatePath("/grades");
}
