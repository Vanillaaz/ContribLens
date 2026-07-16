/**
 * Unit tests: MergeCommitRule
 */

import { describe, it, expect } from "vitest";
import { MergeCommitRule } from "../rules/merge-commit.rule.js";
import { makeFile, makeContext, makeMergeCommitContext } from "./helpers.js";

describe("MergeCommitRule", () => {
  const rule = new MergeCommitRule();

  it("has the correct rule ID", () => {
    expect(rule.id).toBe("MERGE_COMMIT");
  });

  describe("when context is NOT a merge commit", () => {
    it("returns null (pass-through) for any file", () => {
      const file = makeFile({ path: "src/index.ts" });
      const ctx = makeContext({ isMergeCommit: false });

      expect(rule.evaluate(file, ctx)).toBeNull();
    });
  });

  describe("when context IS a merge commit", () => {
    it("excludes any source file", () => {
      const file = makeFile({ path: "src/index.ts" });
      const ctx = makeMergeCommitContext();

      const result = rule.evaluate(file, ctx);

      expect(result).not.toBeNull();
      expect(result!.decision).toBe("excluded");
      expect(result!.matched).toBe(true);
      expect(result!.ruleId).toBe("MERGE_COMMIT");
    });

    it("excludes a config file", () => {
      const file = makeFile({ path: "package.json" });
      const ctx = makeMergeCommitContext();

      const result = rule.evaluate(file, ctx);
      expect(result?.decision).toBe("excluded");
    });

    it("includes a human-readable reason", () => {
      const file = makeFile({ path: "src/foo.ts" });
      const result = rule.evaluate(file, makeMergeCommitContext());

      expect(result!.reason).toMatch(/merge commit/i);
    });
  });
});
