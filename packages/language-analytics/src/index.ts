/**
 * @ContribLens/language-analytics
 *
 * Language attribution engine — estimates personal language usage
 * from qualified authored changes. Never uses repository-level percentages.
 */

export { LanguageAnalyticsEngine } from "./language-analytics-engine.js";
export { LinguistLanguageClassifier } from "./language-classifier.js";
export type {
  ClassificationResult,
  ILanguageClassifier,
} from "./language-classifier.interface.js";
