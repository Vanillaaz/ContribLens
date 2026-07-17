import type { Theme } from "../theme.js";

export const draculaTheme: Theme = {
  name: "dracula",
  displayName: "Dracula",
  isDark: true,
  colors: {
    background: "#282a36",
    backgroundAlt: "#1e1f29",
    surface: "#44475a",
    border: "#6272a4",
    textPrimary: "#f8f8f2",
    textMuted: "#6272a4",
    accent: "#ff79c6",
    success: "#50fa7b",
    warning: "#f1fa8c",
    error: "#ff5555",
    chartPalette: [
      "#ff79c6",  // Pink
      "#bd93f9",  // Purple
      "#8be9fd",  // Cyan
      "#50fa7b",  // Green
      "#f1fa8c",  // Yellow
      "#ffb86c",  // Orange
      "#ff5555",  // Red
      "#6272a4",  // Comment
      "#f8f8f2",  // Foreground
      "#44475a",  // Current Line
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
