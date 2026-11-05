import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  attentionReasons,
  attentionWeight,
  awaitingReply,
  contentRows,
  markingKindsFor,
  repeatedMistakes,
  sectionsFor,
  unmarked,
  waited,
  type ContentCounts,
} from '../src/lib/admin/today';

/**
 * Admin Today (the owner, November 2026): the first screen of Admin, saying
 * what needs attention, in the order each role needs it.
 */

const coach = { admin: false, coach: true, firmAdmin: false };
const firmAdmin = { admin: false, coach: false, firmAdmin: true };
const admin = { admin: true, coach: false, firmAdmin: false };

test('a coach lands on marking, trainees and teaching', () => {
  assert.deepEqual(sectionsFor(coach).slice(0, 3), ['work', 'trainees', 'teaching']);
  assert.ok(!sectionsFor(coach).includes('operations'), 'operations are an administrator’s');
});

test('a firm administrator lands on people and the intake, and is not given content', () => {
  const s = sectionsFor(firmAdmin);
  assert.deepEqual(s.slice(0, 2), ['people', 'teaching']);
  assert.ok(!s.includes('content'), 'a firm administrator never signs content off');
  assert.ok(!s.includes('operations'));
});

test('an administrator who is not a coach lands on content and operations', () => {
  assert.deepEqual(sectionsFor(admin).slice(0, 2), ['content', 'operations']);
  const both = sectionsFor({ admin: true, coach: true, firmAdmin: false });
  assert.deepEqual(both.slice(0, 3), ['work', 'trainees', 'teaching'], 'the supervising role comes first');
  assert.equal(new Set(both).size, both.length, 'no section twice');
  assert.ok(both.includes('operations'));
});

test('a firm administrator’s marking queue is work and replies only', () => {
  assert.deepEqual(markingKindsFor(firmAdmin), ['work', 'reply']);
  assert.deepEqual(markingKindsFor(coach), ['work', 'reply', 'matter', 'studio']);
});

test('a resubmission while waiting is one piece of marking, and a marked one is none', () => {
  const list = unmarked([
    { postId: 'p', userId: 'a', submittedAt: '2026-11-01T09:00:00Z', verdict: null },
    { postId: 'p', userId: 'a', submittedAt: '2026-11-02T09:00:00Z', verdict: null },
    { postId: 'p', userId: 'b', submittedAt: '2026-11-01T09:00:00Z', verdict: 'good' },
    // Sent back, then handed in again: waiting again.
    { postId: 'q', userId: 'b', submittedAt: '2026-11-01T09:00:00Z', verdict: 'again' },
    { postId: 'q', userId: 'b', submittedAt: '2026-11-03T09:00:00Z', verdict: null },
  ]);
  assert.deepEqual(
    list.map((s) => `${s.postId}/${s.userId}@${s.submittedAt.slice(0, 10)}`).sort(),
    ['p/a@2026-11-02', 'q/b@2026-11-03'],
  );
});

test('a thread waits for a reply only when the intern spoke last', () => {
  const list = awaitingReply([
    { postId: 'p', threadUserId: 'a', senderId: 'a', sentAt: '2026-11-01T09:00:00Z' },
    { postId: 'p', threadUserId: 'a', senderId: 'coach', sentAt: '2026-11-01T10:00:00Z' },
    { postId: 'p', threadUserId: 'b', senderId: 'coach', sentAt: '2026-11-01T09:00:00Z' },
    { postId: 'p', threadUserId: 'b', senderId: 'b', sentAt: '2026-11-02T09:00:00Z' },
  ]);
  assert.deepEqual(list.map((m) => m.threadUserId), ['b']);
});

test('how long something has waited, in words', () => {
  const now = new Date('2026-11-04T12:00:00Z');
  assert.equal(waited('2026-11-04T08:00:00Z', now), 'today');
  assert.equal(waited('2026-11-03T08:00:00Z', now), 'yesterday');
  assert.equal(waited('2026-11-01T08:00:00Z', now), '3 days');
  assert.equal(waited('not a date', now), 'today');
});

