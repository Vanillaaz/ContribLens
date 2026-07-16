/**
 * Unit tests: GeneratedPathRule
 */

import { describe, it, expect } from "vitest";
import { GeneratedPathRule } from "../rules/generated-path.rule.js";
import { makeFile, makeContext } from "./helpers.js";

describe("GeneratedPathRule", () => {
  const rule = new GeneratedPathRule();
  const ctx = makeContext();

  it("has the correct rule ID", () => {
    expect(rule.id).toBe("GENERATED_PATH");
  });

  describe("generated directory prefixes", () => {
    const generatedPaths = [
      "dist/index.js",
      "dist/cjs/index.js",
      "build/output.js",
      "out/bundle.js",
      "output/app.js",
      "coverage/lcov.info",
      ".next/static/chunks/app.js",
      ".nuxt/dist/server/index.mjs",
      ".output/server/index.mjs",
      ".svelte-kit/output/server/index.js",
      ".astro/types.d.ts",
      "__generated__/schema.ts",
      "_generated/client.ts",
      "generated/api.ts",
      "auto-generated/types.ts",
      ".generated/graphql.ts",
      "gen/proto.js",
      "codegen/schema.ts",
      ".turbo/cache.json",
      ".vercel/output/functions/index.js",
      "storybook-static/index.html",
      "playwright-report/index.html",
      "test-results/results.json",
    ];

    for (const path of generatedPaths) {
      it(`excludes "${path}"`, () => {
        const result = rule.evaluate(makeFile({ path }), ctx);

        expect(result).not.toBeNull();
        expect(result!.decision).toBe("excluded");
        expect(result!.matched).toBe(true);
        expect(result!.ruleId).toBe("GENERATED_PATH");
      });
    }

    it("excludes a generated directory nested deeper in the path", () => {
      // e.g. packages/foo/dist/index.js
      const result = rule.evaluate(makeFile({ path: "packages/foo/dist/index.js" }), ctx);
      expect(result?.decision).toBe("excluded");
    });

    it("handles paths with a leading slash", () => {
      const result = rule.evaluate(makeFile({ path: "/dist/index.js" }), ctx);
      expect(result?.decision).toBe("excluded");
    });
  });

  describe("generated file extensions", () => {
    it("excludes source map files", () => {
      expect(rule.evaluate(makeFile({ path: "src/index.js.map" }), ctx)?.decision).toBe("excluded");
    });

    it("excludes .bundle.js files regardless of directory", () => {
      expect(rule.evaluate(makeFile({ path: "public/app.bundle.js" }), ctx)?.decision).toBe("excluded");
    });

    it("excludes .chunk.js files", () => {
      expect(rule.evaluate(makeFile({ path: "public/vendor.chunk.js" }), ctx)?.decision).toBe("excluded");
    });

    it("excludes .min.js files (also caught by MinifiedFileRule)", () => {
      expect(rule.evaluate(makeFile({ path: "public/app.min.js" }), ctx)?.decision).toBe("excluded");
    });
  });

  describe("non-generated files pass through", () => {
    it("does not exclude a source file in src/", () => {
      expect(rule.evaluate(makeFile({ path: "src/index.ts" }), ctx)).toBeNull();
    });

    it("does not exclude a file in a directory that contains 'dist' as substring but not prefix", () => {
      // e.g. "distribution/policy.md" should NOT be caught
      // Note: the rule uses startsWith or includes("/${prefix}") logic
      // so "distribution/" should not match "dist/"
      expect(rule.evaluate(makeFile({ path: "distribution/policy.md" }), ctx)).toBeNull();
    });

    it("does not exclude package.json", () => {
      expect(rule.evaluate(makeFile({ path: "package.json" }), ctx)).toBeNull();
    });

    it("does not exclude README.md", () => {
      expect(rule.evaluate(makeFile({ path: "README.md" }), ctx)).toBeNull();
    });

    it("does not exclude a vitest config file", () => {
      expect(rule.evaluate(makeFile({ path: "vitest.config.ts" }), ctx)).toBeNull();
    });
  });
});
