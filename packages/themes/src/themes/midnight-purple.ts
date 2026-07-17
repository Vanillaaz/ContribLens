import type { Theme } from "../theme.js";

export const midnightPurpleTheme: Theme = {
  name: "midnight-purple",
  displayName: "Midnight Purple",
  isDark: true,
  colors: {
    background: "#120f1c", // Very deep dark purple/black
    backgroundAlt: "#1b1430", // Slightly lighter purple for gradient
    surface: "#1e1832",    // Deep dark purple
    border: "#3a2d5e",     // Muted purple border
    textPrimary: "#e3dcf4", // Light lavender
    textMuted: "#9f8cc9",   // Muted violet
    accent: "#c471ed",      // Neon purple accent
    success: "#26de81",     // Neon mint green
    warning: "#fed330",     // Bright yellow
    error: "#fc5c65",       // Coral red
    chartPalette: [
      "#c471ed",  // Neon purple
      "#f64f59",  // Neon pink
      "#12c2e9",  // Neon blue
      "#26de81",  // Neon green
      "#fed330",  // Yellow
      "#fc5c65",  // Red
      "#a29bfe",  // Soft indigo
      "#fd79a8",  // Bright pink
      "#55efc4",  // Teal
      "#81ecec",  // Light cyan
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
