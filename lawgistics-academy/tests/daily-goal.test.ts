import test from 'node:test';
import assert from 'node:assert/strict';
import { STREAK_MILESTONES, streakMilestoneLine } from '../src/lib/learning/milestones';
import { QUESTIONS_PER_MINUTE_GOAL } from '../src/lib/learning/config';

/**
 * The two things the dashboard and the summary now assert about somebody's day.
 * Both are quiet when wrong: a ring that never fills looks like somebody who
 * has not trained, and a milestone that fires on every session looks like
 * enthusiasm until it means nothing.
 */

const met = (answered: number, goalMinutes: number) =>
  answered >= (QUESTIONS_PER_MINUTE_GOAL[goalMinutes] ?? QUESTIONS_PER_MINUTE_GOAL[10]);

test('the goal is met at the target, not one past it', () => {
  assert.equal(met(17, 10), false);
  assert.equal(met(18, 10), true, 'eighteen is the ten minute goal');
  assert.equal(met(19, 10), true, 'more than the goal is still met');
});

test('each goal length has its own target', () => {
  assert.equal(met(10, 5), true);
  assert.equal(met(10, 20), false, 'ten questions is not a twenty minute day');
  assert.equal(met(34, 20), true);
});

test('an unknown goal length falls back rather than dividing by nothing', () => {
  assert.equal(met(18, 7), true, 'falls back to the ten minute target');
  assert.equal(met(17, 7), false);
});

test('milestones are the three we chose', () => {
  assert.deepEqual([...STREAK_MILESTONES], [7, 30, 100]);
});

test('every milestone has a line, and they differ', () => {
  const lines = STREAK_MILESTONES.map((m) => streakMilestoneLine(m));
  for (const line of lines) assert.ok(line.length > 20, 'no empty congratulation');
  assert.equal(new Set(lines).size, lines.length, 'each milestone reads differently');
});

test('the milestone line does not threaten anybody with losing it', () => {
  // The mechanic deliberately not built. If this ever fails, somebody has
  // added loss pressure to a tool people use at work.
  for (const m of STREAK_MILESTONES) {
    const line = streakMilestoneLine(m).toLowerCase();
    for (const word of ['lose', 'lost', "don't break", 'do not break', 'keep it up or']) {
      assert.ok(!line.includes(word), `${m} day line should not mention "${word}"`);
    }
  }
});
