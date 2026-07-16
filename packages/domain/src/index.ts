/**
 * @ContribLens/domain
 *
 * Versioned analytics contracts and definitions.
 *
 * This package contains ONLY types, interfaces, enums, and pure helper functions.
 * It has no runtime dependencies and no I/O.
 *
 * All other packages in this monorepo depend on this package.
 * Nothing in this package depends on any other @ContribLens package.
 */

// Identity
export type {
  GitHubLogin,
  GitHubNodeId,
  RepoOwner,
  RepoName,
} from "./identity.js";
export {
  toGitHubLogin,
  toGitHubNodeId,
  toRepoName,
  toRepoOwner,
} from "./identity.js";

// Time window
export type { ISODateString, TimeWindow } from "./time-window.js";
export {
  currentYearWindow,
  toISODateString,
  windowDurationDays,
  yearWindow,
} from "./time-window.js";

// Repository
export type {
  Repository,
  RepositoryId,
  RepositoryRelationship,
} from "./repository.js";
export { repoSlug } from "./repository.js";

// Commit
export type { Commit, CommitAuthor, CommitSha } from "./commit.js";
export { toCommitSha } from "./commit.js";

// Pull request
export type {
  PullRequest,
  PullRequestNumber,
  PullRequestState,
} from "./pull-request.js";
export { toPullRequestNumber } from "./pull-request.js";

// Changed file
export type {
  ChangedFile,
  FileEvidenceSource,
  FileStatus,
} from "./changed-file.js";
export { rawChangeVolume } from "./changed-file.js";

// Rule result
export type {
  FileEvaluation,
  RuleDecision,
  RuleId,
  RuleResult,
} from "./rule-result.js";
export { toRuleId } from "./rule-result.js";

// Language
export type {
  LanguageBreakdown,
  LanguageCategory,
  LanguageEstimate,
} from "./language.js";

// Confidence
export type {
  ConfidenceAssessment,
  ConfidenceDimensionAssessment,
  ConfidenceDimensionName,
  ConfidenceLevel,
  ConfidenceReasonCode,
} from "./confidence.js";
export { minimumConfidenceLevel } from "./confidence.js";

// Contribution activity
export type {
  ActivityTotal,
  ActivityType,
  ContributionActivity,
} from "./contribution-activity.js";
export { getActivityTotal } from "./contribution-activity.js";

// Coverage
export type {
  InaccessibilityReason,
  InaccessibleSource,
  SourceCoverage,
} from "./coverage.js";

// Errors
export type { AnalyticsError, ErrorCode } from "./errors.js";
export { createAnalyticsError, isAnalyticsError } from "./errors.js";

// Metric versions
export {
  CLASSIFIER_VERSION,
  METRIC_DEFINITION_VERSION,
  RULESET_VERSION,
} from "./metric-version.js";
export type {
  ClassifierVersion,
  MetricDefinitionVersion,
  RulesetVersion,
} from "./metric-version.js";

// Analytics snapshot (the product contract)
export type {
  AnalyticsSnapshot,
  DeveloperIdentity,
  QualifiedChangeSummary,
  RepositoryContributionSummary,
} from "./analytics-snapshot.js";
