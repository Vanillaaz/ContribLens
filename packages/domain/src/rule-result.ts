/**
 * Rule result domain model.
 *
 * Every file evaluated by the Contribution Rules Engine receives a RuleResult.
 * Results are never silently discarded — indeterminate results appear in the
 * analytics snapshot's unknown-volume totals.
 */

declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

/**
 * A stable string identifier for a rule.
 * Used in JSON output so consumers can programmatically filter rule reasons.
 *
 * Convention: `SCREAMING_SNAKE_CASE`.
 * Examples: `LOCK_FILE`, `VENDOR_PATH`, `FORMATTING_ONLY`, `RENAME_ONLY`.
 */
export type RuleId = Brand<string, "RuleId">;

/** Constructs a typed rule ID. Use only when defining rules. */
export function toRuleId(raw: string): RuleId {
  return raw as RuleId;
}

/**
 * The outcome of applying a rule to a file.
 *
 * - `included`      — change counts toward qualified authored-change metrics.
 * - `excluded`      — change is intentionally excluded (lock file, vendor, etc.).
 * - `indeterminate` — the rule could not make a confident decision.
 *                     The change is counted as unknown volume, not as zero.
 */
export type RuleDecision = "included" | "excluded" | "indeterminate";

/**
 * The result of applying a single rule to a single file.
 */
export interface RuleResult {
  /** The rule that produced this result. */
  readonly ruleId: RuleId;
  /** The decision made by this rule. */
  readonly decision: RuleDecision;
  /**
   * Human-readable explanation of why this decision was made.
   * Must be safe to expose in API responses and SVG card tooltips.
   */
  readonly reason: string;
  /**
   * Whether this rule matched and made a final decision (true),
   * or whether it passed through without reaching a conclusion (false).
   *
   * Only the first matching rule's decision is applied (first-match-wins).
   * Non-matching rules are not included in the output.
   */
  readonly matched: boolean;
}

/**
 * The complete evaluation of a single file through the rules engine.
 *
 * The `finalDecision` is the decision from the first rule that matched.
 * If no rule matched, the file defaults to `included`.
 */
export interface FileEvaluation {
  /** The rule result that determined the final decision. Null if no rule matched. */
  readonly matchedRule: RuleResult | null;
  /** The final decision applied to this file. */
  readonly finalDecision: RuleDecision;
  /**
   * Qualified additions after rules processing.
   *
   * - For `included` files: equals the raw additions (or null if unavailable).
   * - For `excluded` files: always 0.
   * - For `indeterminate` files: null (unknown).
   * - For pure renames with zero content change: 0.
   */
  readonly qualifiedAdditions: number | null;
  /**
   * Qualified deletions after rules processing.
   * Same semantics as qualifiedAdditions.
   */
  readonly qualifiedDeletions: number | null;
}
