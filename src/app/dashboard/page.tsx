import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { addDays, endOfDay, isBefore, isToday, startOfDay } from "date-fns";
import { AppNav } from "@/components/app-nav";
import { QuickAddForm } from "@/components/quick-add-form";
import { AssignmentRow } from "@/components/assignment-row";
import { GuardianRequestsCard } from "@/components/guardian-requests-card";
import { InviteGuardianForm } from "@/components/invite-guardian-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { needsGuardianVerification } from "@/lib/coppa";
import { BookPlus, ShieldAlert } from "lucide-react";

export default async function DashboardPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (!dbUser) {
    return (
      <div className="flex flex-1 flex-col">
        <AppNav />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
          <p className="text-sm text-muted-foreground">
            Waiting on the Clerk webhook to sync your account — this happens automatically
            within a few seconds. Refresh in a moment.
          </p>
        </main>
      </div>
    );
  }

  if (!dbUser.onboardingCompletedAt) redirect("/onboarding");
  if (dbUser.role === "PARENT") redirect("/parent");

  const guardianships = await prisma.guardianship.findMany({
    where: { studentId: dbUser.id },
    include: { parent: { select: { name: true, email: true } } },
  });
  const pendingRequests = guardianships
    .filter((g) => g.status === "PENDING")
    .map((g) => ({ id: g.id, parentName: g.parent.name, parentEmail: g.parent.email }));
  const hasAcceptedGuardian = guardianships.some((g) => g.status === "ACCEPTED");

  // See src/lib/coppa.ts — this is a UI gate, not real COPPA Verifiable
  // Parental Consent. It only stops a plain accidental self-signup by a
  // young student from landing on the full app unsupervised.
  if (needsGuardianVerification({ role: dbUser.role, dateOfBirth: dbUser.dateOfBirth, hasAcceptedGuardian })) {
    return (
      <div className="flex flex-1 flex-col">
        <AppNav />
        <main className="mx-auto w-full max-w-md flex-1 px-4 py-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="size-5" /> Parent or guardian needed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Because of your age, a parent or guardian needs to link their Schoolify account
                before you can use the app. If they already have one, send them an invite below —
                if not, ask them to sign up first.
              </p>
              <InviteGuardianForm />
              {pendingRequests.length > 0 && <GuardianRequestsCard requests={pendingRequests} />}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const [courseCount, totalAssignmentCount] = await Promise.all([
    prisma.course.count({ where: { enrollments: { some: { studentId: dbUser.id } } } }),
    prisma.assignment.count({ where: { userId: dbUser.id } }),
  ]);
  const isNewUser = courseCount === 0 && totalAssignmentCount === 0;

  const today = startOfDay(new Date());
  const windowEnd = endOfDay(addDays(today, 7));

  const assignments = await prisma.assignment.findMany({
    where: {
      userId: dbUser.id,
      OR: [{ dueAt: { lte: windowEnd } }, { status: { not: "DONE" } }],
    },
    include: { course: { select: { name: true } } },
    orderBy: { dueAt: "asc" },
  });

  const overdue = assignments.filter((a) => a.status !== "DONE" && isBefore(a.dueAt, today));
  const dueToday = assignments.filter((a) => isToday(a.dueAt));
  const upcoming = assignments.filter(
    (a) => !isBefore(a.dueAt, addDays(today, 1)) && a.dueAt <= windowEnd,
  );

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Hey {clerkUser.firstName ?? "there"}
        </h1>

        {pendingRequests.length > 0 && (
          <div className="mt-6">
            <GuardianRequestsCard requests={pendingRequests} />
          </div>
        )}

        {isNewUser && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Welcome to Schoolify</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Two ways to get going:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Type a task into the box below and hit Enter — no setup needed, it&apos;ll show
                  up here today.
                </li>
                <li>
                  Add your classes under{" "}
                  <Link href="/courses" className="font-medium text-foreground underline">
                    Courses
                  </Link>{" "}
                  to also track grades and organize assignments by class.
                </li>
              </ul>
              <Button
                size="sm"
                variant="secondary"
                render={
                  <Link href="/courses">
                    <BookPlus className="size-4" /> Add your first course
                  </Link>
                }
              />
            </CardContent>
          </Card>
        )}

        <div className="mt-6">
          <QuickAddForm />
        </div>

        <div className="mt-8 space-y-8">
          {overdue.length > 0 && (
            <Section title="Overdue" assignments={overdue} />
          )}
          <Section title="Today" assignments={dueToday} empty="Nothing due today." />
          <Section title="Next 7 days" assignments={upcoming} empty="Nothing coming up." />
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  assignments,
  empty,
}: {
  title: string;
  assignments: Array<{
    id: string;
    title: string;
    dueAt: Date;
    status: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    course: { name: string } | null;
  }>;
  empty?: string;
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      <div className="mt-2 space-y-2">
        {assignments.length === 0 && empty ? (
          <div className="rounded-lg border border-dashed border-border/80 p-8 text-center">
            <p className="text-sm text-muted-foreground">{empty}</p>
          </div>
        ) : (
          assignments.map((a) => (
            <AssignmentRow
              key={a.id}
              id={a.id}
              title={a.title}
              dueAt={a.dueAt}
              done={a.status === "DONE"}
              priority={a.priority}
              courseName={a.course?.name}
            />
          ))
        )}
      </div>
    </section>
  );
}
