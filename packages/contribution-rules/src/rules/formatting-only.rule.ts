/**
 * Rule: FormattingOnlyRule
 *
 * Detects commits or files that contain only whitespace/formatting changes
 * and excludes them from qualified code volume.
 *
 * Formatting changes are valid contribution activity (they still count in totals)
 * but should not dominate language estimates or code-volume metrics.
 *
 * IMPORTANT: This rule is explicitly labeled heuristic. Whitespace normalization
 * cannot perfectly preserve semantics across all languages (e.g., Python indentation
 * is semantic). The rule uses conservative thresholds and classifies ambiguous
 * cases as included (not excluded) or indeterminate.
 *
 * This rule only fires when patch content is available.
 */

import { toRuleId, type ChangedFile, type RuleResult } from "@ContribLens/domain";
import type { IRule } from "../rule.interface.js";
import type { RuleContext } from "../rule-context.js";

/**
 * Strips leading +/- diff markers and normalizes whitespace.
 * Used to compare content across diff lines.
 */
function normalizeLineContent(line: string): string {
  return line.replace(/^[+\- ]/, "").replace(/\s+/g, " ").trim();
}

/**
 * Returns true if a diff line represents only whitespace changes.
 * Compares the normalized content of added lines against surrounding context.
 */
function isPureWhitespaceLine(line: string): boolean {
  const stripped = line.replace(/^[+\-]/, "");
  return stripped.trim() === "" || /^\s+$/.test(stripped);
}

export class FormattingOnlyRule implements IRule {
  readonly id = toRuleId("FORMATTING_ONLY");
  readonly name = "Formatting-Only Change Detection";
  readonly description =
    "Heuristically excludes files where all changes are whitespace or formatting only.";

  evaluate(file: ChangedFile, _context: RuleContext): RuleResult | null {
    if (file.patch === null) {
      // Cannot inspect — pass through. BinaryFileRule handles no-patch cases separately.
      return null;
    }

    const diffLines = file.patch.split("\n");
    const changedLines = diffLines.filter(
      (line) => line.startsWith("+") || line.startsWith("-"),
    );

    if (changedLines.length === 0) {
      return null; // No changed lines visible in patch — pass through
    }

    const allWhitespace = changedLines.every((line) => isPureWhitespaceLine(line));

    if (allWhitespace) {
      return {
        ruleId: this.id,
        decision: "excluded",
        reason: `File "${file.path}" contains only whitespace or blank-line changes. ` +
          "This is heuristically identified as a formatting-only change. " +
          "The contribution activity is still counted; only the code volume is excluded.",
        matched: true,
      };
    }

    // Check if all non-whitespace changes are identical after normalization
    // (e.g., indentation change where content is the same)
    const addedNormalized = changedLines
      .filter((l) => l.startsWith("+"))
      .map(normalizeLineContent);
    const removedNormalized = changedLines
      .filter((l) => l.startsWith("-"))
      .map(normalizeLineContent);

    if (
      addedNormalized.length > 0 &&
      addedNormalized.length === removedNormalized.length &&
      addedNormalized.every((line, i) => line === removedNormalized[i])
    ) {
      return {
        ruleId: this.id,
        decision: "excluded",
        reason: `File "${file.path}" contains changes where all modified lines have ` +
          "identical content after whitespace normalization. " +
          "This is heuristically identified as a formatting or indentation change. " +
          "Note: this heuristic cannot guarantee semantic equivalence in all languages.",
        matched: true,
      };
    }

    return null;
  }
}
