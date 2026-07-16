/**
 * Unit tests: ContributionRulesEngine
 *
 * Tests the engine as a unit — using the default ruleset and verifying
 * the first-match-wins semantics, qualified change aggregation,
 * and result invariants.
 */

import { describe, it, expect } from "vitest";
import { ContributionRulesEngine } from "../rules-engine.js";
import { DEFAULT_RULESET } from "../default-ruleset.js";
import { makeFile, makeContext, makeMergeCommitContext } from "./helpers.js";

describe("ContributionRulesEngine", () => {
  const engine = new ContributionRulesEngine(DEFAULT_RULESET);

  describe("invariants", () => {
    it("returns exactly one EvaluatedFile per input file", () => {
      const files = [
        makeFile({ path: "src/a.ts" }),
        makeFile({ path: "src/b.ts" }),
        makeFile({ path: "package-lock.json" }),
      ];
      const result = engine.evaluate(files, makeContext());

      expect(result.evaluatedFiles).toHaveLength(files.length);
      expect(result.totalFiles).toBe(files.length);
    });

    it("counts add up to totalFiles", () => {
      const files = [
        makeFile({ path: "src/index.ts", additions: 10, deletions: 5 }),
        makeFile({ path: "package-lock.json", additions: 200, deletions: 100 }),
        makeFile({ path: "vendor/lib.js" }),
      ];
      const result = engine.evaluate(files, makeContext());

      expect(result.includedCount + result.excludedCount + result.indeterminateCount)
        .toBe(result.totalFiles);
    });

    it("returns the ruleset version", () => {
      const result = engine.evaluate([], makeContext());
      expect(result.rulesetVersion).toBe(DEFAULT_RULESET.version);
    });

    it("handles an empty file list gracefully", () => {
      const result = engine.evaluate([], makeContext());

      expect(result.totalFiles).toBe(0);
      expect(result.includedCount).toBe(0);
      expect(result.excludedCount).toBe(0);
      expect(result.indeterminateCount).toBe(0);
      expect(result.evaluatedFiles).toHaveLength(0);
    });
  });

  describe("default to included", () => {
    it("includes a regular source file that matches no rule", () => {
      const file = makeFile({ path: "src/index.ts", additions: 10, deletions: 5 });
      const result = engine.evaluate([file], makeContext());

      const evaluated = result.evaluatedFiles[0]!;
      expect(evaluated.evaluation.finalDecision).toBe("included");
      expect(evaluated.evaluation.matchedRule).toBeNull();
      expect(evaluated.evaluation.qualifiedAdditions).toBe(10);
      expect(evaluated.evaluation.qualifiedDeletions).toBe(5);
    });
  });

  describe("first-match-wins semantics", () => {
    it("applies MergeCommitRule first, not LockFileRule, for a lock file in a merge commit", () => {
      const file = makeFile({ path: "package-lock.json" });
      const result = engine.evaluate([file], makeMergeCommitContext());

      const evaluated = result.evaluatedFiles[0]!;
      expect(evaluated.evaluation.matchedRule?.ruleId).toBe("MERGE_COMMIT");
    });

    it("applies LockFileRule for a lock file NOT in a merge commit", () => {
      const file = makeFile({ path: "package-lock.json" });
      const result = engine.evaluate([file], makeContext({ isMergeCommit: false }));

      const evaluated = result.evaluatedFiles[0]!;
      expect(evaluated.evaluation.matchedRule?.ruleId).toBe("LOCK_FILE");
    });

    it("applies VendorPathRule before GeneratedPathRule for vendor paths", () => {
      // vendor/dist/file.js could match both VendorPathRule and GeneratedPathRule
      const file = makeFile({ path: "vendor/dist/file.js" });
      const result = engine.evaluate([file], makeContext());

      const evaluated = result.evaluatedFiles[0]!;
      // VendorPathRule comes before GeneratedPathRule in the default ruleset
      expect(evaluated.evaluation.matchedRule?.ruleId).toBe("VENDOR_PATH");
    });
  });

  describe("qualified change computation", () => {
    it("sets qualifiedAdditions=0 and qualifiedDeletions=0 for excluded files", () => {
      const file = makeFile({ path: "package-lock.json", additions: 1000, deletions: 500 });
      const result = engine.evaluate([file], makeContext());

      const evaluated = result.evaluatedFiles[0]!;
      expect(evaluated.evaluation.finalDecision).toBe("excluded");
      expect(evaluated.evaluation.qualifiedAdditions).toBe(0);
      expect(evaluated.evaluation.qualifiedDeletions).toBe(0);
    });

    it("preserves raw additions/deletions for included files", () => {
      const file = makeFile({ path: "src/utils.ts", additions: 42, deletions: 7 });
      const result = engine.evaluate([file], makeContext());

      const evaluated = result.evaluatedFiles[0]!;
      expect(evaluated.evaluation.qualifiedAdditions).toBe(42);
      expect(evaluated.evaluation.qualifiedDeletions).toBe(7);
    });

    it("returns null qualified changes for indeterminate files", () => {
      // A renamed file with null additions/deletions → indeterminate
      const file = makeFile({
        path: "src/new-name.ts",
        previousPath: "src/old-name.ts",
        status: "renamed",
        additions: null,
        deletions: null,
      });
      const result = engine.evaluate([file], makeContext());

      const evaluated = result.evaluatedFiles[0]!;
      expect(evaluated.evaluation.finalDecision).toBe("indeterminate");
      expect(evaluated.evaluation.qualifiedAdditions).toBeNull();
      expect(evaluated.evaluation.qualifiedDeletions).toBeNull();
    });
  });

  describe("mixed file sets", () => {
    it("correctly categorizes a realistic commit", () => {
      const files = [
        makeFile({ path: "src/feature.ts", additions: 50, deletions: 10 }),
        makeFile({ path: "src/feature.test.ts", additions: 80, deletions: 0 }),
        makeFile({ path: "README.md", additions: 5, deletions: 3 }),
        makeFile({ path: "package-lock.json", additions: 3000, deletions: 2000 }),
        makeFile({ path: "dist/bundle.js", additions: 500, deletions: 300 }),
        makeFile({ path: "vendor/jquery.js", additions: 100, deletions: 0 }),
      ];
      const result = engine.evaluate(files, makeContext());

      expect(result.totalFiles).toBe(6);
      // src/feature.ts, src/feature.test.ts, README.md → included
      expect(result.includedCount).toBe(3);
      // package-lock.json, dist/bundle.js, vendor/jquery.js → excluded
      expect(result.excludedCount).toBe(3);
      expect(result.indeterminateCount).toBe(0);
    });

    it("each file in the result references its original file", () => {
      const fileA = makeFile({ path: "src/a.ts" });
      const fileB = makeFile({ path: "package-lock.json" });

      const result = engine.evaluate([fileA, fileB], makeContext());

      expect(result.evaluatedFiles[0]!.file.path).toBe("src/a.ts");
      expect(result.evaluatedFiles[1]!.file.path).toBe("package-lock.json");
    });
  });

  describe("merge commit bulk exclusion", () => {
    it("excludes ALL files in a merge commit regardless of their type", () => {
      const files = [
        makeFile({ path: "src/feature.ts" }),
        makeFile({ path: "package-lock.json" }),
        makeFile({ path: "README.md" }),
      ];
      const result = engine.evaluate(files, makeMergeCommitContext());

      expect(result.excludedCount).toBe(3);
      expect(result.includedCount).toBe(0);
      for (const { evaluation } of result.evaluatedFiles) {
        expect(evaluation.matchedRule?.ruleId).toBe("MERGE_COMMIT");
        expect(evaluation.qualifiedAdditions).toBe(0);
        expect(evaluation.qualifiedDeletions).toBe(0);
      }
    });
  });
});
