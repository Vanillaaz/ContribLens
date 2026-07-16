/**
 * Language Analytics Engine.
 *
 * Estimates personal language usage from qualified authored changes.
 * NEVER uses repository-level language percentages.
 *
 * Input:  EvaluatedFile[] from the ContributionRulesEngine
 * Output: LanguageBreakdown
 */

import type { LanguageBreakdown, LanguageEstimate } from "@ContribLens/domain";
import type { EvaluatedFile } from "@ContribLens/contribution-rules";
import type { ILanguageClassifier } from "./language-classifier.interface.js";

export class LanguageAnalyticsEngine {
  constructor(private readonly classifier: ILanguageClassifier) {}

  /**
   * Computes a LanguageBreakdown from a set of rule-evaluated files.
   *
   * Only `included` files contribute to language estimates.
   * `excluded` files contribute to excludedVolume.
   * `indeterminate` files contribute to indeterminateVolume.
   */
  analyze(evaluatedFiles: readonly EvaluatedFile[]): LanguageBreakdown {
    // Accumulators per language (included files only)
    const languageAdditions = new Map<string, number>();
    const languageDeletions = new Map<string, number>();
    const languageCategories = new Map<string, LanguageEstimate["category"]>();
    const languageExcluded = new Map<string, number>();
    const languageIndeterminate = new Map<string, number>();

    let totalExcludedVolume = 0;
    let totalIndeterminateVolume = 0;
    let totalUnavailableVolume = 0;
    let unclassifiedFileCount = 0;

    for (const { file, evaluation } of evaluatedFiles) {
      const { language, category } = this.classifier.classify(file.path);
      const langKey = language ?? `__unknown__${category}`;

      const rawVolume = (file.additions ?? 0) + (file.deletions ?? 0);

      if (!languageCategories.has(langKey)) {
        languageCategories.set(langKey, category);
      }

      if (evaluation.finalDecision === "excluded") {
        totalExcludedVolume += rawVolume;
        const prev = languageExcluded.get(langKey) ?? 0;
        languageExcluded.set(langKey, prev + rawVolume);
        continue;
      }

      if (evaluation.finalDecision === "indeterminate") {
        totalIndeterminateVolume += rawVolume;
        const prev = languageIndeterminate.get(langKey) ?? 0;
        languageIndeterminate.set(langKey, prev + rawVolume);
        continue;
      }

      // Included file
      if (language === null) {
        unclassifiedFileCount++;
      }

      if (evaluation.qualifiedAdditions === null || evaluation.qualifiedDeletions === null) {
        // Unavailable volume — count it but don't attribute to language
        totalUnavailableVolume += rawVolume;
        continue;
      }

      const prevAdd = languageAdditions.get(langKey) ?? 0;
      const prevDel = languageDeletions.get(langKey) ?? 0;
      languageAdditions.set(langKey, prevAdd + evaluation.qualifiedAdditions);
      languageDeletions.set(langKey, prevDel + evaluation.qualifiedDeletions);
    }

    // Build language estimates
    let totalQualifiedVolume = 0;
    for (const additions of languageAdditions.values()) {
      for (const [lang, deletions] of languageDeletions.entries()) {
        if (languageAdditions.has(lang)) {
          totalQualifiedVolume += additions + deletions;
          break;
        }
      }
    }
    // Recalculate total correctly
    totalQualifiedVolume = [...languageAdditions.keys()].reduce((sum, lang) => {
      return sum + (languageAdditions.get(lang) ?? 0) + (languageDeletions.get(lang) ?? 0);
    }, 0);

    const languages: LanguageEstimate[] = [...languageCategories.keys()]
      .map((lang) => {
        const additions = languageAdditions.get(lang) ?? 0;
        const deletions = languageDeletions.get(lang) ?? 0;
        const volume = additions + deletions;
        const displayName = lang.startsWith("__unknown__") ? "Unknown" : lang;
        return {
          language: displayName,
          category: languageCategories.get(lang) ?? "unknown",
          qualifiedAdditions: additions,
          qualifiedDeletions: deletions,
          qualifiedChangeVolume: volume,
          percentageOfQualified:
            totalQualifiedVolume > 0 ? volume / totalQualifiedVolume : null,
          excludedVolume: languageExcluded.get(lang) ?? 0,
          indeterminateVolume: languageIndeterminate.get(lang) ?? 0,
        } satisfies LanguageEstimate;
      })
      .sort((a, b) => (b.qualifiedChangeVolume ?? 0) - (a.qualifiedChangeVolume ?? 0));

    return {
      languages,
      totalQualifiedVolume,
      totalExcludedVolume,
      totalIndeterminateVolume,
      totalUnavailableVolume,
      unclassifiedFileCount,
    };
  }
}
