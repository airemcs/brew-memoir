import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Rate limiters
//
// Uses Upstash Redis so limits survive across serverless cold starts.
// Returns null when env vars aren't set — rate limiting is silently skipped
// in local development without a Redis instance.
//
// Limits:
//   register — 5 attempts per IP per hour
//   signin   — 10 attempts per IP per 15 minutes
// ---------------------------------------------------------------------------

function make(requests: number, window: `${number} ${"s" | "m" | "h" | "d"}`) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: "brew-memoir",
  });
}

// 5 registrations per IP per hour
export const registerLimiter = make(5, "1 h");

// 10 sign-in attempts per IP per 15 minutes
export const signinLimiter = make(10, "15 m");

// 20 uploads per user per hour (keyed by userId, not IP)
export const uploadLimiter = make(20, "1 h");

// ---------------------------------------------------------------------------
// getIp — extracts the real client IP from a request's headers.
// Works on Vercel (x-forwarded-for) and falls back to loopback for local dev.
// ---------------------------------------------------------------------------

export function getIp(headers: Headers | Record<string, string | string[] | undefined>): string {
  const raw =
    headers instanceof Headers
      ? headers.get("x-forwarded-for")
      : (Array.isArray(headers["x-forwarded-for"])
          ? headers["x-forwarded-for"][0]
          : headers["x-forwarded-for"]) ?? null;

  return raw?.split(",")[0].trim() ?? "127.0.0.1";
}
