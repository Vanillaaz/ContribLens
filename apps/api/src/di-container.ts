/**
 * Dependency Injection Container.
 *
 * Wires up the concrete implementations for the analytics engine.
 * Environment variables are read ONLY here and injected as config.
 */

import { AnalyticsEngine, AnalyticsCache } from "@ContribLens/analytics-engine";
import { GitHubClient, createDefaultClientConfig } from "@ContribLens/github-client";
import { SvgRenderer } from "@ContribLens/svg-renderer";

export interface AppDependencies {
  readonly analyticsEngine: AnalyticsEngine;
  readonly svgRenderer: SvgRenderer;
}

/**
 * Initializes the application dependencies.
 *
 * @param env - Environment variables dictionary.
 */
export function createDependencies(env: Record<string, string | undefined>): AppDependencies {
  const token = env["GITHUB_TOKEN"] || null;
  const userAgent = env["GITHUB_USER_AGENT"] || "ContribLens/1.0";

  const clientConfig = createDefaultClientConfig({
    token,
    userAgent,
    // Note: Concurrency and limits can be tuned here based on env vars
  });

  const client = new GitHubClient(clientConfig);

  const cache = new AnalyticsCache({
    maxSize: 1000,
    ttlMs: 5 * 60 * 1000, // 5 minutes
  });

  const analyticsEngine = new AnalyticsEngine(client, {
    cache,
    freshUntilTtlMs: 5 * 60 * 1000,
  });

  const svgRenderer = new SvgRenderer();

  return {
    analyticsEngine,
    svgRenderer,
  };
}
