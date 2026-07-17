import type { MiddlewareHandler } from "hono";

// A very naive in-memory rate limiter.
// In a production environment, you would use Redis or Cloudflare Rate Limiting.
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(limit: number, windowMs: number): MiddlewareHandler {
  return async (c, next) => {
    // For local dev/testing, we fallback to a dummy IP.
    // In production (Cloudflare, Fly.io, AWS), read `x-forwarded-for` or similar headers.
    const ip = c.req.header("x-forwarded-for") || "127.0.0.1";

    const now = Date.now();
    const record = requestCounts.get(ip);

    if (record && now < record.resetAt) {
      record.count += 1;
      if (record.count > limit) {
        c.header("Retry-After", String(Math.ceil((record.resetAt - now) / 1000)));
        return c.json(
          {
            type: "https://ContribLens.io/errors/rate-limited",
            title: "Too Many Requests",
            status: 429,
            detail: "You have exceeded your request limit. Please try again later.",
          },
          429
        );
      }
    } else {
      requestCounts.set(ip, { count: 1, resetAt: now + windowMs });
    }

    await next();
  };
}
