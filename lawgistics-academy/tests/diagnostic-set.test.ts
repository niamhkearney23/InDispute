import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { forDiagnostic, forRetake, forTraining, missingFlag } from '../src/lib/learning/diagnostic-set';
import { DIAGNOSTIC_QUESTION_COUNT } from '../src/lib/learning/config';
import { PRACTICE_SKILL_DOMAINS, QUESTIONS } from '../src/content/seed';
import { JURISDICTION_COUNTRY } from '../src/lib/types';

/**
 * The diagnostic's own questions (0055; the owner, November 2026: "can the
 * diagnostic questions be totally different from the learning and other
 * questions?").
 */

const read = (file: string) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const q = (id: string, diagnosticOnly: boolean) => ({ id, diagnosticOnly });

test('training, modules and reviews never get a diagnostic-only question', () => {
  const bank = [q('a', false), q('b', true), q('c', false)];
  assert.deepEqual(forTraining(bank).map((x) => x.id), ['a', 'c']);
});

test('the diagnostic uses its own questions once there is a paper’s worth, and the whole bank until then', () => {
  const own = Array.from({ length: 30 }, (_, i) => q(`d${i}`, true));
  const main = [q('a', false), q('b', false)];
  assert.deepEqual(forDiagnostic([...main, ...own], 30).map((x) => x.id), own.map((x) => x.id));
  const few = own.slice(0, 29);
  assert.equal(forDiagnostic([...main, ...few], 30).length, 31, 'with too few of its own it falls back to everything');
  assert.deepEqual(forDiagnostic(main, 30), main);
});

test('a database without 0055 is recognised and read as before', () => {
  assert.ok(missingFlag({ code: '42703', message: 'column v_question_delivery.diagnostic_only does not exist' }));
  assert.ok(missingFlag({ code: '42703', message: 'column questions_1.diagnostic_only does not exist' }), 'inside an embedded read');
  assert.ok(missingFlag({ code: 'PGRST204', message: "Could not find the 'diagnostic_only' column of 'questions' in the schema cache" }));
  assert.ok(!missingFlag(null));
  assert.ok(!missingFlag({ code: '42501', message: 'permission denied' }), 'another failure is not taken for an old database');
});

test('only a missing column counts: any other failure naming it fails as a failure (the audit)', () => {
  // The read made again without the column treats every question as an
  // ordinary one, so mistaking another failure for an old database would hand
  // the diagnostic set to daily training.
  assert.ok(!missingFlag({ code: '42501', message: 'permission denied for column diagnostic_only' }));
  assert.ok(!missingFlag({ message: 'something about diagnostic_only' }), 'no code');
  assert.ok(!missingFlag({ code: '42703', message: 'column v_question_delivery.something_else does not exist' }));
});

test('a retake leaves out what earlier diagnostics asked (the audit)', () => {
  const item = (id: string, diagnosticOnly: boolean) => ({ questionId: id, diagnosticOnly });
  const own = Array.from({ length: 32 }, (_, i) => item(`d${i}`, true));
  const main = Array.from({ length: 60 }, (_, i) => item(`m${i}`, false));
  const bank = [...main, ...own];
  const firstPaper = new Set(own.slice(0, 30).map((x) => x.questionId));

  const retake = forRetake(bank, 30, firstPaper);
  assert.ok(retake.every((x) => !firstPaper.has(x.questionId)), 'nothing already asked');
  assert.ok(retake.length >= 30, 'still a full paper');

  const moreOwn = Array.from({ length: 70 }, (_, i) => item(`e${i}`, true));
  const roomy = forRetake([...main, ...moreOwn], 30, new Set(moreOwn.slice(0, 30).map((x) => x.questionId)));
  assert.ok(roomy.every((x) => x.diagnosticOnly), 'its own set when enough of it is unseen');

  const tiny = own.slice(0, 31);
  assert.deepEqual(forRetake(tiny, 30, firstPaper), tiny, 'repeats only when nothing else fills a paper');
});

