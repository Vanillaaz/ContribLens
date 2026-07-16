/**
 * IGitHubClient — the interface all analytics packages depend on.
 *
 * The concrete GitHubClient (which wraps Octokit) is the only implementation
 * in production. Tests inject a mock implementation.
 *
 * This interface is intentionally narrow: it exposes only the operations
 * the analytics engine needs, not the full GitHub API surface.
 */

import type {
  ContributionsCollectionQueryResponse,
  ContributionsCollectionQueryVariables,
} from "./queries/contributions-collection.graphql.js";
import type { RepositoryMetadataBatchResponse } from "./queries/repository-metadata.graphql.js";
import type {
  UserIdentityQueryResponse,
  UserIdentityQueryVariables,
} from "./queries/user-identity.graphql.js";
import type { CommitDetailResponse } from "./rest/commit-detail.js";
import type { CommitListItem } from "./rest/commits.js";
import type { PullRequestFile } from "./rest/pull-request-files.js";

/** Parameters for listing commits in a repository. */
export interface ListCommitsOptions {
  owner: string;
  repo: string;
  author: string;
  since: string;
  until: string;
  page?: number;
  perPage?: number;
}

/** Parameters for fetching PR files. */
export interface ListPullRequestFilesOptions {
  owner: string;
  repo: string;
  pullNumber: number;
  page?: number;
  perPage?: number;
}

/**
 * The GitHub API client interface.
 *
 * All methods return typed results. All errors are propagated as rejected
 * Promises and must be caught and mapped by the caller using mapToAnalyticsError.
 */
export interface IGitHubClient {
  /**
   * Resolves a GitHub login to user identity.
   * Returns null in the `user` field when the login does not exist.
   */
  getUserIdentity(
    variables: UserIdentityQueryVariables,
  ): Promise<UserIdentityQueryResponse>;

  /**
   * Fetches the contributions collection for a login and time window.
   * The window must be a single calendar year or shorter (GitHub limitation).
   */
  getContributionsCollection(
    variables: ContributionsCollectionQueryVariables,
  ): Promise<ContributionsCollectionQueryResponse>;

  /**
   * Fetches metadata for a batch of repositories by their stable node IDs.
   * Node IDs survive repository renames.
   */
  getRepositoryMetadataBatch(
    nodeIds: string[],
  ): Promise<RepositoryMetadataBatchResponse>;

  /**
   * Lists commits in a repository filtered by author and time window.
   * Uses REST pagination — the caller is responsible for iterating pages.
   */
  listCommits(options: ListCommitsOptions): Promise<CommitListItem[]>;

  /**
   * Fetches file-level detail for a single commit.
   * Returns files up to the GitHub API cap (300 per page, 3000 total).
   */
  getCommitDetail(
    owner: string,
    repo: string,
    sha: string,
    page?: number,
  ): Promise<CommitDetailResponse>;

  /**
   * Lists files changed in a pull request.
   * Returns files up to the GitHub API cap (3000 total, paginated).
   */
  listPullRequestFiles(
    options: ListPullRequestFilesOptions,
  ): Promise<PullRequestFile[]>;

  /**
   * Returns whether the current API budget is too low to continue.
   * The caller should stop enrichment and return a partial result
   * rather than exhausting the rate limit.
   */
  isBudgetLow(): boolean;

  /**
   * Returns the ISO timestamp when the rate limit resets, or null if unknown.
   * Used for the `retryAfter` field in rate-limit error responses.
   */
  rateLimitResetAt(): string | null;
}
