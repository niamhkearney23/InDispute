/**
 * The tutor's rules and prompts. Pure, so they are tested directly; the part
 * that reads and writes the database is in service.ts.
 *
 * The standing rule is that AI never publishes legal content, so the tutor
 * is built to teach without stating law. "Explain it back" only ever asks:
 * it points at jargon, gaps and oversimplification in the learner's own
 * words, and sends anything legally doubtful to the lesson or a coach.
 * "Test me" uses questions a lawyer has verified, and whatever it says about
 * an answer is drawn from that question's verified explanation, which the
 * page shows beside it.
 */

export type TutorMode = 'explain' | 'test';

export function asMode(value: unknown): TutorMode | null {
  return value === 'explain' || value === 'test' ? value : null;
}

export const MODES: Record<TutorMode, { name: string; line: string }> = {
  explain: {
    name: 'Explain it back',
    line: 'Explain an idea as if to a ten-year-old. The tutor stops you at jargon, skipped steps and anything made too simple to be true.',
  },
  test: {
    name: 'Test me',
    line: 'Five questions a lawyer has checked, one at a time. After each, what your answer suggests you are missing.',
  },
};

/** How many questions a "Test me" asks. */
export const TEST_LENGTH = 5;

/** Messages a learner may send the tutor in a day. Each one costs money. */
export const DAILY_LIMIT = 60;

/** How much of a learner's message is kept, and how much of the reply. */
export const LEARNER_MAX = 2000;
export const REPLY_MAX = 1500;

/** What the page says above every conversation, so nobody is surprised. */
export const TUTOR_NOTICE =
  'This is an AI tutor. It has not been checked by a lawyer, and it will not tell you what the law is. ' +
  'Do not type client names or details. Your coaches can read these conversations.';

/**
 * A reply as it is stored and shown: no em or en dashes (the house rule
 * holds for what the AI writes too), no runs of blank lines, and cut to a
 * length a phone can show.
 */
