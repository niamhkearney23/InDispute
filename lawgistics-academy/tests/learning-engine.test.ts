import assert from 'node:assert/strict';
import test from 'node:test';

import {
  initialReviewState,
  scheduleNextReview,
  describeNextReview,
} from '../src/lib/learning/review-scheduler';
import { applyAttempt, initialMasteryState, displayScore, masteryBand } from '../src/lib/learning/mastery';
import {
  advanceStreak,
  levelForXp,
  localDateString,
  xpForAnswer,
  xpForSessionCompletion,
} from '../src/lib/learning/progression';
import { LEVELS, MASTERY, REVIEW, TRAINING_MIX, XP } from '../src/lib/learning/config';
import { validateSeed, QUESTIONS, DOMAINS } from '../src/content/seed';

const NOW = new Date('2026-03-10T09:00:00Z');

function daysBetween(from: Date, to: Date) {
  const start = new Date(from.getTime());
  start.setUTCHours(0, 0, 0, 0);
  return Math.round((to.getTime() - start.getTime()) / 86_400_000);
}

/* -------------------------------------------------------------------------- */
/* Review scheduling                                                          */
/* -------------------------------------------------------------------------- */

test('a wrong answer always comes back tomorrow, however well established the concept was', () => {
  const mature = {
    intervalDays: 30,
    ease: 2.9,
    reviewCount: 12,
    lapses: 0,
    nextReviewAt: NOW,
  };

  const next = scheduleNextReview(
    mature,
    { isCorrect: false, confidence: 'certain', mastery: 40 },
    NOW,
  );

  assert.equal(next.intervalDays, REVIEW.lapseIntervalDays);
  assert.equal(daysBetween(NOW, next.nextReviewAt), 1);
  assert.equal(next.lapses, 1);
  assert.ok(next.ease < mature.ease, 'a lapse should reduce ease');
});

test('a first correct answer schedules the first interval, not tomorrow', () => {
  const next = scheduleNextReview(
    initialReviewState(NOW),
    { isCorrect: true, confidence: 'somewhat_sure', mastery: 70 },
    NOW,
  );

  assert.equal(next.intervalDays, REVIEW.firstIntervalDays);
  assert.equal(next.reviewCount, 1);
});

test('intervals lengthen as a concept is repeatedly answered correctly', () => {
  let state = initialReviewState(NOW);
  const intervals: number[] = [];

  for (let i = 0; i < 6; i += 1) {
    state = scheduleNextReview(
      state,
      { isCorrect: true, confidence: 'certain', mastery: 95 },
      NOW,
    );
    intervals.push(state.intervalDays);
  }

  for (let i = 1; i < intervals.length; i += 1) {
    assert.ok(
      intervals[i] >= intervals[i - 1],
      `interval ${i} (${intervals[i]}) should not shrink below ${intervals[i - 1]}`,
    );
  }
  assert.ok(intervals.at(-1)! <= REVIEW.maxIntervalDays, 'intervals stay capped');
});

test('low mastery caps how far out a concept can be pushed', () => {
  const shaky = { intervalDays: 20, ease: 2.9, reviewCount: 5, lapses: 2, nextReviewAt: NOW };

  const next = scheduleNextReview(
    shaky,
    { isCorrect: true, confidence: 'certain', mastery: 35 },
    NOW,
  );

  assert.ok(
    next.intervalDays <= 3,
    `a concept at 35 mastery should not go beyond the 3-day band, got ${next.intervalDays}`,
  );
});

test('a lucky guess is not treated as knowledge', () => {
  const state = { intervalDays: 10, ease: 2.5, reviewCount: 3, lapses: 0, nextReviewAt: NOW };

  const confident = scheduleNextReview(
    state,
    { isCorrect: true, confidence: 'certain', mastery: 90 },
    NOW,
  );
  const guessed = scheduleNextReview(
    state,
    { isCorrect: true, confidence: 'guess', mastery: 90 },
    NOW,
  );

  assert.ok(
    guessed.intervalDays < confident.intervalDays,
    'an admitted guess should come back sooner than a confident correct answer',
  );
});

test('review dates are described in plain English', () => {
  const tomorrow = new Date('2026-03-11T00:00:00Z');
  assert.equal(describeNextReview(tomorrow, NOW), 'Back tomorrow');
  assert.equal(describeNextReview(new Date('2026-03-13T00:00:00Z'), NOW), 'Back in 3 days');
  assert.equal(describeNextReview(new Date('2026-03-25T00:00:00Z'), NOW), 'Back in 2 weeks');
});

/* -------------------------------------------------------------------------- */
/* Mastery                                                                    */
/* -------------------------------------------------------------------------- */

