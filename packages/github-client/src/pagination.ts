/**
 * Pagination utilities for GitHub REST API.
 *
 * GitHub REST endpoints use Link header-based cursor pagination.
 * GraphQL endpoints use connection-style cursor pagination.
 *
 * This module provides generic page iteration that:
 * - Stops when all pages are consumed.
 * - Stops when a page-level predicate returns false (e.g., out of time window).
 * - Stops when the rate-limit budget is too low.
 * - Records truncation when stopped before completion.
 */

/** Options for a paginated REST request. */
export interface PaginationOptions {
  /**
   * Maximum number of pages to fetch.
   * Used as a safety cap. Prefer time-window-based stopping.
   */
  maxPages: number;
  /** Items per page (GitHub max is 100 for most endpoints). */
  perPage: number;
}

/** Result of a completed pagination run. */
export interface PaginationResult<T> {
  /** All collected items across pages. */
  readonly items: T[];
  /** Total number of pages fetched. */
  readonly pagesFetched: number;
  /**
   * Whether iteration was stopped before all pages were consumed.
   * True when stopped by maxPages, budget, or predicate.
   */
  readonly truncated: boolean;
  /** Reason for truncation, if any. */
  readonly truncationReason: "max_pages" | "budget_exhausted" | "predicate" | null;
}

/**
 * Iterates a paginated REST endpoint using page-number pagination.
 *
 * @param fetchPage  - Function that fetches one page (1-indexed).
 * @param shouldContinue - Return false to stop early (e.g., left the time window).
 * @param isBudgetLow    - Return true if the rate-limit budget is too low to continue.
 * @param options        - Pagination controls.
 */
export async function paginateByPage<T>(
  fetchPage: (page: number, perPage: number) => Promise<T[]>,
  shouldContinue: (items: T[], pageIndex: number) => boolean,
  isBudgetLow: () => boolean,
  options: PaginationOptions,
): Promise<PaginationResult<T>> {
  const allItems: T[] = [];
  let page = 1;
  let truncated = false;
  let truncationReason: PaginationResult<T>["truncationReason"] = null;

  while (page <= options.maxPages) {
    if (isBudgetLow()) {
      truncated = true;
      truncationReason = "budget_exhausted";
      break;
    }

    const items = await fetchPage(page, options.perPage);

    if (items.length === 0) {
      // No more pages
      break;
    }

    allItems.push(...items);

    if (!shouldContinue(items, page)) {
      truncationReason = "predicate";
      break; // Do not set truncated=true — predicate stop is intentional (e.g., time window)
    }

    if (items.length < options.perPage) {
      // Last page (GitHub returns fewer items than perPage on the last page)
      break;
    }

    page++;

    if (page > options.maxPages) {
      truncated = true;
      truncationReason = "max_pages";
    }
  }

  return {
    items: allItems,
    pagesFetched: page,
    truncated,
    truncationReason,
  };
}

/**
 * Adds exponential backoff with jitter.
 * Used between retries and after rate-limit encounters.
 */
export async function backoffMs(
  attemptIndex: number,
  baseMs = 500,
  maxMs = 30_000,
): Promise<void> {
  const exponential = Math.min(baseMs * Math.pow(2, attemptIndex), maxMs);
  const jitter = Math.random() * exponential * 0.2;
  const waitMs = exponential + jitter;
  await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
}
