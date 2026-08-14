"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";
import { sendSuspensionEmail, sendReactivationEmail } from "@/lib/email";
import type { Role } from "@prisma/client";

async function requireAdmin() {
  const user = await getCurrentDbUser();
  if (!user || user.role !== "ADMIN") throw new Error("Admin only");
  return user;
}

async function logAction(actorId: string, action: string, detail: string) {
  await prisma.adminAuditLog.create({ data: { actorId, action, detail } });
}

export async function suspendUser(userId: string) {
  const admin = await requireAdmin();
  if (userId === admin.id) throw new Error("You can't suspend your own account");

  const target = await prisma.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
  await logAction(admin.id, "SUSPEND_USER", `Suspended ${target.name}`);
  await sendSuspensionEmail(target.email, target.name);
  revalidatePath("/admin/users");
  revalidatePath("/moderation");
}

export async function reactivateUser(userId: string) {
  const admin = await requireAdmin();
  const target = await prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
  await logAction(admin.id, "REACTIVATE_USER", `Reactivated ${target.name}`);
  await sendReactivationEmail(target.email, target.name);
  revalidatePath("/admin/users");
  revalidatePath("/moderation");
}

export async function updateUserRole(userId: string, role: Role) {
  const admin = await requireAdmin();
  if (userId === admin.id) throw new Error("You can't change your own role");

  const target = await prisma.user.update({ where: { id: userId }, data: { role } });
  await logAction(admin.id, "CHANGE_ROLE", `Changed ${target.name}'s role to ${role}`);
  revalidatePath("/admin/users");
  revalidatePath("/moderation");
}
