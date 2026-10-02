import test from 'node:test';
import assert from 'node:assert/strict';
import { dateOfWorkingDay, workingDaysElapsed } from '../src/lib/homework/rules';
import { boxOfTitle, boxTitle, intakeSchedule, sessionPrefill, workPrefill } from '../src/lib/intake/plan';
import { PROGRAMME } from '../src/content/programme';

test('the October intake runs twenty working days, Monday to Friday', () => {
  const schedule = intakeSchedule(PROGRAMME.intakeStartsOn);
  assert.equal(schedule.length, 20);
  assert.equal(schedule[0].date, PROGRAMME.intakeStartsOn);
  assert.equal(schedule[19].date, PROGRAMME.intakeEndsOn);
  for (const d of schedule) {
    const weekday = new Date(`${d.date}T00:00:00Z`).getUTCDay();
    assert.ok(weekday >= 1 && weekday <= 5, `day ${d.day} falls on a weekend`);
  }
  assert.equal(new Date(`${PROGRAMME.intakeStartsOn}T00:00:00Z`).getUTCDay(), 1, 'starts on a Monday');
});

test('a working day and its date agree both ways', () => {
  for (let day = 1; day <= 20; day++) {
    const date = dateOfWorkingDay('2026-10-05', day);
    const elapsed =
      (Date.parse(`${date}T00:00:00Z`) - Date.parse('2026-10-05T00:00:00Z')) / 86_400_000;
    assert.equal(workingDaysElapsed('2026-10-05', elapsed), day);
  }
  // A weekend start begins on the Monday after.
  assert.equal(dateOfWorkingDay('2026-10-03', 1), '2026-10-05');
});

test('a work post is recognised by its box, and only by its box', () => {
  assert.equal(boxOfTitle(boxTitle(7)), 7);
  assert.equal(boxOfTitle('Box 12: Written Submissions'), 12);
  assert.equal(boxOfTitle('Read the chronology again'), null);
  assert.equal(boxOfTitle('Inbox 3: something'), null);
});

test('the pre-filled forms carry the date and the box, and never a link', () => {
  const day = intakeSchedule(PROGRAMME.intakeStartsOn)[1];
  const session = new URLSearchParams(sessionPrefill(day));
  assert.equal(session.get('airsOn'), day.date);
  assert.equal(session.get('country'), 'MY');
  assert.equal(session.get('traineesOnly'), '1', 'the daily programme video is for the cohort');
  assert.equal(session.get('url'), null, 'the coach pastes the video link themselves');

  const work = new URLSearchParams(workPrefill(1, day.date, day.day));
  assert.equal(boxOfTitle(work.get('title') ?? ''), 1);
  assert.equal(work.get('dueOn'), day.date);
  assert.equal(work.get('maxClaims'), '0');
  assert.ok((work.get('instructions') ?? '').length < 5000);
});
