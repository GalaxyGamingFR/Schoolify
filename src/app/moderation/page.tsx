import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format, formatDistanceToNow, subDays } from "date-fns";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { computeTrend, bucketByDay, type Trend } from "@/lib/admin-stats";
import { AppNav } from "@/components/app-nav";
import { ReportActions } from "@/components/report-actions";
import { BroadcastForm } from "@/components/broadcast-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, Building2, AlertTriangle, TrendingUp, Activity, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin",
  description: "Platform overview, announcements, and reported message review.",
};

type FeedEvent = { at: Date; text: string; warn?: boolean };

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// bucketByDay's keys are bare "yyyy-MM-dd" strings -- going through
// `new Date(key)` (parses as UTC midnight) and date-fns's format() (reads
// local getters) would shift the label by a day on any server west of UTC,
// the same bug class already hit in coppa.ts and Settings' DOB display.
// String-split instead of ever constructing a Date.
function formatDayLabel(key: string): string {
  const [, month, day] = key.split("-");
  return `${MONTH_ABBR[Number(month) - 1]} ${Number(day)}`;
}

export default async function ModerationPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");
  // ADMIN is a platform-trust role with no self-service path to acquire it
  // (not offered in onboarding) — it's set directly in the database by a
  // real operator. See roadmap.md.
  if (user.role !== "ADMIN") notFound();

  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const fourteenDaysAgo = subDays(now, 14);

  const [
    reports,
    usersByRole,
    newUsers7d,
    totalSchools,
    schoolsBefore7d,
    messages7d,
    messagesPrior7d,
    signupsLast14d,
    recentSignups,
    recentReports,
    recentSchools,
    recentBroadcasts,
  ] = await Promise.all([
    prisma.report.findMany({
      where: { status: "OPEN" },
      include: {
        message: { include: { sender: { select: { name: true, email: true } } } },
        reporter: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.school.count(),
    prisma.school.count({ where: { createdAt: { lt: sevenDaysAgo } } }),
    prisma.message.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.message.count({ where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } }),
    prisma.user.findMany({ where: { createdAt: { gte: fourteenDaysAgo } }, select: { createdAt: true } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { name: true, role: true, createdAt: true } }),
    prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { createdAt: true, reporter: { select: { name: true } } },
    }),
    prisma.school.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { name: true, createdAt: true } }),
    prisma.notification.findMany({
      where: { type: "BROADCAST" },
      orderBy: { createdAt: "desc" },
      take: 5,
      distinct: ["title", "createdAt"],
      select: { title: true, createdAt: true },
    }),
  ]);

  const totalUsers = usersByRole.reduce((sum, r) => sum + r._count, 0);
  const totalUsersPrior7d = totalUsers - newUsers7d;
  const roleCounts = Object.fromEntries(usersByRole.map((r) => [r.role, r._count]));
  const newSchools7d = totalSchools - schoolsBefore7d;

  const userTrend = computeTrend(totalUsers, totalUsersPrior7d);
  const messageTrend = computeTrend(messages7d, messagesPrior7d);
  const schoolTrend = computeTrend(totalSchools, schoolsBefore7d);

  const chart = bucketByDay(
    signupsLast14d.map((u) => u.createdAt),
    14,
    now,
  );
  const chartMax = Math.max(1, ...chart.map((b) => b.count));

  const feed: FeedEvent[] = [
    ...recentSignups.map((u): FeedEvent => ({
      at: u.createdAt,
      text: `${u.name} joined as ${u.role === "STUDENT" ? "a student" : u.role === "PARENT" ? "a parent" : u.role === "TEACHER" ? "a teacher" : "an admin"}`,
    })),
    ...recentReports.map((r): FeedEvent => ({
      at: r.createdAt,
      text: `${r.reporter.name} reported a message`,
      warn: true,
    })),
    ...recentSchools.map((s): FeedEvent => ({ at: s.createdAt, text: `${s.name} registered as a school` })),
    ...recentBroadcasts.map((b): FeedEvent => ({ at: b.createdAt, text: `Broadcast sent: "${b.title}"` })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={Users}
            value={totalUsers}
            label={`Users · ${roleCounts.STUDENT ?? 0} student${roleCounts.STUDENT === 1 ? "" : "s"}, ${roleCounts.PARENT ?? 0} parent${roleCounts.PARENT === 1 ? "" : "s"}, ${roleCounts.TEACHER ?? 0} teacher${roleCounts.TEACHER === 1 ? "" : "s"}`}
            trend={userTrend}
            href="/admin/users"
          />
          <StatCard icon={MessageSquare} value={messages7d} label="Messages sent, last 7 days" trend={messageTrend} />
          <StatCard
            icon={Building2}
            value={totalSchools}
            label={`Registered schools${newSchools7d > 0 ? ` · +${newSchools7d} this week` : ""}`}
            trend={schoolTrend}
          />
          <StatCard icon={AlertTriangle} value={reports.length} label="Open moderation reports" warn={reports.length > 0} />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-5">
          <Card className="sm:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <TrendingUp className="size-4 text-muted-foreground" /> Signups, last 14 days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-28 items-end gap-1 border-b">
                {chart.map((b) => (
                  <div key={b.key} className="flex h-full flex-1 items-end" title={`${b.key}: ${b.count}`}>
                    <div
                      className="w-full rounded-t bg-primary/70"
                      style={{ height: `${Math.max(4, (b.count / chartMax) * 100)}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                <span>{formatDayLabel(chart[0].key)}</span>
                <span>{formatDayLabel(chart[chart.length - 1].key)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <Activity className="size-4 text-muted-foreground" /> Recent activity
                </span>
                <Link href="/admin/logs" className="text-xs font-normal text-muted-foreground hover:text-foreground">
                  View all
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {feed.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nothing yet.</p>
              ) : (
                feed.map((e, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", e.warn ? "bg-amber-500" : "bg-emerald-500")} />
                    <div>
                      <p>{e.text}</p>
                      <p className="text-muted-foreground">{formatDistanceToNow(e.at, { addSuffix: true })}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-3">
          <CardHeader>
            <CardTitle className="text-base">Broadcast an announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <BroadcastForm />
          </CardContent>
        </Card>

        <h2 className="mt-8 text-sm font-semibold text-muted-foreground">
          {reports.length} open report{reports.length === 1 ? "" : "s"}
        </h2>
        <div className="mt-2 space-y-3">
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing to review.</p>
          ) : (
            reports.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>Reported by {r.reporter.name}</span>
                    <Badge variant="outline">{format(r.createdAt, "MMM d, h:mm a")}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">Reason: {r.reason}</p>
                  <div className="rounded-md border bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">
                      {r.message.sender.name} ({r.message.sender.email})
                      {r.message.deletedAt && " · already removed"}
                    </p>
                    <p className="mt-1">{r.message.body}</p>
                  </div>
                  <ReportActions reportId={r.id} alreadyRemoved={!!r.message.deletedAt} />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  trend,
  href,
  warn,
}: {
  icon: typeof Users;
  value: number;
  label: string;
  trend?: Trend;
  href?: string;
  warn?: boolean;
}) {
  const body = (
    <Card className={cn("h-full transition-colors", href && "hover:bg-muted/50")}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className={cn("flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary", warn && "bg-destructive/10 text-destructive")}>
            <Icon className="size-3.5" />
          </div>
          <div className="flex items-center gap-1">
            {trend && (
              <span
                className={cn(
                  "text-[11px] font-medium",
                  trend.direction === "up" && "text-emerald-500",
                  trend.direction === "down" && "text-destructive",
                  trend.direction === "flat" && "text-muted-foreground",
                )}
              >
                {trend.label}
              </span>
            )}
            {href && <ArrowRight className="size-3 text-muted-foreground" />}
          </div>
        </div>
        <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}
