import test from 'node:test';
import assert from 'node:assert/strict';
import { PROGRAMME_WEEKS, boxesForWeek, weekOfDay } from '../src/content/programme-plan';
import { CERTIFICATION_BOXES } from '../src/content/seed/certification-boxes';
import { HOMEWORK_TASKS } from '../src/content/seed/homework';

/* The plan and the register are the same list read two ways, so the plan
   has to produce what the register requires: every spine box, and at least
   one advocacy box, spread over four weeks that cover the twenty days. */

test('the four weeks cover the twenty homework days, five each', () => {
  assert.equal(PROGRAMME_WEEKS.length, 4);
  for (const week of PROGRAMME_WEEKS) {
    const days = HOMEWORK_TASKS.filter((t) => weekOfDay(t.day) === week.number);
    assert.equal(days.length, 5, `week ${week.number} has ${days.length} days`);
  }
  assert.equal(weekOfDay(1), 1);
  assert.equal(weekOfDay(5), 1);
  assert.equal(weekOfDay(6), 2);
  assert.equal(weekOfDay(20), 4);
});

test('every box a week names exists, and no box is planned twice', () => {
  const seen = new Set<number>();
  for (const week of PROGRAMME_WEEKS) {
    assert.equal(boxesForWeek(week).length, week.boxes.length, `week ${week.number} names a box that does not exist`);
    for (const n of week.boxes) {
      assert.ok(!seen.has(n), `box ${n} is planned in two weeks`);
      seen.add(n);
    }
  }
});

test('the plan produces the whole spine, and at least one advocacy piece', () => {
  const planned = new Set(PROGRAMME_WEEKS.flatMap((w) => w.boxes));
  for (const box of CERTIFICATION_BOXES.filter((b) => b.isSpine)) {
    assert.ok(planned.has(box.number), `spine box ${box.number} is not in the plan`);
  }
  assert.ok(
    CERTIFICATION_BOXES.some((b) => b.isAdvocacy && planned.has(b.number)),
    'no advocacy box is in the plan',
  );
  // Ten at the top grade is certification, so the plan must offer at least ten.
  assert.ok(planned.size >= 10, `the plan produces ${planned.size} pieces, certification needs ten`);
});

test('the spine is finished by the end of week two', () => {
  const byWeekTwo = new Set(PROGRAMME_WEEKS.filter((w) => w.number <= 2).flatMap((w) => w.boxes));
  for (const box of CERTIFICATION_BOXES.filter((b) => b.isSpine)) {
    assert.ok(byWeekTwo.has(box.number), `spine box ${box.number} is planned after week two`);
  }
});

test('no em dashes in the plan', () => {
  const text = JSON.stringify(PROGRAMME_WEEKS);
  assert.ok(!/[\u2013\u2014]/.test(text));
});
