/**
 * Rule: MinifiedFileRule
 *
 * Excludes minified files from qualified change and language attribution metrics.
 *
 * Minified files are machine-optimized for runtime delivery, not for
 * human authoring. Their line counts are meaningless for language attribution.
 *
 * Detection uses file extension patterns and patch content shape.
 */

import { toRuleId, type ChangedFile, type RuleResult } from "@ContribLens/domain";
import type { IRule } from "../rule.interface.js";
import type { RuleContext } from "../rule-context.js";

/** File name patterns indicating minified content. */
const MINIFIED_PATTERNS = [
  /\.min\.[cm]?[jt]s$/i,
  /\.min\.css$/i,
  /\.min\.mjs$/i,
  /\.bundle\.[cm]?js$/i,
  /\.chunk\.[cm]?js$/i,
  /\.prod\.[cm]?js$/i,
  /[-.]min\d+\.[cm]?js$/i,  // some bundlers: file-abc123.min.js
];

/**
 * Threshold for detecting minified content by line length.
 * A line longer than this in a JS/CSS file is very likely minified.
 */
const MINIFIED_LINE_LENGTH_THRESHOLD = 500;

export class MinifiedFileRule implements IRule {
  readonly id = toRuleId("MINIFIED_FILE");
  readonly name = "Minified File Exclusion";
  readonly description =
    "Excludes minified or bundled files from qualified change and language attribution metrics.";

  evaluate(file: ChangedFile, _context: RuleContext): RuleResult | null {
    // Signal 1: Minified file name pattern
    if (MINIFIED_PATTERNS.some((pattern) => pattern.test(file.path))) {
      return {
        ruleId: this.id,
        decision: "excluded",
        reason: `File "${file.path}" matches a minified/bundled file name pattern. ` +
          "Minified files are not authored content.",
        matched: true,
      };
    }

    // Signal 2: Patch contains suspiciously long single lines (JS/CSS only)
    if (file.patch !== null && this.appearsMinified(file.path, file.patch)) {
      return {
        ruleId: this.id,
        decision: "excluded",
        reason: `File "${file.path}" appears minified: the diff contains lines ` +
          `exceeding ${MINIFIED_LINE_LENGTH_THRESHOLD.toString()} characters, ` +
          "characteristic of machine-generated compressed content.",
        matched: true,
      };
    }

    return null;
  }

  private appearsMinified(path: string, patch: string): boolean {
    const isJsOrCss = /\.(js|mjs|cjs|css)$/i.test(path);
    if (!isJsOrCss) return false;

    return patch
      .split("\n")
      .some((line) => line.length > MINIFIED_LINE_LENGTH_THRESHOLD);
  }
}
