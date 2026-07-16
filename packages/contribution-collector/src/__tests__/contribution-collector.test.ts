import { describe, it, expect, vi } from "vitest";
import { ContributionCollector } from "../contribution-collector.js";
import { DEFAULT_COLLECTOR_CONFIG } from "../collector-config.js";
import { type IGitHubClient } from "@ContribLens/github-client";
import { isAnalyticsError } from "@ContribLens/domain";
import { SmallProfile } from "@ContribLens/test-fixtures";

describe("ContributionCollector", () => {
  it("should successfully collect and normalize data from a mock client", async () => {
    // Mock the IGitHubClient
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

    const collector = new ContributionCollector(mockClient, DEFAULT_COLLECTOR_CONFIG);

    const result = await collector.collect({
      login: "small-user",
      window: {
        from: "2023-01-01T00:00:00Z" as any,
        to: "2023-12-31T23:59:59Z" as any,
      },
      correlationId: "test-correlation-id",
    });

    // Verify it's not an error
    if (isAnalyticsError(result)) {
      throw new Error(`Collector failed: ${result.message}`);
    }

    // Verify identity mapping
    expect(result.developer.login).toBe("small-user");
    expect(result.developer.displayName).toBe("Small User");

    // Verify repositories mapped
    expect(result.repositories.size).toBe(1);
    const repo = Array.from(result.repositories.values())[0];
    expect(repo!.name).toBe("test-repo");

    // Verify coverage stats
    expect(result.coverage.paginationIncompleteCount).toBe(0);
  });
});
