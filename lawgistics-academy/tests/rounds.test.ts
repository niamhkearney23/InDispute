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

test('an answer counts for the round whose hour it was given in, whatever its session', () => {
  // Started at 7:55, one answer every 30 seconds: nine before 8, the tenth at 8:00:00.
  const r = roundsFor(KL, DAY, [session(7, 55, 10)], at(8, 5));
  assert.equal(r[0].state, 'missed');
  assert.equal(r[0].answered, 9);
  assert.equal(r[1].state, 'open');
  assert.equal(r[1].answered, 1);
});

test('a trainee answering across the hour is not marked missing for the next round', () => {
  // The audit case: started at 7:50, an answer every three minutes to 8:18.
  const steady = {
    startedAt: at(7, 50).toISOString(),
    answeredAt: Array.from({ length: 10 }, (_, i) => at(7, 51 + i * 3).toISOString()),
    questionCount: 10,
    completedAt: at(8, 19).toISOString(),
  };
  // 7:51, 7:54, 7:57 for 7am; 8:00 to 8:18 for 8am.
  const during = roundsFor(KL, DAY, [steady], at(8, 30));
  assert.equal(during[0].answered, 3);
  assert.equal(during[1].answered, 7);
  assert.equal(during[1].state, 'open');
  // Three more in another session before 9 and the 8am round is done.
  const more = { ...session(8, 40, 3), questionCount: 3 };
  const after = roundsFor(KL, DAY, [steady, more], at(9, 0));
  assert.equal(after[1].state, 'done');
});

test('the hour has no grace: 7:59:59 counts for 7am, 8:00:01 does not', () => {
  const nineEarly = Array.from({ length: 9 }, (_, i) => at(7, 10 + i).toISOString());
  const lastBefore = new Date(at(8).getTime() - 1000).toISOString();
  const lastAfter = new Date(at(8).getTime() + 1000).toISOString();
  const mk = (last: string) => ({
    startedAt: at(7, 5).toISOString(),
    answeredAt: [...nineEarly, last],
    questionCount: 10,
    completedAt: last,
  });
  assert.equal(roundsFor(KL, DAY, [mk(lastBefore)], at(8, 30))[0].state, 'done');
  const late = roundsFor(KL, DAY, [mk(lastAfter)], at(8, 30));
  assert.equal(late[0].state, 'missed');
  assert.equal(late[1].answered, 1);
});

test('a round is open, never missed, until its hour has ended', () => {
  const r = roundsFor(KL, DAY, [], new Date(at(8).getTime() - 1));
  assert.equal(r[0].state, 'open');
  assert.equal(roundsFor(KL, DAY, [], at(8))[0].state, 'missed');
});

test('rounds that closed before rounds started counting are not applicable, not missed', () => {
  // Confirmed at 9:30: 7 and 8am could not have been done; 9am still could.
  const confirmed = at(9, 30);
  const r = roundsFor(KL, DAY, [], at(11, 0), confirmed);
  assert.deepEqual(r.map((x) => x.state), ['not_applicable', 'not_applicable', 'missed', 'missed']);
  // A round closing exactly at the moment is not applicable too.
  const onTheHour = roundsFor(KL, DAY, [], at(9, 30), at(9, 0));
  assert.deepEqual(onTheHour.map((x) => x.state), ['not_applicable', 'not_applicable', 'open', 'upcoming']);
});

test('a short session is done only when started, answered and finished inside one hour', () => {
  // Six questions, started at 7:58, the last answers after 8: neither round is done by it.
  const r = roundsFor(KL, DAY, [session(7, 58, 6, true, 6)], at(9, 0));
  assert.equal(r[0].state, 'missed');
  assert.equal(r[1].state, 'missed');
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

test('each round closes when the next opens, and the last at 11', () => {
  const rounds = roundsFor(KL, DAY, [], at(6, 0));
  assert.deepEqual(rounds.map((r) => r.opensLabel), ['7am', '8am', '9am', '10am']);
  assert.deepEqual(rounds.map((r) => r.closesLabel), ['8am', '9am', '10am', '11am']);
});

test('a cohort on its own clock: three rounds at 9am, 1pm and 4pm in Sydney', () => {
  const sydney = { timezone: 'Australia/Sydney', roundHours: [9, 13, 16], holidays: {} };
  // 1:30pm in Sydney on 10 November 2026 (AEDT, UTC+11) is 02:30 UTC.
  const rounds = roundsFor(sydney, '2026-11-10', [], new Date('2026-11-10T02:30:00Z'));
  assert.deepEqual(rounds.map((r) => r.state), ['missed', 'open', 'upcoming']);
  assert.deepEqual(rounds.map((r) => r.opensLabel), ['9am', '1pm', '4pm']);
  // Each round is open for its own hour, not until the next one opens.
  assert.equal(rounds[1].closesAt.toISOString(), '2026-11-10T03:00:00.000Z');
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
  // They were given in the 10am hour, so they count for the 10am round.
  assert.equal(r[3].state, 'done');
});

test('one test decides which days are rounds days, through the end date', async () => {
  const { roundsDayNumber, lastRoundsDate } = await import('../src/lib/training/rounds');
  const start = '2026-11-02'; // a Monday
  assert.equal(roundsDayNumber(start, null, '2026-11-02'), 1);
  assert.equal(roundsDayNumber(start, null, '2026-11-01'), null); // before the start
  assert.equal(roundsDayNumber(start, null, '2026-11-07'), null); // Saturday
  assert.equal(roundsDayNumber(start, null, '2026-11-09'), null); // Deepavali, skipped
  assert.equal(roundsDayNumber(start, null, '2026-11-10'), 6);
  // With no end date the rounds stop at working day twenty.
  const twenty = lastRoundsDate(start, null);
  assert.equal(roundsDayNumber(start, null, twenty), 20);
  assert.equal(roundsDayNumber(start, null, '2026-12-31'), null);
  // With one, they run to it, even past day twenty.
  assert.equal(roundsDayNumber(start, '2026-12-04', '2026-12-04'), 24);
  assert.equal(roundsDayNumber(start, '2026-12-04', '2026-12-07'), null);
});
