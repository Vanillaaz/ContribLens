import { describe, it, expect } from "vitest";
import { parseHexToRgb, calculateLuminance, getContrastRatio, passesWcagAA } from "../contrast-validator.js";

describe("Contrast Validator", () => {
  describe("parseHexToRgb", () => {
    it("parses 6-character hex codes", () => {
      expect(parseHexToRgb("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
      expect(parseHexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
      expect(parseHexToRgb("#FF0000")).toEqual({ r: 255, g: 0, b: 0 });
    });

    it("parses 3-character hex codes", () => {
      expect(parseHexToRgb("#FFF")).toEqual({ r: 255, g: 255, b: 255 });
      expect(parseHexToRgb("#000")).toEqual({ r: 0, g: 0, b: 0 });
      expect(parseHexToRgb("#F00")).toEqual({ r: 255, g: 0, b: 0 });
    });

    it("handles hex codes without #", () => {
      expect(parseHexToRgb("FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
      expect(parseHexToRgb("FFF")).toEqual({ r: 255, g: 255, b: 255 });
    });
  });

  describe("calculateLuminance", () => {
    it("calculates correct luminance for white and black", () => {
      expect(calculateLuminance(255, 255, 255)).toBeCloseTo(1, 5);
      expect(calculateLuminance(0, 0, 0)).toBeCloseTo(0, 5);
    });
  });

  describe("getContrastRatio", () => {
    it("calculates contrast ratio correctly", () => {
      // Black on White should be 21:1
      expect(getContrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
      // White on Black should also be 21:1 (order shouldn't matter)
      expect(getContrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 1);
      
      // Light gray on white (low contrast)
      expect(getContrastRatio("#CCCCCC", "#FFFFFF")).toBeCloseTo(1.6, 1);
    });
  });

  describe("passesWcagAA", () => {
    it("passes black text on white background", () => {
      expect(passesWcagAA("#000000", "#FFFFFF")).toBe(true);
    });

    it("fails light gray text on white background", () => {
      expect(passesWcagAA("#CCCCCC", "#FFFFFF")).toBe(false);
    });

    it("passes for large text with 3.0 ratio requirement", () => {
      // #666666 on #000000 has a ratio of ~3.65
      const resultNormal = passesWcagAA("#666666", "#000000", false);
      const resultLarge = passesWcagAA("#666666", "#000000", true);
      
      expect(resultNormal).toBe(false); // < 4.5
      expect(resultLarge).toBe(true);   // >= 3.0
    });
  });
});
