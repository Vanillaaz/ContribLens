import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AnalyticsEngine } from "../analytics-engine.js";
import { AnalyticsCache } from "../cache/analytics-cache.js";
import { type IGitHubClient } from "@ContribLens/github-client";
import { SmallProfile } from "@ContribLens/test-fixtures";
import type { AnalyticsRequest } from "../analytics-request.js";
import { type AnalyticsSnapshot, type ISODateString, isAnalyticsError } from "@ContribLens/domain";

describe("AnalyticsEngine", () => {
  let cache: AnalyticsCache;
  let engine: AnalyticsEngine;

  beforeEach(() => {
    cache = new AnalyticsCache();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns cached snapshot if available", async () => {
    // Mock the IGitHubClient with minimal config
    const mockGitHubClient = {} as unknown as IGitHubClient;
    engine = new AnalyticsEngine(mockGitHubClient, { cache });

    const request: AnalyticsRequest = {
      login: "test-user",
      window: { from: "2023-01-01T00:00:00Z" as ISODateString, to: "2023-12-31T23:59:59Z" as ISODateString },
      correlationId: "corr-1",
    };

    const mockSnapshot = {
      developer: { login: "test-user", displayName: "Test User", avatarUrl: "" },
      // Minimal valid snapshot fields
    } as unknown as AnalyticsSnapshot;

    // Prefill cache
    const { buildCacheKey } = await import("../cache/cache-key.js");
    cache.set(buildCacheKey(request.login, request.window), mockSnapshot);

    const result = await engine.analyze(request);
    expect(result).toBe(mockSnapshot);
  });

  it("should successfully generate a golden AnalyticsSnapshot from mock GitHub data", async () => {
    // Mock the IGitHubClient with full fixtures
    const mockClient = {
      getUserIdentity: vi.fn().mockResolvedValue(SmallProfile.smallProfileIdentity),
      getContributionsCollection: vi.fn().mockResolvedValue(SmallProfile.smallProfileContributions),
      getRepositoryMetadataBatch: vi.fn().mockResolvedValue({}),
      listCommits: vi.fn().mockResolvedValue(SmallProfile.smallProfileRepositoryDetails[0]!.commits),
      getCommitDetail: vi.fn().mockResolvedValue({
        files: SmallProfile.smallProfileRepositoryDetails[0]!.commits[0]!.files,
      }),
      listPullRequestFiles: vi.fn(),
      isBudgetLow: vi.fn().mockReturnValue(false),
      rateLimitResetAt: vi.fn().mockReturnValue(null),
    } as unknown as IGitHubClient;

    engine = new AnalyticsEngine(mockClient, { cache });

    const result = await engine.analyze({
      login: "small-user",
      window: {
        from: "2023-01-01T00:00:00Z" as ISODateString,
        to: "2023-12-31T23:59:59Z" as ISODateString,
      },
      correlationId: "test-correlation-id",
    });

    if (isAnalyticsError(result)) {
      throw new Error(`Analytics engine failed: ${result.message}`);
    }

    // 1. Verify top-level identities and versions
    expect(result.developer.login).toBe("small-user");
    expect(result.developer.displayName).toBe("Small User");
    expect(result.metricVersion).toBeDefined();

    // 2. Verify repository summaries mapped correctly
    expect(result.repositorySummaries).toHaveLength(1);
    expect(result.repositorySummaries[0]!.repositorySlug).toBe("small-user/test-repo");
    expect(result.repositorySummaries[0]!.commitCount).toBe(2); // Two commits in the mock

    // 3. Verify qualified changes were computed by RulesEngine
    expect(result.qualifiedChanges).toBeDefined();
    expect(result.qualifiedChanges!.evaluatedFileCount).toBe(4); // 2 files per commit in our mock

    // 4. Verify language breakdown exists
    expect(result.languageBreakdown).toBeDefined();

    // 5. Verify confidence was assessed
    expect(result.confidence.overall).toBeDefined();

    // 6. Verify golden snapshot matches exactly
    expect(result).toMatchSnapshot();
  });
});
