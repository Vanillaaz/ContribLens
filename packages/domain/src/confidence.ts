/**
 * Confidence domain model.
 *
 * Every analytics snapshot includes a structured confidence assessment.
 * Confidence is not a single boolean — it is a multi-dimensional evaluation
 * that allows consumers to understand precisely why a result is incomplete.
 */

/**
 * Overall confidence level of an analytics result.
 *
 * - `high`        — Full window covered; no material known gaps.
 * - `moderate`    — Core activity available; some estimation or limited coverage reduces precision.
 * - `partial`     — Known inaccessible repositories, API limits, or missing file-level evidence
 *                   materially affect results. Results are still useful but must be clearly marked.
 * - `unavailable` — A trustworthy result cannot be produced. Do not display as zero.
 */
export type ConfidenceLevel = "high" | "moderate" | "partial" | "unavailable";

/**
 * Each dimension of confidence assessed independently.
 *
 * The overall level is the minimum across all dimensions.
 * Keeping dimensions separate allows precise explanations rather than
 * a single opaque degraded state.
 */
export type ConfidenceDimensionName =
  | "activity_coverage"
  | "repository_accessibility"
  | "change_detail_coverage"
  | "language_attribution"
  | "rule_certainty"
  | "api_health"
  | "time_window_completeness";

/**
 * Machine-readable reason code for a confidence degradation.
 * Used by consumers to filter or explain specific gaps without string parsing.
 */
export type ConfidenceReasonCode =
  | "REPOSITORY_DISCOVERY_TRUNCATED"
  | "REPOSITORY_INACCESSIBLE"
  | "REPOSITORY_DELETED"
  | "COMMIT_FILE_LIST_UNAVAILABLE"
  | "COMMIT_FILE_CAP_HIT"
  | "PR_FILE_CAP_HIT"
  | "PR_FILE_LIST_UNAVAILABLE"
  | "PATCH_UNAVAILABLE"
  | "LARGE_INDETERMINATE_VOLUME"
  | "LARGE_UNKNOWN_LANGUAGE_VOLUME"
  | "RATE_LIMIT_ENCOUNTERED"
  | "PARTIAL_GRAPHQL_ERROR"
  | "UPSTREAM_TIMEOUT"
  | "TIME_WINDOW_PAGINATION_INCOMPLETE"
  | "CONTRIBUTION_YEARS_UNAVAILABLE";

/**
 * Assessment of a single confidence dimension.
 */
export interface ConfidenceDimensionAssessment {
  /** Which dimension this assessment covers. */
  readonly dimension: ConfidenceDimensionName;
  /** The confidence level for this specific dimension. */
  readonly level: ConfidenceLevel;
  /** Machine-readable reason codes explaining any degradation. */
  readonly reasonCodes: readonly ConfidenceReasonCode[];
  /** Human-readable explanations, safe to expose in API responses. */
  readonly reasons: readonly string[];
}

/**
 * Complete confidence assessment for an analytics snapshot.
 *
 * The `overall` level is the minimum level across all dimensions.
 * Each dimension is assessed independently and stored for transparency.
 */
export interface ConfidenceAssessment {
  /** Rolled-up confidence level. Minimum across all dimensions. */
  readonly overall: ConfidenceLevel;
  /** Per-dimension assessments. Always present, even if all are `high`. */
  readonly dimensions: readonly ConfidenceDimensionAssessment[];
  /**
   * All reason codes that contributed to any confidence degradation.
   * Convenience aggregation of all dimension reason codes.
   */
  readonly allReasonCodes: readonly ConfidenceReasonCode[];
  /**
   * Human-readable summary of confidence degradation factors.
   * Empty when overall level is `high`.
   */
  readonly summary: string;
}

/** Returns the minimum (most pessimistic) confidence level from a list. */
export function minimumConfidenceLevel(
  levels: readonly ConfidenceLevel[],
): ConfidenceLevel {
  const order: ConfidenceLevel[] = ["unavailable", "partial", "moderate", "high"];
  for (const level of order) {
    if (levels.includes(level)) {
      return level;
    }
  }
  return "high";
}
