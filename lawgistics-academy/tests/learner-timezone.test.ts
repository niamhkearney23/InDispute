import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_TIMEZONE, learnerTimezone } from '../src/lib/types';
import { localDateString } from '../src/lib/learning/progression';

test('a Malaysian on the untouched default runs on Kuala Lumpur time', () => {
  assert.equal(learnerTimezone(DEFAULT_TIMEZONE, 'MY'), 'Asia/Kuala_Lumpur');
  assert.equal(learnerTimezone(null, 'MY'), 'Asia/Kuala_Lumpur');
  assert.equal(learnerTimezone('', 'MY'), 'Asia/Kuala_Lumpur');
});

test('an Australian keeps the default', () => {
  assert.equal(learnerTimezone(DEFAULT_TIMEZONE, 'AU'), DEFAULT_TIMEZONE);
  assert.equal(learnerTimezone(null, 'AU'), DEFAULT_TIMEZONE);
});

test('a zone somebody actually set is left alone', () => {
  assert.equal(learnerTimezone('Australia/Perth', 'AU'), 'Australia/Perth');
  assert.equal(learnerTimezone('Asia/Singapore', 'MY'), 'Asia/Singapore');
});

test('eleven at night in Kuala Lumpur is still that day, not the next', () => {
  // 23:00 on 24 September in KL is 01:00 on the 25th in Melbourne. Read on
  // Melbourne time, that evening's training counted towards the next day.
  const lateEvening = new Date('2026-09-24T15:00:00Z');
  assert.equal(localDateString(DEFAULT_TIMEZONE, lateEvening), '2026-09-25');
  assert.equal(
    localDateString(learnerTimezone(DEFAULT_TIMEZONE, 'MY'), lateEvening),
    '2026-09-24',
  );
});
