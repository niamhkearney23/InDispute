import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreOverTime } from '../src/lib/learning/score-history';

const KL = 'Asia/Kuala_Lumpur';
const mark = (answeredAt: string, correct: boolean) => ({ answeredAt, correct });

test('nothing answered gives no days', () => {
  assert.deepEqual(scoreOverTime([], KL), []);
});

test('all right stays at 100, and a wrong answer brings the overall down for good', () => {
  const days = scoreOverTime(
    [
      mark('2026-11-02T00:00:00Z', true),
      mark('2026-11-02T00:05:00Z', true),
      mark('2026-11-03T00:00:00Z', false),
      mark('2026-11-03T00:05:00Z', true),
      mark('2026-11-04T00:00:00Z', true),
    ],
    KL,
  );
  assert.deepEqual(
    days.map((d) => [d.date, d.right, d.answered, d.dayScore, d.overall]),
    [
      ['2026-11-02', 2, 2, 100, 100],
      ['2026-11-03', 1, 2, 50, 75],
      ['2026-11-04', 1, 1, 100, 80],
    ],
  );
});

test('days are the learner’s own, not the server’s', () => {
  // 11pm UTC on 1 November is 7am on 2 November in Kuala Lumpur.
  const days = scoreOverTime([mark('2026-11-01T23:00:00Z', true)], KL);
  assert.equal(days[0].date, '2026-11-02');
});

test('answers given out of order are still counted in order', () => {
  const days = scoreOverTime(
    [mark('2026-11-03T00:00:00Z', false), mark('2026-11-02T00:00:00Z', true)],
    KL,
  );
  assert.deepEqual(days.map((d) => d.overall), [100, 50]);
});
