import { Hono } from "hono";
import { AnalyticsRequestSchema } from "@ContribLens/api-contracts";
import { isAnalyticsError, toISODateString, type TimeWindow } from "@ContribLens/domain";
import type { AppDependencies } from "../di-container.js";
import { errorHandler } from "../middleware/error-handler.js";

function parseTimeWindow(windowQuery: string | undefined): TimeWindow {
  const now = new Date();
  let years = 1;
  if (windowQuery === "all") {
    years = 20;
  } else if (windowQuery && !isNaN(Number(windowQuery))) {
    years = Math.max(1, Math.min(Number(windowQuery), 5));
  }
  const fromDate = new Date(now);
  fromDate.setFullYear(now.getFullYear() - years);
  return {
    from: toISODateString(fromDate.toISOString()),
    to: toISODateString(now.toISOString()),
  };
}

/**
 * Creates the JSON analytics router.
 * Mounted at /analytics — responds to GET /analytics/:username
 */
export function createJsonRouter(deps: AppDependencies) {
  const router = new Hono();

  router.get("/:login", async (c) => {
    const reqData = AnalyticsRequestSchema.parse({
      login: c.req.param("login"),
      window: c.req.query("window"),
      theme: c.req.query("theme"),
      refresh: c.req.query("refresh"),
    });

    const window = parseTimeWindow(reqData.window);
    const correlationId = (c.get("requestId") as string) || crypto.randomUUID();

    const result = await deps.analyticsEngine.analyze({
      login: reqData.login,
      window,
      correlationId,
    });

    if (isAnalyticsError(result)) {
      return errorHandler(result as any, c);
    }

    return c.json(result);
  });

  return router;
}

/**
 * Creates the SVG router.
 * Mounted at /svg — responds to GET /svg/:username
 */
export function createSvgRouter(deps: AppDependencies) {
  const router = new Hono();

  router.get("/:login", async (c) => {
    const reqData = AnalyticsRequestSchema.parse({
      login: c.req.param("login"),
      window: c.req.query("window"),
      theme: c.req.query("theme"),
      refresh: c.req.query("refresh"),
    });

    const window = parseTimeWindow(reqData.window);
    const correlationId = (c.get("requestId") as string) || crypto.randomUUID();

    const result = await deps.analyticsEngine.analyze({
      login: reqData.login,
      window,
      correlationId,
    });

    if (isAnalyticsError(result)) {
      return errorHandler(result as any, c);
    }

    const svg = deps.svgRenderer.render(result, { theme: reqData.theme });

    c.header("Content-Type", "image/svg+xml");
    c.header("Cache-Control", "public, max-age=300");
    return c.body(svg);
  });

  return router;
}
