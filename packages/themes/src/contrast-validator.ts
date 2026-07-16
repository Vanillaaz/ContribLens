/**
 * WCAG 2.1 Contrast Validator
 *
 * Ensures text elements have sufficient contrast against their backgrounds.
 * Minimum ratios (Level AA):
 * - Normal text: 4.5:1
 * - Large text (18pt+ or 14pt+ bold): 3.0:1
 * - UI Components / Graphical objects: 3.0:1
 */

/** Parse a hex color string (e.g., #FFFFFF, #FFF) into RGB components (0-255). */
export function parseHexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace(/^#/, "");
  
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex.charAt(0) + cleanHex.charAt(0), 16);
    const g = parseInt(cleanHex.charAt(1) + cleanHex.charAt(1), 16);
    const b = parseInt(cleanHex.charAt(2) + cleanHex.charAt(2), 16);
    return { r, g, b };
  }
  
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }
  
  throw new Error(`Invalid hex color: ${hex}`);
}

/** Calculate the relative luminance of a color per WCAG 2.1. */
export function calculateLuminance(r: number, g: number, b: number): number {
  const [a0, a1, a2] = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a0! * 0.2126 + a1! * 0.7152 + a2! * 0.0722;
}

/** 
 * Calculate the contrast ratio between two colors.
 * Returns a value between 1 (no contrast) and 21 (maximum contrast).
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = parseHexToRgb(hex1);
  const rgb2 = parseHexToRgb(hex2);
  
  const l1 = calculateLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = calculateLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  
  return (lightest + 0.05) / (darkest + 0.05);
}

/**
 * Checks if a text color has sufficient contrast against a background color.
 * @param textHex The text color hex code
 * @param backgroundHex The background color hex code
 * @param isLargeText True if the text is >= 18pt or >= 14pt bold
 * @returns True if contrast meets WCAG AA standards
 */
export function passesWcagAA(textHex: string, backgroundHex: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(textHex, backgroundHex);
  return isLargeText ? ratio >= 3.0 : ratio >= 4.5;
}
