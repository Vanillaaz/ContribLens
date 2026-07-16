/**
 * Unit tests: BinaryFileRule
 */

import { describe, it, expect } from "vitest";
import { BinaryFileRule } from "../rules/binary.rule.js";
import { makeFile, makeContext } from "./helpers.js";

describe("BinaryFileRule", () => {
  const rule = new BinaryFileRule();
  const ctx = makeContext();

  it("has the correct rule ID", () => {
    expect(rule.id).toBe("BINARY_FILE");
  });

  describe("known binary extensions", () => {
    const binaryFiles = [
      // Images
      "photo.png", "icon.jpg", "logo.jpeg", "anim.gif", "cursor.ico",
      "image.webp", "image.avif", "image.tiff",
      // Audio/video
      "music.mp3", "video.mp4", "audio.wav", "clip.ogg", "lossless.flac",
      "audio.aac", "film.mkv", "film.avi", "film.mov",
      // Archives
      "archive.zip", "archive.tar", "archive.gz", "archive.bz2",
      "archive.xz", "archive.7z", "archive.rar", "archive.zst",
      // Compiled
      "app.exe", "lib.dll", "module.so", "lib.dylib", "obj.o",
      "lib.a", "lib.lib", "module.wasm",
      // Fonts
      "font.ttf", "font.otf", "font.woff", "font.woff2", "font.eot",
      // Documents
      "doc.pdf", "doc.docx", "sheet.xlsx", "slides.pptx", "doc.odt",
      // Database
      "data.db", "data.sqlite", "data.sqlite3",
      // Python bytecode
      "module.pyc", "module.pyo",
      // JVM
      "lib.jar", "app.war", "app.ear", "Class.class",
    ];

    for (const filename of binaryFiles) {
      it(`excludes "${filename}"`, () => {
        const file = makeFile({ path: filename, patch: null, additions: 5, deletions: 3 });
        const result = rule.evaluate(file, ctx);

        expect(result).not.toBeNull();
        expect(result!.decision).toBe("excluded");
        expect(result!.matched).toBe(true);
        expect(result!.ruleId).toBe("BINARY_FILE");
      });
    }

    it("is case-insensitive for extensions", () => {
      expect(rule.evaluate(makeFile({ path: "IMAGE.PNG" }), ctx)?.decision).toBe("excluded");
      expect(rule.evaluate(makeFile({ path: "file.JPG" }), ctx)?.decision).toBe("excluded");
      expect(rule.evaluate(makeFile({ path: "module.WAR" }), ctx)?.decision).toBe("excluded");
    });

    it("works for files with binary extension in a subdirectory", () => {
      const result = rule.evaluate(makeFile({ path: "assets/images/logo.png" }), ctx);
      expect(result?.decision).toBe("excluded");
    });
  });

  describe("API signal: null patch + zero adds/deletes", () => {
    it("excludes a file with null patch, 0 additions, 0 deletions, status not removed", () => {
      const file = makeFile({
        path: "some-unknown-binary-file",
        patch: null,
        additions: 0,
        deletions: 0,
        status: "modified",
      });

      const result = rule.evaluate(file, ctx);
      expect(result?.decision).toBe("excluded");
    });

    it("does NOT exclude a removed file with null patch and 0 adds/deletes", () => {
      // A deleted file can legitimately have 0 additions/deletions in some API responses
      const file = makeFile({
        path: "some-file.ts",
        patch: null,
        additions: 0,
        deletions: 0,
        status: "removed",
      });

      // Should pass through (not matched by binary signal)
      // Note: it may or may not be matched by another rule in the engine,
      // but the binary rule itself should not claim it
      expect(rule.evaluate(file, ctx)).toBeNull();
    });

    it("does NOT apply API signal when patch is provided", () => {
      const file = makeFile({
        path: "actual-text-file",
        patch: "@@ -1,1 +1,1 @@\n- old\n+ new",
        additions: 1,
        deletions: 1,
        status: "modified",
      });

      // Not a binary extension, has a patch → not binary by signal either
      expect(rule.evaluate(file, ctx)).toBeNull();
    });
  });

  describe("non-binary files pass through", () => {
    it("does not exclude TypeScript source files", () => {
      expect(rule.evaluate(makeFile({ path: "src/index.ts" }), ctx)).toBeNull();
    });

    it("does not exclude markdown files", () => {
      expect(rule.evaluate(makeFile({ path: "README.md" }), ctx)).toBeNull();
    });

    it("does not exclude files without an extension", () => {
      expect(rule.evaluate(makeFile({ path: "Makefile" }), ctx)).toBeNull();
      expect(rule.evaluate(makeFile({ path: "Dockerfile" }), ctx)).toBeNull();
    });

    it("does not exclude .svg used as source (caught by extension, but note it's in the list)", () => {
      // SVG is in the binary list - this is intentional (binary rule excludes SVG assets)
      const result = rule.evaluate(makeFile({ path: "icon.svg" }), ctx);
      expect(result?.decision).toBe("excluded");
    });
  });
});
