// Pure functions — no I/O — same approach as grades.ts/gamification.ts.

export type Trend = { direction: "up" | "down" | "flat"; label: string };

/** Week-over-week style trend: percent change, or a raw "+N" when the prior period was zero (percent change is undefined/infinite there). */
export function computeTrend(current: number, prior: number): Trend {
  if (prior === 0) {
    if (current === 0) return { direction: "flat", label: "—" };
    return { direction: "up", label: `+${current}` };
  }
  const pct = ((current - prior) / prior) * 100;
  if (Math.abs(pct) < 1) return { direction: "flat", label: "flat" };
  const rounded = Math.round(pct);
  return { direction: rounded > 0 ? "up" : "down", label: `${rounded > 0 ? "+" : ""}${rounded}%` };
}

/**
 * Buckets a list of timestamps into per-day counts for the last `days` days
 * (oldest first), keyed "yyyy-MM-dd". UTC throughout -- setDate/getDate
 * shift the *local* calendar day, and mixing that with toISOString's UTC
 * day (as an earlier version of this function did) can misfile a
 * timestamp into the wrong bucket depending on server timezone. Same bug
 * class as coppa.ts / Settings' DOB display, just the reverse direction.
 */
export function bucketByDay(dates: Date[], days: number, now: Date = new Date()): { key: string; count: number }[] {
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const date of dates) {
    const key = date.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets, ([key, count]) => ({ key, count }));
}
