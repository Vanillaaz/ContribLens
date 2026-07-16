/**
 * @ContribLens/analytics-engine
 *
 * Orchestration and snapshot assembly.
 * This is the product — the core analytics engine that coordinates all sub-packages.
 */

export { AnalyticsEngine } from "./analytics-engine.js";
export type { AnalyticsEngineOptions } from "./analytics-engine.js";
export type { AnalyticsRequest } from "./analytics-request.js";
export { AnalyticsCache } from "./cache/analytics-cache.js";
export type { AnalyticsCacheOptions } from "./cache/analytics-cache.js";
export { buildCacheKey } from "./cache/cache-key.js";
