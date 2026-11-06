import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { FIRST_STEP_HOME, darkDuring, firstStepFor, openDuring } from '../src/lib/learning/first-steps';
import { LEVEL_MIN_ANSWERS, SKILL_LEVELS, currentSkillLevel, skillLevelFor } from '../src/lib/learning/skill-level';
import { MASTERY } from '../src/lib/learning/config';

/**
 * The first visit (the owner, November 2026): the first steps, then the
 * diagnostic with nothing else open, then the level in a word.
 */

const read = (file: string) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const learner = { staff: false, onboarded: true, diagnosticDone: false, questionsOpen: true };

test('somebody new is held on their first steps, then on the diagnostic, then not at all', () => {
  assert.equal(firstStepFor({ ...learner, onboarded: false }), 'onboarding');
  assert.equal(firstStepFor(learner), 'diagnostic');
  assert.equal(firstStepFor({ ...learner, diagnosticDone: true }), null, 'the diagnostic is asked once');
});

test('nobody is held on a diagnostic they cannot take, and staff are never held', () => {
  assert.equal(firstStepFor({ ...learner, questionsOpen: false }), null);
  assert.equal(firstStepFor({ ...learner, staff: true }), null);
  assert.equal(firstStepFor({ ...learner, staff: true, onboarded: false }), null);
});

test('while held, only the step, the account and the plan open', () => {
  for (const open of ['/dashboard', '/dashboard?tour=1', '/diagnostic', '/diagnostic/results?session=x', '/train/abc', '/account', '/account/password', '/pricing']) {
    assert.ok(openDuring('diagnostic', open), `${open} should open during the diagnostic`);
  }
  for (const shut of ['/modules', '/work', '/skills', '/courts', '/programme', '/matters/1', '/tutor', '/studio', '/onboarding', '/dashboards', '/trainee']) {
    assert.ok(!openDuring('diagnostic', shut), `${shut} should not open during the diagnostic`);
  }
  assert.ok(openDuring('onboarding', '/onboarding'));
  assert.ok(!openDuring('onboarding', '/dashboard'));
  assert.ok(!openDuring('onboarding', '/diagnostic'));
  // Every step's home is itself open, or the hold would send somebody round in a circle.
  for (const step of ['onboarding', 'diagnostic'] as const) assert.ok(openDuring(step, FIRST_STEP_HOME[step]));
});

test('the greeting and the first test are dark; the questions and the account stay on paper', () => {
  assert.ok(darkDuring('onboarding', '/onboarding'));
  assert.ok(darkDuring('diagnostic', '/dashboard'));
  assert.ok(darkDuring('diagnostic', '/diagnostic'));
  assert.ok(!darkDuring('diagnostic', '/train/abc'));
  assert.ok(!darkDuring('diagnostic', '/account'));
});

test('pages hold people on the server, and only on a definite yes about the questions', () => {
  const server = read('src/lib/learning/first-steps-server.ts');
  assert.match(server, /\(await questionsPublished\(profile\.country\)\) === true/);
  assert.match(server, /if \(requested && !openDuring\(step, requested\)\) redirect\(FIRST_STEP_HOME\[step\]\)/);
  // Every training page calls requireAccess (tests/access.test.ts), and the
  // hold comes before anything else it does.
  const access = read('src/lib/access/service.ts');
  const body = access.slice(access.indexOf('export async function requireAccess'));
  assert.match(body, /^export async function requireAccess\(\): Promise<void> \{\s*(\/\/[^\n]*\n\s*)*await holdForFirstSteps\(\);/);
  // The layout draws the plain shell but never redirects for the hold: a
  // redirect thrown by a layout left the browser asking for the same page
  // over and over while moving between pages.
  const layout = read('src/app/(app)/layout.tsx');
  assert.match(layout, /const firstStep = await firstStepNow\(\)/);
  assert.doesNotMatch(layout, /FIRST_STEP_HOME|openDuring|holdForFirstSteps/);
  // Today and the diagnostic page show only the first test while it is due.
  const today = read('src/app/(app)/dashboard/page.tsx');
  assert.match(today, /!staff && !profile\.diagnosticCompletedAt && \(await questionsPublished\(profile\.country\)\) === true[^]*?return <FirstTest/);
  const service = read('src/lib/training/service.ts');
  assert.match(service, /if \(error\) return null;/, 'a failed count is unknown, not a yes');
  // Finishing the diagnostic opens the shell, so every layout is read again.
  assert.match(read('src/app/(app)/actions.ts'), /revalidatePath\(result\.kind === 'diagnostic' \? '\/' : '\/dashboard'/);
});

test('the first steps save the cartoon only from the app’s own lists, and send people to the diagnostic', () => {
  const actions = read('src/app/(app)/actions.ts');
  const body = actions.slice(actions.indexOf('export async function saveOnboarding'), actions.indexOf('\nexport ', actions.indexOf('export async function saveOnboarding') + 1));
  assert.match(body, /strictCartoon\(JSON\.parse/);
  assert.match(body, /\.\.\.\(cartoon \? \{ avatar_style: cartoon \} : \{\}\)/);
  assert.match(body, /redirect\(\(await trainingOpen\(country\)\) \? '\/diagnostic' : '\/dashboard'\)/);
});

test('the level in a word uses the same lines as every score', () => {
  assert.equal(skillLevelFor(0), 'basic');
  assert.equal(skillLevelFor(MASTERY.weaknessThreshold), 'basic');
  assert.equal(skillLevelFor(MASTERY.weaknessThreshold + 1), 'intermediate');
  assert.equal(skillLevelFor(MASTERY.masteredThreshold - 1), 'intermediate');
  assert.equal(skillLevelFor(MASTERY.masteredThreshold), 'advanced');
  assert.equal(skillLevelFor(100), 'advanced');
  // The ranges printed under each name are the same lines.
  assert.match(SKILL_LEVELS.basic.range, new RegExp(`Up to ${MASTERY.weaknessThreshold}%`));
  assert.match(SKILL_LEVELS.advanced.range, new RegExp(`${MASTERY.masteredThreshold}% right or more`));
});

test('a level is not claimed from a handful of answers', () => {
  assert.equal(currentSkillLevel(3, 3), null);
  assert.equal(currentSkillLevel(LEVEL_MIN_ANSWERS - 1, LEVEL_MIN_ANSWERS - 1), null);
  assert.equal(currentSkillLevel(LEVEL_MIN_ANSWERS, LEVEL_MIN_ANSWERS), 'advanced');
  assert.equal(currentSkillLevel(10, 30), 'basic');
  assert.equal(currentSkillLevel(0, 0), null);
});

test('the sign-in pages link the next step inside their own sentences', () => {
  const form = read('src/app/(auth)/auth-form.tsx');
  // "Check them, or reset your password", with the last words a link.
  assert.match(form, /Check them, or\{' '\}\s*<Link href="\/forgot-password"[^>]*>\s*reset your password\s*<\/Link>/);
  // "Already have an account? Sign in instead", with the last words a link.
  assert.match(form, /Already have an account\?\{' '\}\s*<Link href=\{signInHref\}[^>]*>\s*Sign in instead\s*<\/Link>/);
});
