import { localDateString } from './progression';
import { rightShare } from './mastery';

/**
 * A person's overall score, day by day.
 *
 * The overall score is the share of every answer they have ever given that
 * was right, the same rule as the scores by area: all right is 100%, and it
 * only comes down when they get one wrong. Each day carries where the overall
 * score stood at the end of that day, and how that day went on its own.
 */

export interface ScoreDay {
  /** YYYY-MM-DD, in the timezone it was read in. */
  date: string;
  /** Answers given that day, and how many were right. */
  answered: number;
  right: number;
  /** That day on its own. */
  dayScore: number;
  /** Every answer up to the end of that day. */
  overall: number;
}

export interface AnswerMark {
  answeredAt: string;
  correct: boolean;
}

export function scoreOverTime(answers: AnswerMark[], timezone: string): ScoreDay[] {
  const byDay = new Map<string, { answered: number; right: number }>();
  for (const answer of answers) {
    const date = localDateString(timezone, new Date(answer.answeredAt));
    const entry = byDay.get(date) ?? { answered: 0, right: 0 };
    entry.answered += 1;
    if (answer.correct) entry.right += 1;
    byDay.set(date, entry);
  }

  let answered = 0;
  let right = 0;
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, day]) => {
      answered += day.answered;
      right += day.right;
      return {
        date,
        answered: day.answered,
        right: day.right,
        dayScore: rightShare(day.right, day.answered),
        overall: rightShare(right, answered),
      };
    });
}
