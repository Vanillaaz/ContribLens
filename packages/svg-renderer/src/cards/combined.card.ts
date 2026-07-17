import type { AnalyticsSnapshot } from "@ContribLens/domain";
import type { Theme } from "@ContribLens/themes";
import { renderConfidenceBadge } from "../components/confidence-badge.js";
import { renderSegmentedLanguageBar, estimateSegmentedBarHeight } from "../components/segmented-language-bar.js";
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

export function renderCombinedCard(snapshot: AnalyticsSnapshot, theme: Theme, width: number): string {
  const { colors, typography, spacing } = theme;
  const confidence = snapshot.confidence.overall;
  const isPartial = confidence !== "high";

  // Keep ALL languages except "Unknown" (so config and markup are included too)
  const validLanguages = (snapshot.languageBreakdown?.languages ?? [])
    .filter((l: { language: string }) => l.language !== "Unknown");

  // Calculate the total volume of these languages to rescale percentages to 100%
  const totalValidVolume = validLanguages.reduce((sum, lang) => sum + (lang.qualifiedChangeVolume ?? 0), 0);

  // Map to the format needed by segmented bar
  const languagesForBar = validLanguages.map((lang, i) => {
    // If totalValidVolume is 0, default to 0
    const rescalePercentage = totalValidVolume > 0 ? (lang.qualifiedChangeVolume ?? 0) / totalValidVolume : 0;
    return {
      language: lang.language,
      percentage: rescalePercentage,
      color: theme.colors.chartPalette[i % theme.colors.chartPalette.length] ?? colors.accent,
    };
  });

  const titleY = spacing.xl + typography.sizeLg;
  const windowY = titleY + typography.sizeBase + spacing.xs;
  const dividerY = windowY + spacing.md;

  const barY = dividerY + spacing.lg;
  const barX = width / 2 + spacing.md;
  const barWidth = width / 2 - spacing.lg - spacing.md;

  let segmentedBarSvg = "";
  let barHeightEstimate = 0;

  if (languagesForBar.length > 0) {
    segmentedBarSvg = renderSegmentedLanguageBar({
      x: barX,
      y: barY,
      width: barWidth,
      languages: languagesForBar,
      theme,
    });
    barHeightEstimate = estimateSegmentedBarHeight(languagesForBar.length, barWidth);
  } else {
    segmentedBarSvg = `<text x="${(barX + barWidth / 2).toString()}" y="${barY.toString()}" font-family="${typography.fontFamily}" font-size="${typography.sizeSm.toString()}" fill="${colors.textMuted}" text-anchor="middle">No language data available</text>`;
    barHeightEstimate = typography.sizeSm;
  }

  const activityLines: string[] = [];
  
  // Calculate left column height to vertically center it with the right column
  const leftItemCount = 
    snapshot.activity.totals.filter(t => t.count !== null && t.type !== 'review' && t.type !== 'issue').length +
    (snapshot.activity.discoveredRepositoryCount !== undefined ? 1 : 0) +
    (snapshot.activity.currentStreak !== undefined ? 1 : 0) +
    (snapshot.activity.longestStreak !== undefined ? 1 : 0);
    
  const leftHeight = leftItemCount * (typography.sizeBase + spacing.xs + 4);
  const leftOffsetY = Math.max(0, (barHeightEstimate - leftHeight) / 2);
  let y = dividerY + spacing.lg + leftOffsetY;

  for (const total of snapshot.activity.totals) {
    if (total.count === null) continue;
    if (total.type === 'review' || total.type === 'issue') continue;
    
    const label = activityLabel(total.type as string);
    const iconType = total.type as string === 'pull_request_merged' ? 'pull_request' : total.type as string;
    const iconSvg = getIconForType(iconType, colors.textMuted);
    
    // We adjust the X coordinate for the text to leave room for the 14px icon + spacing
    activityLines.push(
      `<g transform="translate(${spacing.lg.toString()}, ${(y - 11).toString()})">${iconSvg}</g>`,
      `<text x="${(spacing.lg + 20).toString()}" y="${y.toString()}" ` +
        `font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" ` +
        `fill="${colors.textMuted}">${escapeXml(label)}:</text>`,
      `<text x="${(width / 2 - spacing.lg).toString()}" y="${y.toString()}" ` +
        `font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" ` +
        `font-weight="${typography.weightBold.toString()}" fill="${colors.textPrimary}" ` +
        `text-anchor="end">${total.count.toLocaleString()}</text>`,
    );
    y += typography.sizeBase + spacing.xs + 4;
  }

  if (snapshot.activity.discoveredRepositoryCount !== undefined) {
    const label = "Contributed to";
    const iconSvg = getIconForType("repo", colors.textMuted);
    activityLines.push(
      `<g transform="translate(${spacing.lg.toString()}, ${(y - 11).toString()})">${iconSvg}</g>`,
      `<text x="${(spacing.lg + 20).toString()}" y="${y.toString()}" ` +
        `font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" ` +
        `fill="${colors.textMuted}">${escapeXml(label)}:</text>`,
      `<text x="${(width / 2 - spacing.lg).toString()}" y="${y.toString()}" ` +
        `font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" ` +
        `font-weight="${typography.weightBold.toString()}" fill="${colors.textPrimary}" ` +
        `text-anchor="end">${snapshot.activity.discoveredRepositoryCount.toLocaleString()}</text>`,
    );
    y += typography.sizeBase + spacing.xs + 4;
  }

  if (snapshot.activity.currentStreak !== undefined) {
    const label = "Current streak";
    const iconSvg = getIconForType("flame", colors.textMuted);
    activityLines.push(
      `<g transform="translate(${spacing.lg.toString()}, ${(y - 11).toString()})">${iconSvg}</g>`,
      `<text x="${(spacing.lg + 20).toString()}" y="${y.toString()}" ` +
        `font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" ` +
        `fill="${colors.textMuted}">${escapeXml(label)}:</text>`,
      `<text x="${(width / 2 - spacing.lg).toString()}" y="${y.toString()}" ` +
        `font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" ` +
        `font-weight="${typography.weightBold.toString()}" fill="${colors.textPrimary}" ` +
        `text-anchor="end">${snapshot.activity.currentStreak.toLocaleString()} days</text>`,
    );
    y += typography.sizeBase + spacing.xs + 4;
  }

  if (snapshot.activity.longestStreak !== undefined) {
    const label = "Longest streak";
    const iconSvg = getIconForType("flame", colors.textMuted);
    activityLines.push(
      `<g transform="translate(${spacing.lg.toString()}, ${(y - 11).toString()})">${iconSvg}</g>`,
      `<text x="${(spacing.lg + 20).toString()}" y="${y.toString()}" ` +
        `font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" ` +
        `fill="${colors.textMuted}">${escapeXml(label)}:</text>`,
      `<text x="${(width / 2 - spacing.lg).toString()}" y="${y.toString()}" ` +
        `font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" ` +
        `font-weight="${typography.weightBold.toString()}" fill="${colors.textPrimary}" ` +
        `text-anchor="end">${snapshot.activity.longestStreak.toLocaleString()} days</text>`,
    );
    y += typography.sizeBase + spacing.xs + 4;
  }

  // Calculate dynamic height based on the taller of the two columns
  const leftColumnHeight = y + spacing.md;
  const rightColumnHeight = barY + barHeightEstimate + spacing.md;
  
  // Base height plus partial data notice space
  const baseHeight = Math.max(leftColumnHeight, rightColumnHeight) + spacing.md; // Add a bit more padding
  const height = isPartial ? baseHeight + spacing.lg : baseHeight;

  return `<svg width="${width.toString()}" height="${height.toString()}" viewBox="0 0 ${width.toString()} ${height.toString()}"
  xmlns="http://www.w3.org/2000/svg" role="img"
  aria-labelledby="cs-title cs-desc">
  <title id="cs-title">GitHub Contribution Analytics — ${escapeXml(snapshot.developer.login)}</title>
  <desc id="cs-desc">Personal contribution analytics for ${escapeXml(snapshot.developer.login)} ` +
    `covering ${escapeXml(snapshot.effectiveWindow.from)} to ${escapeXml(snapshot.effectiveWindow.to)}. ` +
    `Confidence: ${confidence}.${isPartial ? " Partial data — see JSON API for details." : ""}</desc>

  <metadata>
    <script type="application/json" id="contriblens-raw-data">
      ${JSON.stringify(snapshot).replace(/</g, '\\u003c')}
    </script>
  </metadata>

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
  <text id="cs-title-text" x="${spacing.lg.toString()}" y="${titleY.toString()}"
    font-family="${typography.fontFamily}" font-size="${typography.sizeLg.toString()}"
    font-weight="${typography.weightBold.toString()}" fill="${colors.textPrimary}">
    ${escapeXml(snapshot.developer.displayName ?? snapshot.developer.login)}
  </text>

  <!-- Window -->
  <text x="${spacing.lg.toString()}" y="${windowY.toString()}"
    font-family="${typography.fontFamily}" font-size="${typography.sizeSm.toString()}"
    fill="${colors.textMuted}">
    ${escapeXml(snapshot.effectiveWindow.from.slice(0, 10))} – ${escapeXml(snapshot.effectiveWindow.to.slice(0, 10))}
  </text>

  <!-- Confidence badge -->
  ${renderConfidenceBadge({ level: confidence, x: width - spacing.lg, y: titleY, theme })}

  <!-- Divider -->
  <line x1="${spacing.lg.toString()}" y1="${dividerY.toString()}"
    x2="${(width - spacing.lg).toString()}" y2="${dividerY.toString()}"
    stroke="${colors.border}" stroke-width="1"/>

  <!-- Activity totals -->
  ${activityLines.join("\n  ")}

  <!-- Segmented Language Bar -->
  ${segmentedBarSvg}

  ${isPartial ? renderPartialDataNotice({ x: width / 2, y: height - spacing.sm, theme }) : ""}
</svg>`;
}
