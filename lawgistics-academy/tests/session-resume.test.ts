import assert from 'node:assert/strict';
import test from 'node:test';

import { resumeIndexFor } from '../src/lib/training/service';

/**
 * Resuming a part-finished session.
 *
 * The tricky case is a question that was retired or unpublished after the
 * session was built. It drops out of the delivery view, so the list the learner
 * sees is shorter than the list of slots recorded against the session. Counting
 * answered slots would then overshoot and strand them on a question they have
 * already answered, which the grader would refuse, leaving the session stuck.
 */

test('a fresh session starts at the beginning', () => {
  assert.equal(resumeIndexFor(['a', 'b', 'c'], new Set()), 0);
});

test('a part-finished session resumes at the first unanswered question', () => {
  assert.equal(resumeIndexFor(['a', 'b', 'c', 'd'], new Set(['a', 'b'])), 2);
});

test('a fully answered session reports the end, so the page can send them to the summary', () => {
  const questions = ['a', 'b', 'c'];
  assert.equal(resumeIndexFor(questions, new Set(questions)), questions.length);
});

test('a question withdrawn mid-session does not push the resume point past the learner', () => {
  // Four were served; the second was retired and no longer appears. The learner
  // answered the first two. Counting answered slots would give 2, which in the
  // three-question surviving list points at 'c', skipping nothing, but only by
  // luck. Here they answered three of four, so slot-counting would give 3 and
  // land past 'd', the one question actually left to answer.
  const surviving = ['a', 'c', 'd'];
  const answered = new Set(['a', 'b', 'c']);

  assert.equal(resumeIndexFor(surviving, answered), 2, 'should land on "d"');
  assert.equal(surviving[resumeIndexFor(surviving, answered)], 'd');
});

test('an answered question later in the list does not confuse the resume point', () => {
  // Out-of-order answering should still resume at the earliest gap.
  assert.equal(resumeIndexFor(['a', 'b', 'c'], new Set(['a', 'c'])), 1);
});

test('an empty session reports zero rather than a negative index', () => {
  assert.equal(resumeIndexFor([], new Set()), 0);
});

test('every question withdrawn leaves nothing to answer', () => {
  assert.equal(resumeIndexFor([], new Set(['a', 'b'])), 0);
});
