"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";

export async function createCalendarEvent(input: {
  title: string;
  startsAt: Date;
  endsAt?: Date;
  location?: string;
}) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");
  if (!input.title.trim()) throw new Error("Title is required");

  const event = await prisma.calendarEvent.create({
    data: {
      userId: user.id,
      title: input.title.trim(),
      startsAt: input.startsAt,
      endsAt: input.endsAt ?? null,
      location: input.location?.trim() || null,
    },
  });

  revalidatePath("/calendar");
  return event;
}

export async function deleteCalendarEvent(id: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");

  await prisma.calendarEvent.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/calendar");
}
