import type { Country } from '@/lib/types';

/**
 * The shape of a court hierarchy, with no courts in it.
 *
 * Kept apart from the courts themselves (court-hierarchies.ts) so that the
 * drawing components, which run in the browser, can know the shape without
 * carrying every court's description into the page's JavaScript. The courts
 * reach the browser only from the server, and only once a lawyer has signed
 * them off (see src/lib/content/service.ts).
 */

export interface Court {
  /** Stable id, used as the option id on a diagram question. */
  slug: string;
  name: string;
  /** Shown under the name when the full name is too long for a small screen. */
  short?: string;
  tier: number;
  /** Where an appeal from this court ordinarily goes. Null at the apex. */
  appealsTo: string | null;
  /**
   * A second court its appeals go to, depending on where it sits. The
   * Malaysian Sessions Court appeals to whichever High Court has its
   * territory, and drawing only one of them taught the wrong thing.
   */
  alsoAppealsTo?: string;
  note?: string;
}

export interface CourtHierarchy {
  country: Country;
  name: string;
  courts: Court[];
  /**
   * What the lines and rows mean, shown under the map. It says something
   * about the courts, so it is part of what a lawyer signs off.
   */
  legend: string;
  /**
   * What each drawn row is, in two or three words, beside the row. Only for
   * reading the picture: the label says what kind of court sits on that rung,
   * never that the courts on it are interchangeable.
   */
  tierLabels: Record<number, string>;
}

/** Courts grouped into the rows they are drawn in, apex first. */
export function tiersOf(hierarchy: CourtHierarchy): Court[][] {
  const byTier = new Map<number, Court[]>();
  for (const court of hierarchy.courts) {
    const row = byTier.get(court.tier) ?? [];
    row.push(court);
    byTier.set(court.tier, row);
  }
  return [...byTier.entries()].sort((a, b) => a[0] - b[0]).map(([, row]) => row);
}
