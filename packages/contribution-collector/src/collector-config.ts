/**
 * Contribution collector configuration.
 *
 * Controls resource budgets and collection depth for a single analytics run.
 */

/** Configuration for the contribution collector. */
export interface CollectorConfig {
  /**
   * Maximum number of repositories to enrich with file-level detail.
   *
   * Repository discovery (activity counts) is always complete.
   * File-level enrichment is bounded by this limit to control API usage.
   * @default 50
   */
  readonly maxRepositoriesForFileDetail: number;

  /**
   * Maximum number of commits to fetch file detail for (across all repositories).
   *
   * When this limit is reached, remaining commits are counted but not enriched.
   * Confidence is lowered proportionally.
   * @default 200
   */
  readonly maxCommitsForFileDetail: number;

  /**
   * Maximum number of PR file list fetches per analytics run.
   * @default 100
   */
  readonly maxPullRequestFileListFetches: number;

  /**
   * Maximum pages to fetch per REST pagination call.
   * Prevents runaway pagination on extremely active repositories.
   * @default 10
   */
  readonly maxPagesPerRequest: number;

  /**
   * Number of items per page for REST API calls.
   * GitHub maximum is 100 for most endpoints.
   * @default 100
   */
  readonly perPage: number;
}

/** Default collector configuration for production use. */
export const DEFAULT_COLLECTOR_CONFIG: CollectorConfig = {
  maxRepositoriesForFileDetail: 50,
  maxCommitsForFileDetail: 200,
  maxPullRequestFileListFetches: 100,
  maxPagesPerRequest: 10,
  perPage: 100,
} as const;
