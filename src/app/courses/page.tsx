import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { NewCourseForm } from "@/components/new-course-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CoursesPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const courses = await prisma.course.findMany({
    where: { enrollments: { some: { studentId: user.id } } },
    include: {
      _count: { select: { assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const openCounts = await prisma.assignment.groupBy({
    by: ["courseId"],
    where: { userId: user.id, status: { not: "DONE" }, courseId: { not: null } },
    _count: true,
  });
  const openByCourse = new Map(openCounts.map((c) => [c.courseId, c._count]));

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add each class you&apos;re taking, then track assignments under it.
        </p>

        <div className="mt-6 max-w-sm">
          <NewCourseForm />
        </div>

        {courses.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">
            No courses yet — add one above to start tracking assignments.
          </p>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {courses.map((course) => {
              const openCount = openByCourse.get(course.id) ?? 0;
              return (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base">
                        {course.name}
                        {openCount > 0 && <Badge variant="secondary">{openCount} open</Badge>}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {course._count.assignments} assignment
                      {course._count.assignments === 1 ? "" : "s"} total
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
