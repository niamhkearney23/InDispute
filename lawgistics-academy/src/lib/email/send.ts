import 'server-only';

import { emailEnv } from '@/lib/env-server';
import type { Email } from './feedback-email';

/**
 * Sends one email through Resend's API. Off unless RESEND_API_KEY and
 * EMAIL_FROM are both set: a deployment with neither sends nothing and says
 * so in its answer. Never throws, and gives up after five seconds, because
 * the email is a courtesy on top of a mark that is already saved.
 */

export type SendResult = { sent: true } | { sent: false; reason: 'off' | 'refused' | 'failed' };

export const EMAIL_TIMEOUT_MS = 5000;

export function emailOn(env = emailEnv): boolean {
  return Boolean(env.resendApiKey && env.from);
}

export async function sendEmail(
  to: string,
  email: Email,
  { env = emailEnv, fetchImpl = fetch }: { env?: typeof emailEnv; fetchImpl?: typeof fetch } = {},
): Promise<SendResult> {
  if (!env.resendApiKey || !env.from) return { sent: false, reason: 'off' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS);
  try {
    const response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.from, to: [to], subject: email.subject, text: email.text, html: email.html }),
      signal: controller.signal,
    });
    if (!response.ok) {
      // The status only: the body can echo the address, and the key is never logged.
      console.error(`[email] refused by the sending service: ${response.status}`);
      return { sent: false, reason: 'refused' };
    }
    return { sent: true };
  } catch (error) {
    console.error('[email] could not be sent:', error instanceof Error ? error.name : 'unknown');
    return { sent: false, reason: 'failed' };
  } finally {
    clearTimeout(timer);
  }
}
