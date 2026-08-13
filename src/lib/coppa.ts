// Pure functions — no I/O — same approach as grades.ts/gamification.ts/analytics.ts.
//
// IMPORTANT — scope boundary (see roadmap.md Phase 6 "Compliance & Safety"):
// isUnder13/needsGuardianVerification exist to drive the app's own UI gate
// (a student under 13 sees a "link a parent" screen instead of the normal
// dashboard). That gate is NOT Verifiable Parental Consent under the FTC's
// COPPA Rule — an accepted Guardianship link only proves *some* adult
// clicked "accept", not that they're the child's actual parent/guardian.
// Real VPC (credit card charge, signed form, ID check, etc.) is a
// legal/business decision nobody has made yet, so this module must never be
// treated as sufficient to launch to real under-13 users.

/**
 * Age in whole years as of `now` (defaults to today). Uses UTC accessors
 * throughout — a bare "YYYY-MM-DD" (e.g. from a date `<input>`) parses as
 * UTC midnight per spec, so reading it back with local-time getMonth/
 * getDate would silently shift the calendar day on any server west of UTC
 * (the same class of bug already hit once in gamification.ts's streak
 * math — see roadmap.md Phase 4).
 */
export function calculateAge(dateOfBirth: Date, now: Date = new Date()): number {
  let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const hasHadBirthdayThisYear =
    now.getUTCMonth() > dateOfBirth.getUTCMonth() ||
    (now.getUTCMonth() === dateOfBirth.getUTCMonth() && now.getUTCDate() >= dateOfBirth.getUTCDate());
  if (!hasHadBirthdayThisYear) age--;
  return age;
}

export function isUnder13(dateOfBirth: Date, now: Date = new Date()): boolean {
  return calculateAge(dateOfBirth, now) < 13;
}

/** True when a student needs the parent-link screen instead of full app access. */
export function needsGuardianVerification(params: {
  role: "STUDENT" | "PARENT" | "TEACHER" | "ADMIN";
  dateOfBirth: Date | null;
  hasAcceptedGuardian: boolean;
}): boolean {
  if (params.role !== "STUDENT") return false;
  if (!params.dateOfBirth) return false; // unknown DOB never blocks — nothing to gate on
  if (!isUnder13(params.dateOfBirth)) return false;
  return !params.hasAcceptedGuardian;
}
