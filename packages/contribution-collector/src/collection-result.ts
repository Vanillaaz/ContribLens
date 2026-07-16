/**
 * Collection result.
 *
 * The immutable output of the ContributionCollector.
 * Everything the rules engine and language analytics engine need.
 */

import type {
  ChangedFile,
  Commit,
  ContributionActivity,
  DeveloperIdentity,
  PullRequest,
  Repository,
  SourceCoverage,
  TimeWindow,
} from "@ContribLens/domain";

/**
 * The complete normalized output of one contribution collection run.
 *
 * This is passed to the Contribution Rules Engine and Language Analytics Engine.
 * It contains no raw GitHub API response objects — only normalized domain types.
 */
export interface CollectionResult {
  /** Subject developer identity as resolved. */
  readonly developer: DeveloperIdentity;

  /** The effective time window covered by this collection. */
  readonly effectiveWindow: TimeWindow;

  /** Activity totals from the GitHub contribution collection. */
  readonly activity: ContributionActivity;

  /**
   * All repositories discovered via the contribution collection.
   * Deduplicated by node ID.
   */
  readonly repositories: ReadonlyMap<string, Repository>;

  /**
   * All commits discovered, keyed by `{repositoryId}:{sha}`.
   * Merge commits are included (they are filtered by the rules engine, not here).
   */
  readonly commits: readonly Commit[];

  /**
   * All authored pull requests discovered, keyed by node ID.
   */
  readonly pullRequests: readonly PullRequest[];

  /**
   * All changed files collected from PR file lists and commit details.
   *
   * Files from PR file lists are preferred over equivalent commit-detail files.
   * Deduplication by `{repositoryId}:{pullRequestNodeId|commitSha}:{path}` is applied.
   */
  readonly changedFiles: readonly ChangedFile[];

  /**
   * Coverage statistics for the confidence model.
   */
  readonly coverage: SourceCoverage;
}
