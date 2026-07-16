/**
 * Cache key builder for analytics results.
 *
 * Cache keys must include all dimensions that affect the result:
 * - login (the subject)
 * - time window (from + to)
 * - metric definition version
 * - ruleset version
 * - classifier version
 *
 * Theme and renderer version are NOT included — those are presentation concerns
 * and should be in the SVG renderer's own cache key, not here.
 */

import {
  CLASSIFIER_VERSION,
  METRIC_DEFINITION_VERSION,
  RULESET_VERSION,
} from "@ContribLens/domain";
import type { TimeWindow } from "@ContribLens/domain";

/**
 * Builds a deterministic, stable cache key for an analytics result.
 */
export function buildCacheKey(login: string, window: TimeWindow): string {
  return [
    "v1",
    login.toLowerCase(),
    window.from,
    window.to,
    METRIC_DEFINITION_VERSION,
    RULESET_VERSION,
    CLASSIFIER_VERSION,
  ].join(":");
}
