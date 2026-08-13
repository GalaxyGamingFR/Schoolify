import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { addDays, format, startOfDay } from "date-fns";
import { getCurrentDbUser } from "@/lib/current-user";
import { canAccessStudentData } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { computeCourseGrade, computeGpa, letterGrade } from "@/lib/grades";
import { courseGradeTrend, buildRiskAlerts } from "@/lib/analytics";
import { calculateLevel, calculateStreak, calculateXp } from "@/lib/gamification";
import { AppNav } from "@/components/app-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, Flame, TrendingDown } from "lucide-react";
import { RemoveGuardianshipButton } from "@/components/remove-guardianship-button";

const TREND_WINDOW_DAYS = 14;

export default async function ParentStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "PARENT") redirect("/dashboard");

  const { studentId } = await params;

  const allowed = await canAccessStudentData({ id: user.id, role: user.role }, studentId);
  if (!allowed) notFound();

  const guardianship = await prisma.guardianship.findUnique({
    where: { parentId_studentId: { parentId: user.id, studentId } },
  });
  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student || !guardianship) notFound();

  const [courses, assignments] = await Promise.all([
    prisma.course.findMany({
      where: { enrollments: { some: { studentId } } },
      include: { gradeCategories: { include: { gradeEntries: true } } },
    }),
    prisma.assignment.findMany({
      where: { userId: studentId },
      include: { course: { select: { name: true } } },
    }),
  ]);

  const withGrades = courses.map((c) => ({
    id: c.id,
    name: c.name,
    percent: computeCourseGrade(c.gradeCategories),
    trend: courseGradeTrend(c.gradeCategories, TREND_WINDOW_DAYS),
  }));
  const gpa = computeGpa(withGrades.filter((c) => c.percent !== null).map((c) => c.percent!));

  const now = new Date();
  const today = startOfDay(now);
  const weekEnd = addDays(today, 7);
  const upcoming = assignments
    .filter((a) => a.status !== "DONE" && a.dueAt >= today && a.dueAt <= weekEnd)
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  const overdueCount = assignments.filter((a) => a.status !== "DONE" && a.dueAt < today).length;

  const completions = assignments
    .filter((a) => a.completedAt !== null)
    .map((a) => ({ completedAt: a.completedAt!, dueAt: a.dueAt }));
  const xp = calculateXp(completions);
  const level = calculateLevel(xp);
  const streak = calculateStreak(completions.map((c) => c.completedAt));

  // Only the grade-health alert types apply here — "heavy week" is
  // day-to-day workload noise, not the kind of thing this module promises
  // ("high-level academic health... without invading student study
  // privacy"), so it's left off the parent view on purpose.
  const alerts = buildRiskAlerts({
    courses: withGrades.map((c) => ({ name: c.name, trend: c.trend })),
    upcomingWeekMinutes: 0,
    trailingAverageWeekMinutes: 0,
  });

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link
          href="/parent"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Your students
        </Link>

        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">{student.name}</h1>
          <RemoveGuardianshipButton guardianshipId={guardianship.id} />
        </div>

        {alerts.length > 0 && (
          <div className="mt-6 space-y-2">
            {alerts.map((alert, i) => (
              <Card key={i} className="border-destructive/50">
                <CardContent className="flex items-center gap-3 py-3 text-sm">
                  {alert.type === "low-grade" ? (
                    <>
                      <AlertTriangle className="size-5 shrink-0 text-destructive" />
                      <p>
                        <span className="font-medium">{alert.courseName}</span> is at{" "}
                        {alert.percent.toFixed(1)}%, below a C-.
                      </p>
                    </>
                  ) : alert.type === "trending-down" ? (
                    <>
                      <TrendingDown className="size-5 shrink-0 text-destructive" />
                      <p>
                        <span className="font-medium">{alert.courseName}</span> has dropped{" "}
                        {Math.abs(alert.delta).toFixed(1)} points recently.
                      </p>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">GPA</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{gpa !== null ? gpa.toFixed(2) : "—"}</p>
              <p className="text-sm text-muted-foreground">unweighted, 4.0 scale</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{overdueCount}</p>
              <p className="text-sm text-muted-foreground">assignment{overdueCount === 1 ? "" : "s"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-base">
                <Flame className="size-4 text-orange-500" /> Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{streak.currentStreak}d</p>
              <p className="text-sm text-muted-foreground">Level {level.level} · {xp} XP</p>
            </CardContent>
          </Card>
        </div>

        <h2 className="mt-8 text-sm font-semibold text-muted-foreground">Grades</h2>
        <div className="mt-2 space-y-2">
          {withGrades.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses recorded yet.</p>
          ) : (
            withGrades.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex items-center justify-between py-3 text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">
                    {c.percent !== null ? `${c.percent.toFixed(1)}% · ${letterGrade(c.percent)}` : "No grades yet"}
                  </span>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <h2 className="mt-8 text-sm font-semibold text-muted-foreground">Due in the next 7 days</h2>
        <div className="mt-2 space-y-2">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing coming up.</p>
          ) : (
            upcoming.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between py-3 text-sm">
                  <span>
                    {a.title}
                    {a.course && <span className="text-muted-foreground"> · {a.course.name}</span>}
                  </span>
                  <span className="text-muted-foreground">{format(a.dueAt, "MMM d")}</span>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
