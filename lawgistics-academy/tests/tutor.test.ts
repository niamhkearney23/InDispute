import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  EXPLAIN_SYSTEM,
  TEST_SYSTEM,
  TUTOR_NOTICE,
  cleanReply,
  explainPrompt,
  isCorrect,
  nextQuestion,
  questionMessage,
  testLength,
  testProgress,
  testPrompt,
  testSummary,
  type VerifiedQuestion,
} from '../src/lib/tutor/rules';

const ROOT = path.resolve(__dirname, '..');

const question: VerifiedQuestion = {
  versionId: 'v1',
  stem: 'Which court hears it?',
  scenario: 'A claim for RM 80,000.',
  options: [
    { id: 'a', text: 'Magistrates Court' },
    { id: 'b', text: 'Sessions Court' },
  ],
  correctOptionIds: ['b'],
  explanation: 'The checked explanation.',
  misconception: 'A common mix-up.',
};

test('the tutor is told never to state law of its own', () => {
  // The standing rule is that AI never publishes legal content. These lines
  // are what hold the tutor to it; losing one should fail loudly.
  assert.match(EXPLAIN_SYSTEM, /Never explain the idea yourself/);
  assert.match(EXPLAIN_SYSTEM, /Never state a rule of law/);
  assert.match(EXPLAIN_SYSTEM, /ask exactly ONE short question/);
  assert.match(TEST_SYSTEM, /Use only what is in the checked explanation/);
  assert.match(TEST_SYSTEM, /Do not add any law/);
});

test('learners are told it is AI, unchecked, that coaches can read it, and to keep clients out', () => {
  assert.match(TUTOR_NOTICE, /AI tutor/);
  assert.match(TUTOR_NOTICE, /not been checked by a lawyer/);
  assert.match(TUTOR_NOTICE, /client/);
  assert.match(TUTOR_NOTICE, /coaches can read/i);
});

test('what the AI writes loses its em and en dashes', () => {
  const dashed = `Service is personal \u2014 usually \u2013 by hand.`;
  assert.equal(cleanReply(dashed), 'Service is personal, usually, by hand.');
  assert.ok(cleanReply('x'.repeat(5000)).length <= 1500);
});

test('the conversation the model reads is the last twelve turns, with the topic', () => {
  const turns = Array.from({ length: 20 }, (_, i) => ({
    role: (i % 2 ? 'tutor' : 'learner') as 'learner' | 'tutor',
    body: `turn ${i}`,
  }));
  const prompt = explainPrompt('Default judgment', turns);
  assert.match(prompt, /Default judgment/);
  assert.ok(!prompt.includes('turn 7\n'));
  assert.match(prompt, /turn 19/);
});

test('an answer is marked from the verified key, and the prompt carries the checked explanation', () => {
  assert.equal(isCorrect(question, 'b'), true);
  assert.equal(isCorrect(question, 'a'), false);
  const prompt = testPrompt({ question, chosen: 'a', reason: '', correct: false });
  assert.match(prompt, /CHECKED EXPLANATION: The checked explanation\./);
  assert.match(prompt, /\(none given\)/);
  assert.match(questionMessage(question, 2, 5), /^Question 2 of 5\./);
});

test('a test is five questions, or as many as a lawyer has checked', () => {
  assert.equal(testLength(12), 5);
  assert.equal(testLength(3), 3);
});

test('where a test is up to is read from what was said', () => {
  const progress = testProgress([
    { role: 'tutor', questionVersionId: 'q1', correct: null },
    { role: 'learner', questionVersionId: 'q1', correct: true },
    { role: 'tutor', questionVersionId: null, correct: null },
    { role: 'tutor', questionVersionId: 'q2', correct: null },
  ]);
  assert.deepEqual(progress.asked, ['q1', 'q2']);
  assert.deepEqual(progress.results, [{ number: 1, correct: true }]);
  assert.equal(progress.current, 'q2');
});

test('a question is never asked twice in one test', () => {
  const pool = [{ versionId: 'q1' }, { versionId: 'q2' }];
  assert.equal(nextQuestion(pool, ['q1'])?.versionId, 'q2');
  assert.equal(nextQuestion(pool, ['q1', 'q2']), null);
});

test('the summary says what to revisit', () => {
  assert.match(
    testSummary([
      { number: 1, correct: true },
      { number: 2, correct: false },
    ]),
    /question 2/,
  );
  assert.match(testSummary([{ number: 1, correct: true }]), /every one right/);
});

test('every tutor action checks who is asking and whether they have access', () => {
  const source = fs.readFileSync(path.join(ROOT, 'src/app/(app)/tutor/actions.ts'), 'utf8');
  const helper = source.slice(source.indexOf('async function ownConversation'));
  assert.ok(helper.slice(0, helper.indexOf('\n}\n')).includes('hasAccess(userId)'));
  for (const name of ['startTutor', 'sendExplanation', 'answerTutorQuestion']) {
    const start = source.indexOf(`export async function ${name}`);
    assert.ok(start >= 0, `${name} not found`);
    const next = source.indexOf('\nexport async function', start + 1);
    const body = source.slice(start, next === -1 ? undefined : next);
    assert.ok(body.includes('getCurrentUser()'), `${name} must establish the caller`);
    assert.ok(
      body.includes('hasAccess(user.id)') || body.includes('ownConversation(user.id'),
      `${name} must check access`,
    );
  }
});

test('"Test me" only ever reads questions a person has verified', () => {
  const source = fs.readFileSync(path.join(ROOT, 'src/lib/tutor/service.ts'), 'utf8');
  assert.equal(
    source.match(/human_verified/g)?.length,
    2,
    'both readers must require a verified question',
  );
});
