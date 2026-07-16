/**
 * @ContribLens/github-client
 *
 * GitHub GraphQL + REST adapter.
 *
 * The ONLY package in this monorepo that imports Octokit or makes HTTP requests
 * to the GitHub API. Everything outside this package works through IGitHubClient.
 */

// Public interface (consumed by contribution-collector and analytics-engine)
export type { IGitHubClient, ListCommitsOptions, ListPullRequestFilesOptions } from "./github-client.interface.js";

// Concrete implementation (instantiated in apps/api DI container only)
export { GitHubClient } from "./github-client.js";

// Configuration
export {
  createDefaultClientConfig,
  DEFAULT_CONCURRENCY,
  DEFAULT_MAX_RETRIES,
  DEFAULT_TIMEOUT_MS,
} from "./client-config.js";
export type { GitHubClientConfig } from "./client-config.js";

// Rate limit state (exposed for observability)
export { RateLimitTracker } from "./rate-limit-state.js";
export type { ApiType, RateLimitState } from "./rate-limit-state.js";

// Error mapping (exposed for testing and middleware)
export { mapToAnalyticsError, mapGraphQLPartialError } from "./errors.js";

// Pagination utilities (exposed for use in contribution-collector)
export { paginateByPage, backoffMs } from "./pagination.js";
export type { PaginationOptions, PaginationResult } from "./pagination.js";

// REST type shapes (exposed for test fixture typing)
export type { CommitListItem } from "./rest/commits.js";
export type { CommitDetailFile, CommitDetailResponse } from "./rest/commit-detail.js";
export type { PullRequestFile } from "./rest/pull-request-files.js";
export {
  COMMIT_DETAIL_FILE_CAP,
  COMMIT_DETAIL_ABSOLUTE_MAX,
} from "./rest/commit-detail.js";
export { PR_FILE_LIST_ABSOLUTE_MAX } from "./rest/pull-request-files.js";

// GraphQL response shapes (exposed for test fixture typing)
export type {
  UserIdentityQueryResponse,
  UserIdentityQueryVariables,
} from "./queries/user-identity.graphql.js";
export type {
  ContributionsCollectionQueryResponse,
  ContributionsCollectionQueryVariables,
  ContributionRepository,
  RepositoryContributionEntry,
} from "./queries/contributions-collection.graphql.js";
export type {
  RepositoryMetadataBatchResponse,
  RepositoryMetadataNode,
} from "./queries/repository-metadata.graphql.js";
