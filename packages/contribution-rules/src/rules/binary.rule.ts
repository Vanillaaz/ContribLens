/**
 * Rule: BinaryFileRule
 *
 * Excludes binary files from language attribution and qualified change totals.
 *
 * Binary files (images, compiled binaries, compressed archives) have no
 * meaningful textual diff. GitHub typically returns null/absent patches and
 * zero additions/deletions for binary files.
 *
 * Language attribution for binary content is unreliable.
 */

import { toRuleId, type ChangedFile, type RuleResult } from "@ContribLens/domain";
import type { IRule } from "../rule.interface.js";
import type { RuleContext } from "../rule-context.js";

/** Common binary file extensions. Not exhaustive — the heuristic also uses API signals. */
const BINARY_EXTENSIONS = new Set([
  // Images
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".webp", ".avif", ".tiff", ".svg",
  // Audio/video
  ".mp3", ".mp4", ".wav", ".ogg", ".flac", ".aac", ".mkv", ".avi", ".mov",
  // Archives
  ".zip", ".tar", ".gz", ".bz2", ".xz", ".7z", ".rar", ".zst",
  // Compiled binaries
  ".exe", ".dll", ".so", ".dylib", ".o", ".a", ".lib", ".wasm",
  // Fonts
  ".ttf", ".otf", ".woff", ".woff2", ".eot",
  // Documents (binary formats)
  ".pdf", ".docx", ".xlsx", ".pptx", ".odt",
  // Database
  ".db", ".sqlite", ".sqlite3",
  // Python bytecode
  ".pyc", ".pyo",
  // Other
  ".jar", ".war", ".ear", ".class",
]);

export class BinaryFileRule implements IRule {
  readonly id = toRuleId("BINARY_FILE");
  readonly name = "Binary File Exclusion";
  readonly description =
    "Excludes binary files from qualified change and language attribution metrics.";

  evaluate(file: ChangedFile, _context: RuleContext): RuleResult | null {
    const ext = this.getExtension(file.path);

    // Signal 1: Known binary extension
    if (ext && BINARY_EXTENSIONS.has(ext)) {
      return {
        ruleId: this.id,
        decision: "excluded",
        reason: `File "${file.path}" has a binary extension ("${ext}"). ` +
          "Binary files are excluded from language attribution.",
        matched: true,
      };
    }

    // Signal 2: GitHub API returned no patch AND no additions/deletions
    // (characteristic of binary files in GitHub's API response)
    if (
      file.patch === null &&
      file.additions === 0 &&
      file.deletions === 0 &&
      file.status !== "removed"
    ) {
      return {
        ruleId: this.id,
        decision: "excluded",
        reason: `File "${file.path}" appears to be binary: the GitHub API returned ` +
          "no patch and no additions/deletions. Binary content is excluded.",
        matched: true,
      };
    }

    return null;
  }

  private getExtension(path: string): string | null {
    const lastDot = path.lastIndexOf(".");
    if (lastDot === -1 || lastDot === path.length - 1) return null;
    return path.slice(lastDot).toLowerCase();
  }
}
