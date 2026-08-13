"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";
import type { AssignmentStatus, AssignmentType, Priority } from "@prisma/client";

export type QuickAddInput = {
  title: string;
  dueAt?: Date;
  courseId?: string | null;
};

// The quick-add flow: title is the only required field, due date defaults
// to today, course defaults to uncategorized. Keeps assignment creation to
// "type, press Enter" per roadmap.md Phase 1.
export async function quickAddAssignment(input: QuickAddInput) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (!input.title.trim()) throw new Error("Title is required");

  await prisma.assignment.create({
    data: {
      userId: user.id,
      title: input.title.trim(),
      dueAt: input.dueAt ?? new Date(),
      courseId: input.courseId || null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  if (input.courseId) revalidatePath(`/courses/${input.courseId}`);
}

export type AssignmentInput = {
  title: string;
  dueAt: Date;
  courseId?: string | null;
  type: AssignmentType;
  priority: Priority;
  estimatedMinutes?: number | null;
};

export async function createAssignment(input: AssignmentInput) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (!input.title.trim()) throw new Error("Title is required");

  await prisma.assignment.create({
    data: {
      userId: user.id,
      title: input.title.trim(),
      dueAt: input.dueAt,
      courseId: input.courseId || null,
      type: input.type,
      priority: input.priority,
      estimatedMinutes: input.estimatedMinutes ?? null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  if (input.courseId) revalidatePath(`/courses/${input.courseId}`);
}

export async function updateAssignmentStatus(assignmentId: string, status: AssignmentStatus) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");

  await prisma.assignment.updateMany({
    where: { id: assignmentId, userId: user.id },
    data: { status },
  });

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/courses/[id]", "page");
}

export async function deleteAssignment(assignmentId: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");

  await prisma.assignment.deleteMany({
    where: { id: assignmentId, userId: user.id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/courses/[id]", "page");
}
