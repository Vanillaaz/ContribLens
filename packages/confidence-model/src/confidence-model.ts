/**
 * Confidence model — evaluates all dimensions and produces a ConfidenceAssessment.
 *
 * Each dimension is assessed independently. The overall level is the minimum
 * (most pessimistic) across all dimensions.
 */

import {
  minimumConfidenceLevel,
  type ConfidenceAssessment,
  type ConfidenceDimensionAssessment,
  type ConfidenceLevel,
  type ConfidenceReasonCode,
  type SourceCoverage,
} from "@ContribLens/domain";
import type { RulesEngineResult } from "@ContribLens/contribution-rules";
import type { LanguageBreakdown } from "@ContribLens/domain";

/** Inputs required for confidence assessment. */
export interface ConfidenceModelInputs {
  /** Coverage statistics from the collection run. */
  coverage: SourceCoverage;
  /** Result from the rules engine. Null if rules were not run (no file evidence). */
  rulesResult: RulesEngineResult | null;
  /** Language breakdown. Null if not computed. */
  languageBreakdown: LanguageBreakdown | null;
  /** Whether any GraphQL partial errors occurred. */
  hadPartialGraphQLErrors: boolean;
  /** Whether any rate-limit events occurred during the run. */
  hadRateLimitEvents: boolean;
  /** Whether the time window pagination was incomplete. */
  timeWindowIncomplete: boolean;
}

export class ConfidenceModel {
  /**
   * Assesses the confidence of an analytics result.
   */
  assess(inputs: ConfidenceModelInputs): ConfidenceAssessment {
    const dimensions: ConfidenceDimensionAssessment[] = [
      this.assessActivityCoverage(inputs),
      this.assessRepositoryAccessibility(inputs.coverage),
      this.assessChangeDetailCoverage(inputs.coverage),
      this.assessLanguageAttribution(inputs.languageBreakdown),
      this.assessRuleCertainty(inputs.rulesResult),
      this.assessApiHealth(inputs),
      this.assessTimeWindowCompleteness(inputs),
    ];

    const allReasonCodes = dimensions.flatMap((d) => d.reasonCodes);
    const levels = dimensions.map((d) => d.level);
    const overall = minimumConfidenceLevel(levels);

    const degradedDimensions = dimensions.filter((d) => d.level !== "high");
    const summary =
      degradedDimensions.length === 0
        ? ""
        : degradedDimensions
            .flatMap((d) => d.reasons)
            .join(" ");

    return { overall, dimensions, allReasonCodes, summary };
  }

  private assessActivityCoverage(
    inputs: ConfidenceModelInputs,
  ): ConfidenceDimensionAssessment {
    const codes: ConfidenceReasonCode[] = [];
    const reasons: string[] = [];

    if (inputs.coverage.repositoryDiscoveryTruncated) {
      codes.push("REPOSITORY_DISCOVERY_TRUNCATED");
      reasons.push(
        "Repository discovery was truncated: more than 100 repositories had activity " +
          "in this window, but only the first 100 could be retrieved from the GitHub API.",
      );
    }

    const level: ConfidenceLevel =
      codes.length === 0 ? "high" : "partial";

    return { dimension: "activity_coverage", level, reasonCodes: codes, reasons };
  }

  private assessRepositoryAccessibility(
    coverage: SourceCoverage,
  ): ConfidenceDimensionAssessment {
    const codes: ConfidenceReasonCode[] = [];
    const reasons: string[] = [];

    const withContributions = coverage.inaccessibleSources.filter(
      (s) => s.hasKnownContributions,
    );

    for (const source of withContributions) {
      if (source.reason === "deleted") {
        codes.push("REPOSITORY_DELETED");
        reasons.push(
          `Repository "${source.repositorySlug}" was deleted and its contributions cannot be inspected.`,
        );
      } else if (source.reason === "private") {
        codes.push("REPOSITORY_INACCESSIBLE");
        reasons.push(
          `Repository "${source.repositorySlug}" is private and cannot be accessed without authorization.`,
        );
      } else {
        codes.push("REPOSITORY_INACCESSIBLE");
        reasons.push(
          `Repository "${source.repositorySlug}" was inaccessible (reason: ${source.reason}).`,
        );
      }
    }

    const level: ConfidenceLevel =
      withContributions.length === 0
        ? "high"
        : withContributions.length <= 2
          ? "moderate"
          : "partial";

    return {
      dimension: "repository_accessibility",
      level,
      reasonCodes: [...new Set(codes)],
      reasons,
    };
  }

