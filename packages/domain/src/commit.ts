/**
 * Commit domain model.
 *
 * Commits are discovered via the REST commits API. They serve as the
 * fallback file-evidence path when a commit is not covered by an authored PR.
 */

import type { GitHubLogin, GitHubNodeId } from "./identity.js";
import type { RepositoryId } from "./repository.js";
import type { ISODateString } from "./time-window.js";

declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

/** A full 40-character Git commit SHA. */
export type CommitSha = Brand<string, "CommitSha">;

/** Constructs a typed commit SHA. Use only at ingestion boundaries. */
export function toCommitSha(raw: string): CommitSha {
  return raw as CommitSha;
}

/**
 * Authorship identity as reported by the GitHub API.
 *
 * GitHub maps commit authors to user accounts by email when possible.
 * The `login` may be absent if the commit email is not linked to any account.
 */
export interface CommitAuthor {
  /** GitHub account login, if the author email resolved to an account. */
  readonly login: GitHubLogin | null;
  /** Raw email from the git commit object. */
  readonly email: string | null;
  /** Raw name from the git commit object. */
  readonly name: string | null;
}

/**
 * A single commit associated with a repository and subject developer.
 *
 * File-level detail (`ChangedFile[]`) is fetched separately and attached
 * by the `FileEvidenceCollector`. A commit without file evidence is still
 * counted in contribution totals but does not contribute to code analytics.
 */
export interface Commit {
  /** Opaque GitHub node ID for deduplication across discovery paths. */
  readonly nodeId: GitHubNodeId;
  /** Full commit SHA. */
  readonly sha: CommitSha;
  /** Repository this commit belongs to. */
  readonly repositoryId: RepositoryId;
  /** Commit author as resolved by GitHub. */
  readonly author: CommitAuthor;
  /** UTC timestamp of the commit. */
  readonly committedAt: ISODateString;
  /** First line of the commit message. */
  readonly messageHeadline: string;
  /** Whether this commit is a merge commit (two or more parents). */
  readonly isMergeCommit: boolean;
  /** Whether this commit was part of an authored PR (prefer PR file list). */
  readonly coveredByPullRequest: boolean;
  /**
   * Whether file-level detail was successfully fetched.
   * `null` means not yet attempted.
   */
  readonly fileDetailFetched: boolean | null;
}
