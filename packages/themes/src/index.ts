/**
 * @ContribLens/themes
 *
 * Curated, contrast-validated theme token sets for the SVG renderer.
 */

export type { Theme, ColorPalette, TypographyScale, SpacingScale, ColorToken } from "./theme.js";
export { getTheme, listThemeNames, listThemes, DEFAULT_THEME } from "./registry.js";
export { defaultDarkTheme } from "./themes/default-dark.js";
export { defaultLightTheme } from "./themes/default-light.js";
export { draculaTheme } from "./themes/dracula.js";
export { nordTheme } from "./themes/nord.js";
export { midnightPurpleTheme } from "./themes/midnight-purple.js";
export { githubDimmedTheme } from "./themes/github-dimmed.js";
export { retro as retroTheme } from "./themes/retro.js";
export { neon as neonTheme } from "./themes/neon.js";
export { portfolio as portfolioTheme } from "./themes/portfolio.js";
export { vintageTechnology as vintageTechnologyTheme } from "./themes/vintage-technology.js";
