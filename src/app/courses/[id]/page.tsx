import { notFound, redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { AssignmentRow } from "@/components/assignment-row";
import { NewAssignmentForm } from "@/components/new-assignment-form";
import { DeleteCourseButton } from "@/components/delete-course-button";

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
          <h1 className="text-2xl font-semibold tracking-tight">{course.name}</h1>
          <DeleteCourseButton courseId={course.id} />
        </div>

        <div className="mt-6">
          <NewAssignmentForm courseId={course.id} />
        </div>

        <div className="mt-6 space-y-2">
          {course.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assignments yet.</p>
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
