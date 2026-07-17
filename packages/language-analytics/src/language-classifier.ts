/**
 * Linguist-based language classifier.
 *
 * Uses linguist-js (a port of GitHub Linguist) to classify files.
 * This ensures language names are consistent with GitHub's own classifications.
 *
 * linguist-js is lazy-loaded on first use to avoid startup overhead.
 */

import type { LanguageCategory } from "@ContribLens/domain";
import type {
  ClassificationResult,
  ILanguageClassifier,
} from "./language-classifier.interface.js";

/**
 * Mapping from Linguist language type to our LanguageCategory.
 *
 * Linguist types: "programming", "markup", "data", "prose", "nil"
 */
function linguistTypeToCategory(linguistType: string | undefined): LanguageCategory {
  switch (linguistType) {
    case "programming":
      return "source";
    case "markup":
      return "markup";
    case "data":
      return "config";
    case "prose":
      return "markup";
    default:
      return "unknown";
  }
}

/**
 * Extension-to-category fallback for files linguist-js cannot classify.
 * Covers the most common config file types.
 */
const EXTENSION_FALLBACK: Record<string, { language: string | null; category: LanguageCategory }> = {
  ".ts": { language: "TypeScript", category: "source" },
  ".tsx": { language: "TypeScript", category: "source" },
  ".js": { language: "JavaScript", category: "source" },
  ".jsx": { language: "JavaScript", category: "source" },
  ".py": { language: "Python", category: "source" },
  ".java": { language: "Java", category: "source" },
  ".c": { language: "C", category: "source" },
  ".cpp": { language: "C++", category: "source" },
  ".cc": { language: "C++", category: "source" },
  ".cs": { language: "C#", category: "source" },
  ".go": { language: "Go", category: "source" },
  ".rs": { language: "Rust", category: "source" },
  ".rb": { language: "Ruby", category: "source" },
  ".php": { language: "PHP", category: "source" },
  ".swift": { language: "Swift", category: "source" },
  ".kt": { language: "Kotlin", category: "source" },
  ".scala": { language: "Scala", category: "source" },
  ".html": { language: "HTML", category: "markup" },
  ".css": { language: "CSS", category: "markup" },
  ".scss": { language: "SCSS", category: "markup" },
  ".less": { language: "Less", category: "markup" },
  ".json": { language: "JSON", category: "config" },
  ".yaml": { language: "YAML", category: "config" },
  ".yml": { language: "YAML", category: "config" },
  ".toml": { language: "TOML", category: "config" },
  ".ini": { language: "INI", category: "config" },
  ".env": { language: null, category: "config" },
  ".xml": { language: "XML", category: "config" },
  ".conf": { language: null, category: "config" },
  ".config": { language: null, category: "config" },
  ".md": { language: "Markdown", category: "markup" },
  ".mdx": { language: "MDX", category: "markup" },
  ".rst": { language: null, category: "markup" },
  ".txt": { language: null, category: "markup" },
  ".adoc": { language: null, category: "markup" },
  ".sh": { language: "Shell", category: "source" },
  ".bash": { language: "Shell", category: "source" },
  ".ps1": { language: "PowerShell", category: "source" },
  ".sql": { language: "SQL", category: "source" },
  ".graphql": { language: "GraphQL", category: "source" },
  ".vue": { language: "Vue", category: "source" },
  ".svelte": { language: "Svelte", category: "source" }
};

export class LinguistLanguageClassifier implements ILanguageClassifier {
   
  private linguist: any = null;
  private initPromise: Promise<void> | null = null;

  private async init(): Promise<void> {
    if (this.linguist) return;
    if (!this.initPromise) {
      this.initPromise = (async () => {
        const mod = await import("linguist-js");
        this.linguist = mod.default ?? mod;
      })();
    }
    await this.initPromise;
  }

  classify(path: string): ClassificationResult {
    // Synchronous path: use extension fallback when linguist is not yet loaded
    if (!this.linguist) {
      return this.classifyByExtension(path);
    }

    try {
      // linguist-js analyzes file contents but can classify by filename alone
      // We pass only the filename for performance (no file read)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const result = this.linguist.analyse(path, {}) as {
        languages?: {
          results?: Record<string, { type?: string; color?: string }>;
        };
      };

      const languages = result?.languages?.results;
      if (!languages) return this.classifyByExtension(path);

      const entries = Object.entries(languages);
      if (entries.length === 0) return this.classifyByExtension(path);

      // Take the first classification (highest confidence)
      const [language, details] = entries[0]!;
      return {
        language,
        category: linguistTypeToCategory(details?.type),
      };
    } catch {
      return this.classifyByExtension(path);
    }
  }

  /**
   * Eagerly initializes the classifier.
   * Call this during app startup to avoid classification latency on first request.
   */
  async warmUp(): Promise<void> {
    await this.init();
  }

  private classifyByExtension(path: string): ClassificationResult {
    const lastDot = path.lastIndexOf(".");
    if (lastDot !== -1) {
      const ext = path.slice(lastDot).toLowerCase();
      const fallback = EXTENSION_FALLBACK[ext];
      if (fallback) {
        return fallback;
      }
    }
    return { language: null, category: "unknown" };
  }
}
