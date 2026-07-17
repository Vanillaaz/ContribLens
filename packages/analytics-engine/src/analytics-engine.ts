/**
 * Analytics Engine — the top-level orchestrator.
 *
 * Coordinates the full analytics pipeline:
 * 1. Check cache
 * 2. Collect contributions (ContributionCollector)
 * 3. Apply rules (ContributionRulesEngine)
 * 4. Compute language breakdown (LanguageAnalyticsEngine)
 * 5. Assess confidence (ConfidenceModel)
 * 6. Assemble snapshot (SnapshotBuilder)
 * 7. Cache and return
 *
 * This is the product. Everything downstream consumes AnalyticsSnapshot.
 */

import {
  ContributionCollector,
  DEFAULT_COLLECTOR_CONFIG,
} from "@ContribLens/contribution-collector";
import {
  ContributionRulesEngine,
  DEFAULT_RULESET,
  createRuleContext,
} from "@ContribLens/contribution-rules";
import { ConfidenceModel } from "@ContribLens/confidence-model";
import {
  LanguageAnalyticsEngine,
  LinguistLanguageClassifier,
} from "@ContribLens/language-analytics";
import {
  CLASSIFIER_VERSION,
  METRIC_DEFINITION_VERSION,
  RULESET_VERSION,
  isAnalyticsError,
  toISODateString,
  type AnalyticsError,
  type AnalyticsSnapshot,
  type QualifiedChangeSummary,
  type RepositoryContributionSummary,
} from "@ContribLens/domain";
import type { IGitHubClient } from "@ContribLens/github-client";
import type { AnalyticsRequest } from "./analytics-request.js";
import { AnalyticsCache } from "./cache/analytics-cache.js";
import { buildCacheKey } from "./cache/cache-key.js";

export interface AnalyticsEngineOptions {
  cache?: AnalyticsCache;
  /** Fresh-until TTL in milliseconds. @default 300_000 (5 minutes) */
  freshUntilTtlMs?: number;
}

export class AnalyticsEngine {
  private readonly client: IGitHubClient;
  private readonly collector: ContributionCollector;
  private readonly rulesEngine: ContributionRulesEngine;
  private readonly languageEngine: LanguageAnalyticsEngine;
  private readonly confidenceModel: ConfidenceModel;
  private readonly cache: AnalyticsCache;
  private readonly freshUntilTtlMs: number;

  constructor(client: IGitHubClient, options: AnalyticsEngineOptions = {}) {
    this.client = client;
    this.collector = new ContributionCollector(client, DEFAULT_COLLECTOR_CONFIG);
    this.rulesEngine = new ContributionRulesEngine(DEFAULT_RULESET);
    this.languageEngine = new LanguageAnalyticsEngine(new LinguistLanguageClassifier());
    this.confidenceModel = new ConfidenceModel();
    this.cache = options.cache ?? new AnalyticsCache();
    this.freshUntilTtlMs = options.freshUntilTtlMs ?? 300_000;
  }

