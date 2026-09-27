import { REVIEW } from './config';
import type { ConfidenceLevel } from '@/lib/types';

/**
 * The review scheduling service.
 *
 * Deliberately pure: it takes the current state of a concept for one learner
 * plus one outcome, and returns the next state. No database, no clock beyond
 * the `now` you pass in. That makes the algorithm testable today and
 * replaceable tomorrow, a smarter model can be dropped in behind this same
 * signature without touching a single call site.
 */

export interface ReviewState {
  intervalDays: number;
  ease: number;
  reviewCount: number;
  lapses: number;
  nextReviewAt: Date;
}

export interface ReviewOutcome {
  isCorrect: boolean;
  confidence: ConfidenceLevel | null;
  /** Post-attempt mastery for the concept, 0–100. Caps runaway intervals. */
  mastery: number;
}

export function initialReviewState(now: Date = new Date()): ReviewState {
  return {
    intervalDays: 0,
    ease: REVIEW.initialEase,
    reviewCount: 0,
    lapses: 0,
    nextReviewAt: now,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function capForMastery(mastery: number): number {
  for (const band of REVIEW.masteryBandCap) {
    if (mastery <= band.maxMastery) return band.capDays;
  }
  return REVIEW.maxIntervalDays;
}

/** Minutes the zone is ahead of UTC at a moment. */
function offsetMinutes(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') === 24 ? 0 : get('hour'),
    get('minute'),
    get('second'),
  );
  return Math.round((asUtc - at.getTime()) / 60_000);
}

/**
 * The start of the day, `days` from now, where the learner is.
 *
 * Reviews land at the start of a day so "due tomorrow" means tomorrow
 * morning, not 11pm tomorrow night. It was the start of the day in UTC, which
 * is eight in the morning in Kuala Lumpur: a question got wrong at seven
 * came back an hour later, the same morning, while the summary said
 * "tomorrow". Without a zone it keeps the old UTC behaviour.
 */
function addDays(from: Date, days: number, timeZone?: string): Date {
  if (!timeZone) {
    const next = new Date(from.getTime());
    next.setUTCDate(next.getUTCDate() + Math.round(days));
    next.setUTCHours(0, 0, 0, 0);
    return next;
  }
  try {
    const [y, m, d] = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(from)
      .split('-')
      .map(Number);
    const midnightAsUtc = Date.UTC(y, m - 1, d + Math.round(days));
    // Twice, so a clock change between the guess and the answer is caught.
    let instant = midnightAsUtc - offsetMinutes(timeZone, new Date(midnightAsUtc)) * 60_000;
    instant = midnightAsUtc - offsetMinutes(timeZone, new Date(instant)) * 60_000;
    return new Date(instant);
  } catch {
    return addDays(from, days);
  }
}

export function scheduleNextReview(
  state: ReviewState,
  outcome: ReviewOutcome,
  now: Date = new Date(),
  /** The learner's time zone, so a day starts where they are. */
  timeZone?: string,
): ReviewState {
  const reviewCount = state.reviewCount + 1;

  if (!outcome.isCorrect) {
    // A wrong answer resets the ladder. Confidence does not rescue it, if
    // anything, being certain and wrong is the clearest call for a fast retest.
    return {
      intervalDays: REVIEW.lapseIntervalDays,
      ease: clamp(state.ease + REVIEW.easeOnIncorrect, REVIEW.minEase, REVIEW.maxEase),
      reviewCount,
      lapses: state.lapses + 1,
      nextReviewAt: addDays(now, REVIEW.lapseIntervalDays, timeZone),
    };
  }

  const ease = clamp(state.ease + REVIEW.easeOnCorrect, REVIEW.minEase, REVIEW.maxEase);

  let intervalDays: number;
  if (state.intervalDays <= 0) {
    intervalDays = REVIEW.firstIntervalDays;
  } else if (state.intervalDays < REVIEW.secondIntervalDays) {
    intervalDays = REVIEW.secondIntervalDays;
  } else {
    intervalDays = state.intervalDays * ease;
  }

  // An outright guess that happened to be right is weak evidence. Don't let it
  // push the concept out as far as a confident correct answer would.
  if (outcome.confidence === 'guess') {
    intervalDays = Math.max(REVIEW.minIntervalDays, intervalDays * 0.6);
  }

  intervalDays = Math.min(intervalDays, capForMastery(outcome.mastery));
  intervalDays = clamp(intervalDays, REVIEW.minIntervalDays, REVIEW.maxIntervalDays);

  return {
    intervalDays,
    ease,
    reviewCount,
    lapses: state.lapses,
    nextReviewAt: addDays(now, intervalDays, timeZone),
  };
}

/** Human-readable "you'll see this again..." string for the feedback panel. */
export function describeNextReview(nextReviewAt: Date, now: Date = new Date()): string {
  const startOfToday = new Date(now.getTime());
  startOfToday.setUTCHours(0, 0, 0, 0);
  const days = Math.round(
    (nextReviewAt.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (days <= 0) return 'Back later today';
  if (days === 1) return 'Back tomorrow';
  if (days < 7) return `Back in ${days} days`;
  if (days < 14) return 'Back in a week';
  if (days < 31) return `Back in ${Math.round(days / 7)} weeks`;
  return `Back in about ${Math.round(days / 30)} month${days >= 45 ? 's' : ''}`;
}
