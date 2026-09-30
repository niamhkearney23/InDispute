import test from 'node:test';
import assert from 'node:assert/strict';
import { PROGRAMME_DAYS, daysOfWeek, programmeDay } from '../src/content/programme-days';
import { PROGRAMME_WEEKS } from '../src/content/programme-plan';
import { TRAINING_FILE } from '../src/content/training-file';

/* The day plan has to agree with the week plan: every box a week promises
   is due on one of that week's days, and on no other day. */

test('twenty days, numbered once each, five to a week', () => {
  assert.equal(PROGRAMME_DAYS.length, 20);
  const numbers = PROGRAMME_DAYS.map((d) => d.day).sort((a, b) => a - b);
  assert.deepEqual(numbers, Array.from({ length: 20 }, (_, i) => i + 1));
  for (const week of PROGRAMME_WEEKS) {
    assert.equal(daysOfWeek(week.number).length, 5, `week ${week.number}`);
  }
  assert.equal(programmeDay(21), null);
});

test('every box a week promises is due on exactly one of its days', () => {
  for (const week of PROGRAMME_WEEKS) {
    const due = daysOfWeek(week.number).flatMap((d) => d.due);
    assert.deepEqual(
      [...due].sort((a, b) => a - b),
      [...week.boxes].sort((a, b) => a - b),
      `week ${week.number}: due ${due.join(',')} vs planned ${week.boxes.join(',')}`,
    );
  }
});

test('every day has a morning, an afternoon and a video', () => {
  for (const d of PROGRAMME_DAYS) {
    assert.ok(d.title && d.morning && d.afternoon && d.video, `day ${d.day} is missing a part`);
  }
});

test('the training file says it is invented, and has no em dashes', () => {
  assert.match(TRAINING_FILE.fictional, /invented for training/i);
  assert.ok(TRAINING_FILE.documents.length >= 5);
  assert.ok(TRAINING_FILE.people.length >= 3);
  const text = JSON.stringify(TRAINING_FILE) + JSON.stringify(PROGRAMME_DAYS);
  assert.ok(!/[\u2013\u2014]/.test(text));
});

test('the file is facts, not law: it names no Act, Order or section', () => {
  const text = JSON.stringify(TRAINING_FILE);
  assert.ok(!/\bAct\s+\d{4}\b/.test(text), 'names a statute');
  assert.ok(!/\bO\.?\s?\d+\s?r\.?\s?\d+/i.test(text), 'cites a rule');
  assert.ok(!/\bsection\s+\d+/i.test(text), 'cites a section');
});
