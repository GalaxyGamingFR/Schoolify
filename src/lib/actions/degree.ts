"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";

export async function createDegreeRequirement(input: {
  label: string;
  category?: string;
  creditsRequired: number;
  requiresId?: string;
}) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (!input.label.trim()) throw new Error("Label is required");
  if (!(input.creditsRequired > 0)) throw new Error("Credits required must be greater than 0");

  if (input.requiresId) {
    const prereq = await prisma.degreeRequirement.findFirst({
      where: { id: input.requiresId, userId: user.id },
    });
    if (!prereq) throw new Error("Prerequisite not found");
  }

  await prisma.degreeRequirement.create({
    data: {
      userId: user.id,
      label: input.label.trim(),
      category: input.category?.trim() || null,
      creditsRequired: input.creditsRequired,
      requiresId: input.requiresId || null,
    },
  });

  revalidatePath("/degree");
}

export async function updateCreditsCompleted(requirementId: string, creditsCompleted: number) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (creditsCompleted < 0) throw new Error("Credits completed can't be negative");

  await prisma.degreeRequirement.updateMany({
    where: { id: requirementId, userId: user.id },
    data: { creditsCompleted },
  });

  revalidatePath("/degree");
}

export async function deleteDegreeRequirement(requirementId: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");

  // requiresId is ON DELETE SET NULL (see the migration), so deleting a
  // requirement that another one lists as a prerequisite just clears that
  // link rather than failing — no cascade surprises to guard against here.
  await prisma.degreeRequirement.deleteMany({ where: { id: requirementId, userId: user.id } });

  revalidatePath("/degree");
}
