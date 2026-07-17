import type { Theme } from "../theme.js";

export const portfolio: Theme = {
  name: "portfolio",
  colors: {
    background: "#111111",       // Sleek dark gray
    backgroundAlt: "#1c1c1c",    // Subtle lighter gray gradient
    surface: "#222222",          // Surface gray
    border: "#333333",           // Premium dark border
    text: "#f5f5f5",             // Crisp off-white
    textMuted: "#a3a3a3",        // Elegant muted gray
    success: "#10b981",          // Emerald green
    warning: "#f59e0b",          // Amber
    error: "#ef4444",            // Red
  },
  typography: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    sizeSm: 11,
    sizeBase: 13,
    sizeLg: 16,
  },
};
