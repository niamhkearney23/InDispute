/**
 * A cohort's clock: which timezone its mornings run on, which hours its
 * rounds open at, and which public holidays it skips.
 *
 * Each firm runs its own intakes, and not every firm is in Kuala Lumpur, so
 * these come from the trainee's cohort (0041). Somebody in no cohort keeps
 * the programme as it was first built: Kuala Lumpur time, rounds at 7, 8, 9
 * and 10am, and the Malaysian holidays in holidays.ts.
 *
 * Pure, so the rounds, the homework days and the forms all read one set of
 * rules and the tests can check them directly.
 */
import { HOLIDAYS } from '@/content/holidays';

export interface Schedule {
  /** An IANA timezone, from TIMEZONES. */
  timezone: string;
  /** The local hours the rounds open at, earliest first. Each round is open for its hour. */
  roundHours: number[];
  /** Days the programme does not run, as YYYY-MM-DD to the holiday's name. */
  holidays: Record<string, string>;
}

/** The programme as it was first built, for anybody in no cohort. */
export const DEFAULT_SCHEDULE: Schedule = {
  timezone: 'Asia/Kuala_Lumpur',
  roundHours: [7, 8, 9, 10],
  holidays: HOLIDAYS,
};

/**
 * The timezones a cohort can run on, with the city the page names. A short
 * list rather than every zone there is: a firm picks its office's city, and
 * a name it recognises is safer than a free-text zone it could mistype.
 */
export const TIMEZONES: ReadonlyArray<readonly [zone: string, city: string]> = [
  ['Asia/Kuala_Lumpur', 'Kuala Lumpur'],
  ['Asia/Kuching', 'Kuching'],
  ['Asia/Singapore', 'Singapore'],
  ['Asia/Jakarta', 'Jakarta'],
  ['Asia/Bangkok', 'Bangkok'],
  ['Asia/Manila', 'Manila'],
  ['Asia/Hong_Kong', 'Hong Kong'],
  ['Asia/Kolkata', 'India'],
  ['Asia/Dubai', 'Dubai'],
  ['Australia/Perth', 'Perth'],
  ['Australia/Darwin', 'Darwin'],
  ['Australia/Adelaide', 'Adelaide'],
  ['Australia/Brisbane', 'Brisbane'],
  ['Australia/Sydney', 'Sydney'],
  ['Australia/Melbourne', 'Melbourne'],
  ['Australia/Hobart', 'Hobart'],
  ['Pacific/Auckland', 'Auckland'],
  ['Europe/London', 'London'],
];

/** The hours a round may open at: 5am to 8pm, so the last closes by 9pm. */
export const ROUND_HOUR_CHOICES = Array.from({ length: 16 }, (_, i) => i + 5);
/** At most this many rounds a day. */
export const MAX_ROUNDS = 8;

export function knownTimezone(zone: string): boolean {
  return TIMEZONES.some(([z]) => z === zone);
}

/** "Kuala Lumpur time". */
export function zoneName(schedule: Schedule): string {
  const city = TIMEZONES.find(([z]) => z === schedule.timezone)?.[1] ?? schedule.timezone;
  return `${city} time`;
}

/** "7am", "12pm", "1pm". */
export function hourLabel(hour: number): string {
  const h = hour % 24;
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve}${h >= 12 ? 'pm' : 'am'}`;
}

/** "7, 8, 9 and 10am" or "9am, 1pm and 4pm": the round times as a reader says them. */
export function roundTimes(schedule: Schedule): string {
  const hours = schedule.roundHours;
  const sameHalf = hours.every((h) => h < 12) || hours.every((h) => h >= 12);
  const parts = sameHalf
    ? hours.map((h, i) => (i === hours.length - 1 ? hourLabel(h) : String(h % 12 === 0 ? 12 : h % 12)))
    : hours.map(hourLabel);
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/** "four", for "four rounds of ten questions". */
export function roundCountWord(schedule: Schedule): string {
  const words = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
  return words[schedule.roundHours.length] ?? String(schedule.roundHours.length);
}

/**
 * Round hours from a form: distinct whole hours from the allowed choices,
 * earliest first, one to MAX_ROUNDS of them. Null when they are not.
 */
export function readRoundHours(values: unknown[]): number[] | null {
  const hours = [...new Set(values.map((v) => Number(v)))].sort((a, b) => a - b);
  if (hours.length < 1 || hours.length > MAX_ROUNDS) return null;
  if (!hours.every((h) => ROUND_HOUR_CHOICES.includes(h))) return null;
  return hours;
}

export type HolidayRead =
  | { ok: true; holidays: Record<string, string> }
  | { ok: false; error: string };

/**
 * Holidays typed one to a line, a date then its name: "2026-11-09 Deepavali".
 * The date must be a real day; the name is optional and kept short.
 */
export function readHolidays(text: string): HolidayRead {
  const holidays: Record<string, string> = {};
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 60) return { ok: false, error: 'That is more than 60 holidays. Keep to the ones in the programme.' };
  for (const line of lines) {
    const match = /^(\d{4}-\d{2}-\d{2})\s*(.*)$/.exec(line);
    const date = match?.[1];
    if (!date || !realDate(date)) {
      return { ok: false, error: `"${line.slice(0, 40)}" does not start with a date written as 2026-11-09.` };
    }
    holidays[date] = (match[2] ?? '').trim().slice(0, 60) || 'Public holiday';
  }
  return { ok: true, holidays };
}

/** Holidays written back out, one to a line, for the form. */
export function writeHolidays(holidays: Record<string, string>): string {
  return Object.keys(holidays)
    .sort()
    .map((d) => `${d} ${holidays[d]}`)
    .join('\n');
}

export function realDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}

/**
 * A cohort row as the database stores it, made into a schedule. Anything
 * that does not read cleanly falls back to the default rather than running
 * nobody's mornings on a broken clock.
 */
export function scheduleFromRow(row: {
  timezone?: unknown;
  round_hours?: unknown;
  holidays?: unknown;
} | null): Schedule {
  if (!row) return DEFAULT_SCHEDULE;
  const timezone =
    typeof row.timezone === 'string' && knownTimezone(row.timezone)
      ? row.timezone
      : DEFAULT_SCHEDULE.timezone;
  const roundHours =
    (Array.isArray(row.round_hours) ? readRoundHours(row.round_hours) : null) ??
    DEFAULT_SCHEDULE.roundHours;
  const holidays: Record<string, string> = {};
  if (Array.isArray(row.holidays)) {
    for (const h of row.holidays as Array<{ date?: unknown; name?: unknown }>) {
      if (typeof h?.date === 'string' && realDate(h.date)) {
        holidays[h.date] = typeof h.name === 'string' && h.name ? h.name : 'Public holiday';
      }
    }
  }
  return { timezone, roundHours, holidays };
}

/** Holidays as the database stores them: a list of { date, name }, by date. */
export function holidaysToRow(holidays: Record<string, string>): Array<{ date: string; name: string }> {
  return Object.keys(holidays)
    .sort()
    .map((date) => ({ date, name: holidays[date] }));
}

/** "November 2026": when an intake starts, as the public pages say it. */
export function monthYear(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
