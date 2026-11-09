import assert from 'node:assert/strict';
import test from 'node:test';
import { studioExercise } from '../src/content/studio/exercises';
import { ASSESS_BUDGET_MS, AssessmentFailed, MIN_TRY_MS, assess } from '../src/lib/studio/assess';
import {
  RecordingTooLarge,
  TRANSCRIBE_MAX_BYTES,
  segmentsFromWords,
  transcribe,
  transcriberFor,
  type Transcriber,
} from '../src/lib/studio/transcribe';
import type { AiProvider } from '../src/lib/ai/provider';

/**
 * The Advocacy Studio's outside services (0053): which company turns a
 * recording into text, that nothing is sent when none is set up, and that
 * asking for feedback stays inside the page's time.
 */

const base = { aiProvider: 'anthropic', choice: undefined, model: undefined, openaiApiKey: undefined, groqApiKey: undefined };

test('no transcription unless AI is on and the chosen company has a key', () => {
  assert.equal(transcriberFor({ ...base, aiProvider: 'none', openaiApiKey: 'k' }), null, 'AI switched off');
  assert.equal(transcriberFor({ ...base, aiProvider: '', groqApiKey: 'k' }), null, 'AI not set');
  assert.equal(transcriberFor(base), null, 'no key at all');
  assert.equal(transcriberFor({ ...base, choice: 'groq', openaiApiKey: 'k' }), null, 'Groq chosen, only an OpenAI key');
  assert.equal(transcriberFor({ ...base, choice: 'openai', groqApiKey: 'k' }), null, 'OpenAI chosen, only a Groq key');
  assert.equal(transcriberFor({ ...base, choice: 'deepgram', openaiApiKey: 'k', groqApiKey: 'k' }), null, 'unknown company');
});

test('unset, Groq is used when its key is there, OpenAI otherwise, each with its own address and model', () => {
  const groq = transcriberFor({ ...base, groqApiKey: 'g' })!;
  assert.equal(groq.company, 'Groq');
  assert.equal(groq.url, 'https://api.groq.com/openai/v1/audio/transcriptions');
  assert.equal(groq.model, 'whisper-large-v3');
  assert.equal(groq.apiKey, 'g');

  const openai = transcriberFor({ ...base, aiProvider: 'openai', openaiApiKey: 'o' })!;
  assert.equal(openai.company, 'OpenAI');
  assert.equal(openai.url, 'https://api.openai.com/v1/audio/transcriptions');
  assert.equal(openai.model, 'whisper-1');

  const chosen = transcriberFor({ ...base, choice: ' OpenAI ', openaiApiKey: 'o', groqApiKey: 'g' })!;
  assert.equal(chosen.company, 'OpenAI', 'a named choice wins over the default');
  assert.equal(transcriberFor({ ...base, groqApiKey: 'g', model: 'whisper-large-v3-turbo' })!.model, 'whisper-large-v3-turbo');
});

const groq: Transcriber = {
  name: 'groq',
  company: 'Groq',
  url: 'https://api.groq.com/openai/v1/audio/transcriptions',
  model: 'whisper-large-v3',
  apiKey: 'secret',
};

test('a recording goes to the chosen company only, with timings when it gives them', async () => {
  const calls: Array<{ url: string; auth: string | null; form: FormData }> = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, auth: new Headers(init.headers).get('authorization'), form: init.body as FormData });
    return new Response(
      JSON.stringify({ text: ' May it please the court. ', segments: [{ start: 0, end: 2.5, text: ' May it please the court. ' }] }),
    );
  }) as unknown as typeof fetch;

  const result = await transcribe(new Blob([new Uint8Array(10)], { type: 'audio/webm' }), 'recording.webm', {
    fetchImpl,
    transcriber: groq,
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, groq.url);
  assert.equal(calls[0].auth, 'Bearer secret');
  assert.equal(calls[0].form.get('model'), 'whisper-large-v3');
  assert.equal(calls[0].form.get('response_format'), 'verbose_json');
  assert.deepEqual(result, {
    text: 'May it please the court.',
    segments: [{ start: 0, end: 2.5, text: 'May it please the court.' }],
    model: 'whisper-large-v3',
  });
});

test('nothing is sent when no company is set up, or the file is over 25 MB', async () => {
  let sent = 0;
  const fetchImpl = (async () => {
    sent += 1;
    return new Response('{}');
  }) as unknown as typeof fetch;
  await assert.rejects(transcribe(new Blob(['x']), 'r.webm', { fetchImpl, transcriber: null }));
  const big = new Blob([new Uint8Array(TRANSCRIBE_MAX_BYTES + 1)]);
  await assert.rejects(transcribe(big, 'r.webm', { fetchImpl, transcriber: groq }), RecordingTooLarge);
  assert.equal(sent, 0);
});

test('a refused or failed transcription is an error, never an empty transcript', async () => {
  const fetchImpl = (async () => new Response('nope', { status: 401 })) as unknown as typeof fetch;
  await assert.rejects(transcribe(new Blob(['x']), 'r.webm', { fetchImpl, transcriber: groq }), /401/);
});

const exercise = studioExercise('free-practice')!;
const transcript = 'May it please the court, I appear for the applicant and we ask for more time.';

function provider(replies: string[], seen: number[] = []): AiProvider {
  return {
    name: 'test',
    async complete({ timeoutMs }) {
      seen.push(timeoutMs ?? -1);
      return replies.shift() ?? '';
    },
  };
}

