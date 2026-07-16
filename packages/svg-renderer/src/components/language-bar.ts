import type { Theme } from "@ContribLens/themes";
import { escapeXml } from "../utils/escape.js";

export interface LanguageBarProps {
  x: number;
  y: number;
  width: number;
  language: string;
  percentage: number;
  color: string;
  theme: Theme;
}

export function renderLanguageBar({ x, y, width, language, percentage, color, theme }: LanguageBarProps): string {
  const { colors, typography } = theme;
  const fillWidth = Math.max(2, Math.round(width * percentage));
  const label = `${language} ${Math.round(percentage * 100).toString()}%`;

  return `
    <text x="${x.toString()}" y="${y.toString()}" font-family="${typography.fontFamily}" font-size="${typography.sizeSm.toString()}" fill="${colors.textMuted}">${escapeXml(label)}</text>
    <rect x="${x.toString()}" y="${(y + 4).toString()}" width="${fillWidth.toString()}" height="6" rx="3" fill="${color}"/>
    <rect x="${x.toString()}" y="${(y + 4).toString()}" width="${width.toString()}" height="6" rx="3" fill="${colors.border}" opacity="0.3"/>
  `;
}
