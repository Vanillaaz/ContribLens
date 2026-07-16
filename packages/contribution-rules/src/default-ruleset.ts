/**
 * Default Contribution Rules Engine ruleset.
 *
 * Rules are ordered from most-specific to least-specific.
 * The first rule to match a file terminates evaluation (first-match-wins).
 *
 * ORDER MATTERS:
 * 1. MergeCommitRule    — structural signal, highest priority
 * 2. LockFileRule       — exact filename match, very specific
 * 3. VendorPathRule     — directory prefix match, specific
 * 4. GeneratedPathRule  — directory prefix + extension match, specific
 * 5. BinaryFileRule     — extension + API signal, specific
 * 6. MinifiedFileRule   — extension + content heuristic
 * 7. GeneratedHeaderRule — patch content heuristic (needs patch available)
 * 8. RenameOnlyRule     — status-based, specific
 * 9. FormattingOnlyRule — content heuristic, needs patch, most expensive
 * 10. DocumentationRule — catch-all classifier for prose files
 *
 * Files that match no rule default to `included`.
 */

import { RULESET_VERSION } from "@ContribLens/domain";
import { BinaryFileRule } from "./rules/binary.rule.js";
import { DocumentationRule } from "./rules/documentation.rule.js";
import { FormattingOnlyRule } from "./rules/formatting-only.rule.js";
import { GeneratedHeaderRule } from "./rules/generated-header.rule.js";
import { GeneratedPathRule } from "./rules/generated-path.rule.js";
import { LockFileRule } from "./rules/lock-file.rule.js";
import { MergeCommitRule } from "./rules/merge-commit.rule.js";
import { MinifiedFileRule } from "./rules/minified.rule.js";
import { RenameOnlyRule } from "./rules/rename-only.rule.js";
import { VendorPathRule } from "./rules/vendor-path.rule.js";
import type { Ruleset } from "./ruleset.js";

/** The default Contribution Rules Engine ruleset for Version 1. */
export const DEFAULT_RULESET: Ruleset = {
  version: RULESET_VERSION,
  description:
    "Default Version 1 ruleset. Excludes lock files, vendor code, generated artifacts, " +
    "binary files, minified bundles, merge commits, pure renames, and formatting-only changes. " +
    "Documents documentation separately from executable source.",
  rules: [
    new MergeCommitRule(),
    new LockFileRule(),
    new VendorPathRule(),
    new GeneratedPathRule(),
    new BinaryFileRule(),
    new MinifiedFileRule(),
    new GeneratedHeaderRule(),
    new RenameOnlyRule(),
    new FormattingOnlyRule(),
    new DocumentationRule(),
  ],
} as const;
