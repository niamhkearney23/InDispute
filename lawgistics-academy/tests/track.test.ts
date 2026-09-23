import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import { careerStageLabel } from '../src/lib/types';
import { PRACTICE_CHOICES, asTrack, practiceChoiceFor } from '../src/lib/types';

/**
 * The programme a learner is on, and the three-way choice that sets it
 * together with country.
 */

test('anything that is not exactly a trainee is general', () => {
  assert.equal(asTrack('litigation_trainee'), 'litigation_trainee');
  assert.equal(asTrack('general'), 'general');
  assert.equal(asTrack(null), 'general');
  assert.equal(asTrack(undefined), 'general');
  assert.equal(asTrack('LITIGATION_TRAINEE'), 'general');
  assert.equal(asTrack('constructor'), 'general');
});

test('a trainee is always Malaysian, in the choices as in the database', () => {
  for (const choice of PRACTICE_CHOICES) {
    if (choice.track === 'litigation_trainee') assert.equal(choice.country, 'MY');
  }
  // The same rule, as the migration states it. If either side changes, the
  // other must change with it.
  const migration = fs.readFileSync(
    path.join(__dirname, '..', 'supabase', 'migrations', '0018_learner_track.sql'),
    'utf8',
  );
  assert.match(migration, /check \(track <> 'litigation_trainee' or country = 'MY'\)/);
});

test('every choice key is unique and each country has a general choice', () => {
  const keys = PRACTICE_CHOICES.map((c) => c.key);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(practiceChoiceFor('AU', 'general').key, 'AU');
  assert.equal(practiceChoiceFor('MY', 'general').key, 'MY');
  assert.equal(practiceChoiceFor('MY', 'litigation_trainee').key, 'MY_TRAINEE');
});

test('a pair with no choice of its own falls back to that country in general', () => {
  // An Australian trainee cannot exist, so a profile that somehow says so
  // is shown as Australian rather than crashing the form.
  assert.equal(practiceChoiceFor('AU', 'litigation_trainee').key, 'AU');
});

test('the stage between the degree and admission is named in each country\'s own words', () => {
  assert.equal(careerStageLabel('plt_student', 'AU'), 'PLT student');
  assert.equal(careerStageLabel('plt_student', 'MY'), 'Pupil (in chambering)');
  assert.equal(careerStageLabel('law_student', 'MY'), 'Law student');
});
