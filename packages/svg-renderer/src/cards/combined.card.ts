import type { AnalyticsSnapshot } from "@ContribLens/domain";
import type { Theme } from "@ContribLens/themes";
import { renderConfidenceBadge } from "../components/confidence-badge.js";
import { renderLanguageBar } from "../components/language-bar.js";
import { renderPartialDataNotice } from "../components/partial-data-notice.js";
import { escapeXml } from "../utils/escape.js";

function activityLabel(type: string): string {
  const labels: Record<string, string> = {
    commit: "Commits",
    pull_request: "Pull Requests",
    pull_request_merged: "PRs Merged",
    review: "Reviews",
    issue: "Issues",
    discussion: "Discussions",
  };
  return labels[type] ?? type;
}

export function renderCombinedCard(snapshot: AnalyticsSnapshot, theme: Theme, width: number): string {
  const height = 200;
  const { colors, typography, spacing } = theme;
  const confidence = snapshot.confidence.overall;
  const isPartial = confidence !== "high";

  const topLanguages = (snapshot.languageBreakdown?.languages ?? [])
    .filter((l: { category: string }) => l.category === "source")
    .slice(0, 5);

  const totalQualified = snapshot.languageBreakdown?.totalQualifiedVolume ?? 0;

  const activityLines: string[] = [];
  let y = spacing.lg + spacing.md;

  for (const total of snapshot.activity.totals) {
    if (total.count === null) continue;
    const label = activityLabel(total.type as string);
    activityLines.push(
      `<text x="${spacing.lg.toString()}" y="${y.toString()}" ` +
        `font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" ` +
        `fill="${colors.textMuted}">${escapeXml(label)}:</text>`,
      `<text x="${(width / 2 - spacing.lg).toString()}" y="${y.toString()}" ` +
        `font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" ` +
        `font-weight="${typography.weightBold.toString()}" fill="${colors.textPrimary}" ` +
        `text-anchor="end">${total.count.toLocaleString()}</text>`,
    );
    y += typography.sizeBase + spacing.xs;
  }

  let barY = spacing.lg + spacing.md;
  const barLines: string[] = [];
  const barX = width / 2 + spacing.md;
  const barWidth = width / 2 - spacing.lg - spacing.md;

  topLanguages.forEach((lang, i) => {
    const pct = lang.percentageOfQualified ?? 0;
    const color = theme.colors.chartPalette[i] ?? colors.accent;
    barLines.push(renderLanguageBar({
      x: barX,
      y: barY,
      width: barWidth,
      language: lang.language,
      percentage: pct,
      color,
      theme,
    }));
    barY += typography.sizeSm + spacing.sm + 6;
  });

  const titleY = spacing.md + typography.sizeLg;

  return `<svg width="${width.toString()}" height="${height.toString()}" viewBox="0 0 ${width.toString()} ${height.toString()}"
  xmlns="http://www.w3.org/2000/svg" role="img"
  aria-labelledby="cs-title cs-desc">
  <title id="cs-title">GitHub Contribution Analytics — ${escapeXml(snapshot.developer.login)}</title>
  <desc id="cs-desc">Personal contribution analytics for ${escapeXml(snapshot.developer.login)} ` +
    `covering ${escapeXml(snapshot.effectiveWindow.from)} to ${escapeXml(snapshot.effectiveWindow.to)}. ` +
    `Confidence: ${confidence}.${isPartial ? " Partial data — see JSON API for details." : ""}</desc>

  <!-- Background -->
  <rect width="${width.toString()}" height="${height.toString()}" rx="10" fill="${colors.background}" stroke="${colors.border}" stroke-width="1"/>

  <!-- Title -->
  <text id="cs-title-text" x="${spacing.lg.toString()}" y="${titleY.toString()}"
    font-family="${typography.fontFamily}" font-size="${typography.sizeLg.toString()}"
    font-weight="${typography.weightBold.toString()}" fill="${colors.textPrimary}">
    ${escapeXml(snapshot.developer.displayName ?? snapshot.developer.login)}
  </text>

  <!-- Window -->
  <text x="${spacing.lg.toString()}" y="${(titleY + typography.sizeBase + spacing.xs).toString()}"
    font-family="${typography.fontFamily}" font-size="${typography.sizeSm.toString()}"
    fill="${colors.textMuted}">
    ${escapeXml(snapshot.effectiveWindow.from.slice(0, 10))} – ${escapeXml(snapshot.effectiveWindow.to.slice(0, 10))}
  </text>

  <!-- Confidence badge -->
  ${renderConfidenceBadge({ level: confidence, x: width - spacing.lg, y: titleY, theme })}

  <!-- Divider -->
  <line x1="${spacing.lg.toString()}" y1="${(spacing.lg + spacing.md + typography.sizeLg + typography.sizeBase + spacing.sm).toString()}"
    x2="${(width - spacing.lg).toString()}" y2="${(spacing.lg + spacing.md + typography.sizeLg + typography.sizeBase + spacing.sm).toString()}"
    stroke="${colors.border}" stroke-width="1"/>

  <!-- Activity totals -->
  ${activityLines.join("\n  ")}

  <!-- Language bars -->
  ${totalQualified > 0 ? barLines.join("\n  ") : `<text x="${(barX + barWidth / 2).toString()}" y="${(height / 2).toString()}" font-family="${typography.fontFamily}" font-size="${typography.sizeSm.toString()}" fill="${colors.textMuted}" text-anchor="middle">No language data available</text>`}

  ${isPartial ? renderPartialDataNotice({ x: width / 2, y: height - spacing.sm, theme }) : ""}
</svg>`;
}
