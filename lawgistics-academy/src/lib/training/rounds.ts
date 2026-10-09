/**
 * The trainee morning: four rounds of ten questions, one an hour.
 *
 * On a working day of the placement a confirmed trainee's training is a
 * round at 7am, 8am, 9am and 10am Kuala Lumpur time, ten questions each, and
 * the morning ends at 11. A round is open for its hour. Finish it in that
 * hour and it is done; let the hour pass and it is missed for good, and the
 * coach sees that. There is no timer on the questions themselves, only a
 * countdown to when the next round opens.
 *
 * Those are the defaults. A trainee in a cohort (0041) runs on the cohort's
 * timezone, round hours and holidays instead (`Schedule`), each round open
 * for its own hour.
 *
 * Pure, so it is tested directly: given the clock, the schedule and what
 * they have done today, say where each round stands.
 */
import { localHour } from '@/lib/local-day';
import { dateOfWorkingDay, isWorkingDay, workingDaysElapsed } from '@/lib/homework/rules';
import { HOMEWORK_DAYS } from '@/content/seed/homework';
import { DEFAULT_SCHEDULE, hourLabel, type Schedule } from './schedule';

/**
 * The rounds run on the cohort's clock, Kuala Lumpur time by default, for
 * every trainee whatever timezone their own account is set to.
 */
export const ROUNDS_TIMEZONE = DEFAULT_SCHEDULE.timezone;

/** The local hours the rounds open at, by default. */
export const ROUND_HOURS = DEFAULT_SCHEDULE.roundHours;
/** Questions in a round. */
export const ROUND_SIZE = 10;
/** When the last default round closes. */
export const MORNING_ENDS = 11;

/** A schedule, or just a timezone on the default hours and holidays. */
function asSchedule(s: Schedule | string): Schedule {
  return typeof s === 'string' ? { ...DEFAULT_SCHEDULE, timezone: s } : s;
}

/**
 * `not_applicable` is a round that closed before the trainee was confirmed
 * or before questions were first published: nothing could have been done in
 * it, so it is neither done nor missed.
 */
export type RoundState = 'upcoming' | 'open' | 'done' | 'missed' | 'not_applicable';

export interface Round {
  /** 1 to 4. */
  number: number;
  opensAt: Date;
  closesAt: Date;
  /** "7am": when it opens, on the cohort's clock. */
  opensLabel: string;
  /** "8am": when it closes. */
  closesLabel: string;
  state: RoundState;
  /** Answers given in this round's hour, at most ten. */
  answered: number;
}

/** A daily session as the rounds see it. */
export interface RoundSession {
  startedAt: string;
  /** When each of its answers was given, by the server's clock. */
  answeredAt: string[];
  /** How many questions it was given. */
  questionCount: number;
  completedAt: string | null;
}

/** Each round's window on a local day: its own hour. */
export function roundWindows(schedule: Schedule | string, localDate: string) {
  const s = asSchedule(schedule);
  return s.roundHours.map((hour, i) => ({
    number: i + 1,
    opensAt: localHour(s.timezone, localDate, hour),
    closesAt: localHour(s.timezone, localDate, hour + 1),
    opensLabel: hourLabel(hour),
    closesLabel: hourLabel(hour + 1),
  }));
}

/**
 * Where each round stands.
 *
 * An answer counts for the round whose hour it was given in, whatever
 * session it belongs to, so a session started at 7:50 and answered through
 * to 8:18 gives its early answers to the 7am round and its later ones to the
 * 8am round: a trainee who is answering is never marked missing. A round
 * left at 7:59 still cannot be filled in at 10:45, because those answers
 * belong to the 10am round. The hour is the whole window, with no grace: an
 * answer at 7:59:59 counts for 7am, one at 8:00:01 does not.
 *
 * A round is done at ten answers in its hour, or when a session the bank
 * could not fill to ten was started, answered in full and finished inside
 * that same hour.
 *
 * A round that closes at or before `notBefore` (the trainee was confirmed,
 * or questions were first published, after it) could not have been done, so
 * it is not applicable rather than missed.
 */
export function roundsFor(
  schedule: Schedule | string,
  localDate: string,
  sessions: RoundSession[],
  now: Date = new Date(),
  notBefore: Date | null = null,
): Round[] {
  return roundWindows(schedule, localDate).map((w) => {
    const inHour = (iso: string) => {
      const t = new Date(iso).getTime();
      return t >= w.opensAt.getTime() && t < w.closesAt.getTime();
    };
    const answered = sessions.reduce((n, s) => n + s.answeredAt.filter(inHour).length, 0);
    const shortButFinished = sessions.some(
      (s) =>
        s.questionCount > 0 &&
        s.questionCount < ROUND_SIZE &&
        inHour(s.startedAt) &&
        s.completedAt !== null &&
        inHour(s.completedAt) &&
        s.answeredAt.filter(inHour).length >= s.questionCount,
    );
    const done = answered >= ROUND_SIZE || shortButFinished;
    const state: RoundState = done
      ? 'done'
      : notBefore && w.closesAt.getTime() <= notBefore.getTime()
        ? 'not_applicable'
        : now < w.opensAt
          ? 'upcoming'
          : now < w.closesAt
            ? 'open'
            : 'missed';
    return { ...w, state, answered: Math.min(answered, ROUND_SIZE) };
  });
}

/** The last day rounds can run: the end date, or working day twenty when none is set. */
export function lastRoundsDate(
  startsOn: string,
  endsOn: string | null,
  holidays: Record<string, string> = DEFAULT_SCHEDULE.holidays,
): string {
  return endsOn ?? dateOfWorkingDay(startsOn, HOMEWORK_DAYS, holidays);
}

/**
 * Whether a calendar day is a rounds day for this person, and if so which
 * working day of their placement it is: a working day (not a weekend or a
 * skipped holiday) from the start date to the last rounds day. Null when it
 * is not one. Today's rounds and the calendar both ask this, so they cannot
 * disagree about which mornings had rounds.
 */
export function roundsDayNumber(
  startsOn: string | null,
  endsOn: string | null,
  date: string,
  holidays: Record<string, string> = DEFAULT_SCHEDULE.holidays,
): number | null {
  if (!startsOn || date < startsOn || date > lastRoundsDate(startsOn, endsOn, holidays)) return null;
  if (!isWorkingDay(date, holidays)) return null;
  const elapsed = Math.round(
    (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${startsOn}T00:00:00Z`)) / 86_400_000,
  );
  return workingDaysElapsed(startsOn, elapsed, holidays);
}

/** The round open now and not yet done, if there is one. */
export function openRound(rounds: Round[]): Round | null {
  return rounds.find((r) => r.state === 'open') ?? null;
}

/** When the next round opens, if one is still to come today. */
export function nextOpening(rounds: Round[]): Round | null {
  return rounds.find((r) => r.state === 'upcoming') ?? null;
}

/** "7am", "10am": the local hour a round opens at, for the page. */
export function roundLabel(round: { opensLabel: string }): string {
  return round.opensLabel;
}

/** "8am", "11am": the local hour a round closes at. */
export function closingLabel(round: { closesLabel: string }): string {
  return round.closesLabel;
}
