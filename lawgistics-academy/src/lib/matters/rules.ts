/**
 * The rules a matter follows, with no database in them, so they are tested
 * directly and shared by the pages, the actions and the certificate.
 */

/** How many follow-up questions are asked about a learner's draft. */
export const FOLLOW_UP_COUNT = 5;

/** How many matters marked Good by a lawyer the certificate asks for. */
export const MATTERS_FOR_CERTIFICATE = 5;

/** The longest spoken explanation, in seconds. */
export const SPEAK_MAX_SECONDS = 180;

export const PROCEDURE_MAX = 4000;
export const DRAFT_MAX = 12000;
export const FOLLOW_UP_ANSWER_MAX = 1500;

/** Where an attempt stands, in the order a learner moves through it. */
export type AttemptStage = 'working' | 'handed_in' | 'good' | 'again';

export function attemptStage(attempt: {
  submittedAt: string | null;
  verdict: 'good' | 'again' | null;
}): AttemptStage {
  if (!attempt.submittedAt) return 'working';
  if (attempt.verdict === 'good') return 'good';
  if (attempt.verdict === 'again') return 'again';
  return 'handed_in';
}

/** Whole minutes left on the clock, never below zero. */
export function minutesLeft(deadlineAt: string, now: Date): number {
  return Math.max(0, Math.ceil((Date.parse(deadlineAt) - now.getTime()) / 60_000));
}

/** "45 minutes", "1 hour 30 minutes". */
export function describeLimit(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const h = `${hours} hour${hours === 1 ? '' : 's'}`;
  return rest === 0 ? h : `${h} ${rest} minutes`;
}

/** "Matter 04". */
export function matterLabel(number: number): string {
  return `Matter ${String(number).padStart(2, '0')}`;
}

/**
 * Questions a supervising lawyer asks about any piece of advice. Used when the
 * AI is not configured or does not answer, and said to be standard questions
 * on the page, so nobody thinks they were written about their draft.
 */
export const STANDARD_FOLLOW_UPS = [
  'What is the single most important thing the client must do next, and by when?',
  'Which rule or provision does your procedure come from, and what does it require?',
  'What is the strongest point against your advice, and how would you answer it?',
  'What evidence would you want to see before you were confident in this advice?',
  'If the other side does nothing, what happens? If they act first, what changes?',
];

/** The instructions the AI is given. It asks; it never answers or states law. */
export const FOLLOW_UP_SYSTEM = [
  'You are a supervising litigation lawyer testing a junior on their own work.',
  `Ask exactly ${FOLLOW_UP_COUNT} short follow-up questions about the junior's procedure and draft advice below.`,
  'Each question must be about what they actually wrote: press on gaps, assumptions, deadlines, evidence, risks and the next step.',
  'Do not answer the questions. Do not state any rule of law, case or provision yourself. Do not praise or grade.',
  'Reply with the questions only, one per line, numbered 1 to 5, each under 200 characters.',
].join(' ');

export function followUpPrompt(input: {
  brief: string;
  procedurePrompt: string;
  procedureAnswer: string;
  draftPrompt: string;
  draftAnswer: string;
}): string {
  return [
    'THE MATTER',
    input.brief,
    '',
    `TASK: ${input.procedurePrompt}`,
    'THE JUNIOR WROTE:',
    input.procedureAnswer,
    '',
    `TASK: ${input.draftPrompt}`,
    'THE JUNIOR WROTE:',
    input.draftAnswer,
  ].join('\n');
}

/**
 * The AI's reply as a list of questions, or null when it is not a usable
 * five. Numbering and bullets are stripped; anything that is not a question
 * of a sensible length is dropped rather than shown.
 */
export function parseFollowUps(reply: string): string[] | null {
  const questions = reply
    .split('\n')
    .map((line) => line.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '').trim())
    .filter((line) => line.length >= 10 && line.length <= 300 && line.endsWith('?'));
  return questions.length >= FOLLOW_UP_COUNT ? questions.slice(0, FOLLOW_UP_COUNT) : null;
}

/** A stored list of strings, whatever the column held. */
export function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => (typeof v === 'string' ? v : '')) : [];
}

/** What an attempt still needs before it can be handed in. */
export function missingForHandIn(attempt: {
  procedureAnswer: string;
  draftAnswer: string;
  followUpQuestions: string[];
  followUpAnswers: string[];
}): string[] {
  const missing: string[] = [];
  if (!attempt.procedureAnswer.trim()) missing.push('the procedure');
  if (!attempt.draftAnswer.trim()) missing.push('your advice');
  if (attempt.followUpQuestions.length === 0) missing.push('the follow-up questions');
  else if (
    attempt.followUpQuestions.some((_, i) => !(attempt.followUpAnswers[i] ?? '').trim())
  ) {
    missing.push('an answer to every follow-up question');
  }
  return missing;
}

/** Whether the certificate's requirements are met. */
export function certificateEarned(input: {
  requiredModulesLeft: number;
  mattersGood: number;
}): boolean {
  return input.requiredModulesLeft === 0 && input.mattersGood >= MATTERS_FOR_CERTIFICATE;
}
