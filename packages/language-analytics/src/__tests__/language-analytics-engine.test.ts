import { describe, it, expect } from "vitest";
import { LanguageAnalyticsEngine } from "../language-analytics-engine.js";
import type { ILanguageClassifier, ClassificationResult } from "../language-classifier.interface.js";
import type { EvaluatedFile } from "@ContribLens/contribution-rules";


// Mock classifier for testing the engine logic independently of linguist-js
class MockClassifier implements ILanguageClassifier {
  constructor(private readonly mappings: Record<string, ClassificationResult>) {}

  classify(path: string): ClassificationResult {
    return this.mappings[path] ?? { language: null, category: "unknown" };
  }

  async warmUp(): Promise<void> {
    return Promise.resolve();
  }
}

function makeEvaluatedFile(
  path: string,
  finalDecision: "included" | "excluded" | "indeterminate",
  rawAdd: number | null,
  rawDel: number | null,
  qualAdd: number | null,
  qualDel: number | null,
): EvaluatedFile {
  return {
    file: {
      path,
      repositoryId: "repo1" as any,
      pullRequestNodeId: null,
      pullRequestNumber: null,
      commitSha: null,
      previousPath: null,
      status: "modified",
      additions: rawAdd,
      deletions: rawDel,
      patch: null,
      evidenceSource: "commit-detail",
    },
    evaluation: {
      finalDecision,
      matchedRule: null,
      qualifiedAdditions: qualAdd,
      qualifiedDeletions: qualDel,
    },
  };
}

describe("LanguageAnalyticsEngine", () => {
  const classifier = new MockClassifier({
    "src/index.ts": { language: "TypeScript", category: "source" },
    "src/app.js": { language: "JavaScript", category: "source" },
    "docs/readme.md": { language: "Markdown", category: "markup" },
    "config.json": { language: "JSON", category: "config" },
    "unknown.dat": { language: null, category: "unknown" },
  });

  const engine = new LanguageAnalyticsEngine(classifier);

  it("aggregates qualified additions and deletions for included files", () => {
    const files = [
      makeEvaluatedFile("src/index.ts", "included", 10, 5, 10, 5),
      makeEvaluatedFile("src/app.js", "included", 20, 10, 20, 10),
      makeEvaluatedFile("src/index.ts", "included", 5, 0, 5, 0), // Same language
    ];

    const result = engine.analyze(files);

    expect(result.totalQualifiedVolume).toBe(50); // 15+5 (TS) + 30 (JS)
    expect(result.languages).toHaveLength(2);

    const ts = result.languages.find((l) => l.language === "TypeScript");
    expect(ts).toBeDefined();
    expect(ts!.qualifiedAdditions).toBe(15);
    expect(ts!.qualifiedDeletions).toBe(5);
    expect(ts!.qualifiedChangeVolume).toBe(20);
    expect(ts!.percentageOfQualified).toBe(20 / 50);

    const js = result.languages.find((l) => l.language === "JavaScript");
    expect(js).toBeDefined();
    expect(js!.qualifiedAdditions).toBe(20);
    expect(js!.qualifiedDeletions).toBe(10);
    expect(js!.qualifiedChangeVolume).toBe(30);
    expect(js!.percentageOfQualified).toBe(30 / 50);
  });

  it("adds raw volume to totalExcludedVolume for excluded files", () => {
    const files = [
      makeEvaluatedFile("src/index.ts", "excluded", 100, 50, 0, 0), // The rule engine zeros qualified output
    ];

    const result = engine.analyze(files);

    expect(result.totalQualifiedVolume).toBe(0);
    expect(result.totalExcludedVolume).toBe(150);
    expect(result.languages).toHaveLength(1);
    
    const ts = result.languages[0]!;
    expect(ts.language).toBe("TypeScript");
    expect(ts.qualifiedChangeVolume).toBe(0);
    expect(ts.excludedVolume).toBe(150);
  });

  it("adds raw volume to totalIndeterminateVolume for indeterminate files", () => {
    const files = [
      makeEvaluatedFile("src/index.ts", "indeterminate", 20, 10, null, null),
    ];

    const result = engine.analyze(files);

    expect(result.totalQualifiedVolume).toBe(0);
    expect(result.totalIndeterminateVolume).toBe(30);
    expect(result.languages).toHaveLength(1);
    expect(result.languages[0]!.indeterminateVolume).toBe(30);
  });

  it("handles unavailable volume (included but qualified stats are null)", () => {
    // This happens if GitHub doesn't give us additions/deletions, but it's not excluded
    const files = [
      makeEvaluatedFile("src/index.ts", "included", 40, 20, null, null),
    ];

    const result = engine.analyze(files);

    expect(result.totalQualifiedVolume).toBe(0);
    expect(result.totalUnavailableVolume).toBe(60);
    
    // The language is still identified but has 0 qualified volume
    expect(result.languages).toHaveLength(1);
    expect(result.languages[0]!.qualifiedChangeVolume).toBe(0);
  });

  it("handles unclassified files", () => {
    const files = [
      makeEvaluatedFile("unknown.dat", "included", 5, 2, 5, 2),
    ];

    const result = engine.analyze(files);

    expect(result.unclassifiedFileCount).toBe(1);
    expect(result.languages).toHaveLength(1);
    
    const unk = result.languages[0]!;
    expect(unk.language).toBe("Unknown");
    expect(unk.category).toBe("unknown");
    expect(unk.qualifiedChangeVolume).toBe(7);
  });

  it("sorts languages by qualified volume descending", () => {
    const files = [
      makeEvaluatedFile("src/index.ts", "included", 10, 0, 10, 0), // 10
      makeEvaluatedFile("src/app.js", "included", 50, 0, 50, 0), // 50
      makeEvaluatedFile("docs/readme.md", "included", 100, 0, 100, 0), // 100
    ];

    const result = engine.analyze(files);

    expect(result.languages.map((l) => l.language)).toEqual([
      "Markdown",
      "JavaScript",
      "TypeScript",
    ]);
  });
});
