"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";
import type { ActivityCategory } from "@prisma/client";

export async function createActivity(input: {
  title: string;
  organization?: string;
  category: ActivityCategory;
  role?: string;
  description?: string;
  hoursTotal?: number | null;
  startDate?: string;
  endDate?: string;
}) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (!input.title.trim()) throw new Error("Title is required");

  await prisma.activity.create({
    data: {
      userId: user.id,
      title: input.title.trim(),
      organization: input.organization?.trim() || null,
      category: input.category,
      role: input.role?.trim() || null,
      description: input.description?.trim() || null,
      hoursTotal: input.hoursTotal ?? null,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
    },
  });

  revalidatePath("/portfolio");
}

export async function deleteActivity(activityId: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");

  await prisma.activity.deleteMany({ where: { id: activityId, userId: user.id } });
  revalidatePath("/portfolio");
}
