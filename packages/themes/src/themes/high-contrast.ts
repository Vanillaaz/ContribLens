/**
 * High contrast dark theme (WCAG AAA compliant).
 */

import type { Theme } from "../theme.js";

export const highContrastTheme: Theme = {
  name: "high-contrast",
  displayName: "High Contrast",
  isDark: true,
  colors: {
    background: "#0a0c10",       // Pure dark
    surface: "#272b33",          // Distinct surface
    border: "#7a828e",           // High contrast border
    textPrimary: "#ffffff",      // Pure white text
    textMuted: "#a1a8b3",        // AAA compliant muted text
    accent: "#b582ff",           // High contrast violet
    success: "#56d364",          // High contrast green
    warning: "#e3b341",          // High contrast amber
    error: "#ff7b72",            // High contrast red
    chartPalette: [
      "#b582ff",  // Violet
      "#79c0ff",  // Blue
      "#56d364",  // Emerald
      "#e3b341",  // Amber
      "#ff7b72",  // Red
      "#ffa657",  // Orange
      "#ff9bce",  // Pink
      "#d2a8ff",  // Violet light
      "#8b949e",  // Gray
      "#f0f6fc",  // Light gray
    ],
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
    sizeSm: 12, // Bumped slightly for readability
    sizeBase: 14,
    sizeLg: 18,
    sizeXl: 22,
    weightNormal: 400,
    weightBold: 700, // Stronger bold
    lineHeight: 1.6,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};
