"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/current-user";

export type LogLevel = "ERROR" | "WARN" | "INFO";

export type LogEntry = {
  id: string;
  at: string;
  level: LogLevel;
  message: string;
};

const AUDIT_LEVEL: Record<string, LogLevel> = {
  SUSPEND_USER: "ERROR",
  REMOVE_MESSAGE: "ERROR",
  REACTIVATE_USER: "INFO",
  CHANGE_ROLE: "INFO",
  DISMISS_REPORT: "INFO",
};

const roleLabel: Record<string, string> = {
  STUDENT: "a student",
  PARENT: "a parent",
  TEACHER: "a teacher",
  ADMIN: "an admin",
};

async function requireAdmin() {
  const user = await getCurrentDbUser();
  if (!user || user.role !== "ADMIN") throw new Error("Not authorized");
  return user;
}

export async function getLogEntries(sinceISO?: string): Promise<LogEntry[]> {
  await requireAdmin();
  const since = sinceISO ? new Date(sinceISO) : undefined;
  const dateFilter = since ? { createdAt: { gt: since } } : {};

  const [auditLog, signups, reports, schools, broadcasts] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where: dateFilter,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { actor: { select: { name: true } } },
    }),
    prisma.user.findMany({
      where: dateFilter,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, name: true, role: true, createdAt: true },
    }),
    prisma.report.findMany({
      where: dateFilter,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, createdAt: true, reporter: { select: { name: true } } },
    }),
    prisma.school.findMany({
      where: dateFilter,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.notification.findMany({
      where: { type: "BROADCAST", ...dateFilter },
      orderBy: { createdAt: "desc" },
      take: 50,
      distinct: ["title", "createdAt"],
      select: { id: true, title: true, createdAt: true },
    }),
  ]);

  const entries: LogEntry[] = [
    ...auditLog.map((a): LogEntry => ({
      id: `audit-${a.id}`,
      at: a.createdAt.toISOString(),
      level: AUDIT_LEVEL[a.action] ?? "INFO",
      message: `${a.actor.name}: ${a.detail}`,
    })),
    ...signups.map((u): LogEntry => ({
      id: `signup-${u.id}`,
      at: u.createdAt.toISOString(),
      level: "INFO",
      message: `${u.name} joined as ${roleLabel[u.role] ?? u.role.toLowerCase()}`,
    })),
    ...reports.map((r): LogEntry => ({
      id: `report-${r.id}`,
      at: r.createdAt.toISOString(),
      level: "WARN",
      message: `${r.reporter.name} reported a message`,
    })),
    ...schools.map((s): LogEntry => ({
      id: `school-${s.id}`,
      at: s.createdAt.toISOString(),
      level: "INFO",
      message: `${s.name} registered as a school`,
    })),
    ...broadcasts.map((b): LogEntry => ({
      id: `broadcast-${b.id}`,
      at: b.createdAt.toISOString(),
      level: "INFO",
      message: `Broadcast sent: "${b.title}"`,
    })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return since ? entries : entries.slice(-100);
}
