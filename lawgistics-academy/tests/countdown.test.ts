import assert from 'node:assert/strict';
import test from 'node:test';

import { intakeStatus } from '../src/lib/intake/countdown';

const START = '2026-10-05';
const END = '2026-10-30';
// Noon in Kuala Lumpur on the given day.
const kl = (day: string) => new Date(`${day}T04:00:00Z`);

test('the home page counts down to the intake, then says which week it is in', () => {
  assert.equal(intakeStatus(START, END, kl('2026-10-02')), 'Starts in 3 days');
  assert.equal(intakeStatus(START, END, kl('2026-10-04')), 'Starts tomorrow');
  assert.equal(intakeStatus(START, END, kl('2026-10-05')), 'Starts today');
  assert.equal(intakeStatus(START, END, kl('2026-10-07')), 'Week 1 under way');
  assert.equal(intakeStatus(START, END, kl('2026-10-12')), 'Week 2 under way');
  assert.equal(intakeStatus(START, END, kl('2026-10-30')), 'Week 4 under way');
});

test('once the intake is over, the home page says nothing rather than something stale', () => {
  assert.equal(intakeStatus(START, END, kl('2026-10-31')), null);
});

test('the day turns over at midnight in Kuala Lumpur, not in UTC', () => {
  // 17:00 UTC on 3 October is 01:00 on 4 October in Kuala Lumpur.
  assert.equal(intakeStatus(START, END, new Date('2026-10-03T17:00:00Z')), 'Starts tomorrow');
});
