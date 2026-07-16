/**
 * Pull request domain model.
 *
 * Authored PRs are the preferred source for file-level change evidence because
 * the PR file list describes the complete submitted change set, avoiding
 * branch traversal ambiguity and double-counting individual commits.
 */

import type { GitHubNodeId } from "./identity.js";
import type { RepositoryId } from "./repository.js";
import type { ISODateString } from "./time-window.js";

declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

/** A GitHub pull request number within a repository. */
export type PullRequestNumber = Brand<number, "PullRequestNumber">;

/** Constructs a typed pull request number. Use only at ingestion boundaries. */
export function toPullRequestNumber(raw: number): PullRequestNumber {
  return raw as PullRequestNumber;
}

/** The merge state of a pull request at time of discovery. */
export type PullRequestState = "open" | "closed" | "merged";

/**
 * An authored pull request associated with a subject developer.
 *
 * Only pull requests where the subject developer is the author are included.
 * Reviews are tracked separately via {@link ContributionActivity}.
 */
export interface PullRequest {
  /** Opaque GitHub node ID for deduplication. */
  readonly nodeId: GitHubNodeId;
  /** PR number within the repository. */
  readonly number: PullRequestNumber;
  /** Repository this PR was opened against. */
  readonly repositoryId: RepositoryId;
  /** PR title for debugging and display. */
  readonly title: string;
  /** State at time of discovery. */
  readonly state: PullRequestState;
  /** Whether the PR was merged (subset of closed). */
  readonly isMerged: boolean;
  /** UTC creation timestamp. */
  readonly createdAt: ISODateString;
  /** UTC merge timestamp, if merged. */
  readonly mergedAt: ISODateString | null;
  /** UTC close timestamp, if closed without merge. */
  readonly closedAt: ISODateString | null;
  /** Number of files in the PR, as reported by GitHub. May be capped at 3000. */
  readonly changedFileCount: number;
  /**
   * Whether the file list was successfully fetched.
   * When false, the commit evidence fallback is used and confidence is lowered.
   */
  readonly fileListFetched: boolean;
  /**
   * Whether the file list was truncated at the GitHub API cap (3000 files).
   * When true, confidence is lowered and the truncation is reported.
   */
  readonly fileListTruncated: boolean;
}
