import assert from 'node:assert/strict';
import test from 'node:test';
import { HOMEWORK_DAYS } from '../src/content/seed/homework';
import { PROGRAMME_BOOK, READING_DAYS, readingForDay } from '../src/content/seed/reading';
import { doneCount, todaysHomework, type TodayInput } from '../src/lib/homework/today-list';

/**
 * The programme's book, read a little each working day (the owner, November
 * 2026). A list of chapters and pages, never a copy of the book.
 */

const firstPage = (pages: string) => (/^\d+/.test(pages) ? Number(pages.split(' ')[0]) : 0);
const lastPage = (pages: string) => {
  const end = pages.split(' to ')[1];
  return /^\d+$/.test(end) ? Number(end) : Infinity;
};

test('one reading for every working day of the placement, in order', () => {
  assert.equal(READING_DAYS.length, HOMEWORK_DAYS);
  READING_DAYS.forEach((r, i) => assert.equal(r.day, i + 1));
  assert.match(readingForDay(1)!.what, /Introduction and Chapter 1/);
  assert.equal(readingForDay(21), undefined);
});

test('the pages run straight through the book, with no gap and no overlap', () => {
  for (let i = 1; i < READING_DAYS.length; i += 1) {
    const before = READING_DAYS[i - 1];
    const now = READING_DAYS[i];
    if (before.day === 1) {
      assert.equal(firstPage(now.pages), 13, 'day 2 starts where the introduction and chapter 1 end');
      continue;
    }
    assert.equal(firstPage(now.pages), lastPage(before.pages) + 1, `day ${now.day} follows day ${before.day}`);
  }
  assert.match(READING_DAYS.at(-1)!.what, /Epilogue/, 'the last day finishes the book');
});

test('no copy of the book, and nothing claims more than it is', () => {
  const all = JSON.stringify({ PROGRAMME_BOOK, READING_DAYS });
  assert.doesNotMatch(all, /https?:|drive\.google|\.pdf/i, 'never a link to a copy');
  assert.doesNotMatch(all, /—/, 'no long dash');
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
  homework: { day: 1, title: 'Who is who', done: false },
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
  const items = todaysHomework({ ...base, reading: { label: PROGRAMME_BOOK.title, pages: 'vii to 12' } });
  const reading = items.find((i) => i.key === 'reading');
  assert.ok(reading);
  assert.equal(reading.href, '/reading');
  assert.equal(reading.meta, 'Read: pages vii to 12');
  assert.equal(reading.done, null);
  assert.deepEqual(doneCount(items), doneCount(todaysHomework(base)), 'the reading does not change the count');
  assert.equal(todaysHomework(base).some((i) => i.key === 'reading'), false);
});
