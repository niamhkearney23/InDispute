/**
 * Exams (0056; the owner, November 2026: "this idea too. like how it can
 * help for law school").
 *
 * Two kinds. A **mock exam** is a set paper: every area, spread from easy to
 * hard the way the diagnostic is, against the clock. A **drill** is built by
 * the learner: the areas, how hard, how many, how long, and which questions
 * (any, ones never answered, or ones last answered wrong).
 *
 * Pure, so every rule here is tested; the reads and writes are in service.ts.
 * Questions come only from the training bank the caller hands in, which is
 * already signed off, published, in date, the learner's country and never a
 * diagnostic-only question.
 */

export type ExamMode = 'mock' | 'drill';
export type ExamDifficulty = 'any' | 'easy' | 'medium' | 'hard';
export type ExamPool = 'all' | 'unanswered' | 'wrong';

export interface ExamSettings {
  mode: ExamMode;
  /** Area (domain) slugs; empty means every area. */
  areas: string[];
  difficulty: ExamDifficulty;
  pool: ExamPool;
  count: number;
  /** 0 means untimed. */
  minutes: number;
}

/** The mock exam: forty questions, an hour. */
export const MOCK_EXAM: ExamSettings = {
  mode: 'mock',
  areas: [],
  difficulty: 'any',
  pool: 'all',
  count: 40,
  minutes: 60,
};

export const DRILL_COUNTS = [10, 20, 40] as const;
export const DRILL_MINUTES = [0, 10, 20, 30, 60] as const;

export const DIFFICULTY_LABELS: Record<ExamDifficulty, string> = {
  any: 'Any',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export const POOL_LABELS: Record<ExamPool, string> = {
  all: 'Any question',
  unanswered: 'Not answered yet',
  wrong: 'Got wrong last time',
};

/** Questions are written at difficulty 1 to 5. */
export function inBand(difficulty: number, band: ExamDifficulty): boolean {
  if (band === 'easy') return difficulty <= 2;
  if (band === 'medium') return difficulty === 3;
  if (band === 'hard') return difficulty >= 4;
  return true;
}

/**
 * The drill form, read strictly: anything not on a list is refused rather
 * than guessed at, because the settings decide which questions are served.
 */
export function parseDrill(input: {
  areas: string[];
  difficulty: string | null;
  pool: string | null;
  count: string | null;
  minutes: string | null;
  knownAreas: string[];
}): ExamSettings | null {
  const difficulty = input.difficulty ?? 'any';
  const pool = input.pool ?? 'all';
  const count = Number(input.count);
  const minutes = Number(input.minutes ?? 0);
  if (!(difficulty in DIFFICULTY_LABELS)) return null;
  if (!(pool in POOL_LABELS)) return null;
  if (!(DRILL_COUNTS as readonly number[]).includes(count)) return null;
  if (!(DRILL_MINUTES as readonly number[]).includes(minutes)) return null;
  const areas = [...new Set(input.areas)];
  if (areas.some((a) => !input.knownAreas.includes(a))) return null;
  return {
    mode: 'drill',
    areas,
    difficulty: difficulty as ExamDifficulty,
    pool: pool as ExamPool,
    count,
    minutes,
  };
}

/** Settings read back from the database, or null when they are not an exam's. */
export function readSettings(value: unknown): ExamSettings | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<ExamSettings>;
  if (v.mode !== 'mock' && v.mode !== 'drill') return null;
  return {
    mode: v.mode,
    areas: Array.isArray(v.areas) ? v.areas.filter((a): a is string => typeof a === 'string') : [],
    difficulty: v.difficulty && v.difficulty in DIFFICULTY_LABELS ? v.difficulty : 'any',
    pool: v.pool && v.pool in POOL_LABELS ? v.pool : 'all',
    count: typeof v.count === 'number' ? v.count : 0,
    minutes: typeof v.minutes === 'number' ? v.minutes : 0,
  };
}

export interface ExamCandidate {
  questionId: string;
  domainSlug: string;
  difficulty: number;
}

/**
 * A drill's paper: the learner's filter, shuffled, cut to the number asked
 * for. (A mock exam is spread like the diagnostic instead: selection.ts.)
 * It may come back shorter than asked when the signed-off bank is small; the
 * page says how many it got.
 */
export function drillPaper<Q extends ExamCandidate>(
  bank: Q[],
  settings: ExamSettings,
  history: { answered: ReadonlySet<string>; lastWrong: ReadonlySet<string> },
  random: () => number = Math.random,
): Q[] {
  const fit = bank.filter(
    (q) =>
      (settings.areas.length === 0 || settings.areas.includes(q.domainSlug)) &&
      inBand(q.difficulty, settings.difficulty) &&
      (settings.pool === 'all' ||
        (settings.pool === 'unanswered' && !history.answered.has(q.questionId)) ||
        (settings.pool === 'wrong' && history.lastWrong.has(q.questionId))),
  );
  const copy = [...fit];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, settings.count);
}

/** When a timed exam ends, or null for an untimed one. */
export function examEndsAt(startedAt: string | Date, minutes: number | null | undefined): Date | null {
  if (!minutes || minutes <= 0) return null;
  return new Date(new Date(startedAt).getTime() + minutes * 60_000);
}

/**
 * Whether time is up. The server allows a few seconds past the end, for an
 * answer pressed on the last second that arrives just after it.
 */
export const EXAM_GRACE_MS = 15_000;
export function examOver(startedAt: string | Date, minutes: number | null | undefined, now: Date): boolean {
  const ends = examEndsAt(startedAt, minutes);
  return ends !== null && now.getTime() > ends.getTime() + EXAM_GRACE_MS;
}

/** What an attempt was, in a few words, for the history. */
export function examTitle(settings: ExamSettings, areaName: (slug: string) => string): string {
  if (settings.mode === 'mock') return 'Mock exam';
  const areas =
    settings.areas.length === 0
      ? 'Every area'
      : settings.areas.length <= 2
        ? settings.areas.map(areaName).join(' and ')
        : `${settings.areas.length} areas`;
  return `Drill: ${areas}`;
}

export function examDetail(settings: ExamSettings): string {
  const parts = [
    `${settings.count} questions`,
    settings.minutes > 0 ? `${settings.minutes} minutes` : 'untimed',
  ];
  if (settings.mode === 'drill') {
    if (settings.difficulty !== 'any') parts.push(DIFFICULTY_LABELS[settings.difficulty].toLowerCase());
    if (settings.pool !== 'all') parts.push(POOL_LABELS[settings.pool].toLowerCase());
  }
  return parts.join(' · ');
}

/** "1h 05m", "12m 30s". */
export function durationLabel(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}
