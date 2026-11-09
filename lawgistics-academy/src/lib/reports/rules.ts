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

/* -------------------------------------------------------------------------- */
/* Start to end: the improvement report                                        */
/* -------------------------------------------------------------------------- */

/** One diagnostic sitting, as the report reads it. */
export interface Sitting {
  completedAt: string;
  totalQuestions: number;
  totalCorrect: number;
  /** Area slug to the share right in that area, 0 to 100. */
  domainScores: Record<string, number>;
}

export interface AreaChange {
  slug: string;
  before: number | null;
  after: number | null;
  /** Null unless both sittings have the area. */
  change: number | null;
}

export interface Improvement {
  /** How many diagnostic sittings the person has made. */
  sittings: number;
  first: { date: string; percent: number; of: number } | null;
  latest: { date: string; percent: number; of: number } | null;
  /** Percentage points, null until there are two sittings. */
  change: number | null;
  areas: AreaChange[];
}

const percentOf = (s: Sitting) =>
  s.totalQuestions > 0 ? Math.round((s.totalCorrect / s.totalQuestions) * 100) : 0;

/**
 * A person's first diagnostic sitting against their latest. Needs two to say
 * anything about change: with one it reports the start and no change, never a
 * change from nothing. The two papers are different questions (a retake
 * leaves out what was asked before), so this compares two measures of the
 * same breadth, not the same questions twice, and a report must say so.
 */
export function improvementFor(sittings: Sitting[]): Improvement {
  const ordered = [...sittings].sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  if (ordered.length === 0) return { sittings: 0, first: null, latest: null, change: null, areas: [] };
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const summary = (s: Sitting) => ({ date: s.completedAt.slice(0, 10), percent: percentOf(s), of: s.totalQuestions });
  if (ordered.length === 1) {
    return { sittings: 1, first: summary(first), latest: null, change: null, areas: [] };
  }
  const slugs = [...new Set([...Object.keys(first.domainScores), ...Object.keys(last.domainScores)])].sort();
  return {
    sittings: ordered.length,
    first: summary(first),
    latest: summary(last),
    change: percentOf(last) - percentOf(first),
    areas: slugs.map((slug) => {
      const before = slug in first.domainScores ? first.domainScores[slug] : null;
      const after = slug in last.domainScores ? last.domainScores[slug] : null;
      return { slug, before, after, change: before !== null && after !== null ? after - before : null };
    }),
  };
}

export interface CohortImprovement {
  /** People with two or more sittings, whose change can be said. */
  measured: number;
  /** People with at least one sitting but not two. */
  startedOnly: number;
  /** People with no sitting at all. */
  none: number;
  averageFirst: number | null;
  averageLatest: number | null;
  averageChange: number | null;
  /** Average first and latest per area over the people who have both. */
  areas: Array<{ slug: string; people: number; before: number; after: number; change: number }>;
}

/** The firm's people together: only those with two sittings count towards an average. */
export function cohortImprovement(all: Improvement[]): CohortImprovement {
  const measured = all.filter((i) => i.change !== null && i.first && i.latest);
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
  const bySlug = new Map<string, Array<{ before: number; after: number }>>();
  for (const i of measured) {
    for (const a of i.areas) {
      if (a.before === null || a.after === null) continue;
      const list = bySlug.get(a.slug) ?? [];
      list.push({ before: a.before, after: a.after });
      bySlug.set(a.slug, list);
    }
  }
  const averageFirst = avg(measured.map((i) => i.first!.percent));
  const averageLatest = avg(measured.map((i) => i.latest!.percent));
  return {
    measured: measured.length,
    startedOnly: all.filter((i) => i.sittings === 1).length,
    none: all.filter((i) => i.sittings === 0).length,
    averageFirst,
    averageLatest,
    averageChange: averageFirst !== null && averageLatest !== null ? averageLatest - averageFirst : null,
    areas: [...bySlug]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([slug, rows]) => {
        const before = avg(rows.map((r) => r.before))!;
        const after = avg(rows.map((r) => r.after))!;
        return { slug, people: rows.length, before, after, change: after - before };
      }),
  };
}

/** "+12", "-3", "0": a change in percentage points, signed. */
export function signed(change: number | null): string {
  if (change === null) return '';
  return change > 0 ? `+${change}` : String(change);
}
