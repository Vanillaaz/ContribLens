import { describe, it, expect } from "vitest";
import { ConfidenceModel, type ConfidenceModelInputs } from "../confidence-model.js";
import type { SourceCoverage } from "@ContribLens/domain";
import type { RulesEngineResult } from "@ContribLens/contribution-rules";

function createDefaultCoverage(): SourceCoverage {
  return {

    repositoryDiscoveryTruncated: false,
    inaccessibleSources: [],
    commitsWithFileDetail: 50,
    commitsWithoutFileDetail: 0,
    prsWithTruncatedFileList: 0,
    paginationIncompleteCount: 0,
    discoveredRepositoryCount: 10,
    fullyAccessibleRepositoryCount: 10,
  };
}

function createDefaultInputs(overrides: Partial<ConfidenceModelInputs> = {}): ConfidenceModelInputs {
  return {
    coverage: createDefaultCoverage(),
    rulesResult: {
      totalFiles: 100,
      includedCount: 90,
      excludedCount: 10,
      indeterminateCount: 0,
      evaluatedFiles: [],
    } as unknown as RulesEngineResult,
    languageBreakdown: {
      languages: [],
      totalQualifiedVolume: 1000,
      totalExcludedVolume: 100,
      totalIndeterminateVolume: 0,
      totalUnavailableVolume: 0,
      unclassifiedFileCount: 0,
    },
    hadPartialGraphQLErrors: false,
    hadRateLimitEvents: false,
    timeWindowIncomplete: false,
    ...overrides,
  };
}

