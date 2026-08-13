import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { addDays, endOfDay, isBefore, isToday, startOfDay } from "date-fns";
import { AppNav } from "@/components/app-nav";
import { QuickAddForm } from "@/components/quick-add-form";
import { AssignmentRow } from "@/components/assignment-row";
import { prisma } from "@/lib/prisma";

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
        <h1 className="text-2xl font-semibold tracking-tight">
          Hey {clerkUser.firstName ?? "there"}
        </h1>

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
          <p className="text-sm text-muted-foreground">{empty}</p>
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
