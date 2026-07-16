/**
 * Metric definition versioning.
 *
 * Every analytics snapshot is stamped with the version of the metric
 * definitions and ruleset that produced it. Consumers can detect breaking
 * changes and cached results from incompatible versions can be invalidated.
 *
 * Versioning follows semantic versioning conventions:
 * - MAJOR: breaking change to AnalyticsSnapshot structure or metric semantics.
 * - MINOR: new optional fields or non-breaking metric additions.
 * - PATCH: bug fixes that do not change the contract.
 */

/**
 * The current version of the AnalyticsSnapshot contract.
 *
 * Increment MAJOR when the AnalyticsSnapshot interface changes in a way
 * that would break a consumer that serializes or deserializes it.
 *
 * This version is embedded in every produced snapshot and every cache key.
 */
export const METRIC_DEFINITION_VERSION = "1.0.0" as const;

/**
 * The current version of the default Contribution Rules Engine ruleset.
 *
 * Increment when rules are added, removed, or their semantics change
 * in a way that would produce different results for the same input.
 *
 * This version is embedded in every produced snapshot and every cache key.
 */
export const RULESET_VERSION = "1.0.0" as const;

/**
 * The current version of the language classifier configuration.
 *
 * Increment when the classifier library is updated or its configuration
 * changes in a way that would produce different language attributions.
 */
export const CLASSIFIER_VERSION = "1.0.0" as const;

export type MetricDefinitionVersion = typeof METRIC_DEFINITION_VERSION;
export type RulesetVersion = typeof RULESET_VERSION;
export type ClassifierVersion = typeof CLASSIFIER_VERSION;
