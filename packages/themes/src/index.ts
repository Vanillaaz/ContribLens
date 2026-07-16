/**
 * @ContribLens/themes
 *
 * Curated, contrast-validated theme token sets for the SVG renderer.
 */

export type { Theme, ColorPalette, TypographyScale, SpacingScale, ColorToken } from "./theme.js";
export { getTheme, listThemeNames, listThemes, DEFAULT_THEME } from "./registry.js";
export { defaultDarkTheme } from "./themes/default-dark.js";
export { defaultLightTheme } from "./themes/default-light.js";
