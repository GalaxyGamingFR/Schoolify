// Pure grade-calculation functions — no I/O, so they're easy to verify by
// hand. Uses the "total points" method (sum earned / sum possible) rather
// than averaging per-entry percentages, which is more standard and doesn't
// skew when entries carry different point values.

export type GradeEntryInput = {
  pointsEarned: number;
  pointsPossible: number;
};

export type GradeCategoryInput = {
  weight: number;
  dropLowestN: number;
  curveAdjustment: number;
  gradeEntries: GradeEntryInput[];
};

/**
 * Category percent (0-100), or null if the category has no entries yet —
 * categories without entries don't count toward the course grade until
 * something is recorded in them.
 */
export function computeCategoryPercent(category: GradeCategoryInput): number | null {
  if (category.gradeEntries.length === 0) return null;

  const sorted = [...category.gradeEntries].sort(
    (a, b) => a.pointsEarned / a.pointsPossible - b.pointsEarned / b.pointsPossible,
  );
  const kept = sorted.slice(Math.min(category.dropLowestN, sorted.length - 1));

  const earned = kept.reduce((sum, e) => sum + e.pointsEarned, 0);
  const possible = kept.reduce((sum, e) => sum + e.pointsPossible, 0);
  if (possible === 0) return null;

  return (earned / possible) * 100 + category.curveAdjustment;
}

/**
 * Weighted course percent across categories, normalized by the weight of
 * categories that actually have entries — so a course isn't dragged down
 * by categories the student hasn't recorded anything in yet.
 */
export function computeCourseGrade(categories: GradeCategoryInput[]): number | null {
  const withPercent = categories
    .map((c) => ({ weight: c.weight, percent: computeCategoryPercent(c) }))
    .filter((c): c is { weight: number; percent: number } => c.percent !== null);

  const totalWeight = withPercent.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return null;

  const weightedSum = withPercent.reduce((sum, c) => sum + c.weight * c.percent, 0);
  return weightedSum / totalWeight;
}

const SCALE: Array<{ min: number; letter: string; points: number }> = [
  { min: 97, letter: "A+", points: 4.0 },
  { min: 93, letter: "A", points: 4.0 },
  { min: 90, letter: "A-", points: 3.7 },
  { min: 87, letter: "B+", points: 3.3 },
  { min: 83, letter: "B", points: 3.0 },
  { min: 80, letter: "B-", points: 2.7 },
  { min: 77, letter: "C+", points: 2.3 },
  { min: 73, letter: "C", points: 2.0 },
  { min: 70, letter: "C-", points: 1.7 },
  { min: 67, letter: "D+", points: 1.3 },
  { min: 63, letter: "D", points: 1.0 },
  { min: 60, letter: "D-", points: 0.7 },
  { min: -Infinity, letter: "F", points: 0.0 },
];

export function letterGrade(percent: number): string {
  return SCALE.find((s) => percent >= s.min)!.letter;
}

export function gpaPoints(percent: number): number {
  return SCALE.find((s) => percent >= s.min)!.points;
}

/** Unweighted GPA across courses that have a computed grade. */
export function computeGpa(coursePercents: number[]): number | null {
  if (coursePercents.length === 0) return null;
  const total = coursePercents.reduce((sum, p) => sum + gpaPoints(p), 0);
  return total / coursePercents.length;
}
