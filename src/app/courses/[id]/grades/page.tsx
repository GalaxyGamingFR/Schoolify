import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { computeCourseGrade, letterGrade } from "@/lib/grades";
import { AppNav } from "@/components/app-nav";
import { GradeCategoryCard } from "@/components/grade-category-card";
import { NewGradeCategoryForm } from "@/components/new-grade-category-form";
import { WhatIfCalculator } from "@/components/what-if-calculator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function CourseGradesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const { id } = await params;
  const course = await prisma.course.findFirst({
    where: { id, enrollments: { some: { studentId: user.id } } },
    include: {
      gradeCategories: {
        include: { gradeEntries: true },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!course) notFound();

  const percent = computeCourseGrade(course.gradeCategories);
  const totalWeight = course.gradeCategories.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2"
          render={
            <Link href={`/courses/${course.id}`}>
              <ArrowLeft className="size-4" /> {course.name}
            </Link>
          }
        />
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Grades</h1>
          {percent !== null && (
            <div className="text-right">
              <p className="text-2xl font-semibold">{percent.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">{letterGrade(percent)}</p>
            </div>
          )}
        </div>
        {totalWeight !== 100 && course.gradeCategories.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Category weights add up to {totalWeight}%, not 100% — the grade above is normalized
            across categories that have entries.
          </p>
        )}

        <div className="mt-6">
          <NewGradeCategoryForm courseId={course.id} />
        </div>

        <div className="mt-6 space-y-4">
          {course.gradeCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No grade categories yet — add one above (e.g. Exams, 40%).
            </p>
          ) : (
            course.gradeCategories.map((cat) => (
              <GradeCategoryCard key={cat.id} courseId={course.id} category={cat} />
            ))
          )}
        </div>

        {course.gradeCategories.length > 0 && (
          <div className="mt-6">
            <WhatIfCalculator categories={course.gradeCategories} />
          </div>
        )}
      </main>
    </div>
  );
}
