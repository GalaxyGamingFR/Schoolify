import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, UserPlus, AlertTriangle, Building2, Megaphone, ShieldOff, ShieldCheck, UserCog, Trash2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "System Logs",
  description: "A real audit trail of platform activity and admin actions.",
};

type LogEntry = { at: Date; text: string; icon: typeof UserPlus; warn?: boolean };

const AUDIT_ICONS: Record<string, typeof UserPlus> = {
  SUSPEND_USER: ShieldOff,
  REACTIVATE_USER: ShieldCheck,
  CHANGE_ROLE: UserCog,
  REMOVE_MESSAGE: Trash2,
  DISMISS_REPORT: XCircle,
};

export default async function AdminLogsPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "ADMIN") notFound();

  const [auditLog, signups, reports, schools, broadcasts] = await Promise.all([
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { actor: { select: { name: true } } },
    }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { name: true, role: true, createdAt: true } }),
    prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { createdAt: true, reporter: { select: { name: true } } },
    }),
    prisma.school.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { name: true, createdAt: true } }),
    prisma.notification.findMany({
      where: { type: "BROADCAST" },
      orderBy: { createdAt: "desc" },
      take: 50,
      distinct: ["title", "createdAt"],
      select: { title: true, createdAt: true },
    }),
  ]);

  const roleLabel: Record<string, string> = { STUDENT: "a student", PARENT: "a parent", TEACHER: "a teacher", ADMIN: "an admin" };

  const entries: LogEntry[] = [
    ...auditLog.map((a): LogEntry => ({
      at: a.createdAt,
      text: `${a.actor.name}: ${a.detail}`,
      icon: AUDIT_ICONS[a.action] ?? UserCog,
      warn: a.action === "SUSPEND_USER" || a.action === "REMOVE_MESSAGE",
    })),
    ...signups.map((u): LogEntry => ({
      at: u.createdAt,
      text: `${u.name} joined as ${roleLabel[u.role] ?? u.role.toLowerCase()}`,
      icon: UserPlus,
    })),
    ...reports.map((r): LogEntry => ({
      at: r.createdAt,
      text: `${r.reporter.name} reported a message`,
      icon: AlertTriangle,
      warn: true,
    })),
    ...schools.map((s): LogEntry => ({ at: s.createdAt, text: `${s.name} registered as a school`, icon: Building2 })),
    ...broadcasts.map((b): LogEntry => ({ at: b.createdAt, text: `Broadcast sent: "${b.title}"`, icon: Megaphone })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 100);

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link href="/moderation" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Admin
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">System logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real platform activity — signups, reports, schools, broadcasts, and admin actions. No
          simulated data.
        </p>

        <div className="mt-6 space-y-1.5">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
          ) : (
            entries.map((e, i) => {
              const Icon = e.icon;
              return (
                <Card key={i}>
                  <CardContent className="flex items-center gap-3 py-2.5">
                    <div
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary",
                        e.warn && "bg-amber-500/10 text-amber-500",
                      )}
                    >
                      <Icon className="size-3.5" />
                    </div>
                    <p className="min-w-0 flex-1 truncate text-sm">{e.text}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{format(e.at, "MMM d, h:mm a")}</span>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
