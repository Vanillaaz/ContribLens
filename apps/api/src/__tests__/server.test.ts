import { describe, it, expect, vi } from "vitest";
import { createServer } from "../server.js";
import type { AnalyticsSnapshot, AnalyticsError } from "@ContribLens/domain";

describe("API Server", () => {
  const mockSnapshot: AnalyticsSnapshot = {
    metricVersion: "1.0",
    rulesetVersion: "1.0",
    classifierVersion: "1.0",
    developer: { login: "test-user", nodeId: "U_1", displayName: "Test", contributionYears: [2024] },
    requestedWindow: { from: "2023-01-01T00:00:00Z", to: "2023-12-31T23:59:59Z" },
    effectiveWindow: { from: "2023-01-01T00:00:00Z", to: "2023-12-31T23:59:59Z" },
    activity: { totals: [], repositoryDiscoveryTruncated: false, discoveredRepositoryCount: 0 },
    repositorySummaries: [],
    qualifiedChanges: null,
    languageBreakdown: null,
    confidence: { overall: "high", dimensions: [], allReasonCodes: [], summary: "" },
    coverage: { repositoriesDiscovered: 0, repositoriesProcessed: 0, partialErrors: false, paginationIncompleteCount: 0, cacheHitRate: 0 },
    generatedAt: "2024-01-01T00:00:00Z",
    freshUntil: "2024-01-01T00:05:00Z",
  } as unknown as AnalyticsSnapshot;

  const mockAnalyticsEngine = {
    analyze: vi.fn().mockResolvedValue(mockSnapshot),
  };

  const mockSvgRenderer = {
    render: vi.fn().mockReturnValue("<svg></svg>"),
  };

  const app = createServer({
    analyticsEngine: mockAnalyticsEngine as any,
    svgRenderer: mockSvgRenderer as any,
  });

  describe("GET /analytics/:username", () => {
    it("should return 200 with the analytics snapshot", async () => {
      const res = await app.request("/analytics/test-user");
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.developer.login).toBe("test-user");
      expect(data.confidence).toBeDefined();
    });

    it("should return 404 when engine returns USER_NOT_FOUND", async () => {
      mockAnalyticsEngine.analyze.mockResolvedValueOnce({
        type: "AnalyticsError",
        code: "USER_NOT_FOUND",
        message: "User not found",
        correlationId: "test-corr-id",
        retryable: false,
        retryAfter: null,
        hasPartialResult: false
      } as AnalyticsError);

      const res = await app.request("/analytics/ghost-user");
      expect(res.status).toBe(404);
      const data = await res.json() as any;
      expect(data.title).toBe("Analytics Error");
    });
  });

  describe("GET /svg/:username", () => {
    it("should return SVG with correct headers", async () => {
      const res = await app.request("/svg/test-user");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("image/svg+xml");
      expect(res.headers.get("Cache-Control")).toBe("public, max-age=300");
      const body = await res.text();
      expect(body).toBe("<svg></svg>");
    });
  });

  describe("GET /health", () => {
    it("should return ok", async () => {
      const res = await app.request("/health");
      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.status).toBe("ok");
    });
  });
});
