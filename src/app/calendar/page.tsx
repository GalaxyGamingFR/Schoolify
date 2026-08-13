import Link from "next/link";
import { redirect } from "next/navigation";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { getCurrentDbUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/app-nav";
import { AssignmentRow } from "@/components/assignment-row";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type View = "month" | "week" | "day";

function parseView(v: string | undefined): View {
  return v === "week" || v === "day" ? v : "month";
}

function rangeFor(view: View, date: Date) {
  if (view === "day") return { start: date, end: date };
  if (view === "week") return { start: startOfWeek(date), end: endOfWeek(date) };
  // Month view pads to full weeks so the grid has no partial rows.
  return { start: startOfWeek(startOfMonth(date)), end: endOfWeek(endOfMonth(date)) };
}

function shift(view: View, date: Date, direction: 1 | -1) {
  if (view === "day") return direction === 1 ? addDays(date, 1) : subDays(date, 1);
  if (view === "week") return direction === 1 ? addWeeks(date, 1) : subWeeks(date, 1);
  return direction === 1 ? addMonths(date, 1) : subMonths(date, 1);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const params = await searchParams;
  const view = parseView(params.view);
  const date = params.date ? parseISO(params.date) : new Date();

  const { start, end } = rangeFor(view, date);
  const assignments = await prisma.assignment.findMany({
    where: { userId: user.id, dueAt: { gte: start, lte: addDays(end, 1) } },
    include: { course: { select: { name: true } } },
    orderBy: { dueAt: "asc" },
  });

  const byDay = new Map<string, typeof assignments>();
  for (const a of assignments) {
    const key = format(a.dueAt, "yyyy-MM-dd");
    byDay.set(key, [...(byDay.get(key) ?? []), a]);
  }

  const prevHref = `/calendar?view=${view}&date=${format(shift(view, date, -1), "yyyy-MM-dd")}`;
  const nextHref = `/calendar?view=${view}&date=${format(shift(view, date, 1), "yyyy-MM-dd")}`;
  const todayHref = `/calendar?view=${view}&date=${format(new Date(), "yyyy-MM-dd")}`;

  return (
    <div className="flex flex-1 flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight">
            {view === "day"
              ? format(date, "EEEE, MMMM d")
              : view === "week"
                ? `Week of ${format(start, "MMM d")}`
                : format(date, "MMMM yyyy")}
          </h1>
          <div className="flex items-center gap-1">
            {(["month", "week", "day"] as const).map((v) => (
              <Button
                key={v}
                variant={v === view ? "secondary" : "ghost"}
                size="sm"
                render={
                  <Link href={`/calendar?view=${v}&date=${format(date, "yyyy-MM-dd")}`}>
                    {v[0].toUpperCase() + v.slice(1)}
                  </Link>
                }
              />
            ))}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Previous"
              render={
                <Link href={prevHref}>
                  <ChevronLeft className="size-4" />
                </Link>
              }
            />
            <Button variant="outline" size="sm" render={<Link href={todayHref}>Today</Link>} />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Next"
              render={
                <Link href={nextHref}>
                  <ChevronRight className="size-4" />
                </Link>
              }
            />
          </div>
        </div>

        <div className="mt-6">
          {view === "day" ? (
            <DayView assignments={byDay.get(format(date, "yyyy-MM-dd")) ?? []} />
          ) : (
            <GridView
              days={eachDayOfInterval({ start, end })}
              byDay={byDay}
              currentMonth={date}
              compact={view === "month"}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function DayView({
  assignments,
}: {
  assignments: Array<{
    id: string;
    title: string;
    dueAt: Date;
    status: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    course: { name: string } | null;
  }>;
}) {
  if (assignments.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing due this day.</p>;
  }
  return (
    <div className="space-y-2">
      {assignments.map((a) => (
        <AssignmentRow
          key={a.id}
          id={a.id}
          title={a.title}
          dueAt={a.dueAt}
          done={a.status === "DONE"}
          priority={a.priority}
          courseName={a.course?.name}
        />
      ))}
    </div>
  );
}

function GridView({
  days,
  byDay,
  currentMonth,
  compact,
}: {
  days: Date[];
  byDay: Map<string, Array<{ id: string; title: string; status: string; dueAt: Date }>>;
  currentMonth: Date;
  compact: boolean;
}) {
  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border bg-border text-sm">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
        <div key={d} className="bg-muted px-2 py-1 text-center text-xs font-medium text-muted-foreground">
          {d}
        </div>
      ))}
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const items = byDay.get(key) ?? [];
        const dimmed = compact && !isSameMonth(day, currentMonth);
        return (
          <Link
            key={key}
            href={`/calendar?view=day&date=${key}`}
            className={cn(
              "min-h-[5.5rem] bg-background p-1.5 hover:bg-muted/50",
              dimmed && "text-muted-foreground/50",
            )}
          >
            <span
              className={cn(
                "inline-flex size-6 items-center justify-center rounded-full text-xs",
                isToday(day) && "bg-primary text-primary-foreground",
              )}
            >
              {format(day, "d")}
            </span>
            <div className="mt-1 space-y-0.5">
              {items.slice(0, compact ? 2 : 5).map((a) => (
                <p
                  key={a.id}
                  className={cn(
                    "truncate rounded bg-secondary px-1 py-0.5 text-[0.7rem]",
                    a.status === "DONE" && "text-muted-foreground line-through",
                  )}
                >
                  {a.title}
                </p>
              ))}
              {items.length > (compact ? 2 : 5) && (
                <p className="px-1 text-[0.65rem] text-muted-foreground">
                  +{items.length - (compact ? 2 : 5)} more
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
