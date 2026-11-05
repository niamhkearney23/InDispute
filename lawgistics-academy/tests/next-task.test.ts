import assert from 'node:assert/strict';
import test from 'node:test';
import { nextTask, recentlyMarkedGood, type NextTaskInput } from '../src/lib/homework/next-task';

/**
 * "Your next task" (the owner, November 2026): one action on Today saying
 * what to do, when it is due and where the feedback is, with work sent back
 * leading the way back into practice.
 */

const base: NextTaskInput = {
  today: '2026-11-04',
  beforeYouBegin: null,
  needsDiagnostic: false,
  openRound: null,
  nextRound: null,
  openMatter: null,
  returnedMatter: null,
  work: [],
  homework: null,
  goal: null,
  trainingOpen: true,
};

test('nothing due is nothing, not an invented task', () => {
  assert.equal(nextTask(base), null);
});

test('every task says what, and where the feedback is', () => {
  const inputs: NextTaskInput[] = [
    { ...base, beforeYouBegin: { label: 'Your joining list', meta: '3 things to do', href: '/start' } },
    { ...base, openRound: { number: 2, closesLabel: '9am', left: 6 } },
    { ...base, work: [{ id: 'w', title: 'Chronology', dueOn: '2026-11-05', state: 'none' }] },
    { ...base, work: [{ id: 'w', title: 'Chronology', dueOn: null, state: 'again' }] },
    { ...base, homework: { day: 3, title: 'Read the claim', done: false } },
    { ...base, goal: { questions: 10, answered: 4 } },
  ];
  for (const input of inputs) {
    const t = nextTask(input);
    assert.ok(t, JSON.stringify(input));
    assert.ok(t.title.length > 5 && t.feedback.length > 10 && t.href.length > 0, t.key);
    assert.doesNotMatch(`${t.title} ${t.detail} ${t.feedback}`, /\u2014/, 'no long dash');
  }
});

test('work sent back comes before handing in anything new, and links to the feedback', () => {
  const t = nextTask({
    ...base,
    homework: { day: 3, title: 'Read the claim', done: false },
    work: [
      { id: 'new', title: 'Letter before action', dueOn: '2026-11-04', state: 'none' },
      { id: 'back', title: 'Chronology', dueOn: '2026-11-06', state: 'again' },
    ],
  })!;
  assert.equal(t.key, 'again-back');
  assert.equal(t.href, '/work/back#feedback');
  assert.match(t.title, /another go/);
  assert.equal(t.urgent, true);
});

test('a time-boxed round outranks work sent back; the firm’s joining list outranks both', () => {
  const sent = [{ id: 'back', title: 'Chronology', dueOn: null, state: 'again' }];
  assert.equal(nextTask({ ...base, work: sent, openRound: { number: 1, closesLabel: '8am', left: 10 } })!.key, 'round');
  assert.equal(
    nextTask({
      ...base,
      work: sent,
      openRound: { number: 1, closesLabel: '8am', left: 10 },
      beforeYouBegin: { label: 'Your joining list', meta: '1 thing to do', href: '/start' },
    })!.key,
    'before',
  );
});

test('handing in: overdue first, and said to be late', () => {
  const t = nextTask({
    ...base,
    work: [
      { id: 'later', title: 'Later', dueOn: '2026-11-10', state: 'none' },
      { id: 'late', title: 'Late', dueOn: '2026-11-01', state: 'none' },
      { id: 'waiting', title: 'Handed in', dueOn: '2026-10-30', state: 'waiting' },
    ],
  })!;
  assert.equal(t.key, 'hand-in-late');
  assert.match(t.due ?? '', /^Was due/);
  assert.equal(t.urgent, true);
});

test('a practice file sent back is a route back into practice too', () => {
  const t = nextTask({ ...base, returnedMatter: { id: 'm1', title: 'Judgment in default' } })!;
  assert.equal(t.href, '/matters/m1#feedback');
});

test('a trainee between rounds is told when the next one opens', () => {
  const t = nextTask({ ...base, nextRound: { number: 3, opensLabel: '9am' } })!;
  assert.equal(t.key, 'round-next');
  assert.match(t.title, /9am/);
});

test('the end of the loop: work marked Good in the last few days', () => {
  const now = new Date('2026-11-04T10:00:00Z');
  const work = [
    { id: 'old', title: 'Old', dueOn: null, state: 'good', markedAt: '2026-10-20T10:00:00Z' },
    { id: 'new', title: 'New', dueOn: null, state: 'good', markedAt: '2026-11-03T10:00:00Z' },
    { id: 'back', title: 'Back', dueOn: null, state: 'again', markedAt: '2026-11-04T09:00:00Z' },
  ];
  assert.deepEqual(recentlyMarkedGood(work, now), { id: 'new', title: 'New' });
  assert.equal(recentlyMarkedGood(work.slice(0, 1), now), null);
});

test('the card names the checklist line it is about, so the page has one Start', () => {
  assert.equal(nextTask({ ...base, goal: { questions: 10, answered: 0 } })!.listKey, 'training');
  assert.equal(nextTask({ ...base, goal: { questions: 10, answered: 0 } })!.startsTraining, true);
  assert.equal(nextTask({ ...base, openRound: { number: 1, closesLabel: '8am', left: 10 } })!.listKey, 'training');
  assert.equal(
    nextTask({ ...base, work: [{ id: 'w1', title: 'Chronology', dueOn: null, state: 'again' }] })!.listKey,
    'work-w1',
  );
  assert.equal(nextTask({ ...base, homework: { day: 2, title: 'Read', done: false } })!.listKey, 'homework');
  assert.equal(nextTask({ ...base, returnedMatter: { id: 'm', title: 'File' } })!.listKey, null);
  assert.ok(!nextTask({ ...base, homework: { day: 2, title: 'Read', done: false } })!.startsTraining);
});
