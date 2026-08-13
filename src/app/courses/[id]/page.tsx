import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { AssignmentRow } from "@/components/assignment-row";
import { NewAssignmentForm } from "@/components/new-assignment-form";
import { DeleteCourseButton } from "@/components/delete-course-button";
import { ClassChatButton } from "@/components/class-chat-button";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export const metadata: Metadata = {
  title: "Course",
  description: "Assignments and details for this course.",
};

export default async function CourseDetailPage({
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
      assignments: { orderBy: { dueAt: "asc" } },
    },
  });
  if (!course) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{course.name}</h1>
          <div className="flex items-center gap-1">
            {course.teacherId && <ClassChatButton courseId={course.id} />}
            <Button
              variant="outline"
              size="sm"
              render={
                <Link href={`/courses/${course.id}/grades`}>
                  <GraduationCap className="size-4" /> Grades
                </Link>
              }
            />
            <DeleteCourseButton courseId={course.id} />
          </div>
        </div>

        <div className="mt-6">
          <NewAssignmentForm courseId={course.id} />
        </div>

        <div className="mt-6 space-y-2">
          {course.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No assignments yet — add one above.
            </p>
          ) : (
            course.assignments.map((a) => (
              <AssignmentRow
                key={a.id}
                id={a.id}
                title={a.title}
                dueAt={a.dueAt}
                done={a.status === "DONE"}
                priority={a.priority}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
