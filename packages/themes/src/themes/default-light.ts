/**
 * Default light theme.
 */

import type { Theme } from "../theme.js";

export const defaultLightTheme: Theme = {
  name: "default-light",
  displayName: "Default Light",
  isDark: false,
  colors: {
    background: "#ffffff",
    surface: "#f6f8fa",
    border: "#d0d7de",
    textPrimary: "#1f2328",
    textMuted: "#636c76",
    accent: "#6d28d9",
    success: "#1a7f37",
    warning: "#9a6700",
    error: "#d1242f",
    chartPalette: [
      "#6d28d9",  // Violet
      "#1d4ed8",  // Blue
      "#0e7490",  // Cyan
      "#047857",  // Emerald
      "#b45309",  // Amber
      "#b91c1c",  // Red
      "#9d174d",  // Pink
      "#5b21b6",  // Violet dark
      "#4b5563",  // Gray
      "#1f2937",  // Dark gray
    ],
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
    sizeSm: 11,
    sizeBase: 13,
    sizeLg: 16,
    sizeXl: 20,
    weightNormal: 400,
    weightBold: 600,
    lineHeight: 1.5,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};
