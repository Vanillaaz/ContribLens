/**
 * Source coverage domain model.
 *
 * Tracks which repositories and data sources were accessible, inaccessible,
 * or partially covered during the analytics run. Used by the confidence model
 * to assess and explain result completeness.
 */

import type { RepositoryId } from "./repository.js";

/**
 * Why a repository or data source was inaccessible.
 */
export type InaccessibilityReason =
  | "deleted"      // Repository no longer exists.
  | "private"      // Repository is private and we have no authorization.
  | "api_error"    // API returned an unexpected error for this repository.
  | "rate_limited" // API request for this repository was rate-limited and not retried.
  | "timeout"      // API request timed out.
  | "unknown";     // Could not determine the reason.

/**
 * A repository or data source that could not be fully accessed.
 */
export interface InaccessibleSource {
  /** Repository that was inaccessible. */
  readonly repositoryId: RepositoryId;
  /** Repository slug for display (owner/name at discovery time). */
  readonly repositorySlug: string;
  /** Why the repository was inaccessible. */
  readonly reason: InaccessibilityReason;
  /**
   * Whether this source is known to contain commits attributed to the subject.
   * True when the contribution collection confirmed activity but details are unavailable.
   */
  readonly hasKnownContributions: boolean;
}

/**
 * Coverage statistics for the full analytics run.
 *
 * These statistics feed directly into the confidence model and are
 * exposed verbatim in the analytics snapshot for consumer transparency.
 */
export interface SourceCoverage {
  /** Total repositories discovered via contribution collection. */
  readonly discoveredRepositoryCount: number;
  /** Repositories for which full file-level evidence was retrieved. */
  readonly fullyAccessibleRepositoryCount: number;
  /** Repositories that were partially or fully inaccessible. */
  readonly inaccessibleSources: readonly InaccessibleSource[];
  /**
   * Number of commits for which file-level detail could not be fetched.
   * These commits still count in activity totals but not in code analytics.
   */
  readonly commitsWithoutFileDetail: number;
  /** Total commits for which file-level detail was successfully retrieved. */
  readonly commitsWithFileDetail: number;
  /**
   * Number of PRs for which the file list was truncated at the 3000-file cap.
   */
  readonly prsWithTruncatedFileList: number;
  /** Whether the repository discovery list was truncated by the API. */
  readonly repositoryDiscoveryTruncated: boolean;
  /**
   * Number of time window pagination requests that could not complete
   * (budget exhausted before the full window was covered).
   */
  readonly paginationIncompleteCount: number;
}
