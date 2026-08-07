import assert from 'node:assert/strict';
import test from 'node:test';

import { dayNumber, pickForDay } from '../src/lib/facts/service';
import { FACTS } from '../src/content/seed/facts';
import { JURISDICTION_LABELS } from '../src/lib/types';

const POOL = ['a', 'b', 'c', 'd', 'e'];

test('the same date always yields the same fact', () => {
  assert.equal(pickForDay(POOL, '2026-03-10'), pickForDay(POOL, '2026-03-10'));
});

test('consecutive days yield consecutive facts', () => {
  const first = POOL.indexOf(pickForDay(POOL, '2026-03-10')!);
  const second = POOL.indexOf(pickForDay(POOL, '2026-03-11')!);
  assert.equal(second, (first + 1) % POOL.length);
});

test('nothing repeats until the whole pool has been through', () => {
  const seen = new Set<string>();
  for (let i = 0; i < POOL.length; i += 1) {
    const date = new Date(Date.UTC(2026, 2, 10 + i)).toISOString().slice(0, 10);
    seen.add(pickForDay(POOL, date)!);
  }
  assert.equal(seen.size, POOL.length, 'every fact appears exactly once per cycle');
});

test('the rotation wraps rather than running off the end', () => {
  const start = pickForDay(POOL, '2026-03-10');
  const afterOneCycle = new Date(Date.UTC(2026, 2, 10 + POOL.length))
    .toISOString()
    .slice(0, 10);
  assert.equal(pickForDay(POOL, afterOneCycle), start);
});

test('an empty pool yields nothing rather than throwing', () => {
  assert.equal(pickForDay([], '2026-03-10'), null);
});

test('a single fact is shown every day rather than breaking the modulo', () => {
  assert.equal(pickForDay(['only'], '2026-03-10'), 'only');
  assert.equal(pickForDay(['only'], '2026-09-01'), 'only');
});

test('day numbers are stable and increment by one per day', () => {
  assert.equal(dayNumber('1970-01-01'), 0);
  assert.equal(dayNumber('1970-01-02'), 1);
  assert.equal(dayNumber('2026-03-11') - dayNumber('2026-03-10'), 1);
  assert.equal(dayNumber('2027-01-01') - dayNumber('2026-01-01'), 365);
});

test('the shipped fact pool is sound', () => {
  assert.ok(FACTS.length >= 30, `expected a month or more of facts, got ${FACTS.length}`);

  const slugs = new Set<string>();
  for (const fact of FACTS) {
    assert.ok(!slugs.has(fact.slug), `duplicate fact slug: ${fact.slug}`);
    slugs.add(fact.slug);

    assert.ok(fact.title.length >= 10, `${fact.slug} has no real title`);
    assert.ok(fact.body.length >= 60, `${fact.slug} has a thin body`);
    assert.ok(
      fact.jurisdiction in JURISDICTION_LABELS,
      `${fact.slug} has an unknown jurisdiction`,
    );
  }
});
