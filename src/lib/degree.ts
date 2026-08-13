// Pure functions — no I/O — same approach as grades.ts/gamification.ts/analytics.ts.
// Everything here operates on self-authored requirements (see roadmap.md
// for why there's no real per-institution curriculum data involved).

export type RequirementInput = {
  id: string;
  creditsRequired: number;
  creditsCompleted: number;
  requiresId: string | null;
};

/** 0-100, capped even if creditsCompleted exceeds creditsRequired (e.g. transfer credit overage). */
export function requirementPercent(req: { creditsRequired: number; creditsCompleted: number }): number {
  if (req.creditsRequired <= 0) return 100;
  return Math.min(100, (req.creditsCompleted / req.creditsRequired) * 100);
}

export function isRequirementComplete(req: { creditsRequired: number; creditsCompleted: number }): boolean {
  return req.creditsCompleted >= req.creditsRequired;
}

export type OverallProgress = { creditsCompleted: number; creditsRequired: number; percent: number };

/** Aggregate progress across every requirement — credits, not a simple average of percents,
 * so a 1-credit and a 30-credit requirement don't count equally. */
export function overallProgress(
  reqs: { creditsRequired: number; creditsCompleted: number }[],
): OverallProgress {
  const creditsRequired = reqs.reduce((sum, r) => sum + r.creditsRequired, 0);
  const creditsCompleted = reqs.reduce((sum, r) => sum + Math.min(r.creditsCompleted, r.creditsRequired), 0);
  return {
    creditsCompleted,
    creditsRequired,
    percent: creditsRequired > 0 ? (creditsCompleted / creditsRequired) * 100 : 0,
  };
}

/** True when a requirement names a prerequisite that isn't complete yet. Null requiresId (or a
 * dangling/self reference that can't be resolved) is never blocked. */
export function isBlocked(req: RequirementInput, all: RequirementInput[]): boolean {
  if (!req.requiresId) return false;
  const prereq = all.find((r) => r.id === req.requiresId);
  if (!prereq) return false;
  return !isRequirementComplete(prereq);
}
