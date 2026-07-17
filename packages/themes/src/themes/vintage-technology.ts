import type { Theme } from "../theme.js";

export const vintageTechnology: Theme = {
  name: "vintage-technology",
  colors: {
    background: "#0f150f",       // Very dark green CRT background
    backgroundAlt: "#141f14",    // Slightly lighter for gradient glow
    surface: "#182618",          // Surface green
    border: "#2d4a22",           // Phosphor green border
    text: "#4af626",             // Bright phosphor green
    textMuted: "#32a316",        // Dimmer green
    success: "#00ff00",          // Pure green
    warning: "#a8ff00",          // Yellow-green
    error: "#ff3b00",            // Warning red/orange
  },
  typography: {
    fontFamily: "'VT323', 'Courier New', Courier, monospace",
    sizeSm: 12,
    sizeBase: 14,
    sizeLg: 18,
  },
};
