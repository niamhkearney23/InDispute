import 'server-only';
import { aiEnv, studioEnv } from '@/lib/env-server';
import type { TranscriptSegment } from './rules';

export interface Transcript {
  text: string;
  segments: TranscriptSegment[] | null;
  model: string;
}

/** Whether recordings can be transcribed on this deployment. */
export function transcriptionAvailable(): boolean {
  return aiEnv.provider !== 'none' && Boolean(aiEnv.openaiApiKey);
}

/**
 * Sends one recording to OpenAI's transcription and returns the words, with
 * the segment timings the service gave (whisper-1 gives them; other models
 * may not, and then there are none). Throws on any failure; the caller
 * records it and lets the learner try again.
 */
export async function transcribe(
  file: Blob,
  fileName: string,
  { fetchImpl = fetch, timeoutMs = 45_000 }: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<Transcript> {
  if (!aiEnv.openaiApiKey) throw new Error('No OpenAI key is set for transcription.');
  const model = studioEnv.transcribeModel;
  const verbose = model.startsWith('whisper');
  const form = new FormData();
  form.append('file', file, fileName);
  form.append('model', model);
  form.append('response_format', verbose ? 'verbose_json' : 'json');
  if (verbose) form.append('timestamp_granularities[]', 'segment');

  const response = await fetchImpl('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    signal: AbortSignal.timeout(timeoutMs),
    headers: { authorization: `Bearer ${aiEnv.openaiApiKey}` },
    body: form,
  });
  if (!response.ok) throw new Error(`Transcription failed: ${response.status}`);
  const body = (await response.json()) as {
    text?: string;
    segments?: Array<{ start?: number; end?: number; text?: string }>;
  };
  const text = (body.text ?? '').trim();
  const segments =
    Array.isArray(body.segments) && body.segments.length > 0
      ? body.segments
          .filter((s) => typeof s.start === 'number' && typeof s.end === 'number' && typeof s.text === 'string')
          .map((s) => ({ start: s.start!, end: s.end!, text: s.text!.trim() }))
      : null;
  return { text, segments: segments && segments.length > 0 ? segments : null, model };
}