  async analyze(
    request: AnalyticsRequest,
  ): Promise<AnalyticsSnapshot | AnalyticsError> {
    const cacheKey = buildCacheKey(request.login, request.window);

    // 1. Cache hit
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // 2. Collect
    const collectionResult = await this.collector.collect({
      login: request.login,
      window: request.window,
      correlationId: request.correlationId,
    });

    if (isAnalyticsError(collectionResult)) return collectionResult;

    // 2.5 Fetch traffic for owned repositories
    let totalViews: number | null = null;
    let totalClones: number | null = null;
    
    const ownedRepos = Array.from(collectionResult.repositories.values()).filter(
      (repo) => repo.relationship === "owned" && repo.isAccessible
    );

    // Fetch concurrently (we rely on the client's internal rate limiting if any, or just Promise.all)
    // To avoid smashing the API, we can just map them. The client will handle pagination/retries.
    await Promise.all(
      ownedRepos.map(async (repo) => {
        if (this.client.isBudgetLow()) return;
        const [owner, name] = repo.slug.split("/");
        if (!owner || !name) return;
        
        try {
          const [views, clones] = await Promise.all([
            this.client.getRepositoryViews(owner, name),
            this.client.getRepositoryClones(owner, name)
          ]);
          if (views !== null) {
            totalViews = (totalViews ?? 0) + views.count;
          }
          if (clones !== null) {
            totalClones = (totalClones ?? 0) + clones.count;
          }
        } catch {
          // Swallow unexpected errors per repo, they are non-critical
        }
      })
    );

    const activityWithTraffic = {
      ...collectionResult.activity,
      totalViews,
      totalClones,
    };

    // 3. Apply rules engine to all changed files
    const ruleContext = createRuleContext({});
    const rulesResult = this.rulesEngine.evaluate(
      collectionResult.changedFiles,
      ruleContext,
    );

    // 4. Language analytics
    let languageBreakdown = null;
    if (rulesResult.totalFiles > 0) {
      await this.languageEngine.warmUp();
      languageBreakdown = this.languageEngine.analyze(rulesResult.evaluatedFiles);
    }

    // 5. Confidence
    const confidence = this.confidenceModel.assess({
      coverage: collectionResult.coverage,
      rulesResult: rulesResult.totalFiles > 0 ? rulesResult : null,
      languageBreakdown,
      hadPartialGraphQLErrors: false, // TODO: thread from client
      hadRateLimitEvents: false,      // TODO: thread from client
      timeWindowIncomplete: collectionResult.coverage.paginationIncompleteCount > 0,
    });

    // 6. Assemble qualified change summary
    const qualifiedChanges: QualifiedChangeSummary | null =
      rulesResult.totalFiles > 0
        ? {
            estimatedQualifiedAdditions: rulesResult.evaluatedFiles.reduce(
              (sum, e) => sum + (e.evaluation.qualifiedAdditions ?? 0),
              0,
            ),
            estimatedQualifiedDeletions: rulesResult.evaluatedFiles.reduce(
              (sum, e) => sum + (e.evaluation.qualifiedDeletions ?? 0),
              0,
            ),
            excludedVolume: rulesResult.evaluatedFiles.reduce(
              (sum, e) =>
                e.evaluation.finalDecision === "excluded"
                  ? sum + (e.file.additions ?? 0) + (e.file.deletions ?? 0)
                  : sum,
              0,
            ),
            indeterminateVolume: rulesResult.evaluatedFiles.reduce(
              (sum, e) =>
                e.evaluation.finalDecision === "indeterminate"
                  ? sum + (e.file.additions ?? 0) + (e.file.deletions ?? 0)
                  : sum,
              0,
            ),
            unavailableVolume: rulesResult.evaluatedFiles.reduce(
              (sum, e) =>
                e.evaluation.qualifiedAdditions === null &&
                e.evaluation.finalDecision === "included"
                  ? sum + (e.file.additions ?? 0) + (e.file.deletions ?? 0)
                  : sum,
              0,
            ),
            evaluatedFileCount: rulesResult.totalFiles,
            includedFileCount: rulesResult.includedCount,
            excludedFileCount: rulesResult.excludedCount,
            indeterminateFileCount: rulesResult.indeterminateCount,
          }
        : null;

    // 7. Build repository summaries
    const repositorySummaries: RepositoryContributionSummary[] = [
      ...collectionResult.repositories.values(),
    ].map((repo) => ({
      repositoryId: repo.id,
      repositorySlug: repo.slug,
      relationship: repo.relationship,
      isAccessible: repo.isAccessible,
      commitCount:
        collectionResult.commits.filter((c) => c.repositoryId === repo.id).length,
      pullRequestCount:
        collectionResult.pullRequests.filter((p) => p.repositoryId === repo.id).length,
      reviewCount: null, // Review details not fetched in V1 (counts come from collection)
    }));

    // 8. Assemble snapshot
    const now = new Date();
    const freshUntil = new Date(now.getTime() + this.freshUntilTtlMs);

    const snapshot: AnalyticsSnapshot = {
      metricVersion: METRIC_DEFINITION_VERSION,
      rulesetVersion: RULESET_VERSION,
      classifierVersion: CLASSIFIER_VERSION,
      developer: collectionResult.developer,
      requestedWindow: request.window,
      effectiveWindow: collectionResult.effectiveWindow,
      activity: activityWithTraffic,
      repositorySummaries,
      qualifiedChanges,
      languageBreakdown,
      confidence,
      coverage: collectionResult.coverage,
      generatedAt: toISODateString(now.toISOString()),
      freshUntil: toISODateString(freshUntil.toISOString()),
    };

    // 9. Cache
    this.cache.set(cacheKey, snapshot);

    return snapshot;
  }
}
