import type { Theme } from "../theme.js";

export const retro: Theme = {
  name: "retro",
  colors: {
    background: "#2b213a",       // Deep purple
    backgroundAlt: "#181124",    // Darker purple for gradient
    surface: "#3d2b56",          // Elevated purple
    border: "#f272a1",           // Neon pink border
    text: "#ffffff",             // White text
    textMuted: "#f8cd62",        // Synthwave yellow/orange
    success: "#00f0ff",          // Cyan
    warning: "#ffb300",          // Orange
    error: "#ff003c",            // Neon red
  },
  typography: {
    fontFamily: "'Courier New', Courier, monospace",
    sizeSm: 11,
    sizeBase: 13,
    sizeLg: 16,
  },
};
