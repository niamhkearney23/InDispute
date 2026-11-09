import 'server-only';
import { aiEnv, studioEnv } from '@/lib/env-server';
import type { TranscriptSegment } from './rules';

export interface Transcript {
  text: string;
  segments: TranscriptSegment[] | null;
  model: string;
}

/** The companies that can turn a recording into text, and how each is called. */
export const TRANSCRIBERS = {
  openai: {
    company: 'OpenAI',
    url: 'https://api.openai.com/v1/audio/transcriptions',
    defaultModel: 'whisper-1',
  },
  groq: {
    company: 'Groq',
    url: 'https://api.groq.com/openai/v1/audio/transcriptions',
    defaultModel: 'whisper-large-v3',
  },
  // Never the default: only when STUDIO_TRANSCRIBE_PROVIDER names it.
  elevenlabs: {
    company: 'ElevenLabs',
    url: 'https://api.elevenlabs.io/v1/speech-to-text',
    defaultModel: 'scribe_v1',
  },
} as const;

export type TranscriberName = keyof typeof TRANSCRIBERS;

/** Both services refuse a file over 25 MB (Groq's free tier, and OpenAI's limit). */
export const TRANSCRIBE_MAX_BYTES = 25 * 1024 * 1024;

export interface TranscriberSettings {
  aiProvider: string;
  choice: string | undefined;
  model: string | undefined;
  openaiApiKey: string | undefined;
  groqApiKey: string | undefined;
  elevenlabsApiKey?: string | undefined;
}

export interface Transcriber {
  name: TranscriberName;
  company: string;
  url: string;
  model: string;
  apiKey: string;
}

/**
 * Which service transcribes on this deployment, or null when none can: AI is
 * switched off, the named service is not one of the two, or its key is
 * missing. Unset, the choice is Groq when its key is set and OpenAI
 * otherwise; ElevenLabs only when it is named, so adding its key for another
 * use never moves a learner's recording to a new company. Pure, so the rule
 * is tested without any keys.
 */
export function transcriberFor(settings: TranscriberSettings): Transcriber | null {
  if (settings.aiProvider === 'none' || !settings.aiProvider) return null;
  const choice = settings.choice?.trim().toLowerCase() || (settings.groqApiKey ? 'groq' : 'openai');
  if (choice !== 'openai' && choice !== 'groq' && choice !== 'elevenlabs') return null;
  const apiKey =
    choice === 'groq' ? settings.groqApiKey : choice === 'elevenlabs' ? settings.elevenlabsApiKey : settings.openaiApiKey;
  if (!apiKey) return null;
  const service = TRANSCRIBERS[choice];
  return { name: choice, company: service.company, url: service.url, model: settings.model || service.defaultModel, apiKey };
}

function configured(): Transcriber | null {
  return transcriberFor({
    aiProvider: aiEnv.provider,
    choice: studioEnv.transcribeProvider,
    model: studioEnv.transcribeModel,
    openaiApiKey: aiEnv.openaiApiKey,
    groqApiKey: studioEnv.groqApiKey,
    elevenlabsApiKey: studioEnv.elevenlabsApiKey,
  });
}

/** Whether recordings can be transcribed on this deployment. */
export function transcriptionAvailable(): boolean {
  return configured() !== null;
}

/** The company recordings are sent to for transcription, for the consent notice; null when none. */
export function transcriptionCompany(): string | null {
  return configured()?.company ?? null;
}

export class RecordingTooLarge extends Error {}

/**
 * Sends one recording to the configured service and returns the words, with
 * the segment timings it gave (the Whisper models give them; others may not,
 * and then there are none). Throws on any failure; the caller records it and
 * lets the learner try again.
 */
export async function transcribe(
  file: Blob,
  fileName: string,
  {
    fetchImpl = fetch,
    timeoutMs = 45_000,
    transcriber = configured(),
  }: { fetchImpl?: typeof fetch; timeoutMs?: number; transcriber?: Transcriber | null } = {},
): Promise<Transcript> {
  if (!transcriber) throw new Error('No transcription service is set up.');
  if (file.size > TRANSCRIBE_MAX_BYTES) throw new RecordingTooLarge('The recording is over 25 MB.');
  const eleven = transcriber.name === 'elevenlabs';
  const verbose = transcriber.model.startsWith('whisper');
  const form = new FormData();
  form.append('file', file, fileName);
  if (eleven) {
    form.append('model_id', transcriber.model);
    form.append('timestamps_granularity', 'word');
  } else {
    form.append('model', transcriber.model);
    form.append('response_format', verbose ? 'verbose_json' : 'json');
    if (verbose) form.append('timestamp_granularities[]', 'segment');
  }

  const response = await fetchImpl(transcriber.url, {
    method: 'POST',
    signal: AbortSignal.timeout(timeoutMs),
    headers: eleven ? { 'xi-api-key': transcriber.apiKey } : { authorization: `Bearer ${transcriber.apiKey}` },
    body: form,
  });
  if (!response.ok) throw new Error(`Transcription failed: ${response.status}`);
  const body = (await response.json()) as {
    text?: string;
    segments?: Array<{ start?: number; end?: number; text?: string }>;
    words?: ElevenWord[];
  };
  const text = (body.text ?? '').trim();
  if (eleven) {
    const segments = segmentsFromWords(body.words ?? []);
    return { text, segments: segments.length > 0 ? segments : null, model: transcriber.model };
  }
  const segments =
    Array.isArray(body.segments) && body.segments.length > 0
      ? body.segments
          .filter((s) => typeof s.start === 'number' && typeof s.end === 'number' && typeof s.text === 'string')
          .map((s) => ({ start: s.start!, end: s.end!, text: s.text!.trim() }))
      : null;
  return { text, segments: segments && segments.length > 0 ? segments : null, model: transcriber.model };
}

/** One word as ElevenLabs gives it: with its start and end, and a type ("word", "spacing" or "audio_event"). */
export interface ElevenWord {
  text?: string;
  start?: number;
  end?: number;
  type?: string;
}

/**
 * Words with timings into segments a comment can jump to: a segment ends at
 * a full stop, question mark or exclamation mark, or after 30 words. Sounds
 * that are not words ("(laughter)") are left out. Real timings only: a
 * word without both is skipped, never given a made-up one.
 */
export function segmentsFromWords(words: ElevenWord[], maxWords = 30): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  let current: { start: number; end: number; parts: string[]; count: number } | null = null;
  const flush = () => {
    if (current && current.parts.length > 0) {
      segments.push({ start: current.start, end: current.end, text: current.parts.join(' ').trim() });
    }
    current = null;
  };
  for (const w of words) {
    if (w.type !== 'word' || typeof w.text !== 'string' || typeof w.start !== 'number' || typeof w.end !== 'number') continue;
    if (!current) current = { start: w.start, end: w.end, parts: [], count: 0 };
    current.parts.push(w.text);
    current.end = w.end;
    current.count += 1;
    if (/[.?!]$/.test(w.text) || current.count >= maxWords) flush();
  }
  flush();
  return segments;
}
