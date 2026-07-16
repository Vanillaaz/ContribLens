import { describe, it, expect, vi } from "vitest";
import { LinguistLanguageClassifier } from "../language-classifier.js";

vi.mock("linguist-js", () => {
  return {
    default: {
      analyse: vi.fn((path: string) => {
        if (path === "src/index.ts") {
          return { languages: { results: { TypeScript: { type: "programming" } } } };
        }
        if (path === "src/app.js") {
          return { languages: { results: { JavaScript: { type: "programming" } } } };
        }
        if (path === "main.go") {
          return { languages: { results: { Go: { type: "programming" } } } };
        }
        if (path === "README.md") {
          return { languages: { results: { Markdown: { type: "prose" } } } };
        }
        return { languages: { results: {} } };
      }),
    },
  };
});

describe("LinguistLanguageClassifier", () => {
  const classifier = new LinguistLanguageClassifier();

  describe("without warmUp (synchronous fallback)", () => {
    it("uses extension fallback for known config/markup files", () => {
      const json = classifier.classify("package.json");
      expect(json.language).toBeNull();
      expect(json.category).toBe("config");

      const md = classifier.classify("README.md");
      expect(md.language).toBeNull();
      expect(md.category).toBe("markup");
    });

    it("returns unknown for unmapped extensions before warmUp", () => {
      const ts = classifier.classify("src/index.ts");
      expect(ts.language).toBeNull();
      expect(ts.category).toBe("unknown");
    });
  });

  describe("with warmUp (linguist-js loaded)", () => {
    it("correctly identifies common languages", async () => {
      await classifier.warmUp();

      const ts = classifier.classify("src/index.ts");
      expect(ts.language).toBe("TypeScript");
      expect(ts.category).toBe("source");

      const js = classifier.classify("src/app.js");
      expect(js.language).toBe("JavaScript");
      expect(js.category).toBe("source");

      const go = classifier.classify("main.go");
      expect(go.language).toBe("Go");
      expect(go.category).toBe("source");
    });

    it("identifies markup/documentation languages", async () => {
      await classifier.warmUp();

      const md = classifier.classify("README.md");
      expect(md.language).toBe("Markdown");
      expect(md.category).toBe("markup");
    });

    it("falls back to extension logic for completely unknown files", async () => {
      await classifier.warmUp();
      const unknown = classifier.classify("some-weird-file.xyz");
      
      expect(unknown.language).toBeNull();
      expect(unknown.category).toBe("unknown");
    });
  });
});
