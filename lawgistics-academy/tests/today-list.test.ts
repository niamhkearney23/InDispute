import assert from 'node:assert/strict';
import test from 'node:test';
import { doneCount, todaysHomework, type TodayInput } from '../src/lib/homework/today-list';

const base: TodayInput = {
  today: '2026-10-17',
  beforeYouBegin: null,
  matter: null,
  needsDiagnostic: false,
  trainingOpen: true,
  rounds: null,
  roundSize: 10,
  goal: { questions: 10, answered: 3 },
  homework: null,
  work: [],
  session: null,
  nextModule: null,
};

const round = (number: number, state: string, answered = 0) => ({
  number,
  state,
  answered,
  opensLabel: `${6 + number}am`,
  closesLabel: `${7 + number}am`,
});

test('an open round leads, with what is left and when it closes', () => {
  const items = todaysHomework({ ...base, rounds: [round(1, 'done', 10), round(2, 'open', 3), round(3, 'upcoming'), round(4, 'upcoming')] });
  assert.equal(items[0].label, 'Round 2 questions');
  assert.equal(items[0].meta, '7 left · closes 9am');
  assert.equal(items[0].done, false);
  assert.equal(items[0].urgent, true);
});

test('between rounds it says when the next opens; after the last, how many were done', () => {
  const between = todaysHomework({ ...base, rounds: [round(1, 'done', 10), round(2, 'missed'), round(3, 'upcoming'), round(4, 'upcoming')] });
  assert.equal(between[0].meta, 'Opens at 9am · 1 of 4 done so far');
  const after = todaysHomework({ ...base, rounds: [round(1, 'done', 10), round(2, 'done', 10), round(3, 'missed'), round(4, 'not_applicable')] });
  assert.equal(after[0].meta, '2 of 3 done');
  assert.equal(after[0].done, false);
});

test('somebody without rounds is ticked once they reach their daily goal', () => {
  assert.equal(todaysHomework(base)[0].done, false);
  assert.equal(todaysHomework({ ...base, goal: { questions: 10, answered: 12 } })[0].done, true);
});

test('no training line when there is nothing to train on, and the diagnostic comes first', () => {
  assert.deepEqual(todaysHomework({ ...base, trainingOpen: false }), []);
  const items = todaysHomework({ ...base, needsDiagnostic: true });
  assert.deepEqual(items.map((i) => i.key), ['diagnostic']);
});

test('work taken on: soonest due first, handed in counts as done, Good is left off', () => {
  const items = todaysHomework({
    ...base,
    trainingOpen: false,
    work: [
      { id: 'b', title: 'Chronology', dueOn: '2026-10-20', state: 'none' },
      { id: 'a', title: 'List of authorities', dueOn: '2026-10-17', state: 'none' },
      { id: 'c', title: 'Bundle index', dueOn: '2026-10-15', state: 'good' },
      { id: 'd', title: 'Letter', dueOn: '2026-10-16', state: 'waiting' },
    ],
  });
  assert.deepEqual(items.map((i) => i.label), ['Letter', 'List of authorities', 'Chronology']);
  assert.equal(items[0].done, true);
  assert.equal(items[1].meta, 'Hand in today');
  assert.equal(items[1].urgent, true);
});

test('a video is listed but never ticked, so it does not count towards done', () => {
  const items = todaysHomework({ ...base, goal: { questions: 10, answered: 10 }, session: { title: 'How a file is organised' } });
  assert.equal(items[1].done, null);
  assert.deepEqual(doneCount(items), { done: 1, of: 1 });
});

test('the day homework and the next module are on the list, a finished module is not', () => {
  const items = todaysHomework({
    ...base,
    homework: { day: 6, title: 'Read a pleading', done: true },
    nextModule: { slug: 'courts', name: 'Finding the right court', correctOnce: 2, total: 7 },
  });
  assert.deepEqual(items.map((i) => i.key), ['training', 'homework', 'module']);
  assert.equal(items[1].done, true);
  const finished = todaysHomework({ ...base, nextModule: { slug: 'x', name: 'X', correctOnce: 7, total: 7 } });
  assert.ok(!finished.some((i) => i.key === 'module'));
});

test('what the firm needs first is the first line, and an open matter is on the list', () => {
  const items = todaysHomework({
    ...base,
    beforeYouBegin: { label: 'Your joining list', meta: '3 things to do before you begin', href: '/start' },
    matter: { id: 'm1', title: 'Judgment in default' },
  });
  assert.equal(items[0].key, 'before');
  assert.equal(items[0].urgent, true);
  assert.ok(items.some((i) => i.key === 'matter' && i.href === '/matters/m1'));
});

test('the training line can be started from the list, except while waiting for the next round', () => {
  assert.equal(todaysHomework(base)[0].start, 'Carry on');
  assert.equal(todaysHomework({ ...base, goal: { questions: 10, answered: 0 } })[0].start, 'Start');
  const open = todaysHomework({ ...base, rounds: [round(1, 'open', 0)] });
  assert.equal(open[0].start, 'Start');
  const waiting = todaysHomework({ ...base, rounds: [round(1, 'done', 10), round(2, 'upcoming')] });
  assert.equal(waiting[0].start, undefined);
});
