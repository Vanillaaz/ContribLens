/**
 * IRule — the interface all rules implement.
 *
 * Rules are stateless and have a single responsibility:
 * evaluate one file and return a decision or pass through.
 *
 * Rules form an ordered chain (first-match-wins). A rule that does
 * not apply returns `null` to pass through to the next rule.
 */

import type { ChangedFile, RuleId, RuleResult } from "@ContribLens/domain";
import type { RuleContext } from "./rule-context.js";

/**
 * A single contribution rule.
 *
 * Rules are pure functions — they must not have side effects,
 * read from the network, or maintain state between evaluations.
 */
export interface IRule {
  /** Unique stable identifier for this rule. Used in RuleResult and analytics output. */
  readonly id: RuleId;
  /** Human-readable name for documentation and debugging. */
  readonly name: string;
  /** One-sentence description of what this rule detects. */
  readonly description: string;

  /**
   * Evaluates the file and returns a result if this rule applies, or null to pass through.
   *
   * @param file    - The changed file to evaluate.
   * @param context - Surrounding commit/PR metadata.
   * @returns A RuleResult if this rule matches, or null to pass to the next rule.
   */
  evaluate(file: ChangedFile, context: RuleContext): RuleResult | null;
}
