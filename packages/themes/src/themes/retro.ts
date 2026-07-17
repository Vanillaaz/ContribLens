import type { Theme } from "../theme.js";

export const retro: Theme = {
  name: "retro",
  displayName: "Retro",
  isDark: true,
  colors: {
    background: "#2b213a",       // Deep purple
    backgroundAlt: "#181124",    // Darker purple for gradient
    surface: "#3d2b56",          // Elevated purple
    border: "#f272a1",           // Neon pink border
    textPrimary: "#ffffff",             // White text
    textMuted: "#f8cd62",        // Synthwave yellow/orange
    accent: "#f272a1",
    success: "#00f0ff",          // Cyan
    warning: "#ffb300",          // Orange
    error: "#ff003c",            // Neon red
    chartPalette: [
      "#f272a1",
      "#f8cd62",
      "#00f0ff",
      "#ffb300",
      "#ff003c",
      "#ffffff",
    ],
  },
  typography: {
    fontFamily: "'Courier New', Courier, monospace",
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