test('mastery rises towards 100 with correct answers and falls with wrong ones', () => {
  let state = initialMasteryState();
  for (let i = 0; i < 8; i += 1) {
    state = applyAttempt(state, { isCorrect: true, confidence: 'somewhat_sure', difficulty: 3 });
  }
  assert.ok(state.mastery > MASTERY.masteredThreshold, `expected mastery, got ${state.mastery}`);

  const before = state.mastery;
  state = applyAttempt(state, { isCorrect: false, confidence: 'certain', difficulty: 3 });
  assert.ok(state.mastery < before);
  assert.equal(state.consecutiveCorrect, 0);
  assert.equal(state.consecutiveIncorrect, 1);
});

test('being certain and wrong moves mastery further than guessing and wrong', () => {
  const start = { ...initialMasteryState(), mastery: 70, attempts: 5, correct: 4 };

  const certain = applyAttempt(start, {
    isCorrect: false,
    confidence: 'certain',
    difficulty: 3,
  });
  const guess = applyAttempt(start, { isCorrect: false, confidence: 'guess', difficulty: 3 });

  assert.ok(
    certain.mastery < guess.mastery,
    'a confidently wrong answer is the stronger signal and should cost more',
  );
  assert.equal(certain.confidentAndWrong, 1);
  assert.equal(guess.confidentAndWrong, 0);
});

test('mastery never leaves the 0–100 range', () => {
  let state = initialMasteryState();
  for (let i = 0; i < 50; i += 1) {
    state = applyAttempt(state, { isCorrect: true, confidence: 'certain', difficulty: 5 });
  }
  assert.ok(state.mastery <= 100);

  for (let i = 0; i < 50; i += 1) {
    state = applyAttempt(state, { isCorrect: false, confidence: 'certain', difficulty: 5 });
  }
  assert.ok(state.mastery >= 0);
});

test('a score is damped until there is enough evidence behind it', () => {
  assert.equal(displayScore(90, 0), 0);
  assert.ok(displayScore(90, 1) < 90, 'one answer should not read as 90');
  assert.equal(displayScore(90, MASTERY.minAttemptsForConfidence), 90);
});

test('mastery bands line up with the configured thresholds', () => {
  assert.equal(masteryBand(MASTERY.weaknessThreshold), 'weak');
  assert.equal(masteryBand(MASTERY.weaknessThreshold + 1), 'developing');
  assert.equal(masteryBand(MASTERY.masteredThreshold), 'strong');
});

/* -------------------------------------------------------------------------- */
/* XP, levels and streaks                                                     */
/* -------------------------------------------------------------------------- */

test('XP is only awarded for correct answers, with a bonus for hard ones', () => {
  assert.deepEqual(xpForAnswer(false, 5), []);

  const easy = xpForAnswer(true, 2);
  assert.equal(easy.length, 1);
  assert.equal(easy[0].amount, XP.correctAnswer);

  const hard = xpForAnswer(true, 5);
  assert.equal(hard.length, 2);
  assert.equal(
    hard.reduce((total, event) => total + event.amount, 0),
    XP.correctAnswer + XP.hardQuestionBonus,
  );
});

test('a perfect session earns the bonus and an imperfect one does not', () => {
  const perfect = xpForSessionCompletion({
    kind: 'daily',
    totalAnswered: 10,
    correctCount: 10,
    newStreak: 3,
    streakIncreased: true,
  });
  assert.ok(perfect.some((event) => event.kind === 'perfect_session'));

  const imperfect = xpForSessionCompletion({
    kind: 'daily',
    totalAnswered: 10,
    correctCount: 9,
    newStreak: 3,
    streakIncreased: true,
  });
  assert.ok(!imperfect.some((event) => event.kind === 'perfect_session'));
});

test('the streak bonus lands only on the seventh day', () => {
  const day7 = xpForSessionCompletion({
    kind: 'daily',
    totalAnswered: 5,
    correctCount: 3,
    newStreak: 7,
    streakIncreased: true,
  });
  assert.ok(day7.some((event) => event.kind === 'streak_bonus'));

  const day6 = xpForSessionCompletion({
    kind: 'daily',
    totalAnswered: 5,
    correctCount: 3,
    newStreak: 6,
    streakIncreased: true,
  });
  assert.ok(!day6.some((event) => event.kind === 'streak_bonus'));
});