test('a trainee is listed only with a reason a coach can act on', () => {
  const none = { missedRounds: 0, overdueWork: [], missedHomework: 0, repeatedMistakes: 0 };
  assert.deepEqual(attentionReasons(none), []);
  // One slip is a day, not a pattern.
  assert.deepEqual(attentionReasons({ ...none, missedRounds: 1, missedHomework: 1, repeatedMistakes: 2 }), []);
  assert.deepEqual(attentionReasons({ ...none, overdueWork: ['Chronology'] }), ['Overdue: Chronology']);
  const all = attentionReasons({ missedRounds: 3, overdueWork: ['A', 'B'], missedHomework: 2, repeatedMistakes: 4 });
  assert.deepEqual(all, [
    'Missed 3 rounds in the last week',
    '2 pieces of work overdue',
    '2 days of homework not ticked off',
    'Got 4 questions wrong more than once in the last fortnight',
  ]);
  assert.ok(
    attentionWeight({ ...none, overdueWork: ['A'] }) > attentionWeight({ ...none, repeatedMistakes: 5 }),
    'overdue work outranks a pattern of mistakes',
  );
});

test('a question counts as a repeated mistake at its second wrong answer', () => {
  const counts = repeatedMistakes([
    { userId: 'a', questionId: 'q1' },
    { userId: 'a', questionId: 'q1' },
    { userId: 'a', questionId: 'q2' },
    { userId: 'b', questionId: 'q1' },
    { userId: 'b', questionId: 'q3' },
    { userId: 'b', questionId: 'q3' },
    { userId: 'b', questionId: 'q3' },
  ]);
  assert.equal(counts.get('a'), 1);
  assert.equal(counts.get('b'), 1);
});

const quiet: ContentCounts = {
  liveUnverified: 0,
  lapsed: 0,
  flagged: 0,
  questionsWaiting: 0,
  factsWaiting: 0,
  publishedMalaysianQuestions: 10,
  readyToPublish: 0,
  studioExercisesWaiting: 0,
  studioExercisesTotal: 4,
  courtMapWaiting: false,
  lessonsWaiting: 0,
  essaysWaiting: 0,
  maximsWaiting: false,
  mattersWaiting: 0,
};

test('content: what is wrong in front of learners first, then what holds up teaching', () => {
  assert.deepEqual(contentRows(quiet, coach), []);
  const rows = contentRows(
    {
      ...quiet,
      lapsed: 2,
      liveUnverified: 1,
      publishedMalaysianQuestions: 0,
      questionsWaiting: 40,
      factsWaiting: 100,
      studioExercisesWaiting: 4,
      readyToPublish: 5,
    },
    admin,
  );
  assert.deepEqual(rows.map((r) => r.key).slice(0, 5), [
    'live-unverified',
    'lapsed',
    'questions-blocking',
    'studio',
    'publish',
  ]);
  assert.ok(!rows.some((r) => r.key === 'queue-question'), 'the blocking line already counts the questions');
  assert.ok(rows.some((r) => r.key === 'queue-daily brief fact'));
});

test('only an administrator is offered publishing', () => {
  const counts = { ...quiet, readyToPublish: 3 };
  assert.ok(contentRows(counts, admin).some((r) => r.action === 'Publish'));
  assert.ok(!contentRows(counts, coach).some((r) => r.action === 'Publish'));
});

const read = (file: string) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('Admin Today is the first screen, behind the staff guard, and writes nothing', () => {
  const page = read('src/app/admin/today/page.tsx');
  assert.match(page, /await requireCoach\(\)/);
  assert.doesNotMatch(page, /'use server'|\.insert\(|\.update\(|\.delete\(/);
  const sections = read('src/app/admin/today/sections.tsx');
  assert.doesNotMatch(sections, /\.insert\(|\.update\(|\.delete\(|logStudioAccess|sharedAttempt\(/,
    'listing a Studio recording must not count as opening it');
  const layout = read('src/app/admin/layout.tsx');
  assert.match(layout, /<Link href="\/admin\/today"/);
  assert.match(layout, /label: 'Today',\s*items: \[\{ href: '\/admin\/today'/);
  const app = read('src/app/(app)/layout.tsx');
  assert.match(app, /href="\/admin\/today"/);
});

test('a read that fails is said, never shown as nothing waiting', () => {
  const sections = read('src/app/admin/today/sections.tsx');
  for (const fn of ['WorkSection', 'TraineesSection', 'TeachingSection', 'PeopleSection', 'ContentSection']) {
    const body = sections.slice(sections.indexOf(`export async function ${fn}`));
    const end = body.indexOf('\nexport ', 1);
    assert.match(body.slice(0, end === -1 ? undefined : end), /<Unreadable /, `${fn} says when it could not read`);
  }
});
