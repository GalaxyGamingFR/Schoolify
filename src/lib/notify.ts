// Plain server-side helper (no "use server") -- imported only from other
// server action files, never from client components, so this never becomes
// a directly-callable action itself (nothing stops an arbitrary caller from
// passing any userId otherwise).
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

type PreferenceField = "notifyOnMessage" | "notifyOnGuardianship" | "notifyOnSchoolInvite" | "notifyOnBroadcast";

const PREFERENCE_FIELD: Record<NotificationType, PreferenceField> = {
  MESSAGE: "notifyOnMessage",
  GUARDIANSHIP_REQUEST: "notifyOnGuardianship",
  GUARDIANSHIP_ACCEPTED: "notifyOnGuardianship",
  SCHOOL_INVITE: "notifyOnSchoolInvite",
  BROADCAST: "notifyOnBroadcast",
};

const PREFERENCE_SELECT = {
  notifyOnMessage: true,
  notifyOnGuardianship: true,
  notifyOnSchoolInvite: true,
  notifyOnBroadcast: true,
} as const;

export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  link: string,
  body?: string,
) {
  const field = PREFERENCE_FIELD[type];
  const user = await prisma.user.findUnique({ where: { id: userId }, select: PREFERENCE_SELECT });
  if (!user || !user[field]) return;

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

  const field = PREFERENCE_FIELD[type];
  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, ...PREFERENCE_SELECT },
  });
  const optedIn = users.filter((u) => u[field]).map((u) => u.id);
  if (optedIn.length === 0) return;

  await prisma.notification.createMany({
    data: optedIn.map((userId) => ({ userId, type, title, link, body })),
  });
}
