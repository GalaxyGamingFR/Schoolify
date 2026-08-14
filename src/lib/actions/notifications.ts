"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";

export async function getUnreadNotificationCount() {
  const user = await getCurrentDbUser();
  if (!user) return 0;
  return prisma.notification.count({ where: { userId: user.id, readAt: null } });
}

export async function getNotifications() {
  const user = await getCurrentDbUser();
  if (!user) return [];
  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationRead(notificationId: string) {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Not signed in");

  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/notifications");
}
