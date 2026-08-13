import { redirect } from "next/navigation";
import { addDays, format, startOfDay, startOfWeek, subDays } from "date-fns";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import {
  buildRiskAlerts,
  buildWorkloadHeatmap,
  courseGradeTrend,
  onTimeRate,
  velocityPerWeek,
  type RiskAlert,
} from "@/lib/analytics";
import { AppNav } from "@/components/app-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

const HEATMAP_DAYS = 28;
const TREND_WINDOW_DAYS = 14;
const VELOCITY_WEEKS = 4;

export default async function AnalyticsPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const [assignments, courses] = await Promise.all([
    prisma.assignment.findMany({
      where: { userId: user.id },
      select: { dueAt: true, completedAt: true, estimatedMinutes: true },
    }),
    prisma.course.findMany({
      where: { enrollments: { some: { studentId: user.id } } },
      include: { gradeCategories: { include: { gradeEntries: true } } },
    }),
  ]);

  const heatmap = buildWorkloadHeatmap(
    assignments.map((a) => a.dueAt),
    new Date(),
    HEATMAP_DAYS,
  );
  const maxCount = Math.max(1, ...heatmap.map((h) => h.count));

  const completions = assignments
    .filter((a) => a.completedAt !== null)
    .map((a) => ({ completedAt: a.completedAt!, dueAt: a.dueAt }));
  const rate = onTimeRate(completions);
  const velocity = velocityPerWeek(
    completions.map((c) => c.completedAt),
    VELOCITY_WEEKS,
  );

  const courseTrends = courses.map((c) => ({
    name: c.name,
    trend: courseGradeTrend(c.gradeCategories, TREND_WINDOW_DAYS),
  }));

  const now = new Date();
  const nextWeekEnd = addDays(now, 7);
  const upcomingWeekMinutes = assignments
    .filter((a) => a.dueAt >= now && a.dueAt <= nextWeekEnd)
    .reduce((sum, a) => sum + (a.estimatedMinutes ?? 0), 0);

  const trailingStart = subDays(startOfWeek(now), 7 * VELOCITY_WEEKS);
  const trailingMinutesTotal = assignments
    .filter((a) => a.dueAt >= trailingStart && a.dueAt < startOfWeek(now))
    .reduce((sum, a) => sum + (a.estimatedMinutes ?? 0), 0);
  const trailingAverageWeekMinutes = trailingMinutesTotal / VELOCITY_WEEKS;

  const alerts = buildRiskAlerts({
    courses: courseTrends,
    upcomingWeekMinutes,
    trailingAverageWeekMinutes,
  });

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>

        {alerts.length > 0 && (
          <div className="mt-6 space-y-2">
            {alerts.map((alert, i) => (
              <AlertCard key={i} alert={alert} />
            ))}
          </div>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Workload — next 4 weeks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {heatmap.map((day) => (
                <div
                  key={day.date.getTime()}
                  title={`${format(day.date, "MMM d")}: ${day.count} due`}
                  className="flex aspect-square items-center justify-center rounded text-[0.65rem] text-primary-foreground"
                  style={{
                    backgroundColor:
                      day.count === 0
                        ? "var(--muted)"
                        : `color-mix(in oklch, var(--primary) ${20 + (day.count / maxCount) * 80}%, var(--muted))`,
                  }}
                >
                  {format(day.date, "d")}
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Darker = more due that day. Starts today ({format(startOfDay(new Date()), "MMM d")}).
            </p>
          </CardContent>
        </Card>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">On-time rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{rate !== null ? `${rate.toFixed(0)}%` : "—"}</p>
              <p className="text-sm text-muted-foreground">of completed assignments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Completion pace</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{velocity.toFixed(1)}/wk</p>
              <p className="text-sm text-muted-foreground">
                trailing {VELOCITY_WEEKS}-week average
              </p>
            </CardContent>
          </Card>
        </div>

        {completions.length === 0 && (
          <p className="mt-6 text-sm text-muted-foreground">
            Complete a few assignments to see on-time rate and pace here.
          </p>
        )}
      </main>
    </div>
  );
}

function AlertCard({ alert }: { alert: RiskAlert }) {
  if (alert.type === "low-grade") {
    return (
      <Card className="border-destructive/50">
        <CardContent className="flex items-center gap-3 py-3">
          <AlertTriangle className="size-5 shrink-0 text-destructive" />
          <p className="text-sm">
            <span className="font-medium">{alert.courseName}</span> is at{" "}
            {alert.percent.toFixed(1)}%, below a C-.
          </p>
        </CardContent>
      </Card>
    );
  }
  if (alert.type === "trending-down") {
    return (
      <Card className={cn("border-destructive/50")}>
        <CardContent className="flex items-center gap-3 py-3">
          <TrendingDown className="size-5 shrink-0 text-destructive" />
          <p className="text-sm">
            <span className="font-medium">{alert.courseName}</span> has dropped{" "}
            {Math.abs(alert.delta).toFixed(1)} points recently vs. its overall grade.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-destructive/50">
      <CardContent className="flex items-center gap-3 py-3">
        <CalendarClock className="size-5 shrink-0 text-destructive" />
        <p className="text-sm">
          Heavy week ahead — {alert.upcomingMinutes} min of estimated work due next 7 days, vs.
          your {alert.averageMinutes.toFixed(0)} min average.
        </p>
      </CardContent>
    </Card>
  );
}
