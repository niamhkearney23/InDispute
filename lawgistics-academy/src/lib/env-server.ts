import 'server-only';

import { required } from './env';

/**
 * Server settings: the service role key and the AI keys. Kept apart from
 * `env.ts` because that file reaches the browser, and `server-only` makes the
 * build fail if anything a page sends to the browser imports this one.
 */

export function requireServiceRoleKey(): string {
  return required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * The AI coach is strictly additive. V1 must work with every one of these unset.
 */
export const aiEnv = {
  provider: (process.env.AI_PROVIDER ?? 'none') as 'none' | 'anthropic' | 'openai',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  model: process.env.AI_MODEL,
};

/**
 * The Advocacy Studio's transcription (0053). OpenAI only, because the other
 * provider has no speech-to-text; it runs only when AI is switched on and an
 * OpenAI key is set. whisper-1 is the default because it returns real
 * segment timings, which is what lets a comment jump to its place in the
 * recording; a model that returns none gets no timings, never made-up ones.
 */
export const studioEnv = {
  transcribeModel: process.env.STUDIO_TRANSCRIBE_MODEL || 'whisper-1',
};
