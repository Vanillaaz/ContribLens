/**
 * Unit tests: DocumentationRule
 */

import { describe, it, expect } from "vitest";
import { DocumentationRule } from "../rules/documentation.rule.js";
import { makeFile, makeContext } from "./helpers.js";

describe("DocumentationRule", () => {
  const rule = new DocumentationRule();
  const ctx = makeContext();

  it("has the correct rule ID", () => {
    expect(rule.id).toBe("DOCUMENTATION");
  });

  describe("documentation file extensions", () => {
    const docFiles = [
      "README.md",
      "CHANGELOG.mdx",
      "docs/guide.rst",
      "notes.txt",
      "docs/guide.adoc",
      "docs/guide.asciidoc",
      "notes.org",
      "wiki/page.wiki",
      "perldoc.pod",
      "rdoc.rdoc",
    ];

    for (const path of docFiles) {
      it(`includes "${path}" as documentation`, () => {
        const result = rule.evaluate(makeFile({ path }), ctx);

        expect(result).not.toBeNull();
        expect(result!.decision).toBe("included");
        expect(result!.matched).toBe(true);
        expect(result!.ruleId).toBe("DOCUMENTATION");
      });
    }

    it("is case-insensitive for extensions", () => {
      expect(rule.evaluate(makeFile({ path: "README.MD" }), ctx)?.decision).toBe("included");
      expect(rule.evaluate(makeFile({ path: "guide.RST" }), ctx)?.decision).toBe("included");
    });
  });

  describe("known documentation filenames", () => {
    const docFilenames = [
      "README",
      "CHANGELOG",
      "CONTRIBUTING",
      "LICENSE",
      "AUTHORS",
      "CODEOWNERS",
      "NOTICE",
      "PATENTS",
      "SECURITY",
      "HISTORY",
    ];

    for (const name of docFilenames) {
      it(`includes "${name}" (no extension)`, () => {
        const result = rule.evaluate(makeFile({ path: name }), ctx);
        expect(result?.decision).toBe("included");
      });

      it(`includes "${name.toLowerCase()}" (lowercase, no extension)`, () => {
        const result = rule.evaluate(makeFile({ path: name.toLowerCase() }), ctx);
        expect(result?.decision).toBe("included");
      });
    }

    it("includes a documentation file in a subdirectory", () => {
      expect(rule.evaluate(makeFile({ path: "docs/CONTRIBUTING" }), ctx)?.decision).toBe("included");
    });
  });

  describe("non-documentation files pass through", () => {
    it("does not classify TypeScript source", () => {
      expect(rule.evaluate(makeFile({ path: "src/index.ts" }), ctx)).toBeNull();
    });

    it("does not classify JavaScript source", () => {
      expect(rule.evaluate(makeFile({ path: "src/app.js" }), ctx)).toBeNull();
    });

    it("does not classify JSON config files", () => {
      expect(rule.evaluate(makeFile({ path: "tsconfig.json" }), ctx)).toBeNull();
    });

    it("does not classify shell scripts", () => {
      expect(rule.evaluate(makeFile({ path: "scripts/deploy.sh" }), ctx)).toBeNull();
    });

    it("does not classify YAML files", () => {
      expect(rule.evaluate(makeFile({ path: ".github/workflows/ci.yml" }), ctx)).toBeNull();
    });

    it("does not classify Python source", () => {
      expect(rule.evaluate(makeFile({ path: "app.py" }), ctx)).toBeNull();
    });
  });
});
