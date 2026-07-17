import type { AnalyticsSnapshot } from "@ContribLens/domain";
import type { Theme } from "@ContribLens/themes";
import { renderConfidenceBadge } from "../components/confidence-badge.js";
import { renderPartialDataNotice } from "../components/partial-data-notice.js";
import { escapeXml } from "../utils/escape.js";
import { getIconForType } from "../utils/icons.js";

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

export function renderContributionSummaryCard(snapshot: AnalyticsSnapshot, theme: Theme, width: number): string {
  const { colors, typography, spacing } = theme;
  const confidence = snapshot.confidence.overall;
  const isPartial = confidence !== "high";

  const titleY = spacing.xl + typography.sizeLg;
  const windowY = titleY + typography.sizeBase + spacing.xs;
  const dividerY = windowY + spacing.md;

  const activityLines: string[] = [];
  let y = dividerY + spacing.lg;

  // Render basic stats
  for (const total of snapshot.activity.totals) {
    if (total.count === null) continue;
    
    const label = activityLabel(total.type as string);
    const iconType = total.type as string === 'pull_request_merged' ? 'pull_request' : total.type as string;
    const iconSvg = getIconForType(iconType, colors.textMuted);
    
    activityLines.push(
      `<g transform="translate(${spacing.lg.toString()}, ${(y - 11).toString()})">${iconSvg}</g>`,
      `<text x="${(spacing.lg + 24).toString()}" y="${y.toString()}" ` +
        `font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" ` +
        `fill="${colors.textPrimary}">${escapeXml(label)}:</text>`,
      `<text x="${(width - spacing.lg).toString()}" y="${y.toString()}" ` +
        `font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" ` +
        `font-weight="${typography.weightBold.toString()}" fill="${colors.textPrimary}" ` +
        `text-anchor="end">${total.count.toLocaleString()}</text>`,
    );
    y += typography.sizeBase + spacing.xs + 8;
  }

  if (snapshot.activity.discoveredRepositoryCount !== undefined) {
    const label = "Contributed to";
    const iconSvg = getIconForType("repo", colors.textMuted);
    activityLines.push(
      `<g transform="translate(${spacing.lg.toString()}, ${(y - 11).toString()})">${iconSvg}</g>`,
      `<text x="${(spacing.lg + 24).toString()}" y="${y.toString()}" ` +
        `font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" ` +
        `fill="${colors.textPrimary}">${escapeXml(label)} (last year):</text>`,
      `<text x="${(width - spacing.lg).toString()}" y="${y.toString()}" ` +
        `font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" ` +
        `font-weight="${typography.weightBold.toString()}" fill="${colors.textPrimary}" ` +
        `text-anchor="end">${snapshot.activity.discoveredRepositoryCount.toLocaleString()}</text>`,
    );
    y += typography.sizeBase + spacing.xs + 8;
  }

  if (snapshot.activity.totalViews !== undefined && snapshot.activity.totalViews !== null) {
    const iconSvg = getIconForType("views", colors.textMuted);
    activityLines.push(
      `<g transform="translate(${spacing.lg.toString()}, ${(y - 11).toString()})">${iconSvg}</g>`,
      `<text x="${(spacing.lg + 24).toString()}" y="${y.toString()}" ` +
        `font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" ` +
        `fill="${colors.textPrimary}">Total Views:</text>`,
      `<text x="${(width - spacing.lg).toString()}" y="${y.toString()}" ` +
        `font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" ` +
        `font-weight="${typography.weightBold.toString()}" fill="${colors.textPrimary}" ` +
        `text-anchor="end">${snapshot.activity.totalViews.toLocaleString()}</text>`,
    );
    y += typography.sizeBase + spacing.xs + 8;
  }

  if (snapshot.activity.totalClones !== undefined && snapshot.activity.totalClones !== null) {
    const iconSvg = getIconForType("clones", colors.textMuted);
    activityLines.push(
      `<g transform="translate(${spacing.lg.toString()}, ${(y - 11).toString()})">${iconSvg}</g>`,
      `<text x="${(spacing.lg + 24).toString()}" y="${y.toString()}" ` +
        `font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" ` +
        `fill="${colors.textPrimary}">Total Clones:</text>`,
      `<text x="${(width - spacing.lg).toString()}" y="${y.toString()}" ` +
        `font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" ` +
        `font-weight="${typography.weightBold.toString()}" fill="${colors.textPrimary}" ` +
        `text-anchor="end">${snapshot.activity.totalClones.toLocaleString()}</text>`,
    );
    y += typography.sizeBase + spacing.xs + 8;
  }

  const baseHeight = y + spacing.md;
  const height = isPartial ? baseHeight + spacing.lg : baseHeight;

  return `<svg width="${width.toString()}" height="${height.toString()}" viewBox="0 0 ${width.toString()} ${height.toString()}"
  xmlns="http://www.w3.org/2000/svg" role="img"
  aria-labelledby="cs-title cs-desc">
  <title id="cs-title">GitHub Stats — ${escapeXml(snapshot.developer.login)}</title>
  <desc id="cs-desc">GitHub Stats for ${escapeXml(snapshot.developer.login)}</desc>

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
  <text id="cs-title-text" x="${(width / 2).toString()}" y="${titleY.toString()}"
    font-family="${typography.fontFamily}" font-size="${typography.sizeLg.toString()}"
    font-weight="${typography.weightBold.toString()}" fill="${colors.textPrimary}" text-anchor="middle">
    ${escapeXml(snapshot.developer.displayName ?? snapshot.developer.login)}'s GitHub Stats
  </text>

  <!-- Confidence badge (right) -->
  ${renderConfidenceBadge({ level: confidence, x: width - spacing.lg, y: titleY, theme })}

  <!-- Divider -->
  <line x1="${spacing.lg.toString()}" y1="${dividerY.toString()}"
    x2="${(width - spacing.lg).toString()}" y2="${dividerY.toString()}"
    stroke="${colors.border}" stroke-width="1"/>

  <!-- Activity totals -->
  ${activityLines.join("\n  ")}

  ${isPartial ? renderPartialDataNotice({ x: width / 2, y: height - spacing.sm, theme }) : ""}
</svg>`;
}