test('levels follow total XP and report progress to the next one', () => {
  // Asserted against LEVELS rather than against the names themselves. The names
  // are copy and are meant to be changed; the engine is not, and an engine test
  // that fails because somebody reworded a level is a test people learn to edit
  // without reading.
  const first = LEVELS[0];
  const middle = LEVELS[2];
  const last = LEVELS[LEVELS.length - 1];

  assert.equal(levelForXp(0).level, 1);
  assert.equal(levelForXp(0).name, first.name);

  const partway = levelForXp(middle.xpRequired + 100);
  assert.equal(partway.name, middle.name);
  assert.ok(partway.xpForNextLevel! > 0);
  assert.ok(partway.progressPercent > 0 && partway.progressPercent < 100);

  const top = levelForXp(999_999);
  assert.equal(top.name, last.name);
  assert.equal(top.xpForNextLevel, null);
  assert.equal(top.progressPercent, 100);
  assert.equal(top.nextLevelName, null);
});

test('the levels are thresholds in order, each with a line of its own', () => {
  for (let i = 1; i < LEVELS.length; i += 1) {
    assert.equal(LEVELS[i].level, i + 1, 'level numbers run 1..n');
    assert.ok(
      LEVELS[i].xpRequired > LEVELS[i - 1].xpRequired,
      `level ${i + 1} must cost more than level ${i}`,
    );
  }
  assert.equal(LEVELS[0].xpRequired, 0, 'everybody starts somewhere');
  for (const level of LEVELS) {
    assert.ok(level.blurb.trim().length > 0, `level ${level.level} has no blurb`);
    assert.ok(level.name.trim().length > 0);
  }
});

test('no level is a job title, because every page says they are not', () => {
  // The footer on every page reads "levels are game levels, not professional
  // titles or qualifications". These used to be called Law Clerk, Junior
  // Solicitor, Associate, Senior Associate, Advocate and Counsel, which
  // contradicted it flatly. Some of those are close to restricted terms in both
  // jurisdictions, and a paralegal showing a partner that an app had made them
  // Counsel is a conversation nobody wants to have.
  const TITLES = [
    'solicitor',
    'barrister',
    'advocate',
    'counsel',
    'associate',
    'partner',
    'attorney',
    'lawyer',
    'clerk',
    'paralegal',
    'graduate',
    'trainee',
    'qc',
    'sc',
  ];

  for (const level of LEVELS) {
    const words = level.name.toLowerCase().split(/[^a-z]+/).filter(Boolean);
    for (const title of TITLES) {
      assert.ok(
        !words.includes(title),
        `level ${level.level} is called "${level.name}", which reads as a professional title`,
      );
    }
  }
});

test('a streak continues across consecutive days and resets after a gap', () => {
  const day1 = advanceStreak(
    { currentStreak: 0, longestStreak: 0, lastTrainedOn: null },
    '2026-03-10',
  );
  assert.equal(day1.next.currentStreak, 1);
  assert.equal(day1.increased, true);

  const day2 = advanceStreak(day1.next, '2026-03-11');
  assert.equal(day2.next.currentStreak, 2);

  const sameDayAgain = advanceStreak(day2.next, '2026-03-11');
  assert.equal(sameDayAgain.next.currentStreak, 2, 'training twice in a day is still one day');
  assert.equal(sameDayAgain.increased, false);

  const afterGap = advanceStreak(day2.next, '2026-03-15');
  assert.equal(afterGap.next.currentStreak, 1, 'a missed day resets the streak');
  assert.equal(afterGap.next.longestStreak, 2, 'the record is kept');
});

test('the training day is calculated in the learner’s own timezone', () => {
  // 23:30 UTC on 9 March is already 10 March in Melbourne.
  const lateUtc = new Date('2026-03-09T23:30:00Z');
  assert.equal(localDateString('Australia/Melbourne', lateUtc), '2026-03-10');
  assert.equal(localDateString('UTC', lateUtc), '2026-03-09');
  assert.equal(
    localDateString('Not/AZone', lateUtc),
    '2026-03-10',
    'an unusable timezone falls back rather than throwing',
  );
});

/* -------------------------------------------------------------------------- */
/* Configuration and content                                                  */
/* -------------------------------------------------------------------------- */

test('the training mix adds up to a whole session', () => {
  const total = Object.values(TRAINING_MIX).reduce((sum, share) => sum + share, 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `mix should sum to 1, got ${total}`);
});

test('the shipped question bank is structurally sound', () => {
  const errors = validateSeed();
  assert.deepEqual(errors, [], errors.join('\n'));
});

test('every domain has enough questions for a balanced diagnostic', () => {
  for (const domain of DOMAINS) {
    const count = QUESTIONS.filter((q) => q.domain === domain.slug).length;
    assert.ok(count >= 5, `${domain.slug} has only ${count} questions`);
  }
});

test('every question carries a jurisdiction and at least one concept', () => {
  for (const question of QUESTIONS) {
    assert.ok(question.jurisdiction, `${question.slug} has no jurisdiction`);
    assert.ok(question.concepts.length > 0, `${question.slug} has no concepts`);
    assert.ok(question.explanation.length > 40, `${question.slug} has a thin explanation`);
  }
});
