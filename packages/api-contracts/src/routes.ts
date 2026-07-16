/**
 * Shared API route constants and validation schemas.
 *
 * This package is shared between the backend API (apps/api) and
 * any frontend/consumer applications.
 */

export const API_ROUTES = {
  /** Health check endpoint. */
  HEALTH: "/health",
  /** Root endpoint. */
  ROOT: "/",
  /** Analytics SVG endpoint — embed this in a README. */
  ANALYTICS_SVG: "/svg/:login",
  /** Analytics JSON endpoint — full snapshot data. */
  ANALYTICS_JSON: "/analytics/:login",
} as const;

/** Path parameters for analytics endpoints. */
export interface AnalyticsPathParams {
  login: string;
}

/** Query parameters for the SVG endpoint. */
export interface AnalyticsSvgQueryParams {
  /** Theme name (e.g., "default-dark", "default-light"). */
  theme?: string;
  /**
   * Time window in years (e.g., "1" for past year, "all" for all time).
   * Defaults to "1".
   */
  window?: string;
}

/** Query parameters for the JSON endpoint. */
export interface AnalyticsJsonQueryParams {
  /** Time window (e.g., "1", "all"). */
  window?: string;
}
