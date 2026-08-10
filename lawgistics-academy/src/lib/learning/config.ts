/**
 * Every number the training engine leans on lives here.
 *
 * The point is that tuning the product should never mean hunting through
 * business logic. If you want harder sessions, faster review intervals, or a
 * different XP economy, this is the only file you touch.
 */

/* -------------------------------------------------------------------------- */
/* Session composition                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The mix the daily session aims for. Shortfalls in one bucket spill into the
 * others in the order listed in `MIX_FALLBACK_ORDER`, a learner with nothing
 * due for review still gets a full session.
 */
export const TRAINING_MIX = {
  /** Concepts with the lowest mastery. */
  weakness: 0.4,
  /** Concepts the scheduler says are due. */
  due_review: 0.3,
  /** Concepts never attempted. */
  new_material: 0.2,
  /** Strong concepts, kept warm. */
  reinforcement: 0.1,
} as const;

export type MixBucket = keyof typeof TRAINING_MIX;

export const MIX_FALLBACK_ORDER: MixBucket[] = [
  'weakness',
  'due_review',
  'new_material',
  'reinforcement',
];

/** Questions per session, keyed by the learner's chosen daily minutes. */
export const QUESTIONS_PER_MINUTE_GOAL: Record<number, number> = {
  5: 10,
  10: 18,
  15: 26,
  20: 34,
};

export const DIAGNOSTIC_QUESTION_COUNT = 30;

/** Don't serve the same question again within this window unless it's due. */
export const REPEAT_COOLDOWN_HOURS = 20;

/* -------------------------------------------------------------------------- */
/* Mastery                                                                    */
/* -------------------------------------------------------------------------- */

export const MASTERY = {
  /** 0–100. Where a concept starts before any evidence. */
  initial: 0,
  /** Weight of the newest attempt against the running score. */
  learningRate: 0.28,
  /**
   * Confidence multipliers on the mastery move. Being certain and wrong is the
   * strongest signal in the system; it means a belief needs correcting, not a
   * gap needs filling, so it moves mastery further than a wrong guess does.
   */
  confidenceWeight: {
    correct: { guess: 0.6, somewhat_sure: 1.0, certain: 1.15 },
    incorrect: { guess: 0.75, somewhat_sure: 1.0, certain: 1.4 },
  },
  /** Harder questions move mastery more. Index by difficulty 1–5. */
  difficultyWeight: [0.8, 0.9, 1.0, 1.15, 1.3],
  /** At or above this, a concept counts as mastered. */
  masteredThreshold: 80,
  /** At or below this, a concept is a priority weakness. */
  weaknessThreshold: 55,
  /** Attempts needed before a score is treated as meaningful. */
  minAttemptsForConfidence: 3,
} as const;

/* -------------------------------------------------------------------------- */
/* Spaced repetition                                                          */
/* -------------------------------------------------------------------------- */

export const REVIEW = {
  /** Wrong answers always come back tomorrow, whatever the prior interval. */
  lapseIntervalDays: 1,
  /** First correct sighting of a concept. */
  firstIntervalDays: 3,
  /** Second consecutive correct. */
  secondIntervalDays: 7,
  /** Ceiling, so nothing disappears forever. */
  maxIntervalDays: 45,
  minIntervalDays: 1,
  /** SM-2 style ease factor bounds. */
  initialEase: 2.5,
  minEase: 1.3,
  maxEase: 3.0,
  /** Ease adjustments per outcome. */
  easeOnCorrect: 0.06,
  easeOnIncorrect: -0.22,
  /**
   * Interval multipliers by mastery band. Keeps the schedule honest when ease
   * alone would let a shaky concept drift too far out.
   */
  masteryBandCap: [
    { maxMastery: 40, capDays: 3 },
    { maxMastery: 60, capDays: 7 },
    { maxMastery: 80, capDays: 21 },
    { maxMastery: 100, capDays: 45 },
  ],
} as const;

/* -------------------------------------------------------------------------- */
/* XP and progression                                                         */
/* -------------------------------------------------------------------------- */

export const XP = {
  correctAnswer: 10,
  /** Added on top of `correctAnswer` for difficulty 4–5. */
  hardQuestionBonus: 5,
  hardQuestionMinDifficulty: 4,
  sessionComplete: 30,
  perfectSession: 25,
  diagnosticComplete: 100,
  /** Awarded when a streak crosses a multiple of `streakBonusEvery` days. */
  streakBonus: 40,
  streakBonusEvery: 7,
} as const;

/**
 * Game levels. Named after the shape of a litigation career because that is
 * motivating, but they are game levels, not qualifications, and the UI says so.
 */
/**
 * Game levels.
 *
 * Deliberately not job titles. They used to be: Law Clerk, Junior Solicitor,
 * Associate, Senior Associate, Advocate, Counsel. Every page carries a footer
 * saying "levels are game levels, not professional titles or qualifications",
 * which was flatly contradicted by a level literally called Senior Associate,
 * and a paralegal showing a partner that an app had made them Counsel is a
 * conversation nobody wants to have. Some of those words are also close to
 * restricted in both jurisdictions.
 *
 * So they are jokes about litigation instead, which nobody can mistake for a
 * qualification and which are more fun to earn. The arc still means something:
 * you start watching from the back and end up as the reason the other side
 * checks who is on the file.
 */
export const LEVELS = [
  {
    level: 1,
    name: 'Public Gallery',
    xpRequired: 0,
    blurb: 'Watching from the back. Everybody starts here.',
  },
  {
    level: 2,
    name: 'Bundle Carrier',
    xpRequired: 250,
    blurb: 'Four lever arch files and a lift that is not working.',
  },
  {
    level: 3,
    name: 'Affidavit Wrangler',
    xpRequired: 700,
    blurb: 'You can find the one paragraph that actually matters.',
  },
  {
    level: 4,
    name: 'Adjournment Survivor',
    xpRequired: 1500,
    blurb: 'You have sat through a mention that achieved nothing. This is character.',
  },
  {
    level: 5,
    name: 'Objection Haver',
    xpRequired: 2800,
    blurb: 'You have views about relevance now, and they are mostly right.',
  },
  {
    level: 6,
    name: 'Subpoena Enthusiast',
    xpRequired: 4600,
    blurb: 'You know what one can and cannot ask for. Rarer than it should be.',
  },
  {
    level: 7,
    name: 'Deadline Whisperer',
    xpRequired: 7200,
    blurb: 'Nothing gets filed late on your watch.',
  },
  {
    level: 8,
    name: 'Costs Order Dodger',
    xpRequired: 10800,
    blurb: 'You read the costs consequences before, not afterwards.',
  },
  {
    level: 9,
    name: 'Known to the Registry',
    xpRequired: 15500,
    blurb: 'They know your name. In this line of work that is a compliment.',
  },
  {
    level: 10,
    name: 'Menace to the Other Side',
    xpRequired: 22000,
    blurb: 'They check who is on the file. That is the whole game.',
  },
] as const;
