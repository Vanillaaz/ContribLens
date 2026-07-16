/**
 * Rule: GeneratedHeaderRule
 *
 * Detects generated files by examining the file's patch for common
 * generated-code header comments.
 *
 * This rule runs after path-based rules. It catches generated files
 * that happen to be in non-standard locations (e.g., committed to src/).
 *
 * When the patch is unavailable (binary, large diff), this rule passes
 * through rather than making an indeterminate decision — other rules handle
 * binary and unknown content.
 */

import { toRuleId, type ChangedFile, type RuleResult } from "@ContribLens/domain";
import type { IRule } from "../rule.interface.js";
import type { RuleContext } from "../rule-context.js";

/**
 * Patterns found in the first few lines of generated files.
 * Matched case-insensitively against the beginning of the patch.
 */
const GENERATED_HEADER_PATTERNS = [
  // Standard Go/protobuf
  /^[+-]?\s*\/\/\s*code\s+generated\b/im,
  /^[+-]?\s*\/\/\s*do\s+not\s+edit\b/im,
  // GraphQL codegen, Apollo, etc.
  /^[+-]?\s*\/\*\s*eslint-disable\s*\*\//im,
  /^[+-]?\s*\/\/\s*this\s+file\s+is\s+auto[\s-]generated\b/im,
  /^[+-]?\s*\/\/\s*auto[\s-]generated\s+by\b/im,
  /^[+-]?\s*\/\/\s*@generated\b/im,
  /^[+-]?\s*#\s*auto[\s-]generated\b/im,
  /^[+-]?\s*#\s*this\s+file\s+is\s+auto[\s-]generated\b/im,
  /^[+-]?\s*<!--\s*auto[\s-]generated\b/im,
  /^[+-]?\s*<!--\s*do\s+not\s+edit\b/im,
];

/** Number of lines to inspect at the start of a patch for header detection. */
const HEADER_SCAN_LINES = 10;

export class GeneratedHeaderRule implements IRule {
  readonly id = toRuleId("GENERATED_HEADER");
  readonly name = "Generated Header Detection";
  readonly description =
    "Excludes files whose patch begins with a recognized auto-generated code header comment.";

  evaluate(file: ChangedFile, _context: RuleContext): RuleResult | null {
    if (file.patch === null) {
      // Patch unavailable — cannot inspect headers. Pass through.
      return null;
    }

    const patchHead = file.patch.split("\n").slice(0, HEADER_SCAN_LINES).join("\n");

    const matchedPattern = GENERATED_HEADER_PATTERNS.find((pattern) =>
      pattern.test(patchHead),
    );

    if (matchedPattern) {
      return {
        ruleId: this.id,
        decision: "excluded",
        reason: `File "${file.path}" contains a generated-code header comment ` +
          `(pattern: ${matchedPattern.toString()}). ` +
          "Generated files are excluded from authored-change estimates.",
        matched: true,
      };
    }

    return null;
  }
}
