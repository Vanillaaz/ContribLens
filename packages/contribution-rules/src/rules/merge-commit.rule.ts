/**
 * Rule: MergeCommitRule
 *
 * Merge commits are excluded from authored source-change attribution.
 * A developer merging a PR is performing integration work, not authoring
 * the lines that appear in the diff (those were authored in the source branch).
 *
 * The activity is still counted in contribution totals; only the file
 * changes are excluded from qualified code-change and language estimates.
 */

import { toRuleId, type ChangedFile, type RuleResult } from "@ContribLens/domain";
import type { IRule } from "../rule.interface.js";
import type { RuleContext } from "../rule-context.js";

export class MergeCommitRule implements IRule {
  readonly id = toRuleId("MERGE_COMMIT");
  readonly name = "Merge Commit Exclusion";
  readonly description =
    "Excludes files changed in merge commits from qualified authored-change totals.";

  evaluate(_file: ChangedFile, context: RuleContext): RuleResult | null {
    if (!context.isMergeCommit) {
      return null; // Not a merge commit — pass through
    }

    return {
      ruleId: this.id,
      decision: "excluded",
      reason:
        "File changed in a merge commit. Merge commits reflect integration work, " +
        "not personally authored source changes.",
      matched: true,
    };
  }
}
