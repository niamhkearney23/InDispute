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
export const aiEnv = readAiEnv(process.env);

/** A setting as typed into Vercel: spaces and a pasted line break removed; empty is unset. */
function setting(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

/**
 * Forgiving about how a setting was typed (the owner, November 2026: the key
 * was in Vercel and the Studio still said AI was off). "OpenAI" and "openai "
 * mean openai; anything else not recognised means off, never a guess.
 */
export function readAiEnv(env: Record<string, string | undefined>): {
  provider: 'none' | 'anthropic' | 'openai';
  anthropicApiKey: string | undefined;
  openaiApiKey: string | undefined;
  model: string | undefined;
} {
  const named = setting(env.AI_PROVIDER)?.toLowerCase();
  return {
    provider: named === 'openai' || named === 'anthropic' ? named : 'none',
    anthropicApiKey: setting(env.ANTHROPIC_API_KEY),
    openaiApiKey: setting(env.OPENAI_API_KEY),
    model: setting(env.AI_MODEL),
  };
}

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
  transcribeProvider: setting(process.env.STUDIO_TRANSCRIBE_PROVIDER),
  transcribeModel: setting(process.env.STUDIO_TRANSCRIBE_MODEL),
  groqApiKey: setting(process.env.GROQ_API_KEY),
};
