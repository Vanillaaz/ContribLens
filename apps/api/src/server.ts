/**
 * Hono server application.
 *
 * Defines all HTTP endpoints, validates query parameters, and maps
 * domain errors to standard HTTP responses.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";

import type { AppDependencies } from "./di-container.js";
import { rateLimit } from "./middleware/rate-limit.js";
import { errorHandler } from "./middleware/error-handler.js";
import { createJsonRouter, createSvgRouter } from "./routes/analytics.route.js";

/** Creates and configures the Hono application. */
export function createServer(deps: AppDependencies): Hono {
  const app = new Hono();

  // Global Error Handler
  app.onError(errorHandler);

  // Middleware
  app.use("*", requestId());
  app.use("*", logger());
  app.use("*", cors({ origin: "*" })); // Public API

  // Rate Limiting (100 reqs per 15 minutes per IP)
  app.use("/analytics/*", rateLimit(100, 15 * 60 * 1000));
  app.use("/svg/*", rateLimit(100, 15 * 60 * 1000));

  // Root / Health
  app.get("/", (c) => c.text("ContribStats API is running. Try /analytics/:username or /svg/:username"));
  app.get("/health", (c) => c.json({ status: "ok" }));

  // Analytics routes: /analytics/:login (JSON) and /svg/:login (SVG)
  app.route("/analytics", createJsonRouter(deps));
  app.route("/svg", createSvgRouter(deps));

  return app;
}
