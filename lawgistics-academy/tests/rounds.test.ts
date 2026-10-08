import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localHour } from '../src/lib/local-day';
import { nextOpening, openRound, roundLabel, roundsFor, roundWindows } from '../src/lib/training/rounds';

const KL = 'Asia/Kuala_Lumpur';
const DAY = '2026-11-02';
const at = (h: number, m = 0) => new Date(localHour(KL, DAY, h).getTime() + m * 60_000);
// A session started at h:m with `answered` answers, one every 30 seconds.
const session = (h: number, m: number, answered: number, completed = false, questionCount = 10) => {
  const start = at(h, m).getTime();
  const answeredAt = Array.from({ length: answered }, (_, i) => new Date(start + (i + 1) * 30_000).toISOString());
  return {
    startedAt: new Date(start).toISOString(),
    answeredAt,
    questionCount,
    completedAt: completed ? new Date(start + (answered + 1) * 30_000).toISOString() : null,
  };
};

test('four rounds, opening at 7, 8, 9 and 10 where the trainee is', () => {
  const w = roundWindows(KL, DAY);
  assert.equal(w.length, 4);
  assert.equal(w[0].opensAt.toISOString(), '2026-11-01T23:00:00.000Z'); // 7am KL is 11pm UTC the day before
  assert.equal(w[3].closesAt.toISOString(), '2026-11-02T03:00:00.000Z'); // the morning ends at 11
  assert.deepEqual(w.map(roundLabel), ['7am', '8am', '9am', '10am']);
});

test('before 7, everything is still to come', () => {
  const r = roundsFor(KL, DAY, [], at(6, 30));
  assert.deepEqual(r.map((x) => x.state), ['upcoming', 'upcoming', 'upcoming', 'upcoming']);
  assert.equal(openRound(r), null);
  assert.equal(nextOpening(r)?.number, 1);
});

test('a round is open for its hour, done at ten answers, missed when the hour passes', () => {
  const r = roundsFor(KL, DAY, [session(7, 5, 10), session(8, 40, 4)], at(9, 10));
  assert.deepEqual(r.map((x) => x.state), ['done', 'missed', 'open', 'upcoming']);
  assert.equal(openRound(r)?.number, 3);
  assert.equal(nextOpening(r)?.number, 4);
});

test('a session belongs to the round it was started in', () => {
  // Started at 7:55 and finished after 8: it is round one's, not round two's.
  const r = roundsFor(KL, DAY, [session(7, 55, 10)], at(8, 5));
  assert.equal(r[0].state, 'done');
  assert.equal(r[1].state, 'open');
  assert.equal(r[1].answered, 0);
});

test('finishing a short session counts when the bank had fewer than ten', () => {
  const r = roundsFor(KL, DAY, [session(7, 1, 6, true, 6)], at(7, 30));
  assert.equal(r[0].state, 'done');
});

test('after 11 nothing is open and nothing is to come', () => {
  const r = roundsFor(KL, DAY, [], at(11, 0));
  assert.deepEqual(r.map((x) => x.state), ['missed', 'missed', 'missed', 'missed']);
  assert.equal(openRound(r), null);
  assert.equal(nextOpening(r), null);
});

test('7am is 7am on the morning the clocks change in Melbourne', () => {
  // Daylight saving starts on 4 October 2026 at 2am in Melbourne.
  const seven = localHour('Australia/Melbourne', '2026-10-04', 7);
  assert.equal(seven.toISOString(), '2026-10-03T20:00:00.000Z'); // 7am AEDT is UTC+11
});

test('each round closes when the next opens, and the last at 11', async () => {
  const { closingLabel } = await import('../src/lib/training/rounds');
  assert.deepEqual([1, 2, 3, 4].map((number) => closingLabel({ number })), ['8am', '9am', '10am', '11am']);
});

test('finishing a session without answering it does not do the round', () => {
  // Ten questions given, none answered, finished at once: not done.
  const r = roundsFor(KL, DAY, [session(7, 59, 0, true, 10)], at(8, 30));
  assert.equal(r[0].state, 'missed');
});

test('answers given long after the round closed do not count for it', () => {
  // Started at 7:59, the ten answers given at 10:45: round one was missed.
  const late = {
    startedAt: at(7, 59).toISOString(),
    answeredAt: Array.from({ length: 10 }, (_, i) => at(10, 45 + i).toISOString()),
    questionCount: 10,
    completedAt: at(10, 56).toISOString(),
  };
  const r = roundsFor(KL, DAY, [late], at(11, 0));
  assert.equal(r[0].state, 'missed');
  assert.equal(r[0].answered, 0);
});

test('a round started near the end still counts if finished just after it closes', () => {
  // Started at 7:55, the last answer at 8:00:30: inside the grace.
  const r = roundsFor(KL, DAY, [session(7, 55, 10)], at(8, 30));
  assert.equal(r[0].state, 'done');
});
