/**
 * Error domain model.
 *
 * All errors produced by the analytics engine are typed `AnalyticsError`
 * and map to a machine-readable `ErrorCode`. The HTTP layer maps these to
 * RFC 7807 problem details responses.
 *
 * Never produce a generic `Error` from an analytics package.
 */

/**
 * Machine-readable error codes for analytics failures.
 * Used by the HTTP layer to produce appropriate HTTP status codes
 * and by consumers to handle errors programmatically.
 */
export type ErrorCode =
  | "INVALID_INPUT"           // Bad request parameters.
  | "USER_NOT_FOUND"          // GitHub login does not exist or is suspended.
  | "INACCESSIBLE_SOURCE"     // A required data source could not be reached.
  | "UPSTREAM_RATE_LIMITED"   // GitHub API rate limit exhausted.
  | "UPSTREAM_TIMEOUT"        // GitHub API request timed out.
  | "PARTIAL_GITHUB_RESPONSE" // GitHub returned a partial/error GraphQL response.
  | "INSUFFICIENT_EVIDENCE"   // Not enough evidence to produce any useful result.
  | "INTERNAL_ERROR";         // Unexpected internal failure.

/**
 * A structured error produced by the analytics engine.
 *
 * All errors include a correlation ID so they can be traced in logs.
 * Safe messages are suitable for external exposure; internal details are not.
 */
export interface AnalyticsError {
  readonly type: "AnalyticsError";
  /** Machine-readable error code. */
  readonly code: ErrorCode;
  /** Safe, user-facing error message. No stack traces or internal details. */
  readonly message: string;
  /**
   * Correlation identifier linking this error to request logs.
   * Must be included in HTTP responses.
   */
  readonly correlationId: string;
  /**
   * Whether the caller should retry the request.
   * True only for transient errors (rate limit, timeout).
   */
  readonly retryable: boolean;
  /**
   * UTC timestamp after which a retry is likely to succeed.
   * Set for UPSTREAM_RATE_LIMITED errors using the GitHub reset header.
   */
  readonly retryAfter: string | null;
  /**
   * Whether a partial result is available despite this error.
   * When true, the analytics snapshot may still be usable with lower confidence.
   */
  readonly hasPartialResult: boolean;
}

/** Constructs an AnalyticsError. */
export function createAnalyticsError(
  code: ErrorCode,
  message: string,
  correlationId: string,
  options?: {
    retryable?: boolean;
    retryAfter?: string | null;
    hasPartialResult?: boolean;
  },
): AnalyticsError {
  return {
    type: "AnalyticsError",
    code,
    message,
    correlationId,
    retryable: options?.retryable ?? false,
    retryAfter: options?.retryAfter ?? null,
    hasPartialResult: options?.hasPartialResult ?? false,
  };
}

/** Type guard for AnalyticsError. */
export function isAnalyticsError(value: unknown): value is AnalyticsError {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as Record<string, unknown>)["type"] === "AnalyticsError"
  );
}
