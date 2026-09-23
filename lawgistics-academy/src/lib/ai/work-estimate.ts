import 'server-only';

import { getProvider } from './provider';

/**
 * A guess at how long a piece of work will take an intern, for the coach
 * to confirm or change before it is shown to anybody.
 *
 * This is the only thing the AI does on the work board, and it is a draft
 * in the sense the standing rules mean: what an intern sees is the number
 * the coach saved, under the coach's name. The suggestion never reaches a
 * learner's page on its own. It is also deliberately a number and nothing
 * else: the model is not asked what the work involves, only how long.
 *
 * Returns null on absent config, error, timeout, or an answer that is not
 * a sensible number of minutes, and the form says so in a sentence.
 */

const SYSTEM = `You estimate how long a task will take a junior lawyer in their first year.
Answer with a single whole number of minutes and nothing else. No words, no units, no range.
Assume a careful junior who has to read everything once and check their work.
Fifteen minutes is the floor; an ordinary drafting task is one to three hours; a full day is 480.`;

const TIMEOUT_MS = 8000;

export async function estimateWorkMinutes(
  title: string,
  instructions: string,
): Promise<number | null> {
  const provider = getProvider();
  if (!provider) return null;

  const prompt = [`Task: ${title}`, instructions ? `Instructions: ${instructions}` : null]
    .filter(Boolean)
    .join('\n');

  try {
    const text = await Promise.race([
      provider.complete({ system: SYSTEM, prompt, maxTokens: 12, temperature: 0 }),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('AI request timed out')), TIMEOUT_MS),
      ),
    ]);
    const minutes = Number.parseInt(text.replace(/[^0-9]/g, ''), 10);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 6000) return null;
    return Math.max(15, Math.round(minutes / 5) * 5);
  } catch (error) {
    console.error('[work-estimate] failed, continuing without it', error);
    return null;
  }
}
