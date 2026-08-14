"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";
import { enforceRateLimit, sensitiveActionLimiter } from "@/lib/rate-limit";
import { notifyMany } from "@/lib/notify";

async function requireAdmin() {
  const user = await getCurrentDbUser();
  if (!user || user.role !== "ADMIN") throw new Error("Admin only");
  return user;
}

async function logAction(actorId: string, action: string, detail: string) {
  await prisma.adminAuditLog.create({ data: { actorId, action, detail } });
}

/** Platform-wide announcement, delivered as a notification to every user except the sender. */
export async function sendBroadcast(input: { title: string; body?: string }) {
  const admin = await requireAdmin();
  await enforceRateLimit(sensitiveActionLimiter, admin.id);
  if (!input.title.trim()) throw new Error("Title is required");

  const users = await prisma.user.findMany({ where: { id: { not: admin.id } }, select: { id: true } });
  await notifyMany(
    users.map((u) => u.id),
    "BROADCAST",
    input.title.trim(),
    "/dashboard",
    input.body?.trim() || undefined,
  );
}

export async function removeReportedMessage(reportId: string) {
  const admin = await requireAdmin();

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return;

  await prisma.$transaction([
    prisma.message.update({ where: { id: report.messageId }, data: { deletedAt: new Date() } }),
    prisma.report.update({ where: { id: reportId }, data: { status: "RESOLVED_REMOVED" } }),
  ]);
  await logAction(admin.id, "REMOVE_MESSAGE", "Removed a reported message");

  revalidatePath("/moderation");
}

export async function dismissReport(reportId: string) {
  const admin = await requireAdmin();

  await prisma.report.update({ where: { id: reportId }, data: { status: "RESOLVED_DISMISSED" } });
  await logAction(admin.id, "DISMISS_REPORT", "Dismissed a report");
  revalidatePath("/moderation");
}
