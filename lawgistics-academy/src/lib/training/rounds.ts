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
 * Pure, so it is tested directly: given the clock, the learner's timezone
 * and what they have done today, say where each round stands.
 */
import { localHour } from '@/lib/local-day';

/**
 * The rounds run on Kuala Lumpur time, the firm's clock, for every trainee
 * whatever timezone their own account is set to.
 */
export const ROUNDS_TIMEZONE = 'Asia/Kuala_Lumpur';

/** The local hours the rounds open at. */
export const ROUND_HOURS = [7, 8, 9, 10] as const;
/** Questions in a round. */
export const ROUND_SIZE = 10;
/** When the last round closes. */
export const MORNING_ENDS = 11;

export type RoundState = 'upcoming' | 'open' | 'done' | 'missed';

export interface Round {
  /** 1 to 4. */
  number: number;
  opensAt: Date;
  closesAt: Date;
  state: RoundState;
  /** Answers given in this round's sessions. */
  answered: number;
}

/** A daily session as the rounds see it. */
export interface RoundSession {
  startedAt: string;
  totalAnswered: number;
  completed: boolean;
}

/** Each round's window on a local day. */
export function roundWindows(timezone: string, localDate: string) {
  return ROUND_HOURS.map((hour, i) => ({
    number: i + 1,
    opensAt: localHour(timezone, localDate, hour),
    closesAt: localHour(timezone, localDate, ROUND_HOURS[i + 1] ?? MORNING_ENDS),
  }));
}

/**
 * Where each round stands. A session belongs to the round it was started
 * in; a round is done once its sessions hold ten answers, or one of them
 * was finished (when the bank could not supply ten, finishing what there
 * was counts).
 */
export function roundsFor(
  timezone: string,
  localDate: string,
  sessions: RoundSession[],
  now: Date = new Date(),
): Round[] {
  return roundWindows(timezone, localDate).map((w) => {
    const inRound = sessions.filter((s) => {
      const t = new Date(s.startedAt).getTime();
      return t >= w.opensAt.getTime() && t < w.closesAt.getTime();
    });
    const answered = inRound.reduce((n, s) => n + s.totalAnswered, 0);
    const done = answered >= ROUND_SIZE || inRound.some((s) => s.completed);
    const state: RoundState = done
      ? 'done'
      : now < w.opensAt
        ? 'upcoming'
        : now < w.closesAt
          ? 'open'
          : 'missed';
    return { ...w, state, answered: Math.min(answered, ROUND_SIZE) };
  });
}

/** The round open now and not yet done, if there is one. */
export function openRound(rounds: Round[]): Round | null {
  return rounds.find((r) => r.state === 'open') ?? null;
}

/** When the next round opens, if one is still to come today. */
export function nextOpening(rounds: Round[]): Round | null {
  return rounds.find((r) => r.state === 'upcoming') ?? null;
}

const hourLabel = (hour: number) => `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'pm' : 'am'}`;

/** "7am", "10am": the local hour a round opens at, for the page. */
export function roundLabel(round: { number: number }): string {
  return hourLabel(ROUND_HOURS[round.number - 1]);
}

/** "8am", "11am": the local hour a round closes at. */
export function closingLabel(round: { number: number }): string {
  return hourLabel(ROUND_HOURS[round.number] ?? MORNING_ENDS);
}
