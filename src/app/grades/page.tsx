import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { computeCourseGrade, computeGpa, letterGrade } from "@/lib/grades";
import { AppNav } from "@/components/app-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function GradesOverviewPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const courses = await prisma.course.findMany({
    where: { enrollments: { some: { studentId: user.id } } },
    include: { gradeCategories: { include: { gradeEntries: true } } },
    orderBy: { name: "asc" },
  });

  const withGrades = courses.map((c) => ({
    id: c.id,
    name: c.name,
    percent: computeCourseGrade(c.gradeCategories),
  }));

  const gpa = computeGpa(
    withGrades.filter((c) => c.percent !== null).map((c) => c.percent as number),
  );

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Grades</h1>
          {gpa !== null && (
            <div className="text-right">
              <p className="text-2xl font-semibold">{gpa.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">GPA (unweighted, 4.0 scale)</p>
            </div>
          )}
        </div>

        {courses.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">
            No courses yet — add one from{" "}
            <Link href="/courses" className="underline">
              Courses
            </Link>
            , then add grade categories to start tracking.
          </p>
        ) : (
          <div className="mt-6 space-y-2">
            {withGrades.map((c) => (
              <Link key={c.id} href={`/courses/${c.id}/grades`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader className="py-4">
                    <CardTitle className="flex items-center justify-between text-base font-medium">
                      {c.name}
                      <span className="text-muted-foreground">
                        {c.percent !== null
                          ? `${c.percent.toFixed(1)}% · ${letterGrade(c.percent)}`
                          : "No grades yet"}
                      </span>
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <Card className="mt-8">
          <CardContent className="py-4 text-xs text-muted-foreground">
            GPA is unweighted on a standard 4.0 scale (A=4.0 … F=0.0) and only counts courses with
            at least one grade recorded.
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
