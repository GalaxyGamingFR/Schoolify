"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";

async function requireAdmin() {
  const user = await getCurrentDbUser();
  if (!user || user.role !== "ADMIN") throw new Error("Admin only");
  return user;
}

export async function removeReportedMessage(reportId: string) {
  await requireAdmin();

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return;

  await prisma.$transaction([
    prisma.message.update({ where: { id: report.messageId }, data: { deletedAt: new Date() } }),
    prisma.report.update({ where: { id: reportId }, data: { status: "RESOLVED_REMOVED" } }),
  ]);

  revalidatePath("/moderation");
}

export async function dismissReport(reportId: string) {
  await requireAdmin();

  await prisma.report.update({ where: { id: reportId }, data: { status: "RESOLVED_DISMISSED" } });
  revalidatePath("/moderation");
}
