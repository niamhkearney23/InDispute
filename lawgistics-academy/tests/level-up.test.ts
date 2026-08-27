import test from 'node:test';
import assert from 'node:assert/strict';
import { levelForXp } from '../src/lib/learning/progression';

/**
 * The level-up moment is worked out by subtraction: the level before a session
 * is the level the XP total was at before that session's XP was added. No new
 * column, and nothing that can drift out of step with the XP it describes.
 *
 * These fix the arithmetic, because the failure mode is silent. A level-up that
 * never fires looks exactly like a session where nobody levelled up, and a
 * level-up that fires every time looks like enthusiasm until somebody notices
 * it is meaningless.
 */

const crossed = (totalXp: number, awarded: number) =>
  levelForXp(Math.max(0, totalXp - awarded)).level < levelForXp(totalXp).level;

test('crossing a threshold during the session counts as a level up', () => {
  // Level 2 begins at 250.
  assert.equal(crossed(260, 30), true, '230 to 260 crosses 250');
  assert.equal(levelForXp(260).name, 'Bundle Carrier');
});

test('landing exactly on a threshold counts', () => {
  assert.equal(crossed(250, 10), true, '240 to 250 reaches the level');
});

test('a session inside one level does not', () => {
  assert.equal(crossed(300, 30), false, '270 to 300 stays in level 2');
  assert.equal(crossed(240, 40), false, '200 to 240 stays in level 1');
});

test('a first session from nothing can level somebody up', () => {
  assert.equal(crossed(0, 0), false, 'no XP, no level up');
  assert.equal(crossed(700, 700), true, 'straight to Affidavit Wrangler');
});

test('two thresholds in one session is still one level up', () => {
  // Guards the comparison being < rather than a difference of exactly one.
  const before = levelForXp(0).level;
  const after = levelForXp(800).level;
  assert.ok(after - before >= 2, 'that jump spans more than one level');
  assert.equal(crossed(800, 800), true);
});

test('the top level does not keep announcing itself', () => {
  const top = levelForXp(22000);
  assert.equal(top.xpForNextLevel, null, 'nothing above the summit');
  assert.equal(crossed(30000, 1000), false, 'already there, nothing crossed');
});
