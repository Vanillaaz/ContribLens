import type { Theme } from "../theme.js";

export const nordTheme: Theme = {
  name: "nord",
  displayName: "Nord",
  isDark: true,
  colors: {
    background: "#2e3440",
    backgroundAlt: "#242933",
    surface: "#3b4252",
    border: "#4c566a",
    textPrimary: "#eceff4",
    textMuted: "#d8dee9",
    accent: "#88c0d0",
    success: "#a3be8c",
    warning: "#ebcb8b",
    error: "#bf616a",
    chartPalette: [
      "#88c0d0",  // Frost Blue
      "#81a1c1",  // Deep Blue
      "#5e81ac",  // Dark Blue
      "#8fbcbb",  // Cyan
      "#a3be8c",  // Green
      "#ebcb8b",  // Yellow
      "#d08770",  // Orange
      "#bf616a",  // Red
      "#b48ead",  // Purple
      "#e5e9f0",  // Snow
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
