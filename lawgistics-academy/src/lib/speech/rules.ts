import { createHash } from 'node:crypto';

/**
 * Reading lessons and the daily fact aloud (the owner, November 2026, with
 * an ElevenLabs key). Pure, so the rules are tested without any key.
 *
 * Only text the server itself reads, for a person who may see it, is ever
 * spoken: the page asks for "this lesson screen" or "today's fact", never
 * sends words to be read, so the button cannot be used to have anything said
 * that a lawyer has not signed off.
 */

/** Names the private bucket the made audio is kept in (0057). */
export const SPEECH_BUCKET = 'speech';

/** A screen or a fact is a few sentences; anything longer is not read, rather than paid for. */
export const SPEECH_MAX_CHARS = 4500;

export const DEFAULT_SPEECH_MODEL = 'eleven_multilingual_v2';

/** Text as it should be spoken: no markdown marks, no links' addresses, single spaces. */
export function cleanForSpeech(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Parts joined as sentences, each ending in a stop so the voice pauses between them. Null when there is nothing or too much. */
export function speakable(parts: Array<string | null | undefined>): string | null {
  const sentences = parts
    .map((p) => cleanForSpeech(p ?? ''))
    .filter((p) => p.length > 0)
    .map((p) => (/[.!?]$/.test(p) ? p : `${p}.`));
  if (sentences.length === 0) return null;
  const text = sentences.join(' ');
  return text.length > SPEECH_MAX_CHARS ? null : text;
}

export function factText(fact: { title: string; body: string; whyItMatters?: string | null }): string | null {
  return speakable([fact.title, fact.body, fact.whyItMatters]);
}

export function lessonStepText(step: { heading: string; body: string; takeaway?: string }): string | null {
  return speakable([step.heading, step.body, step.takeaway]);
}

/** The same words in the same voice are made once: this names them. */
export function speechCacheKey(text: string, voiceId: string, model: string): string {
  return createHash('sha256').update(`${voiceId}\n${model}\n${text}`).digest('hex');
}

export const speechPath = (key: string) => `${key}.mp3`;
