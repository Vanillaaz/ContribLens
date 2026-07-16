/**
 * Rate limit state tracking.
 *
 * The GitHub API imposes multiple rate limits:
 * - GraphQL: point-based budget (5000 points/hour authenticated, 60 unauthenticated)
 * - REST: request-count-based (5000/hour authenticated)
 * - Secondary limits: concurrency, request frequency, CPU time
 *
 * This module tracks consumed budget and reset times so the client can
 * make pre-flight decisions rather than waiting for a 403 response.
 */

/** The type of GitHub API being tracked. */
export type ApiType = "graphql" | "rest";

/**
 * Current rate limit state as parsed from GitHub response headers.
 *
 * GitHub headers:
 * - `x-ratelimit-limit`     — total budget for the current window
 * - `x-ratelimit-remaining` — remaining budget
 * - `x-ratelimit-reset`     — Unix timestamp when the budget resets
 * - `x-ratelimit-used`      — points used in the current window
 * - `retry-after`           — seconds to wait (secondary rate limit)
 */
export interface RateLimitState {
  readonly apiType: ApiType;
  /** Total budget for the current window. */
  readonly limit: number;
  /** Remaining budget. */
  readonly remaining: number;
  /** Unix timestamp (seconds) when the budget resets. */
  readonly resetAt: number;
  /** Points used in this window. */
  readonly used: number;
  /**
   * Whether the client is currently in a secondary rate limit backoff.
   * Secondary limits are not announced in advance — they manifest as 403 responses.
   */
  readonly secondaryLimitActive: boolean;
  /**
   * UTC timestamp until which requests should be paused due to secondary limit.
   * Null when not in backoff.
   */
  readonly backoffUntil: number | null;
  /** When this state was last updated (Unix ms). */
  readonly observedAt: number;
}

/**
 * Tracks rate limit state for both GraphQL and REST APIs.
 *
 * This is a mutable store updated after every response.
 * It is NOT thread-safe — use within a single analytics run instance.
 */
export class RateLimitTracker {
  private readonly state = new Map<ApiType, RateLimitState>();

  /** Updates state from GitHub response headers. */
  recordResponse(apiType: ApiType, headers: Record<string, string | undefined>): void {
    const limit = parseInt(headers["x-ratelimit-limit"] ?? "0", 10);
    const remaining = parseInt(headers["x-ratelimit-remaining"] ?? "0", 10);
    const reset = parseInt(headers["x-ratelimit-reset"] ?? "0", 10);
    const used = parseInt(headers["x-ratelimit-used"] ?? "0", 10);
    const retryAfter = headers["retry-after"];

    const now = Date.now();
    const existing = this.state.get(apiType);

    this.state.set(apiType, {
      apiType,
      limit: isNaN(limit) ? (existing?.limit ?? 0) : limit,
      remaining: isNaN(remaining) ? (existing?.remaining ?? 0) : remaining,
      resetAt: isNaN(reset) ? (existing?.resetAt ?? 0) : reset,
      used: isNaN(used) ? (existing?.used ?? 0) : used,
      secondaryLimitActive: retryAfter !== undefined,
      backoffUntil:
        retryAfter !== undefined
          ? now + parseInt(retryAfter, 10) * 1000
          : (existing?.backoffUntil ?? null),
      observedAt: now,
    });
  }

  /** Returns current state for an API type, or null if no response seen yet. */
  getState(apiType: ApiType): RateLimitState | null {
    return this.state.get(apiType) ?? null;
  }

  /**
   * Returns true if the client should pause before making another request.
   * Checks both secondary limit backoff and remaining budget threshold.
   */
  shouldPause(apiType: ApiType, minimumRemaining = 50): boolean {
    const s = this.state.get(apiType);
    if (!s) return false;
    if (s.backoffUntil !== null && Date.now() < s.backoffUntil) return true;
    return s.remaining < minimumRemaining;
  }

  /**
   * Returns milliseconds to wait before the next request is safe.
   * Returns 0 if no pause is needed.
   */
  msUntilSafe(apiType: ApiType): number {
    const s = this.state.get(apiType);
    if (!s) return 0;
    if (s.backoffUntil !== null) {
      const wait = s.backoffUntil - Date.now();
      if (wait > 0) return wait;
    }
    if (s.remaining < 50) {
      const resetMs = s.resetAt * 1000 - Date.now();
      return Math.max(0, resetMs);
    }
    return 0;
  }

  /** Returns the ISO timestamp of the rate limit reset for display. */
  resetTimestamp(apiType: ApiType): string | null {
    const s = this.state.get(apiType);
    if (!s || s.resetAt === 0) return null;
    return new Date(s.resetAt * 1000).toISOString();
  }
}
