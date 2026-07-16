/**
 * AnalyticsSnapshot — the core product contract.
 *
 * This is the stable, versioned output of the analytics engine.
 * All consumers (JSON API, SVG renderer, future dashboard) read from this
 * structure and NEVER perform independent metric calculations.
 *
 * Design principles:
 * - Every metric includes its derivation context (time window, versions).
 * - Every estimate includes its confidence.
 * - Unavailable data is absent or explicitly null, never silently zero.
 * - The snapshot is immutable once produced.
 */

import type { ConfidenceAssessment } from "./confidence.js";
import type { ContributionActivity } from "./contribution-activity.js";
import type { SourceCoverage } from "./coverage.js";
import type { GitHubLogin, GitHubNodeId } from "./identity.js";
import type { LanguageBreakdown } from "./language.js";
import type {
  ClassifierVersion,
  MetricDefinitionVersion,
  RulesetVersion,
} from "./metric-version.js";
import type { RepositoryRelationship } from "./repository.js";
import type { ISODateString, TimeWindow } from "./time-window.js";

/**
 * Subject developer identity as resolved at snapshot time.
 */
export interface DeveloperIdentity {
  /** GitHub login at time of request. Logins can be changed; node ID is stable. */
  readonly login: GitHubLogin;
  /** Stable GitHub node ID. */
  readonly nodeId: GitHubNodeId;
  /** Display name, if available. */
  readonly displayName: string | null;
  /** Years for which GitHub reports contribution activity. Used to validate time windows. */
  readonly contributionYears: readonly number[];
}

/**
 * Per-repository breakdown of the subject's activity.
 *
 * Included in the snapshot for consumers that want repository-level detail.
 * Does not include raw file lists (those are internal to the analytics run).
 */
export interface RepositoryContributionSummary {
  /** Stable repository node ID. */
  readonly repositoryId: GitHubNodeId;
  /** Display slug (owner/name at discovery time). */
  readonly repositorySlug: string;
  /** Ownership relationship to the subject. */
  readonly relationship: RepositoryRelationship;
  /** Whether the repository was accessible during the analytics run. */
  readonly isAccessible: boolean;
  /** Number of commits attributed to the subject in this repository and window. */
  readonly commitCount: number | null;
  /** Number of pull requests authored by the subject in this repository and window. */
  readonly pullRequestCount: number | null;
  /** Number of reviews submitted by the subject in this repository and window. */
  readonly reviewCount: number | null;
}

/**
 * Qualified code-change summary derived by the rules engine.
 *
 * These are estimates, not exact counts. The rules engine applies transparent
 * heuristics; every exclusion is accounted for in the volume breakdown.
 */
export interface QualifiedChangeSummary {
  /**
   * Estimated total qualified additions across all files and repositories.
   * Null if the rules engine had insufficient evidence to produce any estimate.
   */
  readonly estimatedQualifiedAdditions: number | null;
  /**
   * Estimated total qualified deletions across all files and repositories.
   * Null if insufficient evidence.
   */
  readonly estimatedQualifiedDeletions: number | null;
  /** Total change volume excluded by the rules engine. */
  readonly excludedVolume: number;
  /** Total change volume that was indeterminate (could not be classified). */
  readonly indeterminateVolume: number;
  /**
   * Total change volume for which additions/deletions were unavailable
   * from the GitHub API (binary files, large diff timeouts, API gaps).
   */
  readonly unavailableVolume: number;
  /** Number of files evaluated by the rules engine. */
  readonly evaluatedFileCount: number;
  /** Number of files included as qualified changes. */
  readonly includedFileCount: number;
  /** Number of files excluded by the rules engine. */
  readonly excludedFileCount: number;
  /** Number of files with an indeterminate decision. */
  readonly indeterminateFileCount: number;
}

/**
 * The analytics snapshot — the immutable, versioned output of one analytics run.
 *
 * This is the stable product boundary. Consumers must not inspect
 * raw GitHub data or recompute any metric from this snapshot.
 */
export interface AnalyticsSnapshot {
  /**
   * Version of the metric definitions contract.
   * Cache keys and consumers must validate this before use.
   */
  readonly metricVersion: MetricDefinitionVersion;
  /**
   * Version of the Contribution Rules Engine ruleset applied.
   */
  readonly rulesetVersion: RulesetVersion;
  /**
   * Version of the language classifier configuration applied.
   */
  readonly classifierVersion: ClassifierVersion;

  /** The subject developer as resolved during this analytics run. */
  readonly developer: DeveloperIdentity;

  /** The time window for which analytics were requested. */
  readonly requestedWindow: TimeWindow;
  /**
   * The time window actually covered by the analytics result.
   * May be narrower than `requestedWindow` if coverage was incomplete.
   */
  readonly effectiveWindow: TimeWindow;

  /** Activity totals by type, sourced from GitHub contribution collection. */
  readonly activity: ContributionActivity;

  /**
   * Per-repository contribution summaries.
   * Sorted descending by total activity volume.
   */
  readonly repositorySummaries: readonly RepositoryContributionSummary[];

  /**
   * Qualified code-change summary from the Contribution Rules Engine.
   * Null if insufficient file-level evidence was available.
   */
  readonly qualifiedChanges: QualifiedChangeSummary | null;

  /**
   * Personal language breakdown from the Language Analytics Engine.
   * Null if insufficient qualified-change evidence was available.
   *
   * IMPORTANT: This is estimated personal language usage from qualified
   * authored changes. It is NOT derived from repository language percentages.
   */
  readonly languageBreakdown: LanguageBreakdown | null;

  /** Structured confidence assessment for this snapshot. */
  readonly confidence: ConfidenceAssessment;

  /** Source coverage statistics used to produce the confidence assessment. */
  readonly coverage: SourceCoverage;

  /** UTC timestamp when this snapshot was produced. */
  readonly generatedAt: ISODateString;

  /**
   * Approximate cache freshness expiry (UTC).
   * Consumers should re-request after this time.
   */
  readonly freshUntil: ISODateString;
}
