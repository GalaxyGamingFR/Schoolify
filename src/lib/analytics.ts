import { addDays, differenceInCalendarWeeks, startOfDay, startOfWeek } from "date-fns";
import { computeCourseGrade, type GradeCategoryInput } from "@/lib/grades";

// Pure functions — no I/O — same approach as grades.ts and gamification.ts.
// Scope decision (see roadmap.md Phase 5): no "study efficiency" measured
// against actual-vs-estimated time, because there's no time-tracking in
// this app (that's a real separate feature — a timer/start-stop UI — not
// implied by "Analytics" alone). Efficiency here means on-time completion
// rate and completion velocity, both derivable from data that already
// exists.

export type HeatmapDay = { date: Date; count: number };

/** Assignment count per day for `days` days starting at `startDate`. */
export function buildWorkloadHeatmap(dueDates: Date[], startDate: Date, days: number): HeatmapDay[] {
  const start = startOfDay(startDate);
  const counts = new Map<number, number>();
  for (const d of dueDates) {
    const key = startOfDay(d).getTime();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(start, i);
    return { date, count: counts.get(date.getTime()) ?? 0 };
  });
}

/** % of completions that landed at or before their due date, or null with no completions. */
export function onTimeRate(completions: { completedAt: Date; dueAt: Date }[]): number | null {
  if (completions.length === 0) return null;
  const onTime = completions.filter((c) => c.completedAt <= c.dueAt).length;
  return (onTime / completions.length) * 100;
}

/** Average completions per calendar week over the trailing `weeks` weeks (including this one). */
export function velocityPerWeek(completedDates: Date[], weeks: number): number {
  if (completedDates.length === 0 || weeks <= 0) return 0;
  const windowStart = startOfWeek(addDays(new Date(), -7 * (weeks - 1)));
  const inWindow = completedDates.filter((d) => d >= windowStart);
  return inWindow.length / weeks;
}

export type GradeTrend = {
  overall: number | null;
  recent: number | null;
  delta: number | null; // recent - overall; negative means trending down
};

type CategoryWithDatedEntries = Omit<GradeCategoryInput, "gradeEntries"> & {
  gradeEntries: Array<{ pointsEarned: number; pointsPossible: number; createdAt: Date }>;
};

/**
 * Compares the course grade computed from all entries against the grade
 * computed from only entries recorded in the last `recentWindowDays` —
 * reuses computeCourseGrade on two filtered entry sets rather than
 * inventing separate trend math, so it can never disagree with the grade
 * shown on the course page.
 */
export function courseGradeTrend(
  categories: CategoryWithDatedEntries[],
  recentWindowDays: number,
): GradeTrend {
  const cutoff = addDays(new Date(), -recentWindowDays);
  const overall = computeCourseGrade(categories);
  const recentOnly = categories.map((c) => ({
    ...c,
    gradeEntries: c.gradeEntries.filter((e) => e.createdAt >= cutoff),
  }));
  const recent = computeCourseGrade(recentOnly);
  const delta = overall !== null && recent !== null ? recent - overall : null;
  return { overall, recent, delta };
}

export type RiskAlert =
  | { type: "low-grade"; courseName: string; percent: number }
  | { type: "trending-down"; courseName: string; delta: number }
  | { type: "heavy-week"; upcomingMinutes: number; averageMinutes: number };

const LOW_GRADE_THRESHOLD = 70; // matches the C-/D letter boundary in grades.ts
const TREND_DOWN_THRESHOLD = -5; // percentage points
const HEAVY_WEEK_MULTIPLIER = 1.5;

export function buildRiskAlerts(input: {
  courses: Array<{ name: string; trend: GradeTrend }>;
  upcomingWeekMinutes: number;
  trailingAverageWeekMinutes: number;
}): RiskAlert[] {
  const alerts: RiskAlert[] = [];

  for (const course of input.courses) {
    if (course.trend.overall !== null && course.trend.overall < LOW_GRADE_THRESHOLD) {
      alerts.push({ type: "low-grade", courseName: course.name, percent: course.trend.overall });
    }
    if (course.trend.delta !== null && course.trend.delta <= TREND_DOWN_THRESHOLD) {
      alerts.push({ type: "trending-down", courseName: course.name, delta: course.trend.delta });
    }
  }

  if (
    input.trailingAverageWeekMinutes > 0 &&
    input.upcomingWeekMinutes > input.trailingAverageWeekMinutes * HEAVY_WEEK_MULTIPLIER
  ) {
    alerts.push({
      type: "heavy-week",
      upcomingMinutes: input.upcomingWeekMinutes,
      averageMinutes: input.trailingAverageWeekMinutes,
    });
  }

  return alerts;
}

// Re-exported for callers that need week-bucketing consistent with
// velocityPerWeek's window definition.
export function weeksAgo(date: Date, from = new Date()): number {
  return differenceInCalendarWeeks(from, date);
}
