/**
 * @ContribLens/contribution-collector
 *
 * Normalized activity and changed-file collection.
 * Coordinates GitHub API data retrieval and normalization into domain objects.
 */

export { ContributionCollector } from "./contribution-collector.js";
export type { CollectionRequest } from "./contribution-collector.js";

export type { CollectionResult } from "./collection-result.js";

export {
  DEFAULT_COLLECTOR_CONFIG,
} from "./collector-config.js";
export type { CollectorConfig } from "./collector-config.js";

export { CoverageTracker } from "./coverage-tracker.js";
export { UserResolver } from "./user-resolver.js";
export { RepositoryDiscoverer } from "./repository-discoverer.js";
export { FileEvidenceCollector } from "./file-evidence-collector.js";
export { classifyRepository } from "./repository-classifier.js";
