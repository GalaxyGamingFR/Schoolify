// Pure functions — no I/O — same approach as grades.ts/gamification.ts/analytics.ts.
//
// Safety scope decision (see roadmap.md Phase 8): direct/group messaging is
// only allowed between people who share a course (as classmates, or
// teacher+enrolled-student) — not open messaging to any user platform-wide.
// This keeps the contact graph bounded to people already in the same
// class, a meaningfully safer default for a platform used by minors than
// letting anyone message anyone by search/email.

/** True when two users have at least one course in common (courses either is enrolled in or teaches). */
export function shareCourse(userACourseIds: string[], userBCourseIds: string[]): boolean {
  const setB = new Set(userBCourseIds);
  return userACourseIds.some((id) => setB.has(id));
}

export function canMessageDirectly(params: {
  userACourseIds: string[];
  userBCourseIds: string[];
  blockedEitherDirection: boolean;
}): boolean {
  if (params.blockedEitherDirection) return false;
  return shareCourse(params.userACourseIds, params.userBCourseIds);
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
