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
