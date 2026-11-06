import assert from 'node:assert/strict';
import test from 'node:test';
import { HOMEWORK_DAYS } from '../src/content/seed/homework';
import fs from 'node:fs';
import path from 'node:path';
import {
  PROGRAMME_BOOK,
  READING_BY_WEEK,
  READING_DAYS,
  READING_WEEKS,
  readingForDay,
  readingForWeek,
  readingWeekOf,
  startsAWeek,
} from '../src/content/seed/reading';
import { doneCount, todaysHomework, type TodayInput } from '../src/lib/homework/today-list';

const read = (file: string) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

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
  homework: { day: 1, title: 'Read the pleadings', done: false },
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

test('Today lists the week’s reading, and never ticks or counts it', () => {
  const items = todaysHomework({
    ...base,
    reading: { label: 'Welcome to week 1: this week’s reading', detail: `${PROGRAMME_BOOK.title}, pages vii to 32` },
  });
  const reading = items.find((i) => i.key === 'reading');
  assert.ok(reading);
  assert.equal(reading.href, '/reading');
  assert.equal(reading.meta, `${PROGRAMME_BOOK.title}, pages vii to 32`);
  assert.equal(reading.done, null);
  assert.deepEqual(doneCount(items), doneCount(todaysHomework(base)), 'the reading does not change the count');
  assert.equal(todaysHomework(base).some((i) => i.key === 'reading'), false);
});

test('the reading is set a week at a time, and said on the first day of each week only', () => {
  // The owner, November 2026: "welcome to week 1, this week's reading ...
  // but don't say it daily".
  assert.deepEqual(READING_BY_WEEK.map((w) => w.week), [1, 2, 3, 4]);
  for (const w of READING_BY_WEEK) {
    assert.equal(w.theme, READING_WEEKS[w.week]);
    assert.ok(w.book.title, 'every week names its book');
    // The week's pages begin where its first day's do.
    const first = READING_DAYS.find((d) => readingWeekOf(d.day) === w.week)!;
    assert.equal(w.pages.split(' ')[0], first.pages.split(' ')[0], `week ${w.week} starts on the wrong page`);
  }
  assert.deepEqual(
    Array.from({ length: 20 }, (_, i) => i + 1).filter(startsAWeek),
    [1, 6, 11, 16],
  );
  assert.equal(readingWeekOf(5), 1);
  assert.equal(readingWeekOf(6), 2);
  assert.equal(readingWeekOf(20), 4);
  assert.equal(readingForWeek(2)?.week, 2);
  const today = read('src/app/(app)/dashboard/page.tsx');
  assert.match(today, /startsAWeek\(homework\.day\)/, 'Today says it only as a week starts');
  assert.doesNotMatch(today, /readingForDay/, 'Today no longer lists the day’s pages');
});
