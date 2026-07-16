/**
 * Rule: VendorPathRule
 *
 * Excludes files in conventional vendor/dependency directories.
 *
 * Vendored code is third-party code committed into the repository.
 * It must not be attributed to the developer who committed it.
 */

import { toRuleId, type ChangedFile, type RuleResult } from "@ContribLens/domain";
import type { IRule } from "../rule.interface.js";
import type { RuleContext } from "../rule-context.js";

/** Path segment prefixes that indicate vendored or third-party code. */
const VENDOR_PATH_PREFIXES = [
  "vendor/",
  "vendors/",
  "node_modules/",
  "third_party/",
  "third-party/",
  "thirdparty/",
  "external/",
  "externals/",
  "deps/",
  "dependencies/",
  "lib/vendor/",
  "Pods/",               // CocoaPods
  ".bundle/",            // Ruby Bundler vendor
  "bower_components/",
  "jspm_packages/",
];

export class VendorPathRule implements IRule {
  readonly id = toRuleId("VENDOR_PATH");
  readonly name = "Vendor Path Exclusion";
  readonly description =
    "Excludes files in conventional vendor and third-party dependency directories.";

  evaluate(file: ChangedFile, _context: RuleContext): RuleResult | null {
    const normalizedPath = file.path.startsWith("/")
      ? file.path.slice(1)
      : file.path;

    const matchedPrefix = VENDOR_PATH_PREFIXES.find(
      (prefix) =>
        normalizedPath.startsWith(prefix) ||
        normalizedPath.includes(`/${prefix}`),
    );

    if (matchedPrefix) {
      return {
        ruleId: this.id,
        decision: "excluded",
        reason: `Path "${file.path}" is in a vendor/third-party directory ` +
          `(matched prefix: "${matchedPrefix}"). ` +
          "Vendored code must not be attributed to the committing developer.",
        matched: true,
      };
    }

    return null;
  }
}
