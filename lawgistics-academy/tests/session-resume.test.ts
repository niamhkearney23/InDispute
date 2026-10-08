import assert from 'node:assert/strict';
import test from 'node:test';

import { isFromToday, resumeIndexFor, sameSet } from '../src/lib/training/service';
import { functionMissing } from '../src/lib/supabase/errors';

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

/**
 * Whether an unfinished session is still today's.
 *
 * A session started yesterday and never finished must not be handed back as
 * "today's session": that is the bug where opening the app on a fresh day
 * dropped a learner mid-way through a batch from days earlier, on a question
 * they had never seen that day, because the query that found it never checked
 * the date at all.
 */

test('a session started earlier today is still today’s', () => {
  const now = new Date('2026-08-25T05:00:00Z');
  const startedAt = '2026-08-25T00:00:00Z';
  assert.equal(isFromToday(startedAt, 'Australia/Melbourne', now), true);
});

test('a session started yesterday is not today’s', () => {
  const now = new Date('2026-08-25T05:00:00Z');
  const startedAt = '2026-08-24T00:00:00Z';
  assert.equal(isFromToday(startedAt, 'Australia/Melbourne', now), false);
});

test('the day boundary is the learner’s timezone, not the server’s', () => {
  // Started at 2026-08-25T12:00:00Z, checked 8 hours later. Melbourne (UTC+10)
  // has already crossed into the 26th by then, so the session is no longer
  // today's there; Los Angeles (UTC-7) is still on the 25th at both instants,
  // so the same pair of timestamps reads as still-today's there.
  const startedAt = '2026-08-25T12:00:00Z';
  const now = new Date('2026-08-25T20:00:00Z');
  assert.equal(isFromToday(startedAt, 'Australia/Melbourne', now), false);
  assert.equal(isFromToday(startedAt, 'America/Los_Angeles', now), true);
});

test('grading compares sets: an option sent twice is not two answers', () => {
  assert.equal(sameSet(['a', 'b'], ['b', 'a']), true);
  assert.equal(sameSet(['a'], ['a']), true);
  assert.equal(sameSet(['a', 'a'], ['a', 'b']), false);
  assert.equal(sameSet(['a', 'b'], ['a', 'a']), false);
  assert.equal(sameSet(['a'], ['a', 'b']), false);
  assert.equal(sameSet([], ['a']), false);
});

test('only a missing function lets the area scores fall back to the per-concept sum', () => {
  assert.equal(
    functionMissing({ code: 'PGRST202', message: 'Could not find the function public.area_scores(uid)' }),
    true,
  );
  assert.equal(functionMissing({ code: '42883', message: 'function area_scores(uuid) does not exist' }), true);
  assert.equal(
    functionMissing({ message: 'Could not find the function public.area_scores in the schema cache' }),
    true,
  );
  assert.equal(functionMissing({ code: '57014', message: 'canceling statement due to statement timeout' }), false);
  assert.equal(functionMissing({ code: 'PGRST301', message: 'JWT expired' }), false);
  assert.equal(functionMissing(null), false);
});
