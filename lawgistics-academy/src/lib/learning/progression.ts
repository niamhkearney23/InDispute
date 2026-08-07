import { LEVELS, XP } from './config';
import type { XpKind } from '@/lib/types';

export interface LevelInfo {
  level: number;
  name: string;
  xpIntoLevel: number;
  xpForNextLevel: number | null;
  nextLevelName: string | null;
  progressPercent: number;
}

type Level = (typeof LEVELS)[number];

export function levelForXp(totalXp: number): LevelInfo {
  let current: Level = LEVELS[0];
  let next: Level | null = null;

  for (let i = 0; i < LEVELS.length; i += 1) {
    if (totalXp >= LEVELS[i].xpRequired) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null;
    }
  }

  const xpIntoLevel = totalXp - current.xpRequired;
  const span = next ? next.xpRequired - current.xpRequired : 0;

  return {
    level: current.level,
    name: current.name,
    xpIntoLevel,
    xpForNextLevel: next ? next.xpRequired - totalXp : null,
    nextLevelName: next ? next.name : null,
    progressPercent: next ? Math.min(100, Math.round((xpIntoLevel / span) * 100)) : 100,
  };
}

export interface PendingXpEvent {
  kind: XpKind;
  amount: number;
  meta?: Record<string, unknown>;
}

/** XP earned for a single graded answer. */
export function xpForAnswer(isCorrect: boolean, difficulty: number): PendingXpEvent[] {
  if (!isCorrect) return [];

  const events: PendingXpEvent[] = [
    { kind: 'correct_answer', amount: XP.correctAnswer, meta: { difficulty } },
  ];

  if (difficulty >= XP.hardQuestionMinDifficulty) {
    events.push({
      kind: 'hard_question_bonus',
      amount: XP.hardQuestionBonus,
      meta: { difficulty },
    });
  }

  return events;
}

/** XP earned for finishing a session. */
export function xpForSessionCompletion(args: {
  kind: 'diagnostic' | 'daily' | 'review' | 'practice';
  totalAnswered: number;
  correctCount: number;
  newStreak: number;
  streakIncreased: boolean;
}): PendingXpEvent[] {
  const events: PendingXpEvent[] = [];

  if (args.kind === 'diagnostic') {
    events.push({ kind: 'diagnostic_complete', amount: XP.diagnosticComplete });
  } else {
    events.push({ kind: 'session_complete', amount: XP.sessionComplete });

    if (args.totalAnswered > 0 && args.correctCount === args.totalAnswered) {
      events.push({ kind: 'perfect_session', amount: XP.perfectSession });
    }
  }

  if (
    args.streakIncreased &&
    args.newStreak > 0 &&
    args.newStreak % XP.streakBonusEvery === 0
  ) {
    events.push({
      kind: 'streak_bonus',
      amount: XP.streakBonus,
      meta: { streak: args.newStreak },
    });
  }

  return events;
}

/** Local calendar day in the learner's timezone, as YYYY-MM-DD. */
export function localDateString(timezone: string, at: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(at);
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Australia/Melbourne',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(at);
  }
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastTrainedOn: string | null;
}

export function advanceStreak(
  state: StreakState,
  today: string,
): { next: StreakState; increased: boolean } {
  if (state.lastTrainedOn === today) {
    return { next: state, increased: false };
  }

  const yesterday = (() => {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  })();

  const currentStreak = state.lastTrainedOn === yesterday ? state.currentStreak + 1 : 1;

  return {
    next: {
      currentStreak,
      longestStreak: Math.max(state.longestStreak, currentStreak),
      lastTrainedOn: today,
    },
    increased: true,
  };
}
