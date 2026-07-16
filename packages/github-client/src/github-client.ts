/**
 * GitHubClient — the concrete Octokit-backed implementation of IGitHubClient.
 *
 * This is the ONLY file in the entire monorepo that imports Octokit.
 * All other packages use IGitHubClient and never see Octokit types.
 *
 * Responsibilities:
 * - Execute GraphQL and REST requests via Octokit.
 * - Track rate limit state from response headers.
 * - Apply retry logic with exponential backoff for transient errors.
 * - Enforce concurrency limits.
 * - Expose budget status to the analytics engine.
 */

import { graphql } from "@octokit/graphql";
import { Octokit } from "@octokit/rest";
import { backoffMs } from "./pagination.js";
import { RateLimitTracker } from "./rate-limit-state.js";
import type { GitHubClientConfig } from "./client-config.js";
import type {
  ContributionsCollectionQueryResponse,
  ContributionsCollectionQueryVariables,
} from "./queries/contributions-collection.graphql.js";
import {
  buildRepositoryMetadataBatchQuery,
  type RepositoryMetadataBatchResponse,
} from "./queries/repository-metadata.graphql.js";
import type {
  UserIdentityQueryResponse,
  UserIdentityQueryVariables,
} from "./queries/user-identity.graphql.js";
import {
  USER_IDENTITY_QUERY,
  CONTRIBUTIONS_COLLECTION_QUERY,
} from "./queries/index.js";
import type { CommitDetailResponse } from "./rest/commit-detail.js";
import type { CommitListItem } from "./rest/commits.js";
import type { PullRequestFile } from "./rest/pull-request-files.js";
import type {
  IGitHubClient,
  ListCommitsOptions,
  ListPullRequestFilesOptions,
} from "./github-client.interface.js";

export class GitHubClient implements IGitHubClient {
  private readonly octokit: Octokit;
  private readonly graphqlClient: typeof graphql;
  private readonly rateLimitTracker = new RateLimitTracker();
  private readonly config: GitHubClientConfig;
  private requestsUsed = 0;

  constructor(config: GitHubClientConfig) {
    this.config = config;

    const authOptions = config.token ? { auth: config.token } : {};

    this.octokit = new Octokit({
      ...authOptions,
      userAgent: config.userAgent,
      request: { timeout: config.timeoutMs },
    });

    this.graphqlClient = config.token
      ? graphql.defaults({
          headers: {
            authorization: `token ${config.token}`,
            "user-agent": config.userAgent,
          },
        })
      : graphql.defaults({
          headers: { "user-agent": config.userAgent },
        });
  }

  // ---------------------------------------------------------------------------
  // GraphQL methods
  // ---------------------------------------------------------------------------

  async getUserIdentity(
    variables: UserIdentityQueryVariables,
  ): Promise<UserIdentityQueryResponse> {
    return this.executeGraphQL<UserIdentityQueryResponse>(
      USER_IDENTITY_QUERY,
      variables as unknown as Record<string, unknown>,
    );
  }

  async getContributionsCollection(
    variables: ContributionsCollectionQueryVariables,
  ): Promise<ContributionsCollectionQueryResponse> {
    return this.executeGraphQL<ContributionsCollectionQueryResponse>(
      CONTRIBUTIONS_COLLECTION_QUERY,
      variables as unknown as Record<string, unknown>,
    );
  }

  async getRepositoryMetadataBatch(
    nodeIds: string[],
  ): Promise<RepositoryMetadataBatchResponse> {
    if (nodeIds.length === 0) return {};
    const query = buildRepositoryMetadataBatchQuery(nodeIds);
    return this.executeGraphQL<RepositoryMetadataBatchResponse>(query, {});
  }

  // ---------------------------------------------------------------------------
  // REST methods
  // ---------------------------------------------------------------------------

  async listCommits(options: ListCommitsOptions): Promise<CommitListItem[]> {
    const response = await this.executeRest(() =>
      this.octokit.request("GET /repos/{owner}/{repo}/commits", {
        owner: options.owner,
        repo: options.repo,
        author: options.author,
        since: options.since,
        until: options.until,
        per_page: options.perPage ?? 100,
        page: options.page ?? 1,
      }),
    );
    return response.data as CommitListItem[];
  }

  async getCommitDetail(
    owner: string,
    repo: string,
    sha: string,
    page = 1,
  ): Promise<CommitDetailResponse> {
    const response = await this.executeRest(() =>
      this.octokit.request("GET /repos/{owner}/{repo}/commits/{ref}", {
        owner,
        repo,
        ref: sha,
        per_page: 100,
        page,
      }),
    );
    return response.data as CommitDetailResponse;
  }

  async listPullRequestFiles(
    options: ListPullRequestFilesOptions,
  ): Promise<PullRequestFile[]> {
    const response = await this.executeRest(() =>
      this.octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}/files", {
        owner: options.owner,
        repo: options.repo,
        pull_number: options.pullNumber,
        per_page: options.perPage ?? 100,
        page: options.page ?? 1,
      }),
    );
    return response.data as PullRequestFile[];
  }

  // ---------------------------------------------------------------------------
  // Budget and rate limit
  // ---------------------------------------------------------------------------

  isBudgetLow(): boolean {
    if (this.config.requestBudget !== null) {
      if (this.requestsUsed >= this.config.requestBudget) return true;
    }
    return (
      this.rateLimitTracker.shouldPause("graphql") ||
      this.rateLimitTracker.shouldPause("rest")
    );
  }

  rateLimitResetAt(): string | null {
    return (
      this.rateLimitTracker.resetTimestamp("graphql") ??
      this.rateLimitTracker.resetTimestamp("rest")
    );
  }

  // ---------------------------------------------------------------------------
  // Private execution helpers
  // ---------------------------------------------------------------------------

  private async executeGraphQL<T>(
    query: string,
    variables: Record<string, unknown>,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        this.requestsUsed++;
        const result = await this.graphqlClient<T>(query, variables);
        return result;
      } catch (err: unknown) {
        lastError = err;

        // Do not retry rate limits — return partial result upstream
        if (this.isRateLimitError(err)) throw err;

        if (attempt < this.config.maxRetries - 1) {
          await backoffMs(attempt);
        }
      }
    }

    throw lastError;
  }

  private async executeRest<T>(
    requestFn: () => Promise<{ data: T; headers: Record<string, string | number | undefined> }>,
  ): Promise<{ data: T; headers: Record<string, string | number | undefined> }> {
    let lastError: unknown;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        this.requestsUsed++;
        const result = await requestFn();
        this.rateLimitTracker.recordResponse("rest", result.headers as Record<string, string | undefined>);
        return result;
      } catch (err: unknown) {
        lastError = err;

        if (this.isRateLimitError(err)) throw err;

        if (attempt < this.config.maxRetries - 1) {
          await backoffMs(attempt);
        }
      }
    }

    throw lastError;
  }

  private isRateLimitError(err: unknown): boolean {
    if (typeof err !== "object" || err === null) return false;
    const status = (err as Record<string, unknown>)["status"];
    return status === 403 || status === 429;
  }
}
