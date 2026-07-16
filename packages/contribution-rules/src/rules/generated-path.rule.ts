/**
 * Rule: GeneratedPathRule
 *
 * Excludes files in conventional build output and generated code directories.
 *
 * Generated artifacts (build outputs, compiled assets, auto-generated API clients)
 * inflate source totals without reflecting authored source work.
 */

import { toRuleId, type ChangedFile, type RuleResult } from "@ContribLens/domain";
import type { IRule } from "../rule.interface.js";
import type { RuleContext } from "../rule-context.js";

/** Directory path prefixes that indicate generated or build output content. */
const GENERATED_PATH_PREFIXES = [
  "dist/",
  "build/",
  "out/",
  "output/",
  "coverage/",
  ".next/",
  ".nuxt/",
  ".output/",
  ".svelte-kit/",
  ".astro/",
  "__generated__/",
  "_generated/",
  "generated/",
  "auto-generated/",
  ".generated/",
  "gen/",
  "codegen/",
  ".turbo/",
  ".vercel/",
  "storybook-static/",
  "playwright-report/",
  "test-results/",
];

/** File extensions that are always generated build artifacts. */
const GENERATED_EXTENSIONS = new Set([
  ".min.js",
  ".min.css",
  ".min.mjs",
  ".bundle.js",
  ".chunk.js",
  ".map",          // Source maps (build artifacts)
]);

export class GeneratedPathRule implements IRule {
  readonly id = toRuleId("GENERATED_PATH");
  readonly name = "Generated Path Exclusion";
  readonly description =
    "Excludes files in build output and auto-generated code directories.";

  evaluate(file: ChangedFile, _context: RuleContext): RuleResult | null {
    const normalizedPath = file.path.startsWith("/")
      ? file.path.slice(1)
      : file.path;

    const matchedPrefix = GENERATED_PATH_PREFIXES.find(
      (prefix) =>
        normalizedPath.startsWith(prefix) ||
        normalizedPath.includes(`/${prefix}`),
    );

    if (matchedPrefix) {
      return {
        ruleId: this.id,
        decision: "excluded",
        reason: `Path "${file.path}" is in a build output or generated code directory ` +
          `(matched prefix: "${matchedPrefix}").`,
        matched: true,
      };
    }

    // Check generated extensions
    const matchedExt = [...GENERATED_EXTENSIONS].find((ext) =>
      file.path.endsWith(ext),
    );
    if (matchedExt) {
      return {
        ruleId: this.id,
        decision: "excluded",
        reason: `File "${file.path}" has a generated/minified file extension ("${matchedExt}").`,
        matched: true,
      };
    }

    return null;
  }
}
