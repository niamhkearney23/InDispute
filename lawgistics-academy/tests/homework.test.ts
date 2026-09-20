import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import { HOMEWORK_DAYS, HOMEWORK_TASKS, homeworkForDay, homeworkThroughDay } from '../src/content/seed/homework';
import { homeworkDay, lastArrivedDay, workingDaysElapsed } from '../src/lib/homework/rules';

const KL = 'Asia/Kuala_Lumpur';

/**
 * The content: twenty fixed working days, matched by the database's own
 * check constraint.
 */

test('there are twenty days, numbered one to twenty with no gap or repeat', () => {
  const days = HOMEWORK_TASKS.map((t) => t.day).sort((a, b) => a - b);
  assert.deepEqual(days, Array.from({ length: 20 }, (_, i) => i + 1));
  assert.equal(HOMEWORK_DAYS, 20);
});

test('every slug is unique', () => {
  const slugs = HOMEWORK_TASKS.map((t) => t.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test('every task has a task and a why', () => {
  for (const t of HOMEWORK_TASKS) {
    assert.ok(t.task.length > 0, `${t.slug} has no task`);
    assert.ok(t.why.length > 0, `${t.slug} has no why`);
  }
});

test('homeworkForDay finds the matching task, and nothing out of range', () => {
  assert.equal(homeworkForDay(1)?.slug, 'find-your-way');
  assert.equal(homeworkForDay(20)?.slug, 'handover');
  assert.equal(homeworkForDay(0), undefined);
  assert.equal(homeworkForDay(21), undefined);
  assert.equal(homeworkForDay(999), undefined);
});

test('homeworkThroughDay returns everything up to and including that day', () => {
  assert.equal(homeworkThroughDay(5).length, 5);
  assert.equal(homeworkThroughDay(0).length, 0);
  assert.equal(homeworkThroughDay(20).length, 20);
});

test('the migration accepts exactly as many days as there are tasks', () => {
  // A twenty-first task added here without touching the migration would be a
  // row the database silently refuses, on one learner, on their last day.
  const migration = fs.readFileSync(
    path.join(__dirname, '..', 'supabase', 'migrations', '0017_homework.sql'),
    'utf8',
  );
  assert.match(migration, new RegExp(`day between 1 and ${HOMEWORK_DAYS}\\b`));
});

/**
 * The calendar: which working day today is, relative to a learner's own
 * start date, in their own timezone.
 */

test('the start date itself is day one, if it falls on a weekday', () => {
  const monday = new Date('2026-01-05T09:00:00Z');
  assert.deepEqual(homeworkDay('2026-01-05', null, 'UTC', monday), { state: 'day', day: 1 });
});

test('the working days of week one count up to five', () => {
  const friday = new Date('2026-01-09T09:00:00Z');
  assert.deepEqual(homeworkDay('2026-01-05', null, 'UTC', friday), { state: 'day', day: 5 });
});

test('the weekend shows no homework, and names the day Monday will be', () => {
  const saturday = new Date('2026-01-10T09:00:00Z');
  assert.deepEqual(homeworkDay('2026-01-05', null, 'UTC', saturday), { state: 'weekend', nextDay: 6 });

  const sunday = new Date('2026-01-11T09:00:00Z');
  assert.deepEqual(homeworkDay('2026-01-05', null, 'UTC', sunday), { state: 'weekend', nextDay: 6 });
});

test('the following Monday picks up where the weekend left off', () => {
  const monday = new Date('2026-01-12T09:00:00Z');
  assert.deepEqual(homeworkDay('2026-01-05', null, 'UTC', monday), { state: 'day', day: 6 });
});

test('the twentieth working day is the last one, not yet finished', () => {
  const fridayWeekFour = new Date('2026-01-30T09:00:00Z');
  assert.deepEqual(homeworkDay('2026-01-05', null, 'UTC', fridayWeekFour), { state: 'day', day: 20 });
});

test('the Monday after day twenty is finished', () => {
  const mondayAfter = new Date('2026-02-02T09:00:00Z');
  assert.deepEqual(homeworkDay('2026-01-05', null, 'UTC', mondayAfter), { state: 'finished' });
});

test('an end date closes homework early, even mid-week', () => {
  const mondayWeekThree = new Date('2026-01-19T09:00:00Z');
  assert.deepEqual(
    homeworkDay('2026-01-05', '2026-01-16', 'UTC', mondayWeekThree),
    { state: 'finished' },
  );
});

test('a start date on a weekend puts day one on the following Monday', () => {
  const saturdayStart = new Date('2026-01-10T09:00:00Z');
  assert.deepEqual(homeworkDay('2026-01-10', null, 'UTC', saturdayStart), { state: 'weekend', nextDay: 1 });

  const followingMonday = new Date('2026-01-12T09:00:00Z');
  assert.deepEqual(homeworkDay('2026-01-10', null, 'UTC', followingMonday), { state: 'day', day: 1 });
});

test('before the placement begins, homework says how many days are left', () => {
  const beforeStart = new Date('2026-01-01T09:00:00Z');
  assert.deepEqual(
    homeworkDay('2026-01-05', null, 'UTC', beforeStart),
    { state: 'before', daysUntilStart: 4 },
  );
});

test('no start date at all is simply nothing to show', () => {
  assert.deepEqual(homeworkDay(null, null, 'UTC', new Date()), { state: 'none' });
});

test('the day is counted where the learner is, not where the server is', () => {
  // The same regression daysUntil itself is tested against: this instant is
  // still Monday afternoon in UTC, but already past midnight Tuesday in Kuala
  // Lumpur, eight hours ahead. A server-local calculation would hand a
  // Malaysian learner Monday's task on Tuesday morning.
  const lateMondayUTC = new Date('2026-01-05T17:00:00Z');
  assert.deepEqual(homeworkDay('2026-01-05', null, KL, lateMondayUTC), { state: 'day', day: 2 });
});

test('workingDaysElapsed counts whole weeks as five days each', () => {
  // Four full weeks from a Monday start is exactly twenty working days.
  assert.equal(workingDaysElapsed('2026-01-05', 27), 20);
  assert.equal(workingDaysElapsed('2026-01-05', 0), 1);
  assert.equal(workingDaysElapsed('2026-01-05', -1), 0);
});

/**
 * Catching up: a weekend does not erase the working day just before it.
 */

test('lastArrivedDay over a weekend is Friday, not zero', () => {
  const saturday = new Date('2026-01-10T09:00:00Z');
  assert.equal(lastArrivedDay(homeworkDay('2026-01-05', null, 'UTC', saturday)), 5);
});

test('lastArrivedDay on a working day is that day itself', () => {
  const friday = new Date('2026-01-09T09:00:00Z');
  assert.equal(lastArrivedDay(homeworkDay('2026-01-05', null, 'UTC', friday)), 5);
});

test('lastArrivedDay before the placement begins is zero', () => {
  const beforeStart = new Date('2026-01-01T09:00:00Z');
  assert.equal(lastArrivedDay(homeworkDay('2026-01-05', null, 'UTC', beforeStart)), 0);
});

test('lastArrivedDay once finished is the full twenty', () => {
  const mondayAfter = new Date('2026-02-02T09:00:00Z');
  assert.equal(lastArrivedDay(homeworkDay('2026-01-05', null, 'UTC', mondayAfter)), 20);
});
