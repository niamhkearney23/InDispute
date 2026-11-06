import assert from 'node:assert/strict';
import test from 'node:test';
import { HOMEWORK_DAYS } from '../src/content/seed/homework';
import { PROGRAMME_BOOK, READING_DAYS, READING_WEEKS, readingForDay } from '../src/content/seed/reading';
import { doneCount, todaysHomework, type TodayInput } from '../src/lib/homework/today-list';

/**
 * The programme's book, read a little each working day (the owner, November
 * 2026). A list of chapters and pages, never a copy of the book.
 */

test('one reading for every working day of the placement, in order', () => {
  assert.equal(READING_DAYS.length, HOMEWORK_DAYS);
  READING_DAYS.forEach((r, i) => assert.equal(r.day, i + 1));
  assert.match(readingForDay(1)!.what, /Introduction/);
  assert.equal(readingForDay(21), undefined);
});

test('every page of the book is read exactly once, whatever the order', () => {
  // Pages 1 to 346 by number; day 1 opens with the roman-numbered front
  // matter and the last day runs from 347 to the end.
  const seen = new Map<number, number>();
  for (const r of READING_DAYS) {
    const [from, to] = r.pages.split(' to ');
    const start = /^\d+$/.test(from) ? Number(from) : 1;
    const end = /^\d+$/.test(to) ? Number(to) : start;
    if (to === 'the end') continue;
    for (let page = start; page <= end; page += 1) {
      assert.equal(seen.has(page), false, `page ${page} is on day ${seen.get(page)} and day ${r.day}`);
      seen.set(page, r.day);
    }
  }
  for (let page = 1; page <= 346; page += 1) assert.ok(seen.has(page), `page ${page} is never read`);
  assert.equal(READING_DAYS.at(-1)!.pages, '347 to the end');
  assert.match(READING_DAYS.at(-1)!.what, /Epilogue/, 'the last day finishes the book');
});

test('the weeks follow what is taught', () => {
  assert.deepEqual(Object.keys(READING_WEEKS).map(Number), [1, 2, 3, 4]);
  const week = (n: number) => READING_DAYS.filter((r) => Math.ceil(r.day / 5) === n).map((r) => r.what).join(' ');
  assert.match(READING_WEEKS[1], /What pleadings are/);
  assert.match(week(1), /Introduction/);
  assert.match(week(1), /Chapter 1/);
  assert.match(READING_WEEKS[2], /affidavits/);
  assert.match(week(2), /the claim|Chapter 2/);
  assert.match(week(2), /affidavit/, 'week 2 reads the chapter on affidavits');
});

test('no copy of the book, and nothing claims more than it is', () => {
  const all = JSON.stringify({ PROGRAMME_BOOK, READING_DAYS });
  assert.doesNotMatch(all, /https?:|drive\.google|\.pdf/i, 'never a link to a copy');
  assert.doesNotMatch(all, /\u2014/, 'no long dash');
  assert.match(PROGRAMME_BOOK.note, /England and Wales/);
});

const base: TodayInput = {
  today: '2026-11-02',
  beforeYouBegin: null,
  needsDiagnostic: false,
  trainingOpen: false,
  rounds: null,
  roundSize: 10,
  goal: { questions: 10, answered: 0 },
  homework: { day: 1, title: 'Where the precedents are', done: false },
  homeworkNote: null,
  missedHomework: 0,
  work: [],
  workOpen: 0,
  nextMatter: null,
  trainingHref: '/train',
  session: null,
  matter: null,
  nextModule: null,
};

test('Today lists the day’s reading, and never ticks or counts it', () => {
  const items = todaysHomework({ ...base, reading: { label: PROGRAMME_BOOK.title, pages: 'vii to 4' } });
  const reading = items.find((i) => i.key === 'reading');
  assert.ok(reading);
  assert.equal(reading.href, '/reading');
  assert.equal(reading.meta, 'Read: pages vii to 4');
  assert.equal(reading.done, null);
  assert.deepEqual(doneCount(items), doneCount(todaysHomework(base)), 'the reading does not change the count');
  assert.equal(todaysHomework(base).some((i) => i.key === 'reading'), false);
});
