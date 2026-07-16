/**
 * Analytics request — the input to the analytics engine.
 */

import type { CollectorConfig } from "@ContribLens/contribution-collector";
import type { TimeWindow } from "@ContribLens/domain";

export interface AnalyticsRequest {
  /** GitHub login to analyze. */
  readonly login: string;
  /** Time window for the analytics run. */
  readonly window: TimeWindow;
  /** Correlation ID for request tracing. */
  readonly correlationId: string;
  /** Optional overrides for the collector configuration. */
  readonly collectorConfig?: Partial<CollectorConfig>;
}
