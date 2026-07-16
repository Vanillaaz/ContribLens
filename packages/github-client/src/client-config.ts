/**
 * GitHub client configuration.
 *
 * All configuration is resolved at startup and injected into the client.
 * No environment variables are read here — that is the responsibility of
 * the application layer (apps/api).
 */

/** Maximum number of concurrent GitHub API requests per process. */
export const DEFAULT_CONCURRENCY = 5;

/** Default request timeout in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 10_000;

/** Maximum retry attempts for transient errors. */
export const DEFAULT_MAX_RETRIES = 3;

/**
 * Configuration for the GitHub API client.
 */
export interface GitHubClientConfig {
  /**
   * GitHub personal access token or app token.
   * Optional for public API access (lower rate limits apply).
   * Required for higher throughput in production.
   */
  readonly token: string | null;

  /**
   * User-Agent string sent with every request.
   * GitHub requires a non-empty User-Agent.
   */
  readonly userAgent: string;

  /**
   * Maximum number of concurrent GitHub API requests.
   * Exceeding GitHub's secondary rate limits causes 403 responses.
   * @default DEFAULT_CONCURRENCY
   */
  readonly maxConcurrency: number;

  /**
   * Request timeout in milliseconds.
   * @default DEFAULT_TIMEOUT_MS
   */
  readonly timeoutMs: number;

  /**
   * Maximum retries for transient failures (5xx, network errors).
   * Rate-limit responses are NOT retried — they return a partial result.
   * @default DEFAULT_MAX_RETRIES
   */
  readonly maxRetries: number;

  /**
   * Maximum total GitHub API points budget for a single analytics run.
   * The client stops enrichment when this budget is near-exhausted.
   * Set to null to disable budget enforcement (not recommended for production).
   */
  readonly requestBudget: number | null;
}

/** Creates a default client config, suitable for development. */
export function createDefaultClientConfig(
  overrides?: Partial<GitHubClientConfig>,
): GitHubClientConfig {
  return {
    token: null,
    userAgent: "ContribLens/1.0 (https://github.com/ContribLens)",
    maxConcurrency: DEFAULT_CONCURRENCY,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    maxRetries: DEFAULT_MAX_RETRIES,
    requestBudget: 500,
    ...overrides,
  };
}
