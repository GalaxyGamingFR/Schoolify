import { startOfDay } from "date-fns";

const MS_PER_DAY = 86_400_000;

// Pure functions — no I/O — so the math is easy to verify by hand, same
// approach as src/lib/grades.ts.

const BASE_XP_PER_COMPLETION = 10;
const ON_TIME_BONUS_XP = 5;
const XP_PER_LEVEL = 100;

export type Completion = {
  completedAt: Date;
  dueAt: Date;
};

/** Total XP from all completed assignments — base + on-time bonus each. */
export function calculateXp(completions: Completion[]): number {
  return completions.reduce((total, c) => {
    const onTime = c.completedAt <= c.dueAt;
    return total + BASE_XP_PER_COMPLETION + (onTime ? ON_TIME_BONUS_XP : 0);
  }, 0);
}

export type LevelInfo = {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
};

/** Linear curve: level N starts at (N-1)*100 XP. Simple on purpose — no
 * player data yet to justify tuning a curve against. */
export function calculateLevel(totalXp: number): LevelInfo {
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = totalXp % XP_PER_LEVEL;
  return { level, xpIntoLevel, xpForNextLevel: XP_PER_LEVEL };
}

export type StreakInfo = {
  currentStreak: number;
  longestStreak: number;
};

/**
 * Consecutive-day streak from a set of completion timestamps. "Current"
 * streak counts backward from today (or yesterday, if nothing's done yet
 * today — the streak isn't broken until a full day passes with no
 * completion). Computed lazily from data on each page load; no cron job.
 */
export function calculateStreak(completedAtDates: Date[]): StreakInfo {
  if (completedAtDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Dedup by calendar day using the local-midnight timestamp as the key —
  // stays entirely in Date-object land, no ISO-string round-trip (parsing
  // a bare "YYYY-MM-DD" string is UTC per spec, which would silently
  // disagree with startOfDay's local-time semantics and shift results by
  // a day depending on server timezone).
  const dayTimestamps = [...new Set(completedAtDates.map((d) => startOfDay(d).getTime()))]
    .sort((a, b) => b - a);

  // Whole days between two local-midnight timestamps that are already day-
  // aligned — safe as plain division since both are startOfDay() outputs.
  const daysBetween = (laterMs: number, earlierMs: number) =>
    Math.round((laterMs - earlierMs) / MS_PER_DAY);

  const todayMs = startOfDay(new Date()).getTime();
  const gapFromToday = daysBetween(todayMs, dayTimestamps[0]);

  let currentStreak = 0;
  if (gapFromToday <= 1) {
    currentStreak = 1;
    for (let i = 1; i < dayTimestamps.length; i++) {
      if (daysBetween(dayTimestamps[i - 1], dayTimestamps[i]) === 1) currentStreak++;
      else break;
    }
  }

  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < dayTimestamps.length; i++) {
    if (daysBetween(dayTimestamps[i - 1], dayTimestamps[i]) === 1) {
      run++;
    } else {
      longestStreak = Math.max(longestStreak, run);
      run = 1;
    }
  }
  longestStreak = Math.max(longestStreak, run, currentStreak);

  return { currentStreak, longestStreak };
}

export type BadgeId =
  | "first-steps"
  | "getting-started"
  | "century"
  | "on-fire"
  | "unstoppable"
  | "perfectionist";

export type Badge = { id: BadgeId; name: string; description: string };

export const BADGES: Badge[] = [
  { id: "first-steps", name: "First Steps", description: "Complete your first assignment" },
  { id: "getting-started", name: "Getting Started", description: "Complete 10 assignments" },
  { id: "century", name: "Century", description: "Complete 100 assignments" },
  { id: "on-fire", name: "On Fire", description: "7-day completion streak" },
  { id: "unstoppable", name: "Unstoppable", description: "30-day completion streak" },
  { id: "perfectionist", name: "Perfectionist", description: "10 on-time completions in a row" },
];

export function evaluateBadges(stats: {
  completedCount: number;
  longestStreak: number;
  currentOnTimeStreak: number;
}): Set<BadgeId> {
  const earned = new Set<BadgeId>();
  if (stats.completedCount >= 1) earned.add("first-steps");
  if (stats.completedCount >= 10) earned.add("getting-started");
  if (stats.completedCount >= 100) earned.add("century");
  if (stats.longestStreak >= 7) earned.add("on-fire");
  if (stats.longestStreak >= 30) earned.add("unstoppable");
  if (stats.currentOnTimeStreak >= 10) earned.add("perfectionist");
  return earned;
}

/** Longest run of consecutive on-time completions, most recent first. */
export function calculateOnTimeStreak(completions: Completion[]): number {
  const sorted = [...completions].sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  let streak = 0;
  for (const c of sorted) {
    if (c.completedAt <= c.dueAt) streak++;
    else break;
  }
  return streak;
}
