import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { speechCacheKey, speechPath, cleanForSpeech, speakable } from '../src/lib/speech/rules';
import { speak, type SpeechStore } from '../src/lib/speech/service';

const read = (f: string) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

function memory(): SpeechStore & { files: Map<string, Uint8Array> } {
  const files = new Map<string, Uint8Array>();
  return { files, get: async (p) => files.get(p) ?? null, put: async (p, b) => void files.set(p, b) };
}

test('the cache key follows the words, the voice and the model', () => {
  const k = speechCacheKey('hello', 'v1', 'm');
  assert.equal(k, speechCacheKey('hello', 'v1', 'm'));
  assert.notEqual(k, speechCacheKey('hello', 'v2', 'm'));
  assert.notEqual(k, speechCacheKey('hello!', 'v1', 'm'));
  assert.equal(speechPath(k), `${k}.mp3`);
  assert.equal(speakable([null, '   ']), null);
  assert.ok(cleanForSpeech('**bold** text').indexOf('*') < 0);
});

test('audio is made once and then served from the store', async () => {
  const store = memory();
  let calls = 0;
  let seen: { url: string; key: string | null } = { url: '', key: null };
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls++;
    seen = { url, key: (init.headers as Record<string, string>)['xi-api-key'] };
    return new Response(new Uint8Array([1, 2, 3]));
  }) as unknown as typeof fetch;
  const opts = { fetchImpl, store, apiKey: 'k', voiceId: 'voice', model: 'm' };
  const a = await speak('Some words', opts);
  const b = await speak('Some words', opts);
  assert.deepEqual([...a], [1, 2, 3]);
  assert.deepEqual([...b], [1, 2, 3]);
  assert.equal(calls, 1, 'second play costs nothing');
  assert.match(seen.url, /text-to-speech\/voice/);
  assert.equal(seen.key, 'k');
});

test('a failure or a missing key throws, and nothing is kept', async () => {
  const store = memory();
  const bad = (async () => new Response('no', { status: 500 })) as unknown as typeof fetch;
  await assert.rejects(speak('x', { fetchImpl: bad, store, apiKey: 'k', voiceId: 'v', model: 'm' }));
  await assert.rejects(speak('x', { store, apiKey: '', voiceId: 'v', model: 'm' }));
  assert.equal(store.files.size, 0);
});

test('the route is for signed-in people with access, and the bucket has no policy', () => {
  const route = read('src/app/api/speak/route.ts');
  assert.match(route, /getCurrentUser/);
  assert.match(route, /hasAccess/);
  assert.match(route, /speechConfigured/);
  const mig = read('supabase/migrations/0057_speech_cache.sql');
  assert.doesNotMatch(mig, /create policy/i);
});
