/**
 * Repository domain model.
 *
 * Repositories are classified by their ownership relationship to the subject
 * developer. This classification drives how contributions are described to
 * consumers, but does not affect whether changes are counted.
 */

import type { GitHubNodeId, GitHubLogin, RepoOwner, RepoName } from "./identity.js";

/**
 * How the repository relates to the subject developer.
 *
 * - `owned`   — the developer is the personal owner (login matches owner).
 * - `org`     — owned by a GitHub organization the developer belongs to.
 * - `external` — owned by another individual or org the developer contributed to.
 * - `unknown` — ownership could not be determined (deleted, inaccessible, or API gap).
 */
export type RepositoryRelationship = "owned" | "org" | "external" | "unknown";

/** Stable identifier for a repository. Node IDs survive renames. */
export type RepositoryId = GitHubNodeId;

/**
 * A GitHub repository discovered through contribution activity.
 *
 * This is not a general-purpose repository model; it contains only the
 * fields the analytics engine needs to classify, attribute, and report.
 */
export interface Repository {
  /** Stable GitHub node ID. Preferred key for deduplication. */
  readonly id: RepositoryId;
  /** Repository owner login or org slug at time of discovery. */
  readonly owner: RepoOwner;
  /** Repository name at time of discovery. */
  readonly name: RepoName;
  /** Full slug for display: "{owner}/{name}". */
  readonly slug: string;
  /** Ownership relationship to the subject developer. */
  readonly relationship: RepositoryRelationship;
  /** Whether the repository is a fork of another repository. */
  readonly isFork: boolean;
  /** Whether the repository has been archived. */
  readonly isArchived: boolean;
  /** Whether the repository was accessible at discovery time. */
  readonly isAccessible: boolean;
  /** Primary language reported by GitHub at the repository level.
   *  Present only for context — NEVER used for personal language attribution. */
  readonly primaryLanguage: string | null;
}

/** Constructs a display slug from owner and name. */
export function repoSlug(owner: RepoOwner | GitHubLogin, name: RepoName): string {
  return `${owner}/${name}`;
}
