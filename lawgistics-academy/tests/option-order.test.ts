import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deliveryOrder, optionLetter } from '../src/lib/learning/option-order';
import { QUESTIONS } from '../src/content/seed/index';

/*
 * The bank was written with the right answer second three times in four, so
 * a learner could score by picking B. Options are shown shuffled, fixed per
 * question version; these hold the shuffle to doing that job.
 */

const four = [
  { id: 'a', text: 'one' },
  { id: 'b', text: 'two' },
  { id: 'c', text: 'three' },
  { id: 'd', text: 'four' },
];

test('the same question shows the same order every time', () => {
  assert.deepEqual(deliveryOrder(four, 'version-1'), deliveryOrder(four, 'version-1'));
  // Nothing lost or added, only moved.
  assert.deepEqual(
    deliveryOrder(four, 'version-1').map((o) => o.id).sort(),
    ['a', 'b', 'c', 'd'],
  );
});

test('true and false, and a court diagram, keep their order', () => {
  const tf = [
    { id: 'true', text: 'True' },
    { id: 'false', text: 'False' },
  ];
  assert.deepEqual(deliveryOrder(tf, 'x'), tf);
  const courts = [
    { id: 'hca', text: 'High Court' },
    { id: 'fca', text: 'Federal Court' },
    { id: 'magistrates', text: 'Magistrates' },
  ];
  assert.deepEqual(deliveryOrder(courts, 'x'), courts);
});

test('letters are places on the screen', () => {
  assert.deepEqual([0, 1, 2, 3].map(optionLetter), ['A', 'B', 'C', 'D']);
});

test('across the bank, the right answer is no longer mostly in one place', () => {
  const lettered = QUESTIONS.filter(
    (q) => q.correct.length === 1 && q.options.length >= 3 && q.options.every((o) => /^[a-h]$/.test(o.id)),
  );
  assert.ok(lettered.length > 100, 'the bank is big enough to judge');
  const at = [0, 0, 0, 0, 0];
  for (const [n, q] of lettered.entries()) {
    // Any fixed per-question seed; in the app it is the version id.
    const shown = deliveryOrder(q.options, `${q.slug}-${n}`);
    at[shown.findIndex((o) => o.id === q.correct[0])]++;
  }
  const share = (i: number) => at[i] / lettered.length;
  for (let i = 0; i < 4; i++) {
    assert.ok(share(i) < 0.35, `${optionLetter(i)} is right ${Math.round(share(i) * 100)}% of the time`);
    assert.ok(share(i) > 0.15, `${optionLetter(i)} is right only ${Math.round(share(i) * 100)}% of the time`);
  }
});

test('a right answer much longer than the rest is pointed out for review', async () => {
  const { longAnswerCue } = await import('../src/lib/review/answer-cue');
  const opts = (right: string) => [
    { id: 'a', text: 'Short wrong one' },
    { id: 'b', text: right },
    { id: 'c', text: 'Another wrong one' },
  ];
  assert.equal(longAnswerCue(opts('A careful, qualified answer that says much more'), ['b']), true);
  assert.equal(longAnswerCue(opts('About the same'), ['b']), false);
  assert.equal(longAnswerCue(opts('A careful, qualified answer that says much more'), ['a', 'b']), false);
  const flagged = QUESTIONS.filter((q) => longAnswerCue(q.options, q.correct)).length;
  // Not a pass mark: the bank says how many still need evening out.
  assert.ok(flagged >= 0);
});

test('the lesson guesses are shown shuffled too', async () => {
  const { ALL_LESSONS } = await import('../src/content/seed/lessons');
  const at = [0, 0, 0, 0];
  let n = 0;
  for (const lesson of ALL_LESSONS) {
    lesson.steps.forEach((step, index) => {
      if (!step.guess) return;
      n++;
      const shown = deliveryOrder(step.guess.options, `${lesson.slug}:${index}`);
      at[shown.findIndex((o) => o.id === step.guess!.answer)]++;
    });
  }
  assert.ok(n >= 20);
  // Most guesses have two options, so an even split is about half each.
  assert.ok(Math.max(...at) / n < 0.65, `one place holds ${Math.max(...at)} of ${n} right answers`);
  const player = (await import('node:fs')).readFileSync(
    new URL('../src/app/(app)/modules/[slug]/lesson-player.tsx', import.meta.url),
    'utf8',
  );
  assert.match(player, /deliveryOrder\(guess\.options, `\$\{lesson\.slug\}:\$\{index\}`\)/);
});
