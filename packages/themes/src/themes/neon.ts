import type { Theme } from "../theme.js";

export const neon: Theme = {
  name: "neon",
  displayName: "Neon",
  isDark: true,
  colors: {
    background: "#090a0f",       // Pitch black/dark blue
    backgroundAlt: "#121524",    // Slight blue gradient
    surface: "#1a1e36",          // Elevated dark blue
    border: "#ff00e5",           // Neon magenta border
    textPrimary: "#ffffff",             // Pure white
    textMuted: "#00f0ff",        // Neon cyan for secondary text
    accent: "#ff00e5",           // Neon magenta
    success: "#39ff14",          // Neon green
    warning: "#ffea00",          // Neon yellow
    error: "#ff003c",            // Neon red
    chartPalette: [
      "#ff00e5",
      "#00f0ff",
      "#39ff14",
      "#ffea00",
      "#ff003c",
      "#ffffff",
      "#1a1e36",
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
