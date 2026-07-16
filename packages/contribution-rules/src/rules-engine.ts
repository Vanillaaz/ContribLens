/**
 * ContributionRulesEngine
 *
 * Applies a Ruleset to a collection of changed files, producing a
 * FileEvaluation for every input file.
 *
 * Invariants:
 * - Every input file produces exactly one FileEvaluation output.
 * - No file is silently dropped.
 * - Files that match no rule default to `included`.
 * - `indeterminate` files are NOT treated as zero — they flow to the
 *   analytics snapshot as unknown volume.
 */

import type {
  ChangedFile,
  FileEvaluation,
  RuleDecision,
} from "@ContribLens/domain";
import type { RuleContext } from "./rule-context.js";
import type { Ruleset } from "./ruleset.js";

/**
 * A changed file paired with its evaluation result.
 */
export interface EvaluatedFile {
  readonly file: ChangedFile;
  readonly evaluation: FileEvaluation;
}

/**
 * Summary statistics from a rules engine run.
 */
export interface RulesEngineResult {
  /** All evaluated files with their decisions. */
  readonly evaluatedFiles: readonly EvaluatedFile[];
  /** Total files evaluated. */
  readonly totalFiles: number;
  /** Files with `included` decision. */
  readonly includedCount: number;
  /** Files with `excluded` decision. */
  readonly excludedCount: number;
  /** Files with `indeterminate` decision. */
  readonly indeterminateCount: number;
  /** The ruleset version that was applied. */
  readonly rulesetVersion: string;
}

export class ContributionRulesEngine {
  constructor(private readonly ruleset: Ruleset) {}

  /**
   * Evaluates a collection of changed files against the ruleset.
   *
   * @param files   - The changed files to evaluate.
   * @param context - The rule evaluation context (commit/PR metadata).
   */
  evaluate(
    files: readonly ChangedFile[],
    context: RuleContext,
  ): RulesEngineResult {
    const evaluatedFiles: EvaluatedFile[] = [];

    for (const file of files) {
      const evaluation = this.evaluateFile(file, context);
      evaluatedFiles.push({ file, evaluation });
    }

    const includedCount = evaluatedFiles.filter(
      (e) => e.evaluation.finalDecision === "included",
    ).length;
    const excludedCount = evaluatedFiles.filter(
      (e) => e.evaluation.finalDecision === "excluded",
    ).length;
    const indeterminateCount = evaluatedFiles.filter(
      (e) => e.evaluation.finalDecision === "indeterminate",
    ).length;

    return {
      evaluatedFiles,
      totalFiles: files.length,
      includedCount,
      excludedCount,
      indeterminateCount,
      rulesetVersion: this.ruleset.version,
    };
  }

  private evaluateFile(file: ChangedFile, context: RuleContext): FileEvaluation {
    for (const rule of this.ruleset.rules) {
      const result = rule.evaluate(file, context);
      if (result === null) continue; // Rule did not match — try next

      // Rule matched — apply its decision
      return this.buildEvaluation(file, result.decision, result);
    }

    // No rule matched — default to included
    return this.buildEvaluation(file, "included", null);
  }

  private buildEvaluation(
    file: ChangedFile,
    decision: RuleDecision,
    matchedRule: NonNullable<FileEvaluation["matchedRule"]> | null,
  ): FileEvaluation {
    let qualifiedAdditions: number | null;
    let qualifiedDeletions: number | null;

    switch (decision) {
      case "included":
        qualifiedAdditions = file.additions;
        qualifiedDeletions = file.deletions;
        break;
      case "excluded":
        qualifiedAdditions = 0;
        qualifiedDeletions = 0;
        break;
      case "indeterminate":
        qualifiedAdditions = null;
        qualifiedDeletions = null;
        break;
    }

    return {
      matchedRule,
      finalDecision: decision,
      qualifiedAdditions,
      qualifiedDeletions,
    };
  }
}
