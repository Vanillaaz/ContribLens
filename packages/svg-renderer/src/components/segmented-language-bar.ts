import type { Theme } from "@ContribLens/themes";
import { escapeXml } from "../utils/escape.js";

export interface SegmentedLanguageBarProps {
  x: number;
  y: number;
  width: number;
  languages: {
    language: string;
    percentage: number;
    color: string;
  }[];
  theme: Theme;
}

export function renderSegmentedLanguageBar({
  x,
  y,
  width,
  languages,
  theme,
}: SegmentedLanguageBarProps): string {
  const { colors, typography } = theme;
  const barHeight = 8;
  const rx = 4;

  let currentX = x;
  let barElements = "";
  
  // Render the segments
  languages.forEach((lang) => {
    const segWidth = Math.max(0, width * lang.percentage);
    if (segWidth < 0.5) return; // Skip tiny slivers

    // For first/last segments, we could clip them, but a simple mask works best
    barElements += `<rect x="${currentX.toString()}" y="${y.toString()}" width="${segWidth.toString()}" height="${barHeight.toString()}" fill="${lang.color}"/>\n`;
    currentX += segWidth;
  });

  // Render the dot legend in a neat grid
  let legendElements = "";
  const dotRadius = 4;
  const cols = Math.floor(width / 130) || 1; // 130px minimum per column
  const colWidth = width / cols;
  const startY = y + barHeight + 16;
  const itemHeight = 20;

  languages.forEach((lang, i) => {
    const label = `${lang.language} ${Math.round(lang.percentage * 100).toString()}%`;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const legendX = x + col * colWidth;
    const legendY = startY + row * itemHeight;

    legendElements += `
      <circle cx="${(legendX + dotRadius).toString()}" cy="${(legendY - dotRadius + 1).toString()}" r="${dotRadius.toString()}" fill="${lang.color}"/>
      <text x="${(legendX + dotRadius * 2 + 8).toString()}" y="${legendY.toString()}" font-family="${typography.fontFamily}" font-size="${typography.sizeSm.toString()}" fill="${colors.textMuted}" text-anchor="start">${escapeXml(label)}</text>
    `;
  });

  // We use a clip path to round the corners of the continuous bar
  return `
    <defs>
      <clipPath id="bar-clip">
        <rect x="${x.toString()}" y="${y.toString()}" width="${width.toString()}" height="${barHeight.toString()}" rx="${rx.toString()}"/>
      </clipPath>
    </defs>
    <g clip-path="url(#bar-clip)">
      <!-- Background for empty space if percentages don't add up to exactly 100% due to tiny skips -->
      <rect x="${x.toString()}" y="${y.toString()}" width="${width.toString()}" height="${barHeight.toString()}" fill="${colors.border}" opacity="0.3"/>
      ${barElements}
    </g>
    <g>
      ${legendElements}
    </g>
  `;
}

/**
 * Returns the estimated height of the legend based on the number of items and available width.
 */
export function estimateSegmentedBarHeight(languagesCount: number, width: number): number {
  const cols = Math.floor(width / 130) || 1;
  const rows = Math.ceil(languagesCount / cols);
  return 8 /* bar */ + 16 /* padding */ + rows * 20;
}
