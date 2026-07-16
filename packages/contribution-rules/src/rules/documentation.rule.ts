/**
 * Rule: DocumentationRule
 *
 * Classifies documentation and prose files as "included" with
 * the `markup` language category, reported separately from executable source.
 *
 * Documentation is meaningful contribution — it should not disappear
 * from the analytics output. It is simply reported in its own category
 * so it does not inflate the "source code" language estimates.
 *
 * This rule fires LAST in the default chain (after exclusion rules)
 * to give other rules a chance to exclude documentation in generated paths first.
 *
 * Note: This rule does not "exclude" documentation — it returns `included`
 * as a signal that the file is specifically classified as documentation.
 * The language analytics engine uses the file path extension to determine
 * the language category anyway; this rule exists as an explicit marker
 * for transparency in the rules output.
 */

import { toRuleId, type ChangedFile, type RuleResult } from "@ContribLens/domain";
import type { IRule } from "../rule.interface.js";
import type { RuleContext } from "../rule-context.js";

/** Extensions for documentation and prose files. */
const DOCUMENTATION_EXTENSIONS = new Set([
  ".md",
  ".mdx",
  ".rst",
  ".txt",
  ".adoc",    // AsciiDoc
  ".asciidoc",
  ".org",     // Org-mode
  ".wiki",
  ".pod",     // Perl POD
  ".rdoc",    // Ruby RDoc
]);

/** Known documentation filenames (without extension). */
const DOCUMENTATION_FILENAMES = new Set([
  "README",
  "CHANGELOG",
  "CONTRIBUTING",
  "LICENSE",
  "AUTHORS",
  "CODEOWNERS",
  "NOTICE",
  "PATENTS",
  "SECURITY",
  "HISTORY",
]);

export class DocumentationRule implements IRule {
  readonly id = toRuleId("DOCUMENTATION");
  readonly name = "Documentation Classification";
  readonly description =
    "Marks documentation and prose files as included but classified separately from executable source.";

  evaluate(file: ChangedFile, _context: RuleContext): RuleResult | null {
    const basename = file.path.split("/").at(-1) ?? file.path;
    const lastDot = basename.lastIndexOf(".");
    const extension = lastDot !== -1 ? basename.slice(lastDot).toLowerCase() : "";
    const nameWithoutExt = lastDot !== -1 ? basename.slice(0, lastDot).toUpperCase() : basename.toUpperCase();

    const isDoc =
      DOCUMENTATION_EXTENSIONS.has(extension) ||
      DOCUMENTATION_FILENAMES.has(nameWithoutExt) ||
      DOCUMENTATION_FILENAMES.has(basename.toUpperCase());

    if (!isDoc) return null;

    return {
      ruleId: this.id,
      decision: "included",
      reason: `File "${file.path}" is classified as documentation. ` +
        "Documentation is counted as a contribution but reported separately " +
        "from executable source in language estimates.",
      matched: true,
    };
  }
}
