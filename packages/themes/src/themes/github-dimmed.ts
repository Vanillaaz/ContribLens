import type { Theme } from "../theme.js";

export const githubDimmedTheme: Theme = {
  name: "github-dimmed",
  displayName: "GitHub Dimmed",
  isDark: true,
  colors: {
    background: "#22272e",       // GitHub dimmed background
    backgroundAlt: "#1e2228",    // Slightly darker for gradient
    surface: "#2d333b",          // GitHub dimmed surface
    border: "#444c56",           // GitHub dimmed border
    textPrimary: "#adbac7",      // GitHub dimmed primary text
    textMuted: "#768390",        // GitHub dimmed muted text
    accent: "#539bf5",           // GitHub dimmed blue accent
    success: "#57ab5a",          // Green
    warning: "#c69026",          // Amber
    error: "#e5534b",            // Red
    chartPalette: [
      "#539bf5",  // Blue
      "#e5534b",  // Red
      "#57ab5a",  // Green
      "#c69026",  // Amber
      "#8cb6ff",  // Light blue
      "#f47067",  // Light red
      "#6bc46d",  // Light green
      "#dcbdfb",  // Purple
      "#96d0ff",  // Cyan
      "#768390",  // Gray
    ],
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
    sizeSm: 12,
    sizeBase: 14,
    sizeLg: 18,
    sizeXl: 22,
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
