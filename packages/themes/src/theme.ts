/**
 * Theme type — declarative token set for the SVG renderer.
 *
 * Themes are small, validated, contrast-compliant token collections.
 * No logic lives in a theme — it is purely data.
 */

/** A color value, strictly enforced as an RGB hex string. */
export type HexColor = `#${string}`;
export type ColorToken = HexColor | "transparent" | "currentColor";

/** A typography scale entry. */
export interface TypographyScale {
  readonly fontFamily: string;
  readonly sizeSm: number;    // px
  readonly sizeBase: number;  // px
  readonly sizeLg: number;    // px
  readonly sizeXl: number;    // px
  readonly weightNormal: number;
  readonly weightBold: number;
  readonly lineHeight: number;
}

/** A spacing scale. Values in pixels. */
export interface SpacingScale {
  readonly xs: number;
  readonly sm: number;
  readonly md: number;
  readonly lg: number;
  readonly xl: number;
}

/** Semantic color palette for a theme. */
export interface ColorPalette {
  /** Card background. */
  readonly background: ColorToken;
  /** Secondary background color for gradients. */
  readonly backgroundAlt?: ColorToken;
  /** Slightly elevated surface (inner panels). */
  readonly surface: ColorToken;
  /** Border/divider color. */
  readonly border: ColorToken;
  /** Primary text. */
  readonly textPrimary: ColorToken;
  /** Secondary/muted text. */
  readonly textMuted: ColorToken;
  /** Accent color for highlights. */
  readonly accent: ColorToken;
  /** Success / positive metric color. */
  readonly success: ColorToken;
  /** Warning / moderate confidence color. */
  readonly warning: ColorToken;
  /** Error / unavailable confidence color. */
  readonly error: ColorToken;
  /** Language bar chart palette (up to 10 colors). */
  readonly chartPalette: readonly ColorToken[];
}

/** A complete theme definition. */
export interface Theme {
  /** Unique theme name. Used in cache keys and API parameters. */
  readonly name: string;
  /** Human-readable display name. */
  readonly displayName: string;
  readonly colors: ColorPalette;
  readonly typography: TypographyScale;
  readonly spacing: SpacingScale;
  /** Whether this is a dark theme (for meta tags and accessibility hints). */
  readonly isDark: boolean;
}
