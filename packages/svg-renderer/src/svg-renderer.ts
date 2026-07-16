/**
 * SVG Renderer — the main entry point.
 *
 * Maps an AnalyticsSnapshot to deterministic, accessible SVG markup.
 *
 * The renderer:
 * - Selects metrics from the snapshot
 * - Applies theme tokens
 * - Renders accessible, deterministic SVG
 * - Always shows confidence and partial-data indicators
 * - Has NO GitHub access, NO metric logic, NO raw API types
 */

import type { AnalyticsSnapshot } from "@ContribLens/domain";
import { getTheme } from "@ContribLens/themes";
import { renderCombinedCard } from "./cards/combined.card.js";
import { renderContributionSummaryCard } from "./cards/contribution-summary.card.js";
import { renderLanguageBreakdownCard } from "./cards/language-breakdown.card.js";

export type CardVariant = "contribution-summary" | "language-breakdown" | "combined";

export interface RenderConfig {
  /** Which card layout to render. @default "combined" */
  readonly variant: CardVariant;
  /** Theme name. Falls back to "default-dark" if not found. @default "default-dark" */
  readonly theme: string;
  /** Card width in pixels. @default 495 */
  readonly width: number;
}

const DEFAULT_RENDER_CONFIG: RenderConfig = {
  variant: "combined",
  theme: "default-dark",
  width: 495,
};

export class SvgRenderer {
  render(snapshot: AnalyticsSnapshot, config: Partial<RenderConfig> = {}): string {
    const cfg = { ...DEFAULT_RENDER_CONFIG, ...config };
    const theme = getTheme(cfg.theme);

    switch (cfg.variant) {
      case "contribution-summary":
        return renderContributionSummaryCard(snapshot, theme, cfg.width);
      case "language-breakdown":
        return renderLanguageBreakdownCard(snapshot, theme, cfg.width);
      case "combined":
        return renderCombinedCard(snapshot, theme, cfg.width);
    }
  }
}
