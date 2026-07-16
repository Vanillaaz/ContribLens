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
   * Classifies a file by its path and optional patch content.
   * Never throws — returns `{ language: null, category: "unknown" }` for unrecognizable files.
   */
  classify(path: string): ClassificationResult;
}