export function cleanReply(reply: string): string {
  const text = reply
    .replace(/\s*[\u2013\u2014]\s*/g, ', ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text.length > REPLY_MAX ? `${text.slice(0, REPLY_MAX - 1).trimEnd()}…` : text;
}

/** The first thing the tutor says in "Explain it back", before any AI. */
export function explainOpening(topic: string): string {
  return [
    `Explain "${topic}" to me as if I were ten years old.`,
    'Use your own words. I will stop you whenever you use a term without saying what it means, skip a step, or make it so simple it is no longer true.',
  ].join(' ');
}

export const EXPLAIN_SYSTEM = [
  'You are a strict but kind tutor using the Feynman method with a junior lawyer.',
  'They are explaining an idea as if to a ten-year-old. Read their latest message in the light of the conversation.',
  'Stop them at the first problem you find: a legal or technical term used without saying what it means, a step skipped, or something made so simple it is no longer accurate.',
  'Quote their words, say which of the three problems it is, and ask exactly ONE short question that makes them fix it.',
  'Never explain the idea yourself. Never state a rule of law, a case, a provision, a time limit or a court. Never say whether their law is right or wrong.',
  'If something they say sounds legally doubtful, say only that they should check that point against the lesson or ask their coach.',
  'If their explanation is now clear, complete and free of unexplained terms, say so in one sentence, then list in a few words each gap the conversation exposed, and stop.',
  'Write under 110 words, in plain British English, as plain text. Do not use em dashes or en dashes.',
].join(' ');

export interface TurnLine {
  role: 'learner' | 'tutor';
  body: string;
}

/** The conversation so far, as the model reads it. The last twelve turns. */
export function explainPrompt(topic: string, turns: TurnLine[]): string {
  const recent = turns.slice(-12);
  return [
    `The idea being explained: ${topic}`,
    '',
    ...recent.map((t) => `${t.role === 'learner' ? 'LEARNER' : 'TUTOR'}: ${t.body}`),
    '',
    'Reply as the TUTOR to the learner’s latest message.',
  ].join('\n');
}

export interface VerifiedQuestion {
  versionId: string;
  stem: string;
  scenario: string | null;
  options: Array<{ id: string; text: string }>;
  correctOptionIds: string[];
  explanation: string;
  misconception: string | null;
}

/** How many a "Test me" asks: five, or fewer when fewer have been checked. */
export function testLength(available: number): number {
  return Math.min(TEST_LENGTH, available);
}

/** A question as the tutor asks it: the facts, the question and the options. */
export function questionMessage(q: VerifiedQuestion, number: number, total: number): string {
  const lines = [`Question ${number} of ${total}.`];
  if (q.scenario) lines.push('', q.scenario);
  lines.push('', q.stem, '');
  for (const option of q.options) lines.push(`${option.id.toUpperCase()}. ${option.text}`);
  return lines.join('\n');
}

/** Whether an option is one of the verified right answers. */
export function isCorrect(q: VerifiedQuestion, chosen: string): boolean {
  return q.correctOptionIds.includes(chosen);
}

export const TEST_SYSTEM = [
  'You are a tutor helping a junior lawyer find gaps in what they know.',
  'They have just answered a multiple choice question. You are given the question, their answer, their reason if they gave one, and an explanation a lawyer has checked.',
  'In two or three sentences, say what their answer and reason suggest they are missing or confusing.',
  'Use only what is in the checked explanation. Do not add any law, case, provision, time limit or court that is not in it. Do not repeat the explanation; it is shown to them separately.',
  'If they were right but their reason was shaky, say what was shaky. If they were right for the right reason, say so in one sentence.',
  'Write plain British English as plain text. Do not use em dashes or en dashes.',
].join(' ');

export function testPrompt(input: {
  question: VerifiedQuestion;
  chosen: string;
  reason: string;
  correct: boolean;
}): string {
  const { question: q, chosen, reason, correct } = input;
  const chosenText = q.options.find((o) => o.id === chosen)?.text ?? chosen;
  const rightText = q.options
    .filter((o) => q.correctOptionIds.includes(o.id))
    .map((o) => o.text)
    .join(' / ');
  return [
    q.scenario ? `FACTS: ${q.scenario}` : '',
    `QUESTION: ${q.stem}`,
    `THEIR ANSWER: ${chosenText} (${correct ? 'right' : 'wrong'})`,
    `THE RIGHT ANSWER: ${rightText}`,
    `THEIR REASON: ${reason.trim() || '(none given)'}`,
    `CHECKED EXPLANATION: ${q.explanation}`,
    q.misconception ? `COMMON MISCONCEPTION (also checked): ${q.misconception}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * What the tutor says after an answer when the AI is not available or fails:
 * right or wrong, and the verified explanation, which is shown anyway.
 */
export function plainVerdict(correct: boolean): string {
  return correct
    ? 'Right. Read the checked explanation below to make sure your reason matches it.'
    : 'Not quite. Read the checked explanation below, then look again at why the answer you chose does not fit.';
}

/** The end of a "Test me": how many were right, and which ones to revisit. */
export function testSummary(results: Array<{ number: number; correct: boolean }>): string {
  const right = results.filter((r) => r.correct).length;
  const missed = results.filter((r) => !r.correct).map((r) => r.number);
  if (missed.length === 0) {
    return `That is all ${results.length}, and you got every one right. Try "Explain it back" on the same topic to check you can say why.`;
  }
  return `That is all ${results.length}. You got ${right} right. Go back over question${
    missed.length === 1 ? '' : 's'
  } ${missed.join(', ')}: the checked explanations show what was missing.`;
}

export interface TestStep {
  role: 'learner' | 'tutor';
  questionVersionId: string | null;
  correct: boolean | null;
}

/**
 * Where a "Test me" is up to, read from its messages: the questions asked,
 * in order; the result of each one answered; and the one waiting for an
 * answer, if any. Worked out from what was said rather than kept separately,
 * so there is nothing to fall out of step with the conversation.
 */
export function testProgress(steps: TestStep[]): {
  asked: string[];
  results: Array<{ number: number; correct: boolean }>;
  current: string | null;
} {
  const asked: string[] = [];
  const answered = new Map<string, boolean>();
  for (const step of steps) {
    if (!step.questionVersionId) continue;
    if (step.role === 'tutor' && !asked.includes(step.questionVersionId))
      asked.push(step.questionVersionId);
    if (step.role === 'learner' && !answered.has(step.questionVersionId)) {
      answered.set(step.questionVersionId, Boolean(step.correct));
    }
  }
  const results = asked
    .filter((id) => answered.has(id))
    .map((id, i) => ({ number: i + 1, correct: answered.get(id)! }));
  const current = asked.find((id) => !answered.has(id)) ?? null;
  return { asked, results, current };
}

/** The next question to ask: one not yet asked in this test, chosen at random. */
export function nextQuestion<T extends { versionId: string }>(
  pool: T[],
  asked: string[],
  random: () => number = Math.random,
): T | null {
  const left = pool.filter((q) => !asked.includes(q.versionId));
  if (left.length === 0) return null;
  return left[Math.floor(random() * left.length)] ?? left[0];
}
