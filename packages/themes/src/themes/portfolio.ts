import type { Theme } from "../theme.js";

export const portfolio: Theme = {
  name: "portfolio",
  displayName: "Portfolio",
  isDark: true,
  colors: {
    background: "#111111",       // Sleek dark gray
    backgroundAlt: "#1c1c1c",    // Subtle lighter gray gradient
    surface: "#222222",          // Surface gray
    border: "#333333",           // Premium dark border
    textPrimary: "#f5f5f5",             // Crisp off-white
    textMuted: "#a3a3a3",        // Elegant muted gray
    accent: "#f5f5f5",
    success: "#10b981",          // Emerald green
    warning: "#f59e0b",          // Amber
    error: "#ef4444",            // Red
    chartPalette: [
      "#f5f5f5",
      "#a3a3a3",
      "#333333",
      "#10b981",
      "#f59e0b",
      "#ef4444",
    ],
  },
  typography: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
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
