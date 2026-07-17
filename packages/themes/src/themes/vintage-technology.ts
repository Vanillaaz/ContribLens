import type { Theme } from "../theme.js";

export const vintageTechnology: Theme = {
  name: "vintage-technology",
  displayName: "Vintage Technology",
  isDark: true,
  colors: {
    background: "#0f150f",       // Very dark green CRT background
    backgroundAlt: "#141f14",    // Slightly lighter for gradient glow
    surface: "#182618",          // Surface green
    border: "#2d4a22",           // Phosphor green border
    textPrimary: "#4af626",             // Bright phosphor green
    textMuted: "#32a316",        // Dimmer green
    accent: "#4af626",
    success: "#00ff00",          // Pure green
    warning: "#a8ff00",          // Yellow-green
    error: "#ff3b00",            // Warning red/orange
    chartPalette: [
      "#4af626",
      "#32a316",
      "#00ff00",
      "#a8ff00",
      "#ff3b00",
      "#2d4a22",
    ],
  },
  typography: {
    fontFamily: "'VT323', 'Courier New', Courier, monospace",
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
