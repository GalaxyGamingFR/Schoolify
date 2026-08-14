"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";

export async function updateDateOfBirth(dateOfBirthRaw: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (user.role !== "STUDENT") throw new Error("Only student accounts track a date of birth");

  const dateOfBirth = new Date(dateOfBirthRaw);
  if (Number.isNaN(dateOfBirth.getTime())) throw new Error("Invalid date of birth");
  if (dateOfBirth > new Date()) throw new Error("Date of birth can't be in the future");

  await prisma.user.update({ where: { id: user.id }, data: { dateOfBirth } });
  revalidatePath("/settings");
}

export async function updateNotificationPreferences(input: {
  notifyOnMessage: boolean;
  notifyOnGuardianship: boolean;
  notifyOnSchoolInvite: boolean;
  notifyOnBroadcast: boolean;
}) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");

  await prisma.user.update({ where: { id: user.id }, data: input });
  revalidatePath("/settings");
}
