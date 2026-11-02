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
 * The Advocacy Studio's speech to text (0053). Neither Claude nor the
 * feedback model hears audio, so a recording is transcribed by OpenAI or by
 * Groq, both running Whisper behind the same kind of API.
 * STUDIO_TRANSCRIBE_PROVIDER picks one; unset, it is Groq when GROQ_API_KEY
 * is set and OpenAI otherwise. It runs only when AI is switched on and that
 * company's key is set. The Whisper models return real segment timings,
 * which is what lets a comment jump to its place in the recording; a model
 * that returns none gets no timings, never made-up ones.
 *
 * The consent notice names whichever companies are switched on. Changing
 * either company means changing NOTICE_VERSION (src/lib/studio/rules.ts) so
 * everybody is asked again: an earlier yes was to the companies named then.
 */
export const studioEnv = {
  transcribeProvider: process.env.STUDIO_TRANSCRIBE_PROVIDER,
  transcribeModel: process.env.STUDIO_TRANSCRIBE_MODEL,
  groqApiKey: process.env.GROQ_API_KEY,
};
