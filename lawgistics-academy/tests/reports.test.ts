import test from 'node:test';
import assert from 'node:assert/strict';

import { activeByMonth, csvCell, fileSlug, monthBounds, monthName, monthsUpTo, toCsv } from '../src/lib/reports/rules';

/**
 * A firm is invoiced on these figures, so the rules are tested directly:
 * one count per person per month, every month present, and a spreadsheet a
 * typed name cannot turn into a formula.
 */

test('the months a report covers run up to this one, oldest first, across a year end', () => {
  assert.deepEqual(monthsUpTo('2027-02-11', 4), ['2026-11', '2026-12', '2027-01', '2027-02']);
  assert.deepEqual(monthBounds('2026-11', '2027-02'), { since: '2026-11-01', until: '2027-03-01' });
  assert.equal(monthName('2026-11'), 'November 2026');
});

test('a person counts once a month however much they did, and an empty month is still there', () => {
  const rows = [
    { user_id: 'b', month: '2026-11-01' },
    { user_id: 'a', month: '2026-11-01' },
    { user_id: 'a', month: '2026-11-01' },
    { user_id: 'a', month: '2027-01-01' },
    { user_id: 'z', month: '2025-01-01' },
  ];
  assert.deepEqual(activeByMonth(rows, ['2026-11', '2026-12', '2027-01']), [
    { month: '2026-11', people: ['a', 'b'] },
    { month: '2026-12', people: [] },
    { month: '2027-01', people: ['a'] },
  ]);
});

test('a spreadsheet cell is quoted when it must be and never becomes a formula', () => {
  assert.equal(csvCell('Aisyah'), 'Aisyah');
  assert.equal(csvCell('Tan, Wei'), '"Tan, Wei"');
  assert.equal(csvCell('She said "yes"'), '"She said ""yes"""');
  assert.equal(csvCell('=HYPERLINK("x")'), `"'=HYPERLINK(""x"")"`);
  assert.equal(csvCell('+60123'), "'+60123");
  assert.equal(csvCell(-3), '-3');
  assert.equal(csvCell(null), '');
  const file = toCsv(['Name', 'Days'], [['Aisyah', 12]]);
  assert.equal(file, '﻿Name,Days\r\nAisyah,12\r\n');
});

test('a file name is plain', () => {
  assert.equal(fileSlug('Thomas Philip: Active trainees!'), 'thomas-philip-active-trainees');
  assert.equal(fileSlug('***'), 'report');
});

import fs from 'node:fs';
import path from 'node:path';

const read = (rel: string) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

test('the report files are the firm administrator\'s, checked before anything is read', () => {
  const route = read('src/app/admin/reports/export/[kind]/route.ts');
  const body = route.slice(route.indexOf('export async function GET'));
  const guard = body.indexOf('checkFirmAdmin(');
  assert.ok(guard > 0, 'the export route checks for a firm administrator');
  for (const read of ['firmPeople(', 'registerRows(', 'activeMonths(', 'progressFor(']) {
    const at = body.indexOf(read);
    assert.ok(at === -1 || at > guard, `${read} runs after the check`);
  }
  assert.match(body, /status: 403/);
  assert.match(read('src/app/admin/reports/page.tsx'), /requireFirmAdmin\(/);
});

test('a certificate PDF is only ever the signed-in learner\'s own', () => {
  const route = read('src/app/(app)/certificate/pdf/route.ts');
  assert.match(route, /getCurrentUser\(\)/);
  assert.match(route, /certificateStatus\(user\.id,/);
  assert.doesNotMatch(route, /searchParams|params/, 'it takes no id from the address');
});

test('downloads are never cached', () => {
  assert.match(read('src/lib/reports/pdf.ts'), /'Cache-Control': 'private, no-store'/);
});

import { cohortImprovement, improvementFor, signed } from '../src/lib/reports/rules';

/**
 * The start-to-end report (the pilot a firm is sold on): a person's first
 * diagnostic against their latest. It must never invent a change from one
 * sitting, and an average counts only the people who have both.
 */

const sitting = (date: string, correct: number, of: number, scores: Record<string, number>) => ({
  completedAt: `${date}T09:00:00Z`,
  totalQuestions: of,
  totalCorrect: correct,
  domainScores: scores,
});

test('no sitting, one sitting and two are three different things', () => {
  assert.deepEqual(improvementFor([]), { sittings: 0, first: null, latest: null, change: null, areas: [] });
  const one = improvementFor([sitting('2026-11-01', 12, 30, { evidence: 50 })]);
  assert.equal(one.sittings, 1);
  assert.equal(one.first?.percent, 40);
  assert.equal(one.latest, null, 'no latest from a single sitting');
  assert.equal(one.change, null, 'never a change from nothing');
});

test('two sittings give the change in points, overall and by area, whichever order they arrive in', () => {
  const rows = [
    sitting('2026-12-01', 21, 30, { evidence: 75, advocacy: 50, drafting: 100 }),
    sitting('2026-11-01', 12, 30, { evidence: 50, advocacy: 50 }),
  ];
  const r = improvementFor(rows);
  assert.equal(r.first?.date, '2026-11-01');
  assert.equal(r.latest?.date, '2026-12-01');
  assert.equal(r.change, 30, '40% to 70%');
  const by = Object.fromEntries(r.areas.map((a) => [a.slug, a]));
  assert.equal(by.evidence.change, 25);
  assert.equal(by.advocacy.change, 0);
  assert.equal(by.drafting.change, null, 'an area missing from the first paper has no change');
  assert.equal(signed(30), '+30');
  assert.equal(signed(-4), '-4');
  assert.equal(signed(0), '0');
  assert.equal(signed(null), '');
});

test('the cohort average counts only people with two sittings, and says how many were left out', () => {
  const a = improvementFor([sitting('2026-11-01', 12, 30, { evidence: 40 }), sitting('2026-12-01', 21, 30, { evidence: 80 })]);
  const b = improvementFor([sitting('2026-11-01', 15, 30, { evidence: 60 }), sitting('2026-12-01', 18, 30, { evidence: 70 })]);
  const c = improvementFor([sitting('2026-11-02', 30, 30, { evidence: 100 })]);
  const none = improvementFor([]);
  const cohort = cohortImprovement([a, b, c, none]);
  assert.equal(cohort.measured, 2);
  assert.equal(cohort.startedOnly, 1);
  assert.equal(cohort.none, 1);
  assert.equal(cohort.averageFirst, 45, 'the person with one sitting is not in the average');
  assert.equal(cohort.averageLatest, 65);
  assert.equal(cohort.averageChange, 20);
  assert.deepEqual(cohort.areas, [{ slug: 'evidence', people: 2, before: 50, after: 75, change: 25 }]);
  const empty = cohortImprovement([none]);
  assert.equal(empty.averageChange, null);
});