  private assessChangeDetailCoverage(
    coverage: SourceCoverage,
  ): ConfidenceDimensionAssessment {
    const codes: ConfidenceReasonCode[] = [];
    const reasons: string[] = [];

    const totalCommits = coverage.commitsWithFileDetail + coverage.commitsWithoutFileDetail;
    const missingRatio = totalCommits > 0
      ? coverage.commitsWithoutFileDetail / totalCommits
      : 0;

    if (coverage.commitsWithoutFileDetail > 0) {
      codes.push("COMMIT_FILE_LIST_UNAVAILABLE");
      reasons.push(
        `${coverage.commitsWithoutFileDetail.toString()} of ${totalCommits.toString()} commits ` +
          "could not be inspected for file-level changes.",
      );
    }

    if (coverage.prsWithTruncatedFileList > 0) {
      codes.push("PR_FILE_CAP_HIT");
      reasons.push(
        `${coverage.prsWithTruncatedFileList.toString()} pull request(s) had file lists ` +
          "truncated at the GitHub API cap (3,000 files).",
      );
    }

    const level: ConfidenceLevel =
      codes.length === 0
        ? "high"
        : missingRatio > 0.5
          ? "partial"
          : "moderate";

    return {
      dimension: "change_detail_coverage",
      level,
      reasonCodes: [...new Set(codes)],
      reasons,
    };
  }

  private assessLanguageAttribution(
    breakdown: LanguageBreakdown | null,
  ): ConfidenceDimensionAssessment {
    const codes: ConfidenceReasonCode[] = [];
    const reasons: string[] = [];

    if (!breakdown) {
      return {
        dimension: "language_attribution",
        level: "partial",
        reasonCodes: ["COMMIT_FILE_LIST_UNAVAILABLE"],
        reasons: ["No file-level evidence was available for language attribution."],
      };
    }

    const total =
      breakdown.totalQualifiedVolume +
      breakdown.totalExcludedVolume +
      breakdown.totalIndeterminateVolume +
      breakdown.totalUnavailableVolume;

    const unknownRatio = total > 0
      ? (breakdown.totalIndeterminateVolume + breakdown.totalUnavailableVolume) / total
      : 0;

    if (unknownRatio > 0.3) {
      codes.push("LARGE_UNKNOWN_LANGUAGE_VOLUME");
      reasons.push(
        `${Math.round(unknownRatio * 100).toString()}% of total change volume ` +
          "could not be attributed to a specific language.",
      );
    }

    const level: ConfidenceLevel =
      codes.length === 0
        ? "high"
        : unknownRatio > 0.6
          ? "partial"
          : "moderate";

    return { dimension: "language_attribution", level, reasonCodes: codes, reasons };
  }

  private assessRuleCertainty(
    rulesResult: RulesEngineResult | null,
  ): ConfidenceDimensionAssessment {
    const codes: ConfidenceReasonCode[] = [];
    const reasons: string[] = [];

    if (!rulesResult || rulesResult.totalFiles === 0) {
      return {
        dimension: "rule_certainty",
        level: "high",
        reasonCodes: [],
        reasons: [],
      };
    }

    const indeterminateRatio =
      rulesResult.indeterminateCount / rulesResult.totalFiles;

    if (indeterminateRatio > 0.2) {
      codes.push("LARGE_INDETERMINATE_VOLUME");
      reasons.push(
        `${Math.round(indeterminateRatio * 100).toString()}% of evaluated files ` +
          "had indeterminate rule decisions (could not be confidently included or excluded).",
      );
    }

    const level: ConfidenceLevel =
      codes.length === 0
        ? "high"
        : indeterminateRatio > 0.5
          ? "partial"
          : "moderate";

    return { dimension: "rule_certainty", level, reasonCodes: codes, reasons };
  }

  private assessApiHealth(
    inputs: ConfidenceModelInputs,
  ): ConfidenceDimensionAssessment {
    const codes: ConfidenceReasonCode[] = [];
    const reasons: string[] = [];

    if (inputs.hadRateLimitEvents) {
      codes.push("RATE_LIMIT_ENCOUNTERED");
      reasons.push(
        "The GitHub API rate limit was encountered during this run. " +
          "Some data may not have been retrieved.",
      );
    }

    if (inputs.hadPartialGraphQLErrors) {
      codes.push("PARTIAL_GRAPHQL_ERROR");
      reasons.push(
        "GitHub returned partial errors in one or more GraphQL responses. " +
          "Some contribution data may be incomplete.",
      );
    }

    const level: ConfidenceLevel =
      codes.length === 0 ? "high" : "moderate";

    return { dimension: "api_health", level, reasonCodes: codes, reasons };
  }

  private assessTimeWindowCompleteness(
    inputs: ConfidenceModelInputs,
  ): ConfidenceDimensionAssessment {
    const codes: ConfidenceReasonCode[] = [];
    const reasons: string[] = [];

    if (inputs.timeWindowIncomplete || inputs.coverage.paginationIncompleteCount > 0) {
      codes.push("TIME_WINDOW_PAGINATION_INCOMPLETE");
      reasons.push(
        "The full requested time window could not be paginated. " +
          "Some contributions in the window may not be reflected.",
      );
    }

    const level: ConfidenceLevel = codes.length === 0 ? "high" : "partial";

    return {
      dimension: "time_window_completeness",
      level,
      reasonCodes: codes,
      reasons,
    };
  }
}
