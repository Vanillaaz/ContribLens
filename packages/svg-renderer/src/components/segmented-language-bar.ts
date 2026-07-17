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
  languages.forEach((lang, i) => {
    const segWidth = Math.max(0, width * lang.percentage);
    if (segWidth < 0.5) return; // Skip tiny slivers

    // For first/last segments, we could clip them, but a simple mask works best
    barElements += `<rect x="${currentX}" y="${y}" width="${segWidth}" height="${barHeight}" fill="${lang.color}"/>\n`;
    currentX += segWidth;
  });

  // Render the dot legend
  let legendElements = "";
  const dotRadius = 4;
  let legendX = x;
  let legendY = y + barHeight + 16;
  const itemHeight = 20;

  languages.forEach((lang) => {
    const label = `${lang.language} ${Math.round(lang.percentage * 100)}%`;
    // Approximate text width
    const textWidth = label.length * (typography.sizeSm * 0.6);
    const itemWidth = dotRadius * 2 + 8 + textWidth + 16;

    if (legendX + itemWidth > x + width) {
      legendX = x;
      legendY += itemHeight;
    }

    legendElements += `
      <circle cx="${legendX + dotRadius}" cy="${legendY - dotRadius + 1}" r="${dotRadius}" fill="${lang.color}"/>
      <text x="${legendX + dotRadius * 2 + 8}" y="${legendY}" font-family="${typography.fontFamily}" font-size="${typography.sizeSm}" fill="${colors.textMuted}">${escapeXml(label)}</text>
    `;
    legendX += itemWidth;
  });

  // We use a clip path to round the corners of the continuous bar
  return `
    <defs>
      <clipPath id="bar-clip">
        <rect x="${x}" y="${y}" width="${width}" height="${barHeight}" rx="${rx}"/>
      </clipPath>
    </defs>
    <g clip-path="url(#bar-clip)">
      <!-- Background for empty space if percentages don't add up to exactly 100% due to tiny skips -->
      <rect x="${x}" y="${y}" width="${width}" height="${barHeight}" fill="${colors.border}" opacity="0.3"/>
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
  // Rough approximation: ~3 items per row on a 300px width
  const itemsPerRow = Math.max(1, Math.floor(width / 90));
  const rows = Math.ceil(languagesCount / itemsPerRow);
  return 8 /* bar */ + 16 /* padding */ + rows * 20;
}
