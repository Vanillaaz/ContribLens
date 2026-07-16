import type { AnalyticsSnapshot } from "@ContribLens/domain";
import type { Theme } from "@ContribLens/themes";
import { renderCombinedCard } from "./combined.card.js";

// For now, delegate to combined. In the future this could be specialized.
export function renderLanguageBreakdownCard(snapshot: AnalyticsSnapshot, theme: Theme, width: number): string {
  return renderCombinedCard(snapshot, theme, width);
}
