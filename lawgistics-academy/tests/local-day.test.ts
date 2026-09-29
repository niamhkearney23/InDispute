import test from 'node:test';
import assert from 'node:assert/strict';
import { liveStreak, localMidnight, shiftLocalDate, zoneOffsetMinutes } from '../src/lib/local-day';

/* -------------------------------------------------------------------------- */
/* Midnight where the learner is                                              */
/* -------------------------------------------------------------------------- */

test('local midnight in Kuala Lumpur is 16:00 UTC the evening before', () => {
  assert.equal(
    localMidnight('Asia/Kuala_Lumpur', '2026-09-29').toISOString(),
    '2026-09-28T16:00:00.000Z',
  );
});

test('local midnight is right on the day Melbourne clocks go forward', () => {
  // 4 October 2026: AEST (+10) becomes AEDT (+11) at 2am. Midnight is still
  // +10, so 14:00 UTC the day before, not 13:00.
  assert.equal(
    localMidnight('Australia/Melbourne', '2026-10-04').toISOString(),
    '2026-10-03T14:00:00.000Z',
  );
  // The day after the change, midnight is +11.
  assert.equal(
    localMidnight('Australia/Melbourne', '2026-10-05').toISOString(),
    '2026-10-04T13:00:00.000Z',
  );
});

test('local midnight is right on the day Melbourne clocks go back', () => {
  // 5 April 2026: AEDT (+11) becomes AEST (+10) at 3am. Midnight is still +11.
  assert.equal(
    localMidnight('Australia/Melbourne', '2026-04-05').toISOString(),
    '2026-04-04T13:00:00.000Z',
  );
});

test('local midnight does not depend on the process timezone', () => {
  const before = process.env.TZ;
  process.env.TZ = 'America/Los_Angeles';
  try {
    assert.equal(
      localMidnight('Asia/Kuala_Lumpur', '2026-09-29').toISOString(),
      '2026-09-28T16:00:00.000Z',
    );
  } finally {
    if (before === undefined) delete process.env.TZ;
    else process.env.TZ = before;
  }
});

test('an unknown timezone falls back to UTC rather than throwing', () => {
  assert.equal(zoneOffsetMinutes('Nowhere/Special', new Date()), 0);
  assert.equal(localMidnight('Nowhere/Special', '2026-09-29').toISOString(), '2026-09-29T00:00:00.000Z');
});

test('shifting a local date crosses month and year ends', () => {
  assert.equal(shiftLocalDate('2026-03-01', -1), '2026-02-28');
  assert.equal(shiftLocalDate('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftLocalDate('2026-09-29', -34), '2026-08-26');
});

/* -------------------------------------------------------------------------- */
/* The streak as it stands today                                              */
/* -------------------------------------------------------------------------- */

test('a streak trained today or yesterday is alive', () => {
  assert.equal(liveStreak(6, '2026-09-29', '2026-09-29'), 6);
  assert.equal(liveStreak(6, '2026-09-28', '2026-09-29'), 6);
});

test('a streak whose owner skipped yesterday is over, whatever the table says', () => {
  assert.equal(liveStreak(6, '2026-09-27', '2026-09-29'), 0);
  assert.equal(liveStreak(6, null, '2026-09-29'), 0);
});
