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
 * Phone notifications (0042). Off unless all three are set: with any of them
 * missing, nobody is offered notifications and nothing is sent.
 *
 * The public key is not a secret (every browser that subscribes is given it),
 * but it is read here on the server and handed to the page, so turning
 * notifications on needs no rebuild of the browser code. The private key is
 * a secret and never leaves the server. The subject is how a push service
 * reaches whoever runs the deployment: a mailto: address or an https page.
 */
export function pushEnv(): { publicKey: string; privateKey: string; subject: string } | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim() ?? '';
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim() ?? '';
  const subject = process.env.VAPID_SUBJECT?.trim() ?? '';
  if (!publicKey || !privateKey) return null;
  if (!/^(mailto:\S+@\S+|https:\/\/\S+)$/.test(subject)) return null;
  return { publicKey, privateKey, subject };
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
