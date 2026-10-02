import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import {
  FOLLOW_UP_COUNT,
  FOLLOW_UP_SYSTEM,
  MATTERS_FOR_CERTIFICATE,
  STANDARD_FOLLOW_UPS,
  attemptStage,
  certificateEarned,
  describeLimit,
  matterLabel,
  minutesLeft,
  missingForHandIn,
  parseFollowUps,
} from '../src/lib/matters/rules';

const ROOT = path.join(import.meta.dirname, '..');

test('an attempt moves from working, to handed in, to marked', () => {
  assert.equal(attemptStage({ submittedAt: null, verdict: null }), 'working');
  assert.equal(attemptStage({ submittedAt: 'x', verdict: null }), 'handed_in');
  assert.equal(attemptStage({ submittedAt: 'x', verdict: 'good' }), 'good');
  assert.equal(attemptStage({ submittedAt: 'x', verdict: 'again' }), 'again');
});

test('the clock counts whole minutes down and never below zero', () => {
  const now = new Date('2026-10-05T01:00:00Z');
  assert.equal(minutesLeft('2026-10-05T01:44:10Z', now), 45);
  assert.equal(minutesLeft('2026-10-05T00:59:00Z', now), 0);
  assert.equal(describeLimit(45), '45 minutes');
  assert.equal(describeLimit(90), '1 hour 30 minutes');
  assert.equal(describeLimit(120), '2 hours');
  assert.equal(matterLabel(4), 'Matter 04');
});

test('five usable questions are taken from the AI, and anything less is refused', () => {
  const reply = [
    '1. What deadline did you count from, and why that date?',
    '2) Which provision gives the client that right?',
    '- What would the supplier say in reply to your rejection point?',
    '• What evidence do you have that the rejection was sent?',
    '5. If the undisputed sum is not paid, what happens next?',
    '6. Why did you not mention security?',
  ].join('\n');
  const questions = parseFollowUps(reply);
  assert.equal(questions?.length, FOLLOW_UP_COUNT);
  assert.ok(questions?.every((q) => q.endsWith('?') && !/^\d/.test(q)));
  assert.equal(parseFollowUps('The answer is to apply under O 29.'), null);
  assert.equal(parseFollowUps('1. Why?\n2. Really?'), null);
  assert.equal(STANDARD_FOLLOW_UPS.length, FOLLOW_UP_COUNT);
});

test('the AI is told to ask, never to answer or state the law', () => {
  assert.match(FOLLOW_UP_SYSTEM, /Do not answer the questions/);
  assert.match(FOLLOW_UP_SYSTEM, /Do not state any rule of law/);
});

test('nothing is handed in without the procedure, the advice and every follow-up answered', () => {
  const full = {
    procedureAnswer: 'O 29',
    draftAnswer: 'Apply for an injunction.',
    followUpQuestions: ['a?', 'b?'],
    followUpAnswers: ['yes', 'no'],
  };
  assert.deepEqual(missingForHandIn(full), []);
  assert.deepEqual(missingForHandIn({ ...full, procedureAnswer: ' ' }), ['the procedure']);
  assert.deepEqual(missingForHandIn({ ...full, followUpQuestions: [] }), ['the follow-up questions']);
  assert.deepEqual(missingForHandIn({ ...full, followUpAnswers: ['yes', ''] }), [
    'an answer to every follow-up question',
  ]);
});

test('the certificate needs every required module and five matters marked Good', () => {
  assert.equal(MATTERS_FOR_CERTIFICATE, 5);
  assert.equal(certificateEarned({ requiredModulesLeft: 0, mattersGood: 5 }), true);
  assert.equal(certificateEarned({ requiredModulesLeft: 1, mattersGood: 9 }), false);
  assert.equal(certificateEarned({ requiredModulesLeft: 0, mattersGood: 4 }), false);
});

test('the lawyer’s approach never reaches learner code except through the hand-in function', () => {
  const learnerFiles = [
    'src/app/(app)/matters/page.tsx',
    'src/app/(app)/matters/[id]/page.tsx',
    'src/app/(app)/matters/[id]/matter-workspace.tsx',
    'src/app/(app)/actions.ts',
  ];
  for (const file of learnerFiles) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.doesNotMatch(source, /model_answer/, `${file} reads the lawyer's approach directly`);
  }
  const service = fs.readFileSync(path.join(ROOT, 'src/lib/matters/service.ts'), 'utf8');
  const selects = /const MATTER_SELECT =([\s\S]*?);\n[\s\S]*?const ATTEMPT_SELECT =([\s\S]*?);\n/.exec(service);
  assert.ok(selects, 'the learner selects should be found');
  assert.doesNotMatch(selects[1] + selects[2], /model_answer/);
});

test('the draft matters go in unpublished, unsigned and with no author', () => {
  const sql = fs
    .readFileSync(path.join(ROOT, 'supabase/migrations/0028_draft_matters.sql'), 'utf8')
    .replace(/^--.*$/gm, '');
  assert.doesNotMatch(sql, /published|verified_by|created_by/);
  assert.match(sql, /on conflict \(slug\) do nothing/);
  assert.equal((sql.match(/'my-[a-z-]+', \d,/g) ?? []).length, 5);
});
