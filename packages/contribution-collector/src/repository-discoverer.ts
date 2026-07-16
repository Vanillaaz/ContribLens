/**
 * Repository discoverer.
 *
 * Uses the GitHub contributionsCollection API to discover all repositories
 * in which the subject developer has recorded contribution activity during
 * the requested time window.
 *
 * Repository discovery is contribution-led, not ownership-led.
 * This is the fundamental distinction from naive profile-card approaches.
 */

import {
  toGitHubNodeId,
  toISODateString,
  toRepoName,
  toRepoOwner,
  type ContributionActivity,
  type DeveloperIdentity,
  type Repository,
  type TimeWindow,
} from "@ContribLens/domain";
import {
  mapToAnalyticsError,
  type IGitHubClient,
  type RepositoryContributionEntry,
} from "@ContribLens/github-client";
import { classifyRepository } from "./repository-classifier.js";
import type { CoverageTracker } from "./coverage-tracker.js";

export interface DiscoveredRepositories {
  /** Repositories deduplicated by node ID. */
  readonly repositories: ReadonlyMap<string, Repository>;
  /** Activity totals from the contributions collection response. */
  readonly activity: ContributionActivity;
}

export class RepositoryDiscoverer {
  constructor(private readonly client: IGitHubClient) {}

  /**
   * Discovers all repositories with contribution activity in the time window.
   *
   * GitHub's contributionsCollection is scoped to one calendar year.
   * For multi-year windows, the caller should invoke this method per year.
   */
  async discover(
    developer: DeveloperIdentity,
    window: TimeWindow,
    coverageTracker: CoverageTracker,
    correlationId: string,
  ): Promise<DiscoveredRepositories> {
    let response;
    try {
      response = await this.client.getContributionsCollection({
        login: developer.login,
        from: window.from,
        to: window.to,
      });
    } catch (err: unknown) {
      const error = mapToAnalyticsError(
        err,
        correlationId,
        `fetching contributions collection for "${developer.login}"`,
      );
      throw error;
    }

    if (!response.user) {
      // User disappeared between identity resolution and collection — treat as error
      throw mapToAnalyticsError(
        { status: 404 },
        correlationId,
        `contributions collection for "${developer.login}"`,
      );
    }

    const collection = response.user.contributionsCollection;

    // Check for discovery truncation (> 100 repos)
    // The API returns at most 100; if any category is at exactly 100, we may be truncated.
    const maxByCategory = Math.max(
      collection.commitContributionsByRepository.length,
      collection.pullRequestContributionsByRepository.length,
      collection.pullRequestReviewContributionsByRepository.length,
    );
    if (maxByCategory >= 100) {
      coverageTracker.recordRepositoryDiscoveryTruncated();
    }

    // Collect all unique repository entries
    const allEntries: RepositoryContributionEntry[] = [
      ...collection.commitContributionsByRepository,
      ...collection.pullRequestContributionsByRepository,
      ...collection.pullRequestReviewContributionsByRepository,
    ];

    // Deduplicate by node ID (primary key — survives renames)
    const repositoryMap = new Map<string, Repository>();

    for (const entry of allEntries) {
      const repo = entry.repository;
      if (repositoryMap.has(repo.id)) continue;

      const relationship = classifyRepository(
        {
          id: repo.id,
          name: repo.name,
          isPrivate: repo.isPrivate ?? false,
          isArchived: repo.isArchived ?? false,
          isFork: repo.isFork ?? false,
          owner: {
            __typename: "User", // placeholder; enriched via metadata batch
            login: repo.owner.login,
          },
          primaryLanguage: repo.primaryLanguage ?? null,
          defaultBranchRef: null,
        },
        developer.login,
      );

      coverageTracker.recordRepositoryDiscovered();

      repositoryMap.set(repo.id, {
        id: toGitHubNodeId(repo.id),
        owner: toRepoOwner(repo.owner.login),
        name: toRepoName(repo.name),
        slug: `${repo.owner.login}/${repo.name}`,
        relationship,
        isFork: repo.isFork ?? false,
        isArchived: repo.isArchived ?? false,
        isAccessible: !(repo.isPrivate ?? false),
        primaryLanguage: repo.primaryLanguage?.name ?? null,
      });
    }

    const activity: ContributionActivity = {
      totals: [
        {
          type: "commit",
          count: collection.totalCommitContributions,
          isComplete: true,
        },
        {
          type: "pull_request",
          count: collection.totalPullRequestContributions,
          isComplete: true,
        },
        {
          type: "review",
          count: collection.totalPullRequestReviewContributions,
          isComplete: true,
        },
        {
          type: "issue",
          count: collection.totalIssueContributions,
          isComplete: true,
        },
      ],
      repositoryDiscoveryTruncated: maxByCategory >= 100,
      discoveredRepositoryCount: repositoryMap.size,
    };

    // Mark effective window boundary (used by snapshot builder)
    void toISODateString; // silence unused import warning — used by caller

    return { repositories: repositoryMap, activity };
  }
}
