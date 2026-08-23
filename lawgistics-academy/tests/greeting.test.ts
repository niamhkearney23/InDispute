import test from 'node:test';
import assert from 'node:assert/strict';
import { greeting, greetingName } from '../src/lib/greeting';

/**
 * The greeting is the first thing a learner reads, every day. Getting somebody's
 * name wrong in it is a small thing that reads as not caring, so the rule is
 * that a name is used only when it is clearly a name.
 */

test('the hour comes from the learner timezone, not the server', () => {
  // 23:30 UTC is 07:30 the next day in Kuala Lumpur and 19:30 the same evening
  // in New York. London is not the contrast here: in August it is UTC+1, so it
  // has already tipped into the next morning too.
  const night = new Date('2026-08-22T23:30:00Z');
  assert.equal(greeting(night, 'Asia/Kuala_Lumpur'), 'Good morning');
  assert.equal(greeting(night, 'America/New_York'), 'Good evening');
});

test('the three parts of the day', () => {
  const at = (iso: string) => greeting(new Date(iso), 'Asia/Kuala_Lumpur');
  assert.equal(at('2026-08-22T00:10:00Z'), 'Good morning'); // 08:10 in KL
  assert.equal(at('2026-08-22T05:00:00Z'), 'Good afternoon'); // 13:00
  assert.equal(at('2026-08-22T11:00:00Z'), 'Good evening'); // 19:00
});

test('a real name is used, and given a capital if it was typed without one', () => {
  assert.equal(greetingName('Niamh'), 'Niamh');
  assert.equal(greetingName('niamh'), 'Niamh');
  assert.equal(greetingName('Niamh Kearney'), 'Niamh');
  assert.equal(greetingName('  siti  '), 'Siti');
});

test('names that are not names are dropped rather than greeted', () => {
  // The signup form falls back to the part of the email before the @, which is
  // a fine label and a bad thing to say good morning to.
  assert.equal(greetingName('niamhkearney23'), null);
  assert.equal(greetingName('user123'), null);
  assert.equal(greetingName(''), null);
  assert.equal(greetingName(null), null);
  assert.equal(greetingName(undefined), null);
  assert.equal(greetingName('a'), null);
  assert.equal(greetingName('averyveryverylongstringindeed'), null);
});

test('names outside the English alphabet are kept', () => {
  // Dropping a name because it is not spelled in ASCII would be its own insult.
  assert.equal(greetingName('Siti Nurhaliza'), 'Siti');
  assert.equal(greetingName('Zoë'), 'Zoë');
  assert.equal(greetingName("O'Brien"), "O'Brien");
  assert.equal(greetingName('Anne-Marie'), 'Anne-Marie');
});
