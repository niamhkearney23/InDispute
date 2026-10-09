import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_SCHEDULE,
  hourLabel,
  monthYear,
  readHolidays,
  readRoundHours,
  roundTimes,
  scheduleFromRow,
  writeHolidays,
  zoneName,
} from '../src/lib/training/schedule';
import { dateOfWorkingDay, homeworkDay, isWorkingDay } from '../src/lib/homework/rules';
import { roundsDayNumber } from '../src/lib/training/rounds';

/**
 * A cohort's clock (0041): its timezone, round hours and holidays. Anybody in
 * no cohort keeps the programme as it was, so the default must say exactly
 * what the pages said before cohorts existed.
 */

test('the default is Kuala Lumpur, 7 to 10am, with Deepavali skipped', () => {
  assert.equal(zoneName(DEFAULT_SCHEDULE), 'Kuala Lumpur time');
  assert.equal(roundTimes(DEFAULT_SCHEDULE), '7, 8, 9 and 10am');
  assert.ok('2026-11-09' in DEFAULT_SCHEDULE.holidays);
});

test('round times read the way a person says them', () => {
  const at = (roundHours: number[]) => roundTimes({ ...DEFAULT_SCHEDULE, roundHours });
  assert.equal(at([9]), '9am');
  assert.equal(at([9, 13, 16]), '9am, 1pm and 4pm');
  assert.equal(at([13, 14]), '1 and 2pm');
  assert.equal(hourLabel(12), '12pm');
  assert.equal(hourLabel(20), '8pm');
});

test('round hours from the form: distinct, sorted, in the day, one to eight', () => {
  assert.deepEqual(readRoundHours(['10', '7', '8', '7']), [7, 8, 10]);
  assert.equal(readRoundHours([]), null);
  assert.equal(readRoundHours(['3']), null);
  assert.equal(readRoundHours(['21']), null);
  assert.equal(readRoundHours(['5', '6', '7', '8', '9', '10', '11', '12', '13']), null);
  assert.equal(readRoundHours(['7.5']), null);
});

test('holidays are a date then a name, one a line, and a bad line says which', () => {
  const read = readHolidays('2026-11-09 Deepavali\n\n2026-12-25\n');
  assert.ok(read.ok);
  if (read.ok) {
    assert.deepEqual(read.holidays, { '2026-11-09': 'Deepavali', '2026-12-25': 'Public holiday' });
    assert.equal(writeHolidays(read.holidays), '2026-11-09 Deepavali\n2026-12-25 Public holiday');
  }
  const bad = readHolidays('9 November Deepavali');
  assert.equal(bad.ok, false);
  assert.equal(readHolidays('2026-02-30 Not a day').ok, false);
});

test('a stored cohort that does not read cleanly falls back rather than breaking', () => {
  assert.deepEqual(scheduleFromRow(null), DEFAULT_SCHEDULE);
  const odd = scheduleFromRow({ timezone: 'Mars/Olympus', round_hours: [2], holidays: 'nope' });
  assert.equal(odd.timezone, DEFAULT_SCHEDULE.timezone);
  assert.deepEqual(odd.roundHours, DEFAULT_SCHEDULE.roundHours);
  assert.deepEqual(odd.holidays, {});
  const sydney = scheduleFromRow({
    timezone: 'Australia/Sydney',
    round_hours: [9, 13],
    holidays: [{ date: '2026-12-25', name: 'Christmas Day' }],
  });
  assert.deepEqual(sydney, {
    timezone: 'Australia/Sydney',
    roundHours: [9, 13],
    holidays: { '2026-12-25': 'Christmas Day' },
  });
});

test("a cohort's holidays move its working days, and nobody else's", () => {
  const christmas = { '2026-12-25': 'Christmas Day' };
  assert.equal(isWorkingDay('2026-12-25', christmas), false);
  assert.equal(isWorkingDay('2026-11-09', christmas), true);
  // Day 5 from Monday 21 December is Monday 28th with Christmas skipped.
  assert.equal(dateOfWorkingDay('2026-12-21', 5, christmas), '2026-12-28');
  assert.equal(roundsDayNumber('2026-12-21', '2026-12-31', '2026-12-25', christmas), null);
  const day = homeworkDay('2026-12-21', '2026-12-31', 'Australia/Sydney', new Date('2026-12-25T00:00:00Z'), christmas);
  assert.equal(day.state, 'weekend');
  // Without the cohort, Deepavali is still skipped as before.
  assert.equal(isWorkingDay('2026-11-09'), false);
});

test('an intake is named by its first month', () => {
  assert.equal(monthYear('2027-02-01'), 'February 2027');
});
