/**
 * The firm's reports, as plain rules: which months a report covers, how
 * active people are counted in each, and how a table becomes a spreadsheet
 * file. Pure, so the figures a firm is invoiced on are tested directly.
 */

/** "2026-11", for a calendar month. */
export type Month = string;

/** The last `count` months up to and including the one `today` is in, oldest first. */
export function monthsUpTo(today: string, count: number): Month[] {
  const [y, m] = today.split('-').map(Number);
  const months: Month[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    months.push(d.toISOString().slice(0, 7));
  }
  return months;
}

/** The first instant of a month and of the month after it, as UTC dates, for a query's range. */
export function monthBounds(first: Month, last: Month): { since: string; until: string } {
  const [y, m] = last.split('-').map(Number);
  const after = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
  return { since: `${first}-01`, until: after };
}

/** "November 2026". */
export function monthName(month: Month): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export interface ActiveMonth {
  month: Month;
  /** The people active in it, by id. */
  people: string[];
}

/**
 * Active people per month: one count per person per month, however much
 * they did, from rows of (person, month) that may repeat. Every month asked
 * for is present, with nobody in it when nobody was active.
 */
export function activeByMonth(
  rows: Array<{ user_id: string; month: string }>,
  months: Month[],
): ActiveMonth[] {
  const byMonth = new Map<Month, Set<string>>(months.map((m) => [m, new Set()]));
  for (const row of rows) {
    byMonth.get(row.month.slice(0, 7))?.add(row.user_id);
  }
  return months.map((month) => ({ month, people: [...(byMonth.get(month) ?? [])].sort() }));
}

/**
 * One spreadsheet cell. Quoted when it has to be, and a cell that starts
 * with =, +, - or @ is given a leading apostrophe, so a name somebody typed
 * cannot become a formula when the firm opens the file.
 */
export function csvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** A table as a CSV file, with a byte-order mark so Excel reads the names right. */
export function toCsv(header: string[], rows: Array<Array<string | number | boolean | null | undefined>>): string {
  const lines = [header, ...rows].map((row) => row.map(csvCell).join(','));
  return `﻿${lines.join('\r\n')}\r\n`;
}

/** A file name a firm can file: letters, digits and hyphens only. */
export function fileSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'report'
  );
}
