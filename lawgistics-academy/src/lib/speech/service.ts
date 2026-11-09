import 'server-only';
import { speechEnv } from '@/lib/env-server';
import { createServiceClient } from '@/lib/supabase/service';
import { DEFAULT_SPEECH_MODEL, SPEECH_BUCKET, speechCacheKey, speechPath } from './rules';

/** Whether this deployment can read aloud: the ElevenLabs key and the voice's id are both set. */
export function speechConfigured(): boolean {
  return Boolean(speechEnv.apiKey && speechEnv.voiceId);
}

export interface SpeechStore {
  get(path: string): Promise<Uint8Array | null>;
  put(path: string, bytes: Uint8Array): Promise<void>;
}

/** The made audio, in a private bucket nobody reads with their own token (0057). */
export function bucketStore(): SpeechStore {
  const files = () => createServiceClient().storage.from(SPEECH_BUCKET);
  return {
    async get(path) {
      const { data, error } = await files().download(path);
      if (error || !data) return null;
      return new Uint8Array(await data.arrayBuffer());
    },
    async put(path, bytes) {
      const { error } = await files().upload(path, bytes, { contentType: 'audio/mpeg', upsert: true });
      if (error) console.error('[speech] could not keep the audio', error);
    },
  };
}

export class SpeechFailed extends Error {}

/**
 * The audio for a text. Made once by ElevenLabs and kept, so the cost follows
 * the amount of content there is, not the number of times it is played; every
 * later request for the same words in the same voice is served from the
 * bucket. Throws SpeechFailed on any failure, and the page says it could not
 * be read aloud.
 */
export async function speak(
  text: string,
  {
    fetchImpl = fetch,
    store = bucketStore(),
    apiKey = speechEnv.apiKey,
    voiceId = speechEnv.voiceId,
    model = speechEnv.model ?? DEFAULT_SPEECH_MODEL,
    timeoutMs = 30_000,
  }: {
    fetchImpl?: typeof fetch;
    store?: SpeechStore;
    apiKey?: string;
    voiceId?: string;
    model?: string;
    timeoutMs?: number;
  } = {},
): Promise<Uint8Array> {
  if (!apiKey || !voiceId) throw new SpeechFailed('Reading aloud is not set up.');
  const path = speechPath(speechCacheKey(text, voiceId, model));
  const kept = await store.get(path).catch(() => null);
  if (kept && kept.byteLength > 0) return kept;

  const response = await fetchImpl(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_64`,
    {
      method: 'POST',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'xi-api-key': apiKey, 'content-type': 'application/json', accept: 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: model }),
    },
  );
  if (!response.ok) throw new SpeechFailed(`ElevenLabs answered ${response.status}.`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength === 0) throw new SpeechFailed('ElevenLabs sent no audio.');
  await store.put(path, bytes).catch(() => undefined);
  return bytes;
}
