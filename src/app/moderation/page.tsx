import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { format, subDays } from "date-fns";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { ReportActions } from "@/components/report-actions";
import { BroadcastForm } from "@/components/broadcast-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Admin",
  description: "Platform overview, announcements, and reported message review.",
};

export default async function ModerationPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");
  // ADMIN is a platform-trust role with no self-service path to acquire it
  // (not offered in onboarding) — it's set directly in the database by a
  // real operator. See roadmap.md.
  if (user.role !== "ADMIN") notFound();

  const sevenDaysAgo = subDays(new Date(), 7);
  const [reports, usersByRole, totalSchools, totalCourses, newUsers7d] = await Promise.all([
    prisma.report.findMany({
      where: { status: "OPEN" },
      include: {
        message: { include: { sender: { select: { name: true, email: true } } } },
        reporter: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.school.count(),
    prisma.course.count(),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
  ]);

  const totalUsers = usersByRole.reduce((sum, r) => sum + r._count, 0);
  const roleCounts = Object.fromEntries(usersByRole.map((r) => [r.role, r._count]));

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="py-4">
              <p className="text-2xl font-semibold">{totalUsers}</p>
              <p className="text-xs text-muted-foreground">
                Users · {roleCounts.STUDENT ?? 0} student{roleCounts.STUDENT === 1 ? "" : "s"},{" "}
                {roleCounts.PARENT ?? 0} parent{roleCounts.PARENT === 1 ? "" : "s"},{" "}
                {roleCounts.TEACHER ?? 0} teacher{roleCounts.TEACHER === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-2xl font-semibold">{newUsers7d}</p>
              <p className="text-xs text-muted-foreground">New signups, last 7 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-2xl font-semibold">{totalSchools}</p>
              <p className="text-xs text-muted-foreground">Registered schools</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-2xl font-semibold">{totalCourses}</p>
              <p className="text-xs text-muted-foreground">Courses</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
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
