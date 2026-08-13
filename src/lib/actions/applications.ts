"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";
import type { ApplicationStatus } from "@prisma/client";

async function ownedTarget(userId: string, targetId: string) {
  return prisma.universityTarget.findFirst({ where: { id: targetId, userId } });
}

export async function createUniversityTarget(input: {
  name: string;
  applicationDeadline?: string;
  notes?: string;
}) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (!input.name.trim()) throw new Error("Name is required");

  const target = await prisma.universityTarget.create({
    data: {
      userId: user.id,
      name: input.name.trim(),
      applicationDeadline: input.applicationDeadline ? new Date(input.applicationDeadline) : null,
      notes: input.notes?.trim() || null,
    },
  });

  revalidatePath("/applications");
  return target;
}

export async function updateUniversityStatus(targetId: string, status: ApplicationStatus) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (!(await ownedTarget(user.id, targetId))) return;

  await prisma.universityTarget.update({ where: { id: targetId }, data: { status } });
  revalidatePath("/applications");
}

export async function deleteUniversityTarget(targetId: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (!(await ownedTarget(user.id, targetId))) return;

  await prisma.universityTarget.delete({ where: { id: targetId } });
  revalidatePath("/applications");
}

export async function addApplicationTask(input: { targetId: string; title: string; dueDate?: string }) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (!input.title.trim()) throw new Error("Task title is required");
  if (!(await ownedTarget(user.id, input.targetId))) throw new Error("Not found");

  await prisma.applicationTask.create({
    data: {
      targetId: input.targetId,
      title: input.title.trim(),
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    },
  });

  revalidatePath("/applications");
}

export async function toggleApplicationTask(taskId: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");

  const task = await prisma.applicationTask.findFirst({
    where: { id: taskId, target: { userId: user.id } },
  });
  if (!task) return;

  await prisma.applicationTask.update({ where: { id: taskId }, data: { done: !task.done } });
  revalidatePath("/applications");
}

export async function deleteApplicationTask(taskId: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");

  await prisma.applicationTask.deleteMany({
    where: { id: taskId, target: { userId: user.id } },
  });
  revalidatePath("/applications");
}
