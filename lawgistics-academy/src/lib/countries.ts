import type { Country, PracticeChoice } from './types';

/**
 * Which countries this deployment offers to new people (the owner, November
 * 2026: "just have Malaysian for now, and Australian keep it there but don't
 * have it visible").
 *
 * Read from NEXT_PUBLIC_OPEN_COUNTRIES, a comma-separated list such as
 * "MY,AU". Unset or unreadable, it is Malaysia alone. A closed country is
 * not offered anywhere a person chooses: the front page, sign-up, the first
 * questions and a staff invitation. Nothing is removed: its questions,
 * lessons, court map and sign-offs stay, staff still review them, and
 * anybody already on it keeps it. Opening it again is the setting alone.
 *
 * NEXT_PUBLIC_, because the browser-side forms need it too; it says nothing
 * that is not on the page anyway.
 */

const ALL: Country[] = ['MY', 'AU'];

export function parseOpenCountries(value: string | undefined): Country[] {
  const asked = new Set(
    (value ?? '')
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean),
  );
  const open = ALL.filter((c) => asked.has(c));
  return open.length > 0 ? open : ['MY'];
}

export const OPEN_COUNTRIES: Country[] = parseOpenCountries(process.env.NEXT_PUBLIC_OPEN_COUNTRIES);

export function countryOpen(country: Country, open: Country[] = OPEN_COUNTRIES): boolean {
  return open.includes(country);
}

/** A country to start someone on: the one asked for if it is open, else the first open one. */
export function openCountryOr(country: Country | undefined, open: Country[] = OPEN_COUNTRIES): Country {
  return country && open.includes(country) ? country : open[0];
}

/**
 * The choices a person may pick from: the open countries, plus the one they
 * already have, so somebody already on a closed country is never moved off
 * it by a form they did not mean to change.
 */
export function choicesFor<T extends Pick<PracticeChoice, 'country'>>(
  choices: T[],
  current: Country | null = null,
  open: Country[] = OPEN_COUNTRIES,
): T[] {
  return choices.filter((c) => open.includes(c.country) || c.country === current);
}
