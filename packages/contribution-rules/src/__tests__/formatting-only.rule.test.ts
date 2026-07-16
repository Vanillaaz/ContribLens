/**
 * Unit tests: FormattingOnlyRule
 */

import { describe, it, expect } from "vitest";
import { FormattingOnlyRule } from "../rules/formatting-only.rule.js";
import { makeFile, makeContext } from "./helpers.js";

describe("FormattingOnlyRule", () => {
  const rule = new FormattingOnlyRule();
  const ctx = makeContext();

  it("has the correct rule ID", () => {
    expect(rule.id).toBe("FORMATTING_ONLY");
  });

  describe("pass-through: no patch available", () => {
    it("returns null when patch is null", () => {
      const file = makeFile({ path: "src/index.ts", patch: null });
      expect(rule.evaluate(file, ctx)).toBeNull();
    });
  });

  describe("pass-through: no changed lines in patch", () => {
    it("returns null when patch has only context lines", () => {
      const patch = "@@ -1,3 +1,3 @@\n unchanged\n still unchanged\n context";
      const file = makeFile({ path: "src/index.ts", patch });
      expect(rule.evaluate(file, ctx)).toBeNull();
    });
  });

  describe("whitespace-only changes", () => {
    it("excludes a file where only blank lines are added", () => {
      const patch = "@@ -1,2 +1,3 @@\n line1\n+\n line2";
      const file = makeFile({ path: "src/index.ts", patch });
      const result = rule.evaluate(file, ctx);

      expect(result?.decision).toBe("excluded");
      expect(result?.matched).toBe(true);
    });

    it("excludes a file where only whitespace lines are changed", () => {
      const patch = "@@ -1,2 +1,2 @@\n- \n+  ";
      const file = makeFile({ path: "src/index.ts", patch });
      const result = rule.evaluate(file, ctx);

      expect(result?.decision).toBe("excluded");
    });

    it("does not exclude when patch contains real content changes", () => {
      const patch = "@@ -1,2 +1,2 @@\n-const x = 1;\n+const x = 2;";
      const file = makeFile({ path: "src/index.ts", patch });
      expect(rule.evaluate(file, ctx)).toBeNull();
    });
  });

  describe("indentation-only changes (normalized content is identical)", () => {
    it("excludes a file where indentation changed but content is the same", () => {
      const patch = [
        "@@ -1,2 +1,2 @@",
        "-  const x = 1;",
        "+    const x = 1;",
      ].join("\n");
      const file = makeFile({ path: "src/index.ts", patch });
      const result = rule.evaluate(file, ctx);

      expect(result?.decision).toBe("excluded");
    });

    it("excludes trailing whitespace removal", () => {
      const patch = [
        "@@ -1,1 +1,1 @@",
        "-const x = 1;   ",
        "+const x = 1;",
      ].join("\n");
      const file = makeFile({ path: "src/index.ts", patch });
      const result = rule.evaluate(file, ctx);

      expect(result?.decision).toBe("excluded");
    });

    it("does NOT exclude when content differs after normalization", () => {
      const patch = [
        "@@ -1,2 +1,2 @@",
        "-const x = 1;",
        "+const y = 1;",
      ].join("\n");
      const file = makeFile({ path: "src/index.ts", patch });
      expect(rule.evaluate(file, ctx)).toBeNull();
    });

    it("does NOT exclude when number of added/removed lines differ", () => {
      // More lines added than removed = real content change
      const patch = [
        "@@ -1,1 +1,2 @@",
        "-const x = 1;",
        "+const x = 1;",
        "+const y = 2;",
      ].join("\n");
      const file = makeFile({ path: "src/index.ts", patch });
      expect(rule.evaluate(file, ctx)).toBeNull();
    });
  });

  describe("mixed changes (formatting + real content)", () => {
    it("does not exclude when patch has both whitespace and content changes", () => {
      const patch = [
        "@@ -1,3 +1,3 @@",
        "-const x = 1;",
        "+const x = 2;", // Real change
        "-   ",           // Whitespace
        "+",
      ].join("\n");
      const file = makeFile({ path: "src/index.ts", patch });
      // Should NOT be caught because allWhitespace is false, and add/remove counts differ
      expect(rule.evaluate(file, ctx)).toBeNull();
    });
  });
});
