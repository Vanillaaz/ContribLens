import type { ConfidenceLevel } from "@ContribLens/domain";
import type { Theme } from "@ContribLens/themes";

export interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  x: number;
  y: number;
  theme: Theme;
}

export function renderConfidenceBadge({ level, x, y, theme }: ConfidenceBadgeProps): string {
  const { colors, typography } = theme;
  
  const colorMap: Record<ConfidenceLevel, string> = {
    high: colors.success,
    moderate: colors.warning,
    partial: colors.warning,
    unavailable: colors.error,
  };
  const color = colorMap[level];

  const label = level.charAt(0).toUpperCase() + level.slice(1);

  return `<g>
    <circle cx="${x.toString()}" cy="${(y - 5).toString()}" r="5" fill="${color}" opacity="0.8"/>
    <text x="${(x - 10).toString()}" y="${y.toString()}" font-family="${typography.fontFamily}"
      font-size="${typography.sizeSm.toString()}" fill="${color}" text-anchor="end">${label}</text>
  </g>`;
}
