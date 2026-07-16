/**
 * Unit tests: RenameOnlyRule
 */

import { describe, it, expect } from "vitest";
import { RenameOnlyRule } from "../rules/rename-only.rule.js";
import { makeFile, makeContext } from "./helpers.js";

describe("RenameOnlyRule", () => {
  const rule = new RenameOnlyRule();
  const ctx = makeContext();

  it("has the correct rule ID", () => {
    expect(rule.id).toBe("RENAME_ONLY");
  });

  describe("pure rename (status=renamed, 0 additions, 0 deletions)", () => {
    it("excludes a pure rename with no content changes", () => {
      const file = makeFile({
        path: "src/new-name.ts",
        previousPath: "src/old-name.ts",
        status: "renamed",
        additions: 0,
        deletions: 0,
      });

      const result = rule.evaluate(file, ctx);

      expect(result).not.toBeNull();
      expect(result!.decision).toBe("excluded");
      expect(result!.matched).toBe(true);
      expect(result!.ruleId).toBe("RENAME_ONLY");
    });

    it("mentions the previous path in the reason", () => {
      const file = makeFile({
        path: "src/new.ts",
        previousPath: "src/old.ts",
        status: "renamed",
        additions: 0,
        deletions: 0,
      });

      const result = rule.evaluate(file, ctx);
      expect(result!.reason).toContain("src/old.ts");
    });

    it("handles a rename with unknown previousPath gracefully", () => {
      const file = makeFile({
        path: "src/new.ts",
        previousPath: null,
        status: "renamed",
        additions: 0,
        deletions: 0,
      });

      const result = rule.evaluate(file, ctx);
      expect(result?.decision).toBe("excluded");
    });
  });

  describe("pure copy (status=copied)", () => {
    it("excludes a pure copy with no content changes", () => {
      const file = makeFile({
        path: "src/copy.ts",
        previousPath: "src/original.ts",
        status: "copied",
        additions: 0,
        deletions: 0,
      });

      const result = rule.evaluate(file, ctx);
      expect(result?.decision).toBe("excluded");
    });
  });

  describe("rename with unknown add/delete counts", () => {
    it("returns indeterminate when additions is null", () => {
      const file = makeFile({
        path: "src/new.ts",
        previousPath: "src/old.ts",
        status: "renamed",
        additions: null,
        deletions: null,
      });

      const result = rule.evaluate(file, ctx);
      expect(result?.decision).toBe("indeterminate");
    });

    it("returns indeterminate when additions is null but deletions > 0", () => {
      const file = makeFile({
        path: "src/new.ts",
        status: "renamed",
        additions: null,
        deletions: 5,
      });

      const result = rule.evaluate(file, ctx);
      expect(result?.decision).toBe("indeterminate");
    });
  });

  describe("rename with content changes (rename + edit)", () => {
    it("passes through (returns null) when rename includes additions/deletions", () => {
      const file = makeFile({
        path: "src/new.ts",
        previousPath: "src/old.ts",
        status: "renamed",
        additions: 10,
        deletions: 5,
      });

      // Rename + edit: only the edit content should count → pass through
      expect(rule.evaluate(file, ctx)).toBeNull();
    });
  });

  describe("non-renamed files", () => {
    it("returns null for modified files", () => {
      expect(rule.evaluate(makeFile({ path: "src/index.ts", status: "modified" }), ctx)).toBeNull();
    });

    it("returns null for added files", () => {
      expect(rule.evaluate(makeFile({ path: "src/new.ts", status: "added" }), ctx)).toBeNull();
    });

    it("returns null for removed files", () => {
      expect(rule.evaluate(makeFile({ path: "src/old.ts", status: "removed" }), ctx)).toBeNull();
    });
  });
});
