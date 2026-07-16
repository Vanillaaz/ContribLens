/**
 * Unit tests: LockFileRule
 */

import { describe, it, expect } from "vitest";
import { LockFileRule } from "../rules/lock-file.rule.js";
import { makeFile, makeContext } from "./helpers.js";

describe("LockFileRule", () => {
  const rule = new LockFileRule();
  const ctx = makeContext();

  it("has the correct rule ID", () => {
    expect(rule.id).toBe("LOCK_FILE");
  });

  describe("exact filename matches", () => {
    const lockFiles = [
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      "npm-shrinkwrap.json",
      "poetry.lock",
      "Pipfile.lock",
      "Gemfile.lock",
      "Cargo.lock",
      "composer.lock",
      "mix.lock",
      "go.sum",
      "flake.lock",
      "pdm.lock",
      "uv.lock",
      "bun.lockb",
      "pubspec.lock",
      "Podfile.lock",
      "Package.resolved",
    ];

    for (const name of lockFiles) {
      it(`excludes "${name}" at root level`, () => {
        const file = makeFile({ path: name });
        const result = rule.evaluate(file, ctx);

        expect(result).not.toBeNull();
        expect(result!.decision).toBe("excluded");
        expect(result!.matched).toBe(true);
        expect(result!.ruleId).toBe("LOCK_FILE");
      });

      it(`excludes "${name}" in a subdirectory`, () => {
        const file = makeFile({ path: `backend/${name}` });
        const result = rule.evaluate(file, ctx);

        expect(result).not.toBeNull();
        expect(result!.decision).toBe("excluded");
      });
    }
  });

  describe("suffix pattern matches", () => {
    it("excludes any *.lock file", () => {
      const file = makeFile({ path: "custom.lock" });
      const result = rule.evaluate(file, ctx);

      expect(result?.decision).toBe("excluded");
    });

    it("excludes *.lock.json files", () => {
      const file = makeFile({ path: "something.lock.json" });
      const result = rule.evaluate(file, ctx);

      expect(result?.decision).toBe("excluded");
    });

    it("excludes *-lock.json files", () => {
      const file = makeFile({ path: "my-lock.json" });
      const result = rule.evaluate(file, ctx);

      expect(result?.decision).toBe("excluded");
    });
  });

  describe("non-lock files pass through", () => {
    it("does not exclude a regular source file", () => {
      expect(rule.evaluate(makeFile({ path: "src/index.ts" }), ctx)).toBeNull();
    });

    it("does not exclude package.json", () => {
      expect(rule.evaluate(makeFile({ path: "package.json" }), ctx)).toBeNull();
    });

    it("does not exclude a file with 'lock' in its name that isn't a lock file", () => {
      expect(rule.evaluate(makeFile({ path: "src/deadlock.ts" }), ctx)).toBeNull();
      expect(rule.evaluate(makeFile({ path: "src/lock-manager.ts" }), ctx)).toBeNull();
    });

    it("does not exclude README.md", () => {
      expect(rule.evaluate(makeFile({ path: "README.md" }), ctx)).toBeNull();
    });
  });
});