describe("ConfidenceModel", () => {
  const model = new ConfidenceModel();

  it("returns high confidence when all inputs are optimal", () => {
    const result = model.assess(createDefaultInputs());
    expect(result.overall).toBe("high");
    expect(result.allReasonCodes).toHaveLength(0);
    expect(result.summary).toBe("");
  });

  describe("assessActivityCoverage", () => {
    it("degrades to partial if repository discovery was truncated", () => {
      const inputs = createDefaultInputs({
        coverage: { ...createDefaultCoverage(), repositoryDiscoveryTruncated: true },
      });
      const result = model.assess(inputs);
      expect(result.overall).toBe("partial");
      expect(result.allReasonCodes).toContain("REPOSITORY_DISCOVERY_TRUNCATED");
    });
  });

  describe("assessRepositoryAccessibility", () => {
    it("degrades to moderate if 1 or 2 repos are inaccessible with known contributions", () => {
      const inputs = createDefaultInputs({
        coverage: {
          ...createDefaultCoverage(),
          inaccessibleSources: [
            { repositoryId: "repo1" as any, repositorySlug: "org/repo1" as any, reason: "deleted", hasKnownContributions: true },
          ],
        },
      });
      const result = model.assess(inputs);
      expect(result.overall).toBe("moderate");
      expect(result.allReasonCodes).toContain("REPOSITORY_DELETED");
    });

    it("degrades to partial if 3 or more repos are inaccessible", () => {
      const inputs = createDefaultInputs({
        coverage: {
          ...createDefaultCoverage(),
          inaccessibleSources: [
            { repositoryId: "repo1" as any, repositorySlug: "org/repo1" as any, reason: "deleted", hasKnownContributions: true },
            { repositoryId: "repo2" as any, repositorySlug: "org/repo2" as any, reason: "private", hasKnownContributions: true },
            { repositoryId: "repo3" as any, repositorySlug: "org/repo3" as any, reason: "archived" as any, hasKnownContributions: true },
          ],
        },
      });
      const result = model.assess(inputs);
      expect(result.overall).toBe("partial");
      expect(result.allReasonCodes).toContain("REPOSITORY_INACCESSIBLE");
    });

    it("remains high if inaccessible repos have no known contributions", () => {
      const inputs = createDefaultInputs({
        coverage: {
          ...createDefaultCoverage(),
          inaccessibleSources: [
            { repositoryId: "repo1" as any, repositorySlug: "org/repo1" as any, reason: "deleted", hasKnownContributions: false },
          ],
        },
      });
      const result = model.assess(inputs);
      expect(result.overall).toBe("high");
    });
  });

  describe("assessChangeDetailCoverage", () => {
    it("degrades to moderate if some commits lack file detail (<= 50%)", () => {
      const inputs = createDefaultInputs({
        coverage: { ...createDefaultCoverage(), commitsWithFileDetail: 8, commitsWithoutFileDetail: 2 },
      });
      const result = model.assess(inputs);
      expect(result.overall).toBe("moderate");
      expect(result.allReasonCodes).toContain("COMMIT_FILE_LIST_UNAVAILABLE");
    });

    it("degrades to partial if > 50% of commits lack file detail", () => {
      const inputs = createDefaultInputs({
        coverage: { ...createDefaultCoverage(), commitsWithFileDetail: 2, commitsWithoutFileDetail: 8 },
      });
      const result = model.assess(inputs);
      expect(result.overall).toBe("partial");
    });

    it("degrades to moderate if PR file caps are hit", () => {
      const inputs = createDefaultInputs({
        coverage: { ...createDefaultCoverage(), prsWithTruncatedFileList: 1 },
      });
      const result = model.assess(inputs);
      expect(result.overall).toBe("moderate");
      expect(result.allReasonCodes).toContain("PR_FILE_CAP_HIT");
    });
  });

  describe("assessLanguageAttribution", () => {
    it("degrades to partial if breakdown is missing entirely", () => {
      const inputs = createDefaultInputs({ languageBreakdown: null });
      const result = model.assess(inputs);
      expect(result.overall).toBe("partial");
      expect(result.allReasonCodes).toContain("COMMIT_FILE_LIST_UNAVAILABLE");
    });

    it("degrades to moderate if > 30% and <= 60% of volume is unknown", () => {
      const inputs = createDefaultInputs({
        languageBreakdown: {
          languages: [], totalQualifiedVolume: 500, totalExcludedVolume: 100,
          totalIndeterminateVolume: 300, totalUnavailableVolume: 100, unclassifiedFileCount: 0,
        },
      });
      // total = 1000, unknown = 400 (40%)
      const result = model.assess(inputs);
      expect(result.overall).toBe("moderate");
      expect(result.allReasonCodes).toContain("LARGE_UNKNOWN_LANGUAGE_VOLUME");
    });

    it("degrades to partial if > 60% of volume is unknown", () => {
      const inputs = createDefaultInputs({
        languageBreakdown: {
          languages: [], totalQualifiedVolume: 200, totalExcludedVolume: 100,
          totalIndeterminateVolume: 600, totalUnavailableVolume: 100, unclassifiedFileCount: 0,
        },
      });
      // total = 1000, unknown = 700 (70%)
      const result = model.assess(inputs);
      expect(result.overall).toBe("partial");
    });
  });

  describe("assessRuleCertainty", () => {
    it("degrades to moderate if > 20% and <= 50% of files are indeterminate", () => {
      const inputs = createDefaultInputs({
        rulesResult: { totalFiles: 100, includedCount: 50, excludedCount: 20, indeterminateCount: 30, evaluatedFiles: [] } as unknown as RulesEngineResult,
      });
      const result = model.assess(inputs);
      expect(result.overall).toBe("moderate");
      expect(result.allReasonCodes).toContain("LARGE_INDETERMINATE_VOLUME");
    });

    it("degrades to partial if > 50% of files are indeterminate", () => {
      const inputs = createDefaultInputs({
        rulesResult: { totalFiles: 100, includedCount: 20, excludedCount: 20, indeterminateCount: 60, evaluatedFiles: [] } as unknown as RulesEngineResult,
      });
      const result = model.assess(inputs);
      expect(result.overall).toBe("partial");
    });
  });

  describe("assessApiHealth", () => {
    it("degrades to moderate on rate limit events", () => {
      const inputs = createDefaultInputs({ hadRateLimitEvents: true });
      const result = model.assess(inputs);
      expect(result.overall).toBe("moderate");
      expect(result.allReasonCodes).toContain("RATE_LIMIT_ENCOUNTERED");
    });

    it("degrades to moderate on partial GraphQL errors", () => {
      const inputs = createDefaultInputs({ hadPartialGraphQLErrors: true });
      const result = model.assess(inputs);
      expect(result.overall).toBe("moderate");
      expect(result.allReasonCodes).toContain("PARTIAL_GRAPHQL_ERROR");
    });
  });

  describe("assessTimeWindowCompleteness", () => {
    it("degrades to partial if time window is incomplete", () => {
      const inputs = createDefaultInputs({ timeWindowIncomplete: true });
      const result = model.assess(inputs);
      expect(result.overall).toBe("partial");
      expect(result.allReasonCodes).toContain("TIME_WINDOW_PAGINATION_INCOMPLETE");
    });

    it("degrades to partial if pagination incomplete count > 0", () => {
      const inputs = createDefaultInputs({
        coverage: { ...createDefaultCoverage(), paginationIncompleteCount: 1 },
      });
      const result = model.assess(inputs);
      expect(result.overall).toBe("partial");
    });
  });
});
