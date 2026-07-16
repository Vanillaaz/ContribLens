/**
 * Ruleset — an ordered, versioned collection of rules.
 *
 * Rules are evaluated in declaration order (first-match-wins).
 * The first rule that returns a non-null RuleResult terminates evaluation.
 */

import type { IRule } from "./rule.interface.js";

export interface Ruleset {
  /**
   * Semantic version string for this ruleset.
   * Embedded in every analytics snapshot; used as part of the cache key.
   * Increment when rules are added, removed, or semantics change.
   */
  readonly version: string;
  /**
   * Human-readable description of this ruleset.
   */
  readonly description: string;
  /**
   * Ordered list of rules. First-match-wins.
   */
  readonly rules: readonly IRule[];
}
