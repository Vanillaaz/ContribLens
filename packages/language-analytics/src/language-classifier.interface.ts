/**
 * ILanguageClassifier — injectable language classifier interface.
 *
 * The concrete implementation wraps linguist-js.
 * Tests inject a mock classifier to avoid filesystem dependencies.
 */

import type { LanguageCategory } from "@ContribLens/domain";

/** Result of classifying a single file path. */
export interface ClassificationResult {
  /** Language name, e.g. "TypeScript", "Python". Null if unrecognized. */
  readonly language: string | null;
  /** Broad category for the language. */
  readonly category: LanguageCategory;
}

export interface ILanguageClassifier {
  /**
   * Evaluates a file path and returns its language classification.
   * This is a synchronous operation.
   */
  classify(path: string): ClassificationResult;

  /**
   * Optionally warms up the classifier asynchronously (e.g. loading ML models).
   */
  warmUp?(): Promise<void>;
}
