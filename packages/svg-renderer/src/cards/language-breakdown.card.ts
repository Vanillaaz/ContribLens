import type { AnalyticsSnapshot } from "@ContribLens/domain";
import type { Theme } from "@ContribLens/themes";
import { renderSegmentedLanguageBar, estimateSegmentedBarHeight } from "../components/segmented-language-bar.js";
import { renderPartialDataNotice } from "../components/partial-data-notice.js";
import { escapeXml } from "../utils/escape.js";

export function renderLanguageBreakdownCard(snapshot: AnalyticsSnapshot, theme: Theme, width: number): string {
  const { colors, typography, spacing } = theme;
  const confidence = snapshot.confidence.overall;
  const isPartial = confidence !== "high";

  // Keep ALL languages except "Unknown"
  const validLanguages = (snapshot.languageBreakdown?.languages ?? [])
    .filter((l: { language: string }) => l.language !== "Unknown");

  const totalValidVolume = validLanguages.reduce((sum, lang) => sum + (lang.qualifiedChangeVolume ?? 0), 0);

  const languagesForBar = validLanguages.map((lang, i) => {
    const rescalePercentage = totalValidVolume > 0 ? (lang.qualifiedChangeVolume ?? 0) / totalValidVolume : 0;
    return {
      language: lang.language,
      percentage: rescalePercentage,
      color: theme.colors.chartPalette[i % theme.colors.chartPalette.length] ?? colors.accent,
    };
  });

  const titleY = spacing.xl + typography.sizeLg;
  const dividerY = titleY + spacing.lg;
  const barY = dividerY + spacing.lg;

  const barWidth = width - spacing.lg * 2;

  let segmentedBarSvg = "";
  let barHeightEstimate = 0;

  if (languagesForBar.length > 0) {
    segmentedBarSvg = renderSegmentedLanguageBar({
      x: spacing.lg,
      y: barY,
      width: barWidth,
      languages: languagesForBar,
      theme,
    });
    barHeightEstimate = estimateSegmentedBarHeight(languagesForBar.length, barWidth);
  } else {
    segmentedBarSvg = `<text x="${(width / 2).toString()}" y="${barY.toString()}" font-family="${typography.fontFamily}" font-size="${typography.sizeSm.toString()}" fill="${colors.textMuted}" text-anchor="middle">No language data available</text>`;
    barHeightEstimate = typography.sizeSm;
  }

  const baseHeight = barY + barHeightEstimate + spacing.md;
  const height = isPartial ? baseHeight + spacing.lg : baseHeight;

  return `<svg width="${width.toString()}" height="${height.toString()}" viewBox="0 0 ${width.toString()} ${height.toString()}"
  xmlns="http://www.w3.org/2000/svg" role="img"
  aria-labelledby="lb-title lb-desc">
  <title id="lb-title">Most Used Languages — ${escapeXml(snapshot.developer.login)}</title>
  <desc id="lb-desc">Language breakdown for ${escapeXml(snapshot.developer.login)}</desc>

  <defs>
    <linearGradient id="bg-gradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colors.background}"/>
      <stop offset="100%" stop-color="${colors.backgroundAlt ?? colors.background}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="${theme.isDark ? '0.3' : '0.1'}"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${(width - 2).toString()}" height="${(height - 2).toString()}" x="1" y="1" rx="10" fill="url(#bg-gradient)" stroke="${colors.border}" stroke-width="1" filter="url(#shadow)"/>

  <!-- Title -->
  <text id="lb-title-text" x="${(width / 2).toString()}" y="${titleY.toString()}"
    font-family="${typography.fontFamily}" font-size="${typography.sizeLg.toString()}"
    font-weight="${typography.weightBold.toString()}" fill="${colors.textPrimary}" text-anchor="middle">
    Most Used Languages
  </text>

  <!-- Divider -->
  <line x1="${spacing.lg.toString()}" y1="${dividerY.toString()}"
    x2="${(width - spacing.lg).toString()}" y2="${dividerY.toString()}"
    stroke="${colors.border}" stroke-width="1"/>

  <!-- Segmented Language Bar -->
  ${segmentedBarSvg}

  ${isPartial ? renderPartialDataNotice({ x: width / 2, y: height - spacing.sm, theme }) : ""}
</svg>`;
}
