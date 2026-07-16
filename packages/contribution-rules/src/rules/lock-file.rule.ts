/**
 * Rule: LockFileRule
 *
 * Excludes standard dependency lock files from qualified authored-change metrics.
 *
 * Lock file diffs describe dependency version resolution, not personally
 * authored logic. They can be enormous (thousands of lines) and would
 * dramatically distort language estimates if counted.
 *
 * Covers: npm, yarn, pnpm, pip, poetry, gem, cargo, composer, mix, go
 */

import { toRuleId, type ChangedFile, type RuleResult } from "@ContribLens/domain";
import type { IRule } from "../rule.interface.js";
import type { RuleContext } from "../rule-context.js";

/** Exact filenames that are always lock files, regardless of path. */
const LOCK_FILE_NAMES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "npm-shrinkwrap.json",
  "poetry.lock",
  "Pipfile.lock",
  "Gemfile.lock",
  "Cargo.lock",
  "composer.lock",
  "mix.lock",
  "go.sum",
  "flake.lock",        // Nix
  "pdm.lock",
  "uv.lock",
  "bun.lockb",
  "pubspec.lock",      // Dart/Flutter
  "Podfile.lock",      // CocoaPods
  "Package.resolved",  // Swift PM
]);

/** Filename suffixes that indicate a lock file. */
const LOCK_FILE_SUFFIXES = [".lock", "-lock.json", ".lock.json"];

export class LockFileRule implements IRule {
  readonly id = toRuleId("LOCK_FILE");
  readonly name = "Lock File Exclusion";
  readonly description =
    "Excludes standard dependency lock files from qualified authored-change totals.";

  evaluate(file: ChangedFile, _context: RuleContext): RuleResult | null {
    const basename = file.path.split("/").at(-1) ?? file.path;

    if (LOCK_FILE_NAMES.has(basename)) {
      return {
        ruleId: this.id,
        decision: "excluded",
        reason: `"${basename}" is a dependency lock file. Lock files describe ` +
          "version resolution, not personally authored code.",
        matched: true,
      };
    }

    if (LOCK_FILE_SUFFIXES.some((suffix) => basename.endsWith(suffix))) {
      return {
        ruleId: this.id,
        decision: "excluded",
        reason: `"${basename}" matches a lock file suffix pattern.`,
        matched: true,
      };
    }

    return null;
  }
}
