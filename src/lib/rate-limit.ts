import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Provisioned via the Vercel Marketplace (Upstash), not the plain
// UPSTASH_REDIS_REST_* names Ratelimit.fromEnv()/Redis.fromEnv() expect —
// Vercel's own KV-branded env var names are used instead.
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// Every limiter shares one Redis instance but gets its own key prefix
// (below) so a burst against one action type never eats into another's
// budget. Sliding window, not fixed window, so a burst right at a window
// boundary can't double an attacker's effective rate.

/** Frequent, low-friction writes (sending a message). Generous — this must not get in the way of real conversation. */
export const messageLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "10 s"),
  prefix: "ratelimit:message",
});

/** Rare-in-normal-use, higher-consequence actions (invites, reports, school registration). */
export const sensitiveActionLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "ratelimit:sensitive",
});

/** Join-code attempts — the thing this specifically guards against is brute-forcing a 6-character code. */
export const joinCodeLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  prefix: "ratelimit:joincode",
});

export class RateLimitError extends Error {
  constructor() {
    super("You're doing that too much — try again in a moment.");
    this.name = "RateLimitError";
  }
}

/** Throws RateLimitError if `key` has exceeded `limiter`'s budget. Call as the first check after auth in any action worth protecting. */
export async function enforceRateLimit(limiter: Ratelimit, key: string) {
  const { success } = await limiter.limit(key);
  if (!success) throw new RateLimitError();
}
