// Pure functions — no I/O — same approach as grades.ts/gamification.ts/analytics.ts/coppa.ts.

const JOIN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — avoids look-alikes
const JOIN_CODE_LENGTH = 6;

/** Domain portion of an email, lowercased. Returns null for a malformed address. */
export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at === -1 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}

/** Normalizes user-entered domain input ("@Lincoln.edu", " lincoln.edu ") to bare lowercase form. */
export function normalizeDomain(input: string): string {
  return input.trim().toLowerCase().replace(/^@/, "");
}

/** True when an account's email belongs to the given school domain. */
export function matchesSchoolDomain(email: string, schoolDomain: string): boolean {
  return emailDomain(email) === normalizeDomain(schoolDomain);
}

/** Random human-friendly join code, e.g. "7KXQ2P" — ambiguous characters excluded on purpose. */
export function generateJoinCode(): string {
  let code = "";
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
    code += JOIN_CODE_CHARS[Math.floor(Math.random() * JOIN_CODE_CHARS.length)];
  }
  return code;
}
