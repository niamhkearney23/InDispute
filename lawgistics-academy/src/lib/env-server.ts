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