test('the readers keep the rule: training and modules leave them out, the diagnostic draws on them', () => {
  const selection = read('src/lib/learning/selection.ts');
  assert.match(selection, /read\(`\$\{columns\}, diagnostic_only`\)/);
  assert.match(selection, /missingFlag\(first\.error\) \? await read\(columns\) : first/);
  assert.match(selection, /loadTrainingBank\(db, options\.country\)/, 'daily training');
  assert.match(selection, /\(await loadTrainingBank\(db, country\)\)\.filter\(\(q\) => domainSlugs\.includes/, 'modules');
  assert.match(selection, /const whole = \(await loadBank\(db, country\)\)\.filter\(/, 'the diagnostic, on the knowledge areas');
  assert.match(selection, /askedBefore\.size > 0 \? forRetake\(whole, count, askedBefore\) : forDiagnostic\(whole, count\)/);
  assert.match(read('src/lib/training/service.ts'), /selectDiagnosticQuestions\(db, country, count, await askedInDiagnostics\(db, userId\)\)/);
  assert.equal(selection.match(/await loadBank\(/g)?.length, 2, 'only the training bank and the diagnostic read the whole bank');
  const modules = read('src/lib/modules/service.ts');
  assert.match(modules, /row\.diagnostic_only !== true/, 'a module never counts one');
  const seed = read('src/lib/setup/seed-content.ts');
  assert.match(seed, /if \(q\.diagnosticOnly && !canMarkDiagnostic\) \{\s*waitingForUpdate \+= 1;\s*continue;/, 'never loaded as an ordinary question');
  assert.match(seed, /update\(\{ diagnostic_only: Boolean\(q\.diagnosticOnly\) \}\)/, 'follows the seed for a question already here');
  assert.match(read('src/app/admin/actions.ts'), /questionsWaitingForUpdate/, 'and says what it skipped');
});

test('publishing only the diagnostic set opens no training and starts no rounds (the audit)', () => {
  // Daily training never gives a diagnostic-only question, so with only those
  // published, rounds that opened could only be missed.
  const service = read('src/lib/training/service.ts');
  const published = service.slice(service.indexOf('export const questionsPublished'));
  assert.match(published.slice(0, 1200), /\.eq\('diagnostic_only', false\)/, 'trainingOpen and the first-visit hold');
  const rounds = read('src/lib/training/rounds-service.ts');
  assert.match(rounds, /\.eq\('questions\.diagnostic_only', false\)/, 'the rounds clock');
  assert.match(read('src/lib/admin/today-service.ts'), /!i\.diagnosticOnly &&/, 'Admin Today');
  const tutor = read('src/lib/tutor/service.ts');
  assert.match(tutor, /if \(row\.questions\?\.diagnostic_only === true\) continue;/, 'the tutor, if switched back on');
});

test('Malaysia has a full diagnostic of its own, across every area, waiting for a lawyer', () => {
  const own = QUESTIONS.filter((x) => x.diagnosticOnly);
  const my = own.filter((x) => JURISDICTION_COUNTRY[x.jurisdiction] === 'MY');
  assert.equal(my.length, own.length, 'every diagnostic-only question so far is Malaysian');
  assert.ok(my.length >= DIAGNOSTIC_QUESTION_COUNT, `only ${my.length}; the diagnostic needs ${DIAGNOSTIC_QUESTION_COUNT}`);
  // The knowledge areas: the practice skills are not part of the diagnostic.
  const areas = new Set(
    QUESTIONS.filter(
      (x) => JURISDICTION_COUNTRY[x.jurisdiction] === 'MY' && !(PRACTICE_SKILL_DOMAINS as readonly string[]).includes(x.domain),
    ).map((x) => x.domain),
  );
  assert.deepEqual(new Set(my.map((x) => x.domain)), areas, 'an area has no diagnostic questions');
  assert.ok(my.some((x) => x.difficulty >= 4) && my.some((x) => x.difficulty <= 2), 'a spread of difficulty');
  assert.match(read('src/content/seed/questions/diagnostic-my.ts'), /NOT CHECKED BY A LAWYER/);
});

test('the database keeps them apart, and the gate still stands on the view', () => {
  const migration = read('supabase/migrations/0055_diagnostic_questions.sql');
  assert.match(migration, /add column if not exists diagnostic_only boolean not null default false/);
  const view = migration.slice(migration.indexOf('create or replace view public.v_question_delivery'));
  assert.match(view, /q\.diagnostic_only\s*\nfrom public\.questions q/, 'added at the end');
  assert.match(view, /qv\.verification_status = 'human_verified'/);
  assert.match(view, /qv\.review_due_on is null or qv\.review_due_on > current_date/);
  assert.match(view, /q\.country = public\.caller_country\(\)/);
});
