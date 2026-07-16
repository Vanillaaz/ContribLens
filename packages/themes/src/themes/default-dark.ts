/**
 * Default dark theme — the primary theme for ContribLens cards.
 *
 * Designed for GitHub README embeds which default to dark backgrounds.
 * Color palette uses harmonious slate/violet tones, not generic web colors.
 */

import type { Theme } from "../theme.js";

export const defaultDarkTheme: Theme = {
  name: "default-dark",
  displayName: "Default Dark",
  isDark: true,
  colors: {
    background: "#0d1117",       // GitHub dark background
    surface: "#161b22",          // GitHub dark surface
    border: "#30363d",           // GitHub dark border
    textPrimary: "#e6edf3",      // GitHub dark primary text
    textMuted: "#7d8590",        // GitHub dark muted text
    accent: "#7c3aed",           // Violet accent
    success: "#3fb950",          // Green
    warning: "#d29922",          // Amber
    error: "#f85149",            // Red
    chartPalette: [
      "#7c3aed",  // Violet
      "#2563eb",  // Blue
      "#0891b2",  // Cyan
      "#059669",  // Emerald
      "#d97706",  // Amber
      "#dc2626",  // Red
      "#db2777",  // Pink
      "#7c3aed",  // Violet (repeat at 50% opacity in renderer)
      "#6b7280",  // Gray
      "#374151",  // Dark gray
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
