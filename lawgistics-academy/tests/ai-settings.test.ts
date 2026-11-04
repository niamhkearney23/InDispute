import assert from 'node:assert/strict';
import test from 'node:test';
import { readAiEnv } from '../src/lib/env-server';

/**
 * The owner, November 2026: the key was in Vercel and the Studio said AI
 * was off. A setting typed with a capital or pasted with a line break now
 * counts; anything not recognised still means off.
 */
test('the AI settings are read the way a person types them', () => {
  const on = readAiEnv({ AI_PROVIDER: ' OpenAI\n', OPENAI_API_KEY: 'sk-test-123\n' });
  assert.equal(on.provider, 'openai');
  assert.equal(on.openaiApiKey, 'sk-test-123');
  assert.equal(readAiEnv({ AI_PROVIDER: 'Anthropic' }).provider, 'anthropic');
});

test('anything else is off, and an empty key is no key', () => {
  assert.equal(readAiEnv({}).provider, 'none');
  assert.equal(readAiEnv({ AI_PROVIDER: 'gpt' }).provider, 'none');
  assert.equal(readAiEnv({ AI_PROVIDER: 'none' }).provider, 'none');
  assert.equal(readAiEnv({ AI_PROVIDER: 'openai', OPENAI_API_KEY: '   ' }).openaiApiKey, undefined);
});
