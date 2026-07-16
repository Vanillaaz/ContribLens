/**
 * Language domain model.
 *
 * Language estimates are derived from qualified authored changes,
 * never from repository-level language percentages.
 *
 * Every estimate exposes its raw totals alongside percentages so consumers
 * cannot accidentally display only the percentage without its context.
 */

/**
 * Broad category of a language or file type.
 *
 * - `source`        — executable/compiled source code (TypeScript, Rust, Python, …).
 * - `markup`        — human-readable markup and documentation (Markdown, RST, HTML, …).
 * - `config`        — configuration and data files (JSON, YAML, TOML, …).
 * - `unknown`       — could not be classified by the language classifier.
 */
export type LanguageCategory = "source" | "markup" | "config" | "unknown";

/**
 * Estimated personal language usage derived from qualified authored changes.
 *
 * IMPORTANT: `percentageOfQualified` is only meaningful alongside the
 * totals it was derived from. It must not be displayed without context.
 */
export interface LanguageEstimate {
  /** Language name as returned by the classifier, e.g. "TypeScript". */
  readonly language: string;
  /** Broad category of this language. */
  readonly category: LanguageCategory;
  /**
   * Estimated qualified additions attributed to this language.
   * Null when the additions count was unavailable for all associated files.
   */
  readonly qualifiedAdditions: number | null;
  /**
   * Estimated qualified deletions attributed to this language.
   * Null when the deletions count was unavailable for all associated files.
   */
  readonly qualifiedDeletions: number | null;
  /**
   * Total qualified change volume (additions + deletions) for this language.
   * Null if either component is unavailable.
   */
  readonly qualifiedChangeVolume: number | null;
  /**
   * This language's share of total qualified change volume, as a decimal [0, 1].
   * Null if qualifiedChangeVolume is null or total is zero.
   *
   * Always report alongside `qualifiedChangeVolume` and `totalQualifiedVolume`.
   */
  readonly percentageOfQualified: number | null;
  /**
   * Volume of changes for this language that were excluded by the rules engine.
   * Reported for transparency.
   */
  readonly excludedVolume: number;
  /**
   * Volume of changes for this language that were indeterminate (could not be classified).
   * Reported for transparency.
   */
  readonly indeterminateVolume: number;
}

/**
 * Aggregated language breakdown for a complete analytics result.
 *
 * All volumes are qualified authored changes only.
 * Raw totals are always present alongside computed percentages.
 */
export interface LanguageBreakdown {
  /** Per-language estimates, sorted descending by qualifiedChangeVolume. */
  readonly languages: readonly LanguageEstimate[];
  /** Total qualified change volume across all languages. */
  readonly totalQualifiedVolume: number;
  /** Total excluded volume (rules-engine exclusions). */
  readonly totalExcludedVolume: number;
  /** Total indeterminate volume (rules-engine indeterminate decisions). */
  readonly totalIndeterminateVolume: number;
  /**
   * Total volume for which additions/deletions were unavailable from GitHub
   * (binary files, API gaps, large diff timeouts).
   */
  readonly totalUnavailableVolume: number;
  /** Number of files that could not be classified by the language classifier. */
  readonly unclassifiedFileCount: number;
}
