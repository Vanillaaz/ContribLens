/**
 * GitHub client errors.
 *
 * Maps Octokit and HTTP errors to typed AnalyticsError domain objects.
 * No Octokit types leak out of this package.
 */

import {
  createAnalyticsError,
  type AnalyticsError,
} from "@ContribLens/domain";

/** Octokit-compatible error shape (minimal surface). */
interface OctokitErrorLike {
  status?: number;
  message?: string;
  response?: {
    headers?: Record<string, string | undefined>;
    data?: unknown;
  };
}

function isOctokitErrorLike(err: unknown): err is OctokitErrorLike {
  return typeof err === "object" && err !== null && "status" in err;
}

/**
 * Maps a raw error from Octokit or fetch into a typed AnalyticsError.
 *
 * @param err     - The raw error caught from an API call.
 * @param correlationId - The request correlation ID.
 * @param context - Human-readable description of the operation that failed.
 */
export function mapToAnalyticsError(
  err: unknown,
  correlationId: string,
  context: string,
): AnalyticsError {
  console.error("RAW ERROR IN mapToAnalyticsError:", err);
  if (isOctokitErrorLike(err)) {
    const status = err.status;
    const retryAfter = err.response?.headers?.["retry-after"] ?? null;
    const resetAt = err.response?.headers?.["x-ratelimit-reset"] ?? null;
    const retryAfterIso =
      retryAfter !== null
        ? new Date(Date.now() + parseInt(retryAfter, 10) * 1000).toISOString()
        : resetAt !== null
          ? new Date(parseInt(resetAt, 10) * 1000).toISOString()
          : null;

    if (status === 404) {
      return createAnalyticsError(
        "USER_NOT_FOUND",
        `The requested resource was not found: ${context}`,
        correlationId,
      );
    }

    if (status === 403 || status === 429) {
      return createAnalyticsError(
        "UPSTREAM_RATE_LIMITED",
        `GitHub API rate limit exceeded during: ${context}. ` +
          (retryAfterIso ? `Rate limit resets at ${retryAfterIso}.` : ""),
        correlationId,
        { retryable: true, retryAfter: retryAfterIso },
      );
    }

    if (status === 401) {
      return createAnalyticsError(
        "INACCESSIBLE_SOURCE",
        `GitHub API authentication failed during: ${context}`,
        correlationId,
      );
    }

    if (status !== undefined && status >= 500) {
      return createAnalyticsError(
        "UPSTREAM_TIMEOUT",
        `GitHub API server error (${status.toString()}) during: ${context}`,
        correlationId,
        { retryable: true },
      );
    }
  }

  // Network timeout or fetch error
  const message = err instanceof Error ? err.message : String(err);
  if (message.toLowerCase().includes("timeout") || message.toLowerCase().includes("econnreset")) {
    return createAnalyticsError(
      "UPSTREAM_TIMEOUT",
      `Request timed out during: ${context}`,
      correlationId,
      { retryable: true },
    );
  }

  return createAnalyticsError(
    "INTERNAL_ERROR",
    `Unexpected error during: ${context}`,
    correlationId,
  );
}

/**
 * Maps a GraphQL partial error response.
 * GitHub GraphQL can return both `data` and `errors` in the same response.
 */
export function mapGraphQLPartialError(
  errors: readonly { message?: string }[],
  correlationId: string,
): AnalyticsError {
  const messages = errors
    .map((e) => e.message ?? "unknown")
    .join("; ");

  return createAnalyticsError(
    "PARTIAL_GITHUB_RESPONSE",
    `GitHub GraphQL returned partial errors: ${messages}`,
    correlationId,
    { hasPartialResult: true },
  );
}
