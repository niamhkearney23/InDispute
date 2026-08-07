import 'server-only';

import { getProvider, isAiEnabled } from './provider';
import type { Jurisdiction, QuestionOption } from '@/lib/types';
import { JURISDICTION_LABELS } from '@/lib/types';

/**
 * The AI coach.
 *
 * Two hard rules, both structural rather than aspirational:
 *
 *  1. Every function here returns `null` on absent config, error, or timeout.
 *     The core loop calls them and moves on. Turn the API key off and the app
 *     behaves identically, minus one optional paragraph.
 *
 *  2. It never states the law. The verified question bank does that. The coach
 *     works only from text an admin has already approved, and is asked to
 *     rephrase and connect — not to research.
 *
 * The generative features in the roadmap (question drafting, scenario
 * generation, judge simulation) all belong behind this same boundary, and all
 * of them must produce drafts for human verification, never published content.
 */

const SUPERVISOR_SYSTEM = `You are a senior Australian litigation solicitor supervising a junior.

Rules you must follow:
- Only use the legal content supplied to you. Never introduce a rule, section
  number, case, or time limit that is not in the supplied material.
- Never contradict the supplied explanation.
- If the supplied material does not answer something, say nothing about it.
- Be direct, warm and practical. No praise padding, no talking down.
- Two or three sentences. Plain English.
- Australian spelling.`;

const TIMEOUT_MS = 6000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('AI request timed out')), ms),
    ),
  ]);
}

export interface CoachContext {
  stem: string;
  scenario: string | null;
  options: QuestionOption[];
  selectedOptionIds: string[];
  correctOptionIds: string[];
  isCorrect: boolean;
  explanation: string;
  commonMisconception: string | null;
  jurisdiction: Jurisdiction;
  conceptNames: string[];
}

function renderOption(options: QuestionOption[], ids: string[]): string {
  const chosen = options.filter((o) => ids.includes(o.id));
  return chosen.length > 0 ? chosen.map((o) => o.text).join('; ') : '(no answer)';
}

/**
 * A short, personal note layered on top of the verified feedback. Additive —
 * the learner already has the full explanation before this resolves.
 */
export async function coachOnAnswer(context: CoachContext): Promise<string | null> {
  const provider = getProvider();
  if (!provider) return null;

  const prompt = [
    `Jurisdiction: ${JURISDICTION_LABELS[context.jurisdiction]}`,
    context.scenario ? `Facts: ${context.scenario}` : null,
    `Question: ${context.stem}`,
    `The junior answered: ${renderOption(context.options, context.selectedOptionIds)}`,
    `The correct answer: ${renderOption(context.options, context.correctOptionIds)}`,
    `They were ${context.isCorrect ? 'correct' : 'incorrect'}.`,
    `Approved explanation: ${context.explanation}`,
    context.commonMisconception
      ? `Known confusion: ${context.commonMisconception}`
      : null,
    context.conceptNames.length
      ? `Concepts tested: ${context.conceptNames.join(', ')}`
      : null,
    '',
    context.isCorrect
      ? 'Add one sentence on how this comes up in practice, and one on the trap to watch for. Do not repeat the explanation verbatim.'
      : 'Explain in your own words what they appear to have confused, then how to keep the distinction straight. Do not repeat the explanation verbatim.',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const text = await withTimeout(
      provider.complete({ system: SUPERVISOR_SYSTEM, prompt, maxTokens: 220 }),
      TIMEOUT_MS,
    );
    return text.length > 0 ? text : null;
  } catch (error) {
    console.error('[legal-coach] coachOnAnswer failed, continuing without it', error);
    return null;
  }
}

/**
 * A one-line read on the shape of a learner's skill map. Cosmetic; the map
 * itself is computed from attempts and renders with or without this.
 */
export async function summariseSkillMap(
  entries: Array<{ name: string; score: number }>,
): Promise<string | null> {
  const provider = getProvider();
  if (!provider || entries.length === 0) return null;

  const prompt = [
    'A junior lawyer has these training scores out of 100:',
    ...entries.map((e) => `- ${e.name}: ${e.score}`),
    '',
    'In two sentences, tell them what this pattern suggests about their current strengths and where to put their next hour. Do not invent legal content.',
  ].join('\n');

  try {
    const text = await withTimeout(
      provider.complete({ system: SUPERVISOR_SYSTEM, prompt, maxTokens: 180 }),
      TIMEOUT_MS,
    );
    return text.length > 0 ? text : null;
  } catch (error) {
    console.error('[legal-coach] summariseSkillMap failed, continuing without it', error);
    return null;
  }
}

export { isAiEnabled };
