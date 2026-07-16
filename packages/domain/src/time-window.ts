/**
 * Time window and timestamp primitives.
 *
 * All times are UTC. ISO 8601 strings are used at API boundaries;
 * Date objects are used for internal arithmetic.
 */

declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

/** An ISO 8601 date-time string in UTC, e.g. "2024-01-01T00:00:00Z". */
export type ISODateString = Brand<string, "ISODateString">;

/**
 * A closed time window [from, to] over which analytics are computed.
 *
 * Both boundaries are inclusive. The analytics engine must not fetch
 * or attribute data outside this window.
 */
export interface TimeWindow {
  /** Inclusive start of the window (UTC). */
  readonly from: ISODateString;
  /** Inclusive end of the window (UTC). */
  readonly to: ISODateString;
}

/** Constructs a typed ISO date string. Use only at ingestion/parsing boundaries. */
export function toISODateString(raw: string): ISODateString {
  return raw as ISODateString;
}

/** Returns a {@link TimeWindow} covering a full calendar year in UTC. */
export function yearWindow(year: number): TimeWindow {
  return {
    from: toISODateString(`${year.toString()}-01-01T00:00:00Z`),
    to: toISODateString(`${year.toString()}-12-31T23:59:59Z`),
  };
}

/** Returns the current year as a full calendar {@link TimeWindow}. */
export function currentYearWindow(): TimeWindow {
  return yearWindow(new Date().getUTCFullYear());
}

/** Returns the number of days covered by the window (inclusive). */
export function windowDurationDays(window: TimeWindow): number {
  const from = new Date(window.from).getTime();
  const to = new Date(window.to).getTime();
  return Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
}
