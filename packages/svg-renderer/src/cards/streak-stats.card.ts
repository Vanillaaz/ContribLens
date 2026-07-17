import type { AnalyticsSnapshot } from "@ContribLens/domain";
import type { Theme } from "@ContribLens/themes";
import { escapeXml } from "../utils/escape.js";
import { getIconForType } from "../utils/icons.js";
import { renderPartialDataNotice } from "../components/partial-data-notice.js";

function formatDateRange(from: string, to: string): string {
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr.slice(0, 10);
    }
  };
  return `${formatDate(from)} - ${formatDate(to)}`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr.slice(0, 10);
  }
}

function formatShortDateRange(from?: string, to?: string): string {
  if (!from || !to) return "No streak";
  const format = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateStr.slice(0, 10);
    }
  };
  if (from === to) return format(from);
  return `${format(from)} - ${format(to)}`;
}

export function renderStreakStatsCard(snapshot: AnalyticsSnapshot, theme: Theme, width: number): string {
  const { colors, typography, spacing } = theme;
  const isPartial = snapshot.confidence.overall !== "high";
  const height = isPartial ? 215 : 195;
  const flameIcon = getIconForType("flame", colors.accent);

  let totalContributions = 0;
  for (const t of snapshot.activity.totals) {
    if (t.count) {
      totalContributions += t.count;
    }
  }

  const currentStreak = snapshot.activity.currentStreak ?? 0;
  const longestStreak = snapshot.activity.longestStreak ?? 0;

  // The grid consists of 3 columns
  const colWidth = width / 3;
  
  // Centers for text
  const c1x = colWidth / 2;
  const c2x = colWidth + colWidth / 2;
  const c3x = colWidth * 2 + colWidth / 2;

  // Y positions
  const cy = 75; // Center of the ring and numbers
  const numY = cy + 10; // Large number baseline
  const labelY = cy + 40 + spacing.md + typography.sizeBase; // Label text baseline
  const dateY = labelY + 22; // Date text baseline

  // Ring properties
  const ringRadius = 40;
  const ringStroke = 4.5;
  const ringCircumference = 2 * Math.PI * ringRadius;
  // Let's assume max reasonable streak for progress ring calculation is ~365 days
  const progressPercent = Math.min(currentStreak / 365, 1); 
  const dashOffset = ringCircumference * (1 - progressPercent);

  // SVG generation
  return `<svg width="${width.toString()}" height="${height.toString()}" viewBox="0 0 ${width.toString()} ${height.toString()}"
  xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="ss-title ss-desc">
  <title id="ss-title">Streak Stats for ${escapeXml(snapshot.developer.login)}</title>
  <desc id="ss-desc">Total contributions: ${totalContributions}, Current streak: ${currentStreak}, Longest streak: ${longestStreak}</desc>

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

  <!-- Dividers -->
  <line x1="${colWidth.toString()}" y1="30" x2="${colWidth.toString()}" y2="${(height - 30).toString()}" stroke="${colors.border}" stroke-width="1"/>
  <line x1="${(colWidth * 2).toString()}" y1="30" x2="${(colWidth * 2).toString()}" y2="${(height - 30).toString()}" stroke="${colors.border}" stroke-width="1"/>

  <!-- Column 1: Total Contributions -->
  <text x="${c1x.toString()}" y="${numY.toString()}" font-family="${typography.fontFamily}" font-size="28" font-weight="${typography.weightBold.toString()}" fill="${colors.textPrimary}" text-anchor="middle">
    ${totalContributions.toLocaleString()}
  </text>
  <text x="${c1x.toString()}" y="${labelY.toString()}" font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" font-weight="${typography.weightBold.toString()}" fill="${colors.textPrimary}" text-anchor="middle">
    Total Contributions
  </text>
  <text x="${c1x.toString()}" y="${dateY.toString()}" font-family="${typography.fontFamily}" font-size="${typography.sizeSm.toString()}" fill="${colors.textMuted}" text-anchor="middle">
    ${formatDate(snapshot.effectiveWindow.from)} - Present
  </text>

  <!-- Column 2: Current Streak -->
  <!-- Background Ring -->
  <circle cx="${c2x.toString()}" cy="${cy.toString()}" r="${ringRadius.toString()}" fill="none" stroke="${colors.border}" stroke-width="${ringStroke.toString()}"/>
  <!-- Progress Ring -->
  <circle cx="${c2x.toString()}" cy="${cy.toString()}" r="${ringRadius.toString()}" fill="none" stroke="${colors.accent}" stroke-width="${ringStroke.toString()}" 
          stroke-dasharray="${ringCircumference.toString()}" stroke-dashoffset="${dashOffset.toString()}" stroke-linecap="round" 
          transform="rotate(-90 ${c2x.toString()} ${cy.toString()})"/>
  
  <!-- Flame Icon placed on top of the ring, with mask to cut ring -->
  <g transform="translate(${(c2x - 12).toString()}, ${(cy - ringRadius - 12).toString()}) scale(1.5)">
    <rect width="16" height="16" fill="${colors.background}" rx="8"/> <!-- Mask behind the flame to cut the ring -->
    ${flameIcon}
  </g>

  <!-- Number inside ring -->
  <text x="${c2x.toString()}" y="${numY.toString()}" font-family="${typography.fontFamily}" font-size="28" font-weight="${typography.weightBold.toString()}" fill="${colors.textPrimary}" text-anchor="middle">
    ${currentStreak.toLocaleString()}
  </text>
  <text x="${c2x.toString()}" y="${labelY.toString()}" font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" font-weight="${typography.weightBold.toString()}" fill="${colors.accent}" text-anchor="middle">
    Current Streak
  </text>
  <text x="${c2x.toString()}" y="${dateY.toString()}" font-family="${typography.fontFamily}" font-size="${typography.sizeSm.toString()}" fill="${colors.textMuted}" text-anchor="middle">
    ${formatShortDateRange(snapshot.activity.currentStreakStart, snapshot.activity.currentStreakEnd)}
  </text>

  <!-- Column 3: Longest Streak -->
  <text x="${c3x.toString()}" y="${numY.toString()}" font-family="${typography.fontFamily}" font-size="28" font-weight="${typography.weightBold.toString()}" fill="${colors.textPrimary}" text-anchor="middle">
    ${longestStreak.toLocaleString()}
  </text>
  <text x="${c3x.toString()}" y="${labelY.toString()}" font-family="${typography.fontFamily}" font-size="${typography.sizeBase.toString()}" font-weight="${typography.weightBold.toString()}" fill="${colors.textPrimary}" text-anchor="middle">
    Longest Streak
  </text>
  <text x="${c3x.toString()}" y="${dateY.toString()}" font-family="${typography.fontFamily}" font-size="${typography.sizeSm.toString()}" fill="${colors.textMuted}" text-anchor="middle">
    ${formatShortDateRange(snapshot.activity.longestStreakStart, snapshot.activity.longestStreakEnd)}
  </text>

  ${isPartial ? renderPartialDataNotice({ x: width / 2, y: height - spacing.sm, theme }) : ""}
</svg>`;
}
