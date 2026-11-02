import assert from 'node:assert/strict';
import test from 'node:test';
import { choicesFor, countryOpen, openCountryOr, parseOpenCountries } from '../src/lib/countries';
import { PRACTICE_CHOICES } from '../src/lib/types';

/**
 * Which countries are offered (the owner, November 2026: Malaysia only for
 * now, Australia kept but not visible). One setting, NEXT_PUBLIC_OPEN_COUNTRIES.
 */

test('unset or unreadable, only Malaysia is offered', () => {
  assert.deepEqual(parseOpenCountries(undefined), ['MY']);
  assert.deepEqual(parseOpenCountries(''), ['MY']);
  assert.deepEqual(parseOpenCountries('NZ, uk'), ['MY']);
});

test('the setting opens Australia again, in a fixed order', () => {
  assert.deepEqual(parseOpenCountries('MY,AU'), ['MY', 'AU']);
  assert.deepEqual(parseOpenCountries(' au , my '), ['MY', 'AU']);
  assert.deepEqual(parseOpenCountries('AU'), ['AU']);
});

test('a closed country is never offered, nor started on', () => {
  const open = parseOpenCountries(undefined);
  assert.equal(countryOpen('AU', open), false);
  assert.equal(countryOpen('MY', open), true);
  assert.equal(openCountryOr('AU', open), 'MY', 'a link asking for Australia starts on Malaysia');
  assert.equal(openCountryOr(undefined, open), 'MY');

  const general = PRACTICE_CHOICES.filter((c) => c.track === 'general');
  assert.deepEqual(choicesFor(general, null, open).map((c) => c.key), ['MY']);
  assert.deepEqual(
    choicesFor(PRACTICE_CHOICES, null, open).map((c) => c.key),
    ['MY', 'MY_TRAINEE'],
    'a firm can still invite to the Malaysian trainee programme',
  );
});

test('somebody already on a closed country keeps it in their own choices', () => {
  const open = parseOpenCountries(undefined);
  const general = PRACTICE_CHOICES.filter((c) => c.track === 'general');
  assert.deepEqual(choicesFor(general, 'AU', open).map((c) => c.key), ['AU', 'MY']);
});

test('with both open, both are offered', () => {
  const open = parseOpenCountries('MY,AU');
  const general = PRACTICE_CHOICES.filter((c) => c.track === 'general');
  assert.deepEqual(choicesFor(general, null, open).map((c) => c.key), ['AU', 'MY']);
  assert.equal(openCountryOr('AU', open), 'AU');
});
