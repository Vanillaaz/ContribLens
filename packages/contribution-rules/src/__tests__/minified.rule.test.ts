/**
 * Unit tests: MinifiedFileRule
 */

import { describe, it, expect } from "vitest";
import { MinifiedFileRule } from "../rules/minified.rule.js";
import { makeFile, makeContext } from "./helpers.js";

describe("MinifiedFileRule", () => {
  const rule = new MinifiedFileRule();
  const ctx = makeContext();

  it("has the correct rule ID", () => {
    expect(rule.id).toBe("MINIFIED_FILE");
  });

  describe("minified filename patterns", () => {
    const minifiedFiles = [
      "app.min.js",
      "app.min.mjs",
      "app.min.cjs",
      "app.min.ts",
      "styles.min.css",
      "vendor.bundle.js",
      "vendor.bundle.cjs",
      "vendor.bundle.mjs",
      "vendor.chunk.js",
      "vendor.prod.js",
      // Bundler numeric patterns
      "file-abc123.min.js",
      "file-8f3a2.min.js",
    ];

    for (const filename of minifiedFiles) {
      it(`excludes "${filename}"`, () => {
        const result = rule.evaluate(makeFile({ path: filename }), ctx);

        expect(result).not.toBeNull();
        expect(result!.decision).toBe("excluded");
        expect(result!.matched).toBe(true);
        expect(result!.ruleId).toBe("MINIFIED_FILE");
      });
    }

    it("is case-insensitive", () => {
      expect(rule.evaluate(makeFile({ path: "app.MIN.JS" }), ctx)?.decision).toBe("excluded");
      expect(rule.evaluate(makeFile({ path: "STYLES.MIN.CSS" }), ctx)?.decision).toBe("excluded");
    });

    it("matches minified files in subdirectories", () => {
      expect(
        rule.evaluate(makeFile({ path: "public/js/app.min.js" }), ctx)?.decision,
      ).toBe("excluded");
    });
  });

  describe("content heuristic: suspiciously long lines in JS/CSS", () => {
    function makeLongLine(length: number): string {
      return "+" + "x".repeat(length);
    }

    it("excludes a .js file with lines over 500 chars", () => {
      const patch = `@@ -1,1 +1,1 @@\n${makeLongLine(501)}`;
      const file = makeFile({ path: "bundle.js", patch });
      const result = rule.evaluate(file, ctx);

      expect(result?.decision).toBe("excluded");
    });

    it("excludes a .mjs file with lines over 500 chars", () => {
      const patch = `@@ -1,1 +1,1 @@\n${makeLongLine(501)}`;
      expect(rule.evaluate(makeFile({ path: "bundle.mjs", patch }), ctx)?.decision).toBe("excluded");
    });

    it("excludes a .cjs file with lines over 500 chars", () => {
      const patch = `@@ -1,1 +1,1 @@\n${makeLongLine(501)}`;
      expect(rule.evaluate(makeFile({ path: "bundle.cjs", patch }), ctx)?.decision).toBe("excluded");
    });

    it("excludes a .css file with lines over 500 chars", () => {
      const patch = `@@ -1,1 +1,1 @@\n${makeLongLine(501)}`;
      expect(rule.evaluate(makeFile({ path: "styles.css", patch }), ctx)?.decision).toBe("excluded");
    });

    it("does NOT trigger for .ts files with long lines (only JS/CSS)", () => {
      const patch = `@@ -1,1 +1,1 @@\n${makeLongLine(501)}`;
      const file = makeFile({ path: "source.ts", patch });
      // TypeScript source with a long line is not considered minified by this heuristic
      expect(rule.evaluate(file, ctx)).toBeNull();
    });

    it("does NOT trigger for lines at or below the 500-char threshold", () => {
      // makeLongLine(n) produces "+" + "x".repeat(n), so the line is n+1 chars total.
      // The threshold is MINIFIED_LINE_LENGTH_THRESHOLD = 500 (strictly > 500).
      // A line of 500 chars total (makeLongLine(499)) should NOT trigger.
      const patch = `@@ -1,1 +1,1 @@\n${makeLongLine(499)}`;
      const file = makeFile({ path: "bundle.js", patch });
      expect(rule.evaluate(file, ctx)).toBeNull();
    });

    it("DOES trigger for lines just above the 500-char threshold (501 chars)", () => {
      // makeLongLine(500) = "+" + "x".repeat(500) = 501 chars total → triggers
      const patch = `@@ -1,1 +1,1 @@\n${makeLongLine(500)}`;
      const file = makeFile({ path: "bundle.js", patch });
      expect(rule.evaluate(file, ctx)?.decision).toBe("excluded");
    });

    it("does NOT trigger when patch is null", () => {
      const file = makeFile({ path: "bundle.js", patch: null });
      expect(rule.evaluate(file, ctx)).toBeNull();
    });
  });

  describe("non-minified files pass through", () => {
    it("does not exclude normal .js source files", () => {
      const patch = "@@ -1,3 +1,3 @@\n+const x = 1;\n+const y = 2;\n+export { x, y };";
      expect(rule.evaluate(makeFile({ path: "src/index.js", patch }), ctx)).toBeNull();
    });

    it("does not exclude TypeScript files", () => {
      expect(rule.evaluate(makeFile({ path: "src/component.ts" }), ctx)).toBeNull();
    });

    it("does not exclude CSS files with normal content", () => {
      const patch = "@@ -1,2 +1,2 @@\n-.button { color: red; }\n+.button { color: blue; }";
      expect(rule.evaluate(makeFile({ path: "styles.css", patch }), ctx)).toBeNull();
    });
  });
});
