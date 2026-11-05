import 'server-only';

import { after } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { brand } from '@/lib/brand';
import { greetingName } from '@/lib/greeting';
import { feedbackEmail, type FeedbackKind } from './feedback-email';
import { emailOn, sendEmail, type SendResult } from './send';

/**
 * Tells a learner their work has been marked, by email, after the mark is
 * saved. Called by the three marking actions (work, practice files, Studio
 * reviews) once their own write has succeeded; it can only ever add an
 * email, never stop or undo a mark.
 */

export interface FeedbackNotice {
  userId: string;
  kind: FeedbackKind;
  title: string;
  verdict: 'good' | 'again' | null;
  /** The learner's page with the feedback, from the site's root, e.g. /work/<id>#feedback. */
  path: string;
}

/** The public address of this deployment, for links in emails, or null. */
export function publicOrigin(env: Record<string, string | undefined> = process.env): string | null {
  const candidates = [
    env.NEXT_PUBLIC_SITE_URL,
    env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
  ];
  for (const value of candidates) {
    try {
      const url = new URL((value ?? '').trim());
      if (url.protocol === 'https:' && !/^(localhost|127\.|0\.0\.0\.0)/.test(url.hostname)) return url.origin;
    } catch {
      // Not an address: try the next one.
    }
  }
  return null;
}

/** Whether an address on a profile is somebody's real inbox. */
export function deliverable(email: string | null | undefined, erasedAt: string | null | undefined): email is string {
  if (!email || erasedAt) return false;
  // A deleted account's sign-in address (0043) belongs to nobody.
  if (/\.invalid$/i.test(email.trim())) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function notifyFeedback(notice: FeedbackNotice): Promise<SendResult | { sent: false; reason: 'no-address' }> {
  if (!emailOn()) return { sent: false, reason: 'off' };
  const { data } = await createServiceClient()
    .from('profiles')
    .select('email, display_name, erased_at')
    .eq('id', notice.userId)
    .maybeSingle();
  const email = (data?.email as string | null | undefined) ?? null;
  if (!deliverable(email, data?.erased_at as string | null | undefined)) return { sent: false, reason: 'no-address' };
  const origin = publicOrigin();
  return sendEmail(
    email.trim(),
    feedbackEmail({
      firstName: greetingName(data?.display_name as string | null | undefined),
      kind: notice.kind,
      title: notice.title,
      verdict: notice.verdict,
      link: origin ? `${origin}${notice.path}` : null,
      academy: brand.fullName,
    }),
  );
}

/**
 * The marking actions' one call: send after the response has gone, so the
 * coach never waits on an email service. Outside a request (a test calling
 * the action directly) there is no "after", so it is sent straight away.
 * The notice is built inside, so its reads (the title) also wait until then.
 */
export function emailFeedbackLater(build: () => Promise<FeedbackNotice | null>): void {
  // Nothing is read for an email that cannot be sent.
  if (!emailOn()) return;
  const send = () =>
    build()
      .then((notice) => (notice ? notifyFeedback(notice) : null))
      .catch((error) => {
        console.error('[email] feedback notice failed:', error instanceof Error ? error.name : 'unknown');
      });
  try {
    after(send);
  } catch {
    void send();
  }
}