const good = JSON.stringify({
  overall_summary: 'Clear.',
  strengths: [{ text: 'You said what you wanted.', quotes: ['we ask for more time'] }],
  scores: [],
});

test('feedback gets the time left, and a second try only when there is time for it', async () => {
  const start = 1_000_000;
  const seen: number[] = [];
  // Transcription took 10 seconds; the first reply is not usable.
  let clock = start + 10_000;
  const result = await assess({
    provider: provider(['not json', good], seen),
    exercise,
    transcript,
    segments: null,
    recordingSeconds: 20,
    nextOptions: [],
    startedAt: start,
    now: () => clock,
  });
  assert.equal(result.strengths.length, 1);
  assert.equal(seen.length, 2);
  assert.equal(seen[0], Math.min(ASSESS_BUDGET_MS - 10_000, 40_000));

  // Almost out of time after transcription: no try is made, and it says so.
  clock = start + ASSESS_BUDGET_MS - MIN_TRY_MS + 1;
  const none: number[] = [];
  await assert.rejects(
    assess({ provider: provider([good], none), exercise, transcript, segments: null, recordingSeconds: 20, nextOptions: [], startedAt: start, now: () => clock }),
    (e: unknown) => e instanceof Error && !(e instanceof AssessmentFailed),
  );
  assert.equal(none.length, 0, 'nothing is sent with no time to answer');

  // Two unusable replies in time is a failed assessment.
  clock = start;
  await assert.rejects(
    assess({ provider: provider(['x', 'y']), exercise, transcript, segments: null, recordingSeconds: 20, nextOptions: [], startedAt: start, now: () => clock }),
    AssessmentFailed,
  );
});

test('ElevenLabs transcribes only when it is named, never because its key is there', () => {
  const withKey = { ...base, elevenlabsApiKey: 'e', openaiApiKey: 'o' };
  assert.equal(transcriberFor(withKey)!.company, 'OpenAI', 'a key alone changes nothing');
  assert.equal(transcriberFor({ ...withKey, groqApiKey: 'g' })!.company, 'Groq');
  const named = transcriberFor({ ...withKey, choice: 'ElevenLabs' })!;
  assert.equal(named.company, 'ElevenLabs');
  assert.equal(named.url, 'https://api.elevenlabs.io/v1/speech-to-text');
  assert.equal(named.model, 'scribe_v1');
  assert.equal(transcriberFor({ ...base, choice: 'elevenlabs', openaiApiKey: 'o' }), null, 'named, but no ElevenLabs key');
  assert.equal(transcriberFor({ ...withKey, aiProvider: 'none', choice: 'elevenlabs' }), null, 'AI switched off');
});

test('ElevenLabs gets its own header and fields, and its words become segments with real timings', async () => {
  const calls: Array<{ headers: Headers; form: FormData }> = [];
  const fetchImpl = (async (_url: string, init: RequestInit) => {
    calls.push({ headers: new Headers(init.headers), form: init.body as FormData });
    return new Response(
      JSON.stringify({
        text: ' May it please the court. I appear for the claimant. ',
        words: [
          { text: 'May', start: 0, end: 0.2, type: 'word' },
          { text: ' ', start: 0.2, end: 0.25, type: 'spacing' },
          { text: 'it', start: 0.25, end: 0.4, type: 'word' },
          { text: 'please', start: 0.4, end: 0.8, type: 'word' },
          { text: 'the', start: 0.8, end: 0.9, type: 'word' },
          { text: 'court.', start: 0.9, end: 1.4, type: 'word' },
          { text: '(laughter)', start: 1.4, end: 1.8, type: 'audio_event' },
          { text: 'I', start: 2, end: 2.1, type: 'word' },
          { text: 'appear', start: 2.1, end: 2.5, type: 'word' },
          { text: 'for', start: 2.5, end: 2.6, type: 'word' },
        ],
      }),
    );
  }) as unknown as typeof fetch;
  const eleven: Transcriber = { name: 'elevenlabs', company: 'ElevenLabs', url: 'https://api.elevenlabs.io/v1/speech-to-text', model: 'scribe_v1', apiKey: 'secret' };
  const result = await transcribe(new Blob([new Uint8Array(10)]), 'recording.webm', { fetchImpl, transcriber: eleven });
  assert.equal(calls[0].headers.get('xi-api-key'), 'secret');
  assert.equal(calls[0].headers.get('authorization'), null, 'not the bearer header the other two use');
  assert.equal(calls[0].form.get('model_id'), 'scribe_v1');
  assert.equal(result.text, 'May it please the court. I appear for the claimant.');
  assert.deepEqual(result.segments, [
    { start: 0, end: 1.4, text: 'May it please the court.' },
    { start: 2, end: 2.6, text: 'I appear for' },
  ]);
});

test('segments break at the end of a sentence or after thirty words, and never invent a timing', () => {
  const words = Array.from({ length: 70 }, (_, i) => ({ text: `w${i}`, start: i, end: i + 0.5, type: 'word' }));
  const segments = segmentsFromWords(words);
  assert.equal(segments.length, 3, '30, 30 and 10');
  assert.equal(segments[0].start, 0);
  assert.equal(segments[1].start, 30);
  assert.deepEqual(segmentsFromWords([{ text: 'no timing', type: 'word' }]), [], 'a word without a time is skipped');
  assert.deepEqual(segmentsFromWords([]), []);
});
