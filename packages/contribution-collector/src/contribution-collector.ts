/**
 * ContributionCollector — top-level orchestrator.
 *
 * Coordinates all sub-collectors to produce a complete CollectionResult:
 * 1. Resolve developer identity
 * 2. Discover repositories via contribution collection
 * 3. Fetch PR file lists (preferred evidence source)
 * 4. Fetch commit detail for non-PR commits (fallback evidence)
 * 5. Assemble CollectionResult with coverage statistics
 */

import {
  isAnalyticsError,
  toCommitSha,
  toGitHubLogin,
  toGitHubNodeId,
  type AnalyticsError,
  type Commit,
  type DeveloperIdentity,
  type PullRequest,
  type TimeWindow,
} from "@ContribLens/domain";
import {
  mapToAnalyticsError,
  paginateByPage,
  type IGitHubClient,
} from "@ContribLens/github-client";
import type { CollectionResult } from "./collection-result.js";
import type { CollectorConfig } from "./collector-config.js";
import { CoverageTracker } from "./coverage-tracker.js";
import { FileEvidenceCollector } from "./file-evidence-collector.js";
import { RepositoryDiscoverer } from "./repository-discoverer.js";
import { UserResolver } from "./user-resolver.js";

export interface CollectionRequest {
  readonly login: string;
  readonly window: TimeWindow;
  readonly correlationId: string;
}

export class ContributionCollector {
  private readonly userResolver: UserResolver;
  private readonly repositoryDiscoverer: RepositoryDiscoverer;

  constructor(
    private readonly client: IGitHubClient,
    private readonly config: CollectorConfig,
  ) {
    this.userResolver = new UserResolver(client);
    this.repositoryDiscoverer = new RepositoryDiscoverer(client);
  }

