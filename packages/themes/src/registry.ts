/**
 * Theme registry.
 *
 * All registered themes are curated and contrast-validated.
 * Unknown theme names fall back to the default dark theme.
 */

import type { Theme } from "./theme.js";
import { defaultDarkTheme } from "./themes/default-dark.js";
import { defaultLightTheme } from "./themes/default-light.js";
import { highContrastTheme } from "./themes/high-contrast.js";
import { draculaTheme } from "./themes/dracula.js";
import { nordTheme } from "./themes/nord.js";
import { midnightPurpleTheme } from "./themes/midnight-purple.js";
import { githubDimmedTheme } from "./themes/github-dimmed.js";

/**
 * Built-in themes registry.
 */
export const BUILT_IN_THEMES: Record<string, Theme> = {
  [defaultDarkTheme.name]: defaultDarkTheme,
  [defaultLightTheme.name]: defaultLightTheme,
  [highContrastTheme.name]: highContrastTheme,
  [draculaTheme.name]: draculaTheme,
  [nordTheme.name]: nordTheme,
  [midnightPurpleTheme.name]: midnightPurpleTheme,
  [githubDimmedTheme.name]: githubDimmedTheme,
};

const THEMES = new Map<string, Theme>([
  [defaultDarkTheme.name, defaultDarkTheme],
  [defaultLightTheme.name, defaultLightTheme],
  [highContrastTheme.name, highContrastTheme],
  [draculaTheme.name, draculaTheme],
  [nordTheme.name, nordTheme],
  [midnightPurpleTheme.name, midnightPurpleTheme],
  [githubDimmedTheme.name, githubDimmedTheme],
]);

/** Returns a registered theme by name, or the default dark theme if not found. */
export function getTheme(name: string | undefined | null): Theme {
  return THEMES.get(name ?? "") ?? defaultDarkTheme;
}

/** Returns all registered theme names. */
export function listThemeNames(): string[] {
  return [...THEMES.keys()];
}

/** Returns all registered themes. */
export function listThemes(): Theme[] {
  return [...THEMES.values()];
}

/** The default theme (dark). */
export const DEFAULT_THEME = defaultDarkTheme;
