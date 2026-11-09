/**
 * The "Ask" box's rules. Pure, so they are tested directly.
 *
 * The standing rule is that AI never publishes legal content. So a question is
 * answered only from lesson steps a lawyer has signed off: the words are found
 * by matching, never recalled by the AI, the AI may only put those words into
 * a short answer, and anything it says that is not in them is thrown away
 * (the tutor's guard). If nothing in the lessons matches, no AI is asked and
 * the person is told so.
 */

export const DAILY_ASKS = 15;
export const MAX_QUESTION = 300;
export const MIN_QUESTION = 3;
export const PASSAGES_USED = 3;
/** The least a match must score to count as the lessons covering the question. */
export const MIN_SCORE = 2;

export interface Passage {
  moduleSlug: string;
  lessonTitle: string;
  step: number;
  heading: string;
  text: string;
}

const STOP = new Set(
  (
    'the and for are but not you your with what when where which who whom how why does did can could ' +
    'should would will shall this that these those have has had its from into than then them they their ' +
    'there about over under after before between also any all one out off our too very was were been being ' +
    'is it in on of to a an as at by be do if or so me my we us i'
  ).split(/\s+/),
);

export function tokens(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return [...new Set(words.filter((w) => w.length >= 3 && !STOP.has(w)).map(stem))];
}

/** A rough stem, so "courts" finds "court" and "appeals" finds "appeal". */
function stem(word: string): string {
  return word.length > 4 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word;
}

export function scorePassage(question: string[], passage: Passage): number {
  const heading = new Set(tokens(passage.heading));
  const body = new Set(tokens(`${passage.text} ${passage.lessonTitle}`));
  let score = 0;
  for (const t of question) {
    if (heading.has(t)) score += 2;
    else if (body.has(t)) score += 1;
  }
  return score;
}

/** The best passages for a question, best first, only those that clear the bar. */
export function pickPassages(question: string, passages: Passage[], max = PASSAGES_USED): Passage[] {
  const q = tokens(question);
  if (q.length === 0) return [];
  return passages
    .map((p) => ({ p, score: scorePassage(q, p) }))
    .filter((x) => x.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => x.p);
}

export function cleanQuestion(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const q = raw.trim().replace(/\s+/g, ' ');
  return q.length >= MIN_QUESTION && q.length <= MAX_QUESTION ? q : null;
}

export const NOT_COVERED =
  'The lessons do not cover that yet, so I will not guess. Try other words, look through Learn, or ask your coach.';
export const LIMIT_REACHED = `That is ${DAILY_ASKS} questions today, the most the box takes. Try again tomorrow.`;

export const ASK_SYSTEM =
  'You answer a law learner’s question using ONLY the numbered lesson passages given. ' +
  'Write two to four plain sentences. Do not add any rule, section, case, time limit or fact that is not in the passages. ' +
  'Do not say whether the learner is right or wrong about the law. ' +
  'If the passages do not answer the question, reply with exactly: NOT_IN_LESSONS';

export function askPrompt(question: string, passages: Passage[]): string {
  return [
    ...passages.map((p, i) => `Passage ${i + 1} (${p.lessonTitle}, ${p.heading}): ${p.text}`),
    '',
    `Question: ${question}`,
  ].join('\n');
}

export interface AskSource {
  title: string;
  heading: string;
  href: string;
}

export type AskResult =
  | { kind: 'answer'; text: string; sources: AskSource[]; written: boolean }
  | { kind: 'notCovered' }
  | { kind: 'limit' }
  | { kind: 'error' };

export const sourcesOf = (passages: Passage[]): AskSource[] =>
  passages.map((p) => ({ title: p.lessonTitle, heading: p.heading, href: `/modules/${p.moduleSlug}` }));
