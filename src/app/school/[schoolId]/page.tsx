import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { AppFooter } from "@/components/app-footer";
import { InviteTeacherForm } from "@/components/invite-teacher-form";
import { StaffList } from "@/components/staff-list";
import { CreateSchoolCourseForm } from "@/components/create-school-course-form";
import { SchoolCourseCard } from "@/components/school-course-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "School",
  description: "Staff and classes for this school.",
};

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const { schoolId } = await params;
  const membership = await prisma.schoolStaff.findFirst({
    where: { schoolId, userId: user.id, status: "ACTIVE" },
  });
  if (!membership) notFound();

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      staff: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
      courses: {
        include: { teacher: { select: { name: true } }, _count: { select: { enrollments: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!school) notFound();

  const isPrincipal = membership.role === "PRINCIPAL";
  const visibleCourses = isPrincipal ? school.courses : school.courses.filter((c) => c.teacherId === user.id);

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link href="/school" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Schools
        </Link>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">{school.name}</h1>
        <p className="text-sm text-muted-foreground">{school.domain}</p>

        <h2 className="mt-8 text-sm font-semibold text-muted-foreground">
          {isPrincipal ? "Classes" : "Your classes"}
        </h2>
        <div className="mt-2 space-y-2">
          {visibleCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No classes yet.</p>
          ) : (
            visibleCourses.map((c) => (
              <SchoolCourseCard
                key={c.id}
                course={{
                  id: c.id,
                  name: c.name,
                  joinCode: c.joinCode,
                  teacherName: c.teacher?.name ?? "Unassigned",
                  studentCount: c._count.enrollments,
                }}
              />
            ))
          )}
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Create a class</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateSchoolCourseForm schoolId={school.id} />
            <p className="mt-2 text-xs text-muted-foreground">
              Students join with the code, but only if their account email is on {school.domain}.
              Grades for these classes are still self-tracked by each student — teacher-entered
              grading isn&apos;t built yet.
            </p>
          </CardContent>
        </Card>

        {isPrincipal && (
          <>
            <h2 className="mt-8 text-sm font-semibold text-muted-foreground">Staff</h2>
            <div className="mt-2">
              <StaffList
                staff={school.staff.map((s) => ({
                  id: s.id,
                  email: s.email,
                  role: s.role,
                  status: s.status,
                  name: s.user?.name ?? null,
                }))}
              />
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Invite a teacher</CardTitle>
              </CardHeader>
              <CardContent>
                <InviteTeacherForm schoolId={school.id} />
              </CardContent>
            </Card>
          </>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
