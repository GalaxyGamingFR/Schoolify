// Plain server-side helper (no "use server") -- imported only from other
// server action files, never from client components, so this never becomes
// a directly-callable action itself (nothing stops an arbitrary caller from
// passing any userId otherwise).
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  link: string,
  body?: string,
) {
  await prisma.notification.create({ data: { userId, type, title, link, body } });
}

export async function notifyMany(
  userIds: string[],
  type: NotificationType,
  title: string,
  link: string,
  body?: string,
) {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return;
  await prisma.notification.createMany({
    data: unique.map((userId) => ({ userId, type, title, link, body })),
  });
}
