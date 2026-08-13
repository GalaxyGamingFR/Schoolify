// Pure functions — no I/O — same approach as grades.ts/gamification.ts/analytics.ts.
//
// Safety scope decision (see roadmap.md Phase 8): direct/group messaging is
// only allowed between people who share a course (as classmates, or
// teacher+enrolled-student) OR who have an accepted guardian link (a
// parent and their own linked student) — not open messaging to any user
// platform-wide. A guardian link is, if anything, the *most* trusted
// relationship on the platform (the student explicitly accepted it, or
// invited it themselves — see Phase 6), so it belongs in the same
// allow-list as classmates, not left out of it. Originally missed: the
// eligibility check only looked at shared courses, so a parent and their
// own linked student couldn't message each other at all.

/** True when two users have at least one course in common (courses either is enrolled in or teaches). */
export function shareCourse(userACourseIds: string[], userBCourseIds: string[]): boolean {
  const setB = new Set(userBCourseIds);
  return userACourseIds.some((id) => setB.has(id));
}

export function canMessageDirectly(params: {
  userACourseIds: string[];
  userBCourseIds: string[];
  isGuardianLinked: boolean;
  blockedEitherDirection: boolean;
}): boolean {
  if (params.blockedEitherDirection) return false;
  return params.isGuardianLinked || shareCourse(params.userACourseIds, params.userBCourseIds);
}

/** Hides messages from anyone the viewer has blocked — blocking is receiver-side only (see Block model comment). */
export function filterBlockedSenders<T extends { senderId: string }>(
  messages: T[],
  blockedSenderIds: Set<string>,
): T[] {
  return messages.filter((m) => !blockedSenderIds.has(m.senderId));
}

/** Messages from anyone but the viewer, sent after lastReadAt (or ever, if never read). */
export function unreadCount<T extends { senderId: string; createdAt: Date }>(
  messages: T[],
  viewerId: string,
  lastReadAt: Date | null,
): number {
  return messages.filter(
    (m) => m.senderId !== viewerId && (lastReadAt === null || m.createdAt > lastReadAt),
  ).length;
}