  async collect(
    request: CollectionRequest,
  ): Promise<CollectionResult | AnalyticsError> {
    const coverageTracker = new CoverageTracker();
    const { login, window, correlationId } = request;

    // Step 1: Resolve developer identity
    const identityResult = await this.userResolver.resolve(login, correlationId);
    if (isAnalyticsError(identityResult)) return identityResult;
    const developer: DeveloperIdentity = identityResult;

    // Step 2: Discover repositories via contribution collection
    const allRepositories = new Map<string, import("@ContribLens/domain").Repository>();
    const allActivityCounts = {
      commit: 0,
      pull_request: 0,
      review: 0,
      issue: 0,
    };
    let repositoryDiscoveryTruncated = false;
    let isComplete = true;

    const effectiveWindow: import("@ContribLens/domain").TimeWindow = {
      from: window.from,
      to: window.to,
    };

    if (developer.contributionYears && developer.contributionYears.length > 0) {
      const earliestYear = Math.min(...developer.contributionYears);
      const earliestDate = new Date(`${earliestYear}-01-01T00:00:00Z`);
      if (new Date(effectiveWindow.from) < earliestDate) {
        (effectiveWindow as any).from = earliestDate.toISOString();
      }
    }

    try {
      let currentToDate = new Date(effectiveWindow.to);
      const minFromDate = new Date(effectiveWindow.from);

      while (currentToDate > minFromDate) {
        if (this.client.isBudgetLow()) {
          coverageTracker.recordPaginationIncomplete();
          isComplete = false;
          break;
        }

        let chunkFromDate = new Date(currentToDate);
        // GitHub contributionsCollection allows up to 1 year. We subtract 1 year and add 1 sec.
        chunkFromDate.setFullYear(chunkFromDate.getFullYear() - 1);
        chunkFromDate.setSeconds(chunkFromDate.getSeconds() + 1);
        
        if (chunkFromDate < minFromDate) {
          chunkFromDate = minFromDate;
        }

        const chunkWindow: TimeWindow = {
          from: chunkFromDate.toISOString() as import("@ContribLens/domain").ISODateString,
          to: currentToDate.toISOString() as import("@ContribLens/domain").ISODateString,
        };

        const discovered = await this.repositoryDiscoverer.discover(
          developer,
          chunkWindow,
          coverageTracker,
          correlationId,
        );

        for (const [id, repo] of discovered.repositories.entries()) {
          allRepositories.set(id, repo);
        }

        for (const total of discovered.activity.totals) {
          if (total.count !== null && total.type in allActivityCounts) {
            allActivityCounts[total.type as keyof typeof allActivityCounts] += total.count;
          } else if (total.count === null) {
             isComplete = false;
          }
        }
        if (discovered.activity.repositoryDiscoveryTruncated) {
          repositoryDiscoveryTruncated = true;
        }

        currentToDate = new Date(chunkFromDate.getTime() - 1000); // 1 second before
      }
    } catch (err: unknown) {
      if (isAnalyticsError(err)) return err;
      return mapToAnalyticsError(err, correlationId, "repository discovery");
    }

    const activity: import("@ContribLens/domain").ContributionActivity = {
      totals: [
        { type: "commit", count: allActivityCounts.commit, isComplete },
        { type: "pull_request", count: allActivityCounts.pull_request, isComplete },
        { type: "review", count: allActivityCounts.review, isComplete },
        { type: "issue", count: allActivityCounts.issue, isComplete },
      ],
      repositoryDiscoveryTruncated,
      discoveredRepositoryCount: allRepositories.size,
    };
    const repositories = allRepositories;

    // Step 3: Collect commits and PRs per repository
    const allCommits: Commit[] = [];
    const allPullRequests: PullRequest[] = [];
    const commitKeys = new Set<string>(); // {repoId}:{sha}

    const fileEvidenceCollector = new FileEvidenceCollector(
      this.client,
      this.config,
      coverageTracker,
    );
    const allChangedFiles: ReturnType<typeof fileEvidenceCollector.collectPrFiles> extends Promise<infer T> ? T : never[] = [];

    for (const repo of repositories.values()) {
      if (!repo.isAccessible) {
        coverageTracker.recordInaccessibleSource(
          repo.id,
          repo.slug,
          "private",
          true,
        );
        continue;
      }

      if (this.client.isBudgetLow()) {
        coverageTracker.recordPaginationIncomplete();
        break;
      }

      // Fetch commits for this repo
      const commitResult = await paginateByPage(
        async (page, perPage) => {
          try {
            return await this.client.listCommits({
              owner: repo.owner,
              repo: repo.name,
              author: login,
              since: effectiveWindow.from,
              until: effectiveWindow.to,
              page,
              perPage,
            });
          } catch {
            coverageTracker.recordInaccessibleSource(repo.id, repo.slug, "api_error", true);
            return [];
          }
        },
        (items) => items.length > 0,
        () => this.client.isBudgetLow(),
        { maxPages: this.config.maxPagesPerRequest, perPage: this.config.perPage },
      );

      if (commitResult.truncated) {
        coverageTracker.recordPaginationIncomplete();
      }

      for (const rawCommit of commitResult.items) {
        const key = `${repo.id}:${rawCommit.sha}`;
        if (commitKeys.has(key)) continue;
        commitKeys.add(key);

        const isMerge = rawCommit.parents.length > 1;
        const commit: Commit = {
          nodeId: toGitHubNodeId(rawCommit.node_id),
          sha: toCommitSha(rawCommit.sha),
          repositoryId: repo.id,
          author: {
            login: rawCommit.author ? toGitHubLogin(rawCommit.author.login) : null,
            email: rawCommit.commit.author.email,
            name: rawCommit.commit.author.name,
          },
          committedAt: rawCommit.commit.author.date
            ? (rawCommit.commit.author.date as unknown as import("@ContribLens/domain").ISODateString)
            : (effectiveWindow.from as unknown as import("@ContribLens/domain").ISODateString),
          messageHeadline: rawCommit.commit.message.split("\n")[0] ?? "",
          isMergeCommit: isMerge,
          coveredByPullRequest: false, // updated below
          fileDetailFetched: null,
        };

        allCommits.push(commit);
      }

      coverageTracker.recordRepositoryFullyAccessible();
    }

    // Step 4: Collect PR file lists (preferred evidence)
    // Note: In V1 we fetch PRs from commit contribution collection — a full PR discovery
    // query would require additional GraphQL calls. This is a known coverage limitation.
    // For now we use the file evidence collector for commits only.
    // TODO (V1.1): Add PR discovery via contributionsCollection.pullRequestContributions

    // Step 5: Collect commit file detail (fallback for non-PR commits)
    const filesByKey = new Map<string, boolean>();

    for (const commit of allCommits) {
      if (commit.isMergeCommit) continue; // merge commits excluded by rules, skip file fetch
      if (commit.coveredByPullRequest) continue;

      const repo = repositories.get(commit.repositoryId);
      if (!repo) continue;

      const files = await fileEvidenceCollector.collectCommitFiles(
        commit,
        repo,
        correlationId,
      );

      for (const file of files) {
        const dedupeKey = `${repo.id}:${commit.sha}:${file.path}`;
        if (filesByKey.has(dedupeKey)) continue;
        filesByKey.set(dedupeKey, true);
        (allChangedFiles as typeof files).push(file);
      }
    }

    return {
      developer,
      effectiveWindow,
      activity,
      repositories,
      commits: allCommits,
      pullRequests: allPullRequests,
      changedFiles: allChangedFiles as ReturnType<typeof fileEvidenceCollector.collectPrFiles> extends Promise<infer T> ? T : never[],
      coverage: coverageTracker.toSourceCoverage(),
    };
  }
}
