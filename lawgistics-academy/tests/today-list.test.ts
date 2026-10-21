import assert from 'node:assert/strict';
import test from 'node:test';
import { doneCount, todaysHomework, type TodayInput } from '../src/lib/homework/today-list';

const base: TodayInput = {
  today: '2026-10-17',
  beforeYouBegin: null,
  matter: null,
  homeworkNote: null,
  missedHomework: 0,
  workOpen: 0,
  nextMatter: null,
  trainingHref: '/programme',
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

test('work taken on: what still needs doing first, soonest due first, then handed in; Good is left off', () => {
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
  assert.deepEqual(items.map((i) => i.label), ['List of authorities', 'Chronology', 'Letter']);
  assert.equal(items[0].meta, 'Hand in today');
  assert.equal(items[0].urgent, true);
  assert.equal(items[2].done, true);
  assert.equal(items[2].meta, 'Handed in · waiting for your coach');
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

test('work sent back is never pushed off the list by finished work', () => {
  // The independent review's case: three handed in, one sent back with no date.
  const items = todaysHomework({
    ...base,
    trainingOpen: false,
    work: [
      { id: 'a', title: 'A', dueOn: '2026-10-10', state: 'waiting' },
      { id: 'b', title: 'B', dueOn: '2026-10-11', state: 'waiting' },
      { id: 'c', title: 'C', dueOn: '2026-10-12', state: 'waiting' },
      { id: 'd', title: 'Sent back', dueOn: null, state: 'again' },
    ],
  });
  assert.equal(items[0].label, 'Sent back');
  assert.equal(items[0].urgent, true);
  const pieces = items.filter((i) => i.key.startsWith('work-') && !['work-open', 'work-more'].includes(i.key));
  assert.equal(pieces.length, 3);
  // The fourth is not dropped without a word.
  const more = items.find((i) => i.key === 'work-more');
  assert.equal(more?.label, '1 more piece of your work');
  assert.equal(more?.href, '/work');
});

test('three pieces or fewer: no "more" line', () => {
  const items = todaysHomework({
    ...base,
    trainingOpen: false,
    work: [{ id: 'a', title: 'A', dueOn: null, state: 'todo' }],
  });
  assert.equal(items.find((i) => i.key === 'work-more'), undefined);
});

test('sent back with a reply: the reply does not hide that another go is wanted (found by the independent review)', () => {
  const items = todaysHomework({
    ...base,
    trainingOpen: false,
    work: [{ id: 'a', title: 'Letter', dueOn: null, state: 'again', replyWaiting: true }],
  });
  assert.equal(items[0].meta, 'Your coach asked for another go · and has replied');
  assert.equal(items[0].urgent, true);
  assert.equal(items[0].done, false);
});

test('a reply from the coach is said, and work open to take is a line', () => {
  const items = todaysHomework({
    ...base,
    trainingOpen: false,
    work: [{ id: 'a', title: 'Letter', dueOn: null, state: 'waiting', replyWaiting: true }],
    workOpen: 2,
  });
  assert.equal(items[0].meta, 'Your coach has replied');
  assert.equal(items[0].urgent, true);
  assert.deepEqual(items[1], {
    key: 'work-open',
    label: '2 pieces of work you can take',
    meta: 'From your coach · put your name on one',
    href: '/work',
    done: null,
  });
});

test('the homework page is always reachable for somebody with a start date', () => {
  const weekend = todaysHomework({ ...base, trainingOpen: false, homeworkNote: { meta: 'No homework today' }, missedHomework: 2 });
  assert.deepEqual(weekend.map((i) => [i.key, i.href]), [['homework', '/homework'], ['homework-catch-up', '/homework']]);
  assert.equal(weekend[1].meta, '2 earlier days are not ticked off');
});

test('rounds that do not count today are said, and lines without a button go somewhere', () => {
  const none = todaysHomework({ ...base, rounds: [round(1, 'not_applicable'), round(2, 'not_applicable')] });
  assert.equal(none[0].done, null);
  assert.equal(none[0].href, '/programme');
  const waiting = todaysHomework({ ...base, rounds: [round(1, 'done', 10), round(2, 'upcoming')] });
  assert.equal(waiting[0].href, '/programme');
});

test('the next practice file is offered only when none is open', () => {
  const next = { id: 'm2', title: 'Judgment in default' };
  assert.ok(todaysHomework({ ...base, nextMatter: next }).some((i) => i.key === 'matter-next'));
  const open = todaysHomework({ ...base, nextMatter: next, matter: { id: 'm1', title: 'Open one' } });
  assert.ok(!open.some((i) => i.key === 'matter-next'));
});

// -----------------------------------------------------------------------------
// The homework lines, for every kind of day (the independent review's finding:
// outside a working day an intern had no way to the homework page).
// -----------------------------------------------------------------------------
import { homeworkLines } from '../src/lib/homework/today-list';

const date = (iso: string) => `[${iso}]`;

test('no start date: no homework lines at all', () => {
  assert.deepEqual(homeworkLines({ startsOn: null, day: { state: 'none' }, declared: new Set(), longDate: date }), {
    note: null,
    missed: 0,
  });
});

test('before the start: says when it begins, nothing is missed', () => {
  const r = homeworkLines({ startsOn: '2026-11-02', day: { state: 'before', daysUntilStart: 5 }, declared: new Set(), longDate: date });
  assert.equal(r.note?.meta, 'Begins [2026-11-02]: twenty tasks, one each working day');
  assert.equal(r.missed, 0);
});

test('a weekend: says when it picks up, and counts the days before it not ticked off', () => {
  const r = homeworkLines({
    startsOn: '2026-10-05',
    day: { state: 'weekend', nextDay: 6, resumesOn: '2026-10-12' },
    declared: new Set([1, 2, 4]),
    longDate: date,
  });
  assert.equal(r.note?.meta, 'None today. Day 6 picks up on Monday');
  assert.equal(r.missed, 2, 'days 3 and 5');
});

test('a public holiday is named', () => {
  const r = homeworkLines({
    startsOn: '2026-10-05',
    day: { state: 'weekend', nextDay: 3, resumesOn: '2026-10-08', holiday: 'Deepavali' },
    declared: new Set([1, 2]),
    longDate: date,
  });
  assert.equal(r.note?.meta, 'None today (Deepavali). Day 3 picks up on Thursday');
  assert.equal(r.missed, 0);
});

test('a working day: no note (the task has its own line), earlier days not ticked are counted, today is not', () => {
  const r = homeworkLines({ startsOn: '2026-10-05', day: { state: 'day', day: 6 }, declared: new Set([1, 3]), longDate: date });
  assert.equal(r.note, null);
  assert.equal(r.missed, 3, 'days 2, 4 and 5; day 6 is today');
});

test('after the last day: says so with what was recorded, and every day not ticked is missed', () => {
  const r = homeworkLines({ startsOn: '2026-09-01', day: { state: 'finished', lastDay: 20 }, declared: new Set([1, 2, 3]), longDate: date });
  assert.equal(r.note?.meta, 'You finished the four weeks: 3 of 20 recorded');
  assert.equal(r.missed, 17);
});

test('after a placement that ended early: counted out of the days it had, nothing past them missed', () => {
  const r = homeworkLines({ startsOn: '2026-09-01', day: { state: 'finished', lastDay: 10 }, declared: new Set([1, 2, 3]), longDate: date });
  assert.equal(r.note?.meta, 'Your placement is over: 3 of 10 recorded');
  assert.equal(r.missed, 7);
});
