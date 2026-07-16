/**
 * @ContribLens/contribution-rules
 *
 * Contribution Rules Engine — determines whether a changed file should
 * count toward qualified authored-change metrics.
 */

// Engine
export { ContributionRulesEngine } from "./rules-engine.js";
export type { EvaluatedFile, RulesEngineResult } from "./rules-engine.js";

// Ruleset
export type { Ruleset } from "./ruleset.js";
export { DEFAULT_RULESET } from "./default-ruleset.js";

// Rule interface (for custom rule implementations)
export type { IRule } from "./rule.interface.js";

// Rule context
export { createRuleContext } from "./rule-context.js";
export type { RuleContext } from "./rule-context.js";

// Individual rules (exported for testing and custom rulesets)
export { MergeCommitRule } from "./rules/merge-commit.rule.js";
export { LockFileRule } from "./rules/lock-file.rule.js";
export { VendorPathRule } from "./rules/vendor-path.rule.js";
export { GeneratedPathRule } from "./rules/generated-path.rule.js";
export { GeneratedHeaderRule } from "./rules/generated-header.rule.js";
export { BinaryFileRule } from "./rules/binary.rule.js";
export { MinifiedFileRule } from "./rules/minified.rule.js";
export { RenameOnlyRule } from "./rules/rename-only.rule.js";
export { FormattingOnlyRule } from "./rules/formatting-only.rule.js";
export { DocumentationRule } from "./rules/documentation.rule.js";
