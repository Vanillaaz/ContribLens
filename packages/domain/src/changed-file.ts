/**
 * Changed file domain model.
 *
 * A changed file is the atomic unit of analysis for the Contribution Rules Engine
 * and Language Analytics Engine. It represents a single file path modified in
 * a commit or pull request.
 */

import type { CommitSha } from "./commit.js";
import type { GitHubNodeId } from "./identity.js";
import type { RepositoryId } from "./repository.js";
import type { PullRequestNumber } from "./pull-request.js";

/**
 * The status of a file within a commit or PR, as reported by GitHub.
 *
 * - `added`    — file did not exist before this change.
 * - `modified` — file existed and its content changed.
 * - `removed`  — file was deleted.
 * - `renamed`  — file was moved/renamed, possibly with content changes.
 * - `copied`   — file was copied from another path.
 * - `changed`  — GitHub-reported submodule pointer change (rare).
 * - `unknown`  — status could not be determined from the API response.
 */
export type FileStatus =
  | "added"
  | "modified"
  | "removed"
  | "renamed"
  | "copied"
  | "changed"
  | "unknown";

/**
 * Evidence source indicates where the file information was retrieved from.
 *
 * `pr-files` is preferred; `commit-detail` is the fallback.
 */
export type FileEvidenceSource = "pr-files" | "commit-detail";

/**
 * A single file changed within a commit or pull request.
 *
 * This is the input to the Contribution Rules Engine. Every field that is
 * unavailable from the GitHub API is explicitly typed as `null` rather than
 * omitted, so rules can distinguish "zero changes" from "unknown changes".
 */
export interface ChangedFile {
  /** The repository this file belongs to. */
  readonly repositoryId: RepositoryId;
  /**
   * PR node ID, if this file was discovered via `GET /pulls/{number}/files`.
   * Null for commit-based evidence.
   */
  readonly pullRequestNodeId: GitHubNodeId | null;
  /**
   * PR number within the repository, if applicable.
   * Used for display and deduplication.
   */
  readonly pullRequestNumber: PullRequestNumber | null;
  /**
   * Commit SHA, if this file was discovered via `GET /commits/{sha}`.
   * May also be set for PR files when the source commit is known.
   */
  readonly commitSha: CommitSha | null;
  /** Current file path (after rename if applicable). */
  readonly path: string;
  /** Previous file path before a rename/copy. Null if not a rename. */
  readonly previousPath: string | null;
  /** File status as reported by GitHub. */
  readonly status: FileStatus;
  /**
   * Number of line additions reported by GitHub.
   * Null when GitHub does not provide this value (e.g. binary files).
   */
  readonly additions: number | null;
  /**
   * Number of line deletions reported by GitHub.
   * Null when GitHub does not provide this value (e.g. binary files).
   */
  readonly deletions: number | null;
  /**
   * Raw unified diff patch, if available from the GitHub API.
   * Used by formatting-only and generated-header rules.
   * May be absent for large or binary files.
   */
  readonly patch: string | null;
  /** Where this file information was retrieved from. */
  readonly evidenceSource: FileEvidenceSource;
}

/** Returns total raw change volume (additions + deletions), or null if either is unknown. */
export function rawChangeVolume(file: ChangedFile): number | null {
  if (file.additions === null || file.deletions === null) {
    return null;
  }
  return file.additions + file.deletions;
}
