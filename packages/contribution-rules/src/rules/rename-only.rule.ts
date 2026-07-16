/**
 * Rule: RenameOnlyRule
 *
 * Handles file rename operations.
 *
 * - Pure rename (zero additions, zero deletions): excluded from qualified code volume.
 *   The developer moved a file, not authored new content.
 *
 * - Rename + edit (some additions or deletions): only the changed content counts.
 *   The rule still applies but qualifiedAdditions/Deletions reflects only the edit portion.
 *   (The engine uses the reported additions/deletions, not the total file size.)
 *
 * - Rename with unavailable add/delete counts: classified as indeterminate.
 *   We cannot verify whether content changed without the diff.
 */

import { toRuleId, type ChangedFile, type RuleResult } from "@ContribLens/domain";
import type { IRule } from "../rule.interface.js";
import type { RuleContext } from "../rule-context.js";

export class RenameOnlyRule implements IRule {
  readonly id = toRuleId("RENAME_ONLY");
  readonly name = "Rename-Only Operation";
  readonly description =
    "Excludes pure file renames from qualified code volume; rename+edit counts only changed content.";

  evaluate(file: ChangedFile, _context: RuleContext): RuleResult | null {
    if (file.status !== "renamed" && file.status !== "copied") {
      return null;
    }

    // Pure rename: no content changes
    if (file.additions === 0 && file.deletions === 0) {
      return {
        ruleId: this.id,
        decision: "excluded",
        reason: `File "${file.path}" was renamed from "${file.previousPath ?? "unknown"}" ` +
          "with no content changes. Pure renames are not authored code.",
        matched: true,
      };
    }

    // Rename with unknown add/delete counts
    if (file.additions === null || file.deletions === null) {
      return {
        ruleId: this.id,
        decision: "indeterminate",
        reason: `File "${file.path}" was renamed from "${file.previousPath ?? "unknown"}". ` +
          "Additions/deletions were unavailable, so it is unknown how much " +
          "content changed alongside the rename.",
        matched: true,
      };
    }

    // Rename + content edit: pass through as included (additions/deletions already reflect only edits)
    // No rule result — fall through to default include
    return null;
  }
}
