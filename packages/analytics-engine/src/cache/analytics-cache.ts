/**
 * In-process bounded LRU analytics cache.
 *
 * Uses lru-cache for a battle-tested, typed, TTL-aware implementation.
 * This is the only cache in Version 1 (no Redis, no database).
 *
 * Cache entries expire after `ttlMs` milliseconds.
 * The cache is bounded by `maxSize` entries — LRU eviction applies.
 */

import { LRUCache } from "lru-cache";
import type { AnalyticsSnapshot } from "@ContribLens/domain";

export interface AnalyticsCacheOptions {
  /**
   * Maximum number of cached results.
   * @default 500
   */
  maxSize: number;
  /**
   * Time-to-live for cache entries in milliseconds.
   * @default 300_000 (5 minutes)
   */
  ttlMs: number;
}

const DEFAULT_OPTIONS: AnalyticsCacheOptions = {
  maxSize: 500,
  ttlMs: 300_000,
};

export class AnalyticsCache {
  private readonly cache: LRUCache<string, AnalyticsSnapshot>;

  constructor(options: Partial<AnalyticsCacheOptions> = {}) {
    const { maxSize, ttlMs } = { ...DEFAULT_OPTIONS, ...options };
    this.cache = new LRUCache<string, AnalyticsSnapshot>({
      max: maxSize,
      ttl: ttlMs,
      allowStale: false,
    });
  }

  get(key: string): AnalyticsSnapshot | undefined {
    return this.cache.get(key);
  }

  set(key: string, snapshot: AnalyticsSnapshot): void {
    this.cache.set(key, snapshot);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  /** Returns current cache size (for observability). */
  get size(): number {
    return this.cache.size;
  }

  /** Clears the entire cache. Useful for testing. */
  clear(): void {
    this.cache.clear();
  }
}
