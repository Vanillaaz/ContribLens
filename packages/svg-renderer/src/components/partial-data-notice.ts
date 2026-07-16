import type { Theme } from "@ContribLens/themes";

export interface PartialDataNoticeProps {
  x: number;
  y: number;
  theme: Theme;
}

export function renderPartialDataNotice({ x, y, theme }: PartialDataNoticeProps): string {
  const { colors, typography } = theme;
  
  return `<text x="${x.toString()}" y="${y.toString()}"
    font-family="${typography.fontFamily}" font-size="${typography.sizeSm.toString()}"
    fill="${colors.warning}" text-anchor="middle" role="alert">
    ⚠ Partial data — some contributions could not be retrieved
  </text>`;
}
