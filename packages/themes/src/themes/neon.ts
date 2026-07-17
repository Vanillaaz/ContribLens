import type { Theme } from "../theme.js";

export const neon: Theme = {
  name: "neon",
  colors: {
    background: "#090a0f",       // Pitch black/dark blue
    backgroundAlt: "#121524",    // Slight blue gradient
    surface: "#1a1e36",          // Elevated dark blue
    border: "#ff00e5",           // Neon magenta border
    text: "#ffffff",             // Pure white
    textMuted: "#00f0ff",        // Neon cyan for secondary text
    success: "#39ff14",          // Neon green
    warning: "#ffea00",          // Neon yellow
    error: "#ff003c",            // Neon red
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
    sizeSm: 11,
    sizeBase: 13,
    sizeLg: 16,
  },
};
