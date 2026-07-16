import { describe, it, expect } from "vitest";
import { SvgRenderer } from "../svg-renderer.js";

import type { AnalyticsSnapshot } from "@ContribLens/domain";

describe("SvgRenderer", () => {
  const dummySnapshot: AnalyticsSnapshot = {
    developer: { login: "testuser", displayName: "Test User" },
    effectiveWindow: { from: "2023-01-01T00:00:00Z", to: "2023-12-31T23:59:59Z" },
    activity: { totals: [{ type: "commit", count: 42 }] },
    languageBreakdown: {
      languages: [
        { language: "TypeScript", volume: 1000, percentageOfQualified: 0.8, category: "source" },
        { language: "HTML", volume: 250, percentageOfQualified: 0.2, category: "source" }
      ],
      totalQualifiedVolume: 1250,
      totalExcludedVolume: 0
    },
    confidence: {
      overall: "high",
      dimensions: []
    },
    metricVersion: "1.0.0"
  } as unknown as AnalyticsSnapshot;

  it("renders a combined card by default", () => {
    const renderer = new SvgRenderer();
    const svg = renderer.render(dummySnapshot);
    
    expect(svg).toContain("<svg");
    expect(svg).toContain("Test User");
    expect(svg).toContain("TypeScript");
    expect(svg).toContain("80%");
    expect(svg).toContain("Commits:");
    expect(svg).toContain("42");
    expect(svg).toContain("High"); // Confidence badge
  });

  it("renders partial data notice if confidence is not high", () => {
    const renderer = new SvgRenderer();
    const partialSnapshot: AnalyticsSnapshot = {
      ...dummySnapshot,
      confidence: {
        overall: "partial",
        dimensions: []
      }
    } as unknown as AnalyticsSnapshot;
    
    const svg = renderer.render(partialSnapshot);
    expect(svg).toContain("Partial data — some contributions could not be retrieved");
    expect(svg).toContain("Partial"); // Badge
  });

  it("renders no language data message if totalQualifiedVolume is 0", () => {
    const renderer = new SvgRenderer();
    const noLangSnapshot: AnalyticsSnapshot = {
      ...dummySnapshot,
      languageBreakdown: {
        languages: [],
        totalQualifiedVolume: 0,
        totalExcludedVolume: 100
      }
    } as unknown as AnalyticsSnapshot;
    
    const svg = renderer.render(noLangSnapshot);
    expect(svg).toContain("No language data available");
    expect(svg).not.toContain("TypeScript");
  });
});
