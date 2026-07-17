/**
 * Contribution activity domain model.
 *
 * Tracks the types of GitHub activity a developer performed during
 * the requested time window. These totals come directly from GitHub's
 * contribution collection — they are not derived from our file analysis.
 */

/**
 * The type of GitHub contribution activity.
 *
 * - `commit`           — a commit authored by the developer.
 * - `pull_request`     — a pull request opened by the developer.
 * - `pull_request_merged` — a subset of pull_requests that were merged.
 * - `review`           — a pull request review submitted by the developer.
 * - `issue`            — an issue opened by the developer.
 * - `discussion`       — a discussion started by the developer (where API-accessible).
 */
export type ActivityType =
  | "commit"
  | "pull_request"
  | "pull_request_merged"
  | "review"
  | "issue"
  | "discussion";

/**
 * A contribution activity total for a single activity type.
 *
 * Totals come from GitHub's `contributionsCollection` — they are the
 * most reliable count available but may differ from directly-counted
 * objects due to GitHub's own contribution eligibility rules.
 */
export interface ActivityTotal {
  /** The type of activity. */
  readonly type: ActivityType;
  /**
   * Count of this activity type in the requested window.
   * Null if the count could not be retrieved (API error or unavailability).
   *
   * NEVER return 0 for a failed fetch. Use null instead.
   */
  readonly count: number | null;
  /**
   * Whether this count covers the full requested time window.
   * False when pagination was incomplete or the window was partially covered.
   */
  readonly isComplete: boolean;
}

/**
 * All activity totals for a subject developer in a time window.
 */
export interface ContributionActivity {
  /** Totals by activity type. */
  readonly totals: readonly ActivityTotal[];
  /** Whether the contribution collection was truncated (> max repositories). */
  readonly repositoryDiscoveryTruncated: boolean;
  readonly discoveredRepositoryCount: number;
  /** The current consecutive days of contributions (counting back from today/end of window). */
  readonly currentStreak?: number;
  /** Start date of the current streak. */
  readonly currentStreakStart?: string;
  /** End date of the current streak. */
  readonly currentStreakEnd?: string;

  /** The longest consecutive days of contributions in the fetched window. */
  readonly longestStreak?: number;
  /** Start date of the longest streak. */
  readonly longestStreakStart?: string;
  /** End date of the longest streak. */
  readonly longestStreakEnd?: string;

  /** Total repository traffic views for repositories owned by the subject (null if unauthorized/unavailable). */
  readonly totalViews?: number | null;
  /** Total repository traffic clones for repositories owned by the subject (null if unauthorized/unavailable). */
  readonly totalClones?: number | null;
}

/** Returns the total for a specific activity type, or null if not present. */
export function getActivityTotal(
  activity: ContributionActivity,
  type: ActivityType,
): ActivityTotal | undefined {
  return activity.totals.find((t) => t.type === type);
}
