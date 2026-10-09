import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { driveLinkIn, plainDraft } from './inbound';
import type { InboundEmail } from './inbound';

/**
 * Turning an email into a draft post.
 *
 * Only an email from somebody who is a coach or an administrator here makes
 * anything: the sender's address has to match their account. Anything else is
 * dropped without a word, so the address cannot be used to learn who works
 * at the firm. What it makes is a draft, unpublished, under that lawyer's
 * name, and the lawyer publishes it themselves after checking it.
 *
 * Every database write here uses the service client, because an email arrives
 * with no session. That is why the checks are here and explicit: who sent it,
 * and that it has not been made before.
 *
 * Two things deliberately do not happen before a person has looked at it.
 * Attachments are not stored: a file on the board carries its poster's
 * declaration that nothing in it identifies a client, and nobody has made one
 * for a file that arrived by email. And the email is not sent to the AI to be
 * tidied: it may name a client, and passing it to a third party is a
 * decision for the lawyer, not for an address anybody can write to. The
 * draft is the subject and the email as typed, and the reply says to add any
 * file on the draft page.
 */

export type InboundResult =
  | { status: 'created'; postId: string }
  | { status: 'duplicate' }
  | { status: 'ignored' };

export async function draftFromEmail(email: InboundEmail): Promise<InboundResult> {
  const db = createServiceClient();

  // A From address is only a claim: anybody can type a coach's. The From
  // domain has to vouch for it, by DMARC or by its own DKIM signature, as our
  // receiving server found, or the email is dropped like any other
  // stranger's. SPF alone is not enough: it vouches for the envelope sender,
  // which a forger chooses, not for the address on the email.
  if (!email.verifiedBy) return { status: 'ignored' };

  // The sender has to be staff here, by the address on their account. Case
  // does not matter in an address, but % and _ are wildcards to ilike, so
  // they are escaped: the match is the address, not a pattern.
  const exact = email.fromEmail.replace(/[\\%_]/g, (c) => `\\${c}`);
  const { data: sender } = await db
    .from('profiles')
    .select('id, country, is_admin, is_coach, display_name')
    .ilike('email', exact)
    .maybeSingle();
  const staff = sender as
    | { id: string; country: string | null; is_admin: boolean; is_coach: boolean | null; display_name: string | null }
    | null;
  if (!staff || !(staff.is_admin || staff.is_coach)) return { status: 'ignored' };

  // The same email delivered twice makes one draft.
  const { data: existing } = await db
    .from('work_posts')
    .select('id')
    .eq('inbound_message_id', email.messageId)
    .maybeSingle();
  if (existing) return { status: 'duplicate' };

  const draft = plainDraft(email);
  const id = crypto.randomUUID();

  const { error } = await db.from('work_posts').insert({
    id,
    kind: 'task',
    title: draft.title,
    instructions: draft.instructions,
    link_url: driveLinkIn(email.text),
    max_claims: draft.maxClaims,
    expected_minutes: draft.expectedMinutes,
    due_on: draft.dueOn,
    trainees_only: true,
    country: staff.country === 'AU' ? 'AU' : 'MY',
    // Never published by arriving. The lawyer checks it and publishes it.
    published: false,
    posted_by: staff.id,
    source: 'email',
    inbound_message_id: email.messageId,
    inbound_from: email.fromEmail,
    // What vouched for the sender, which is always one of the two by here.
    inbound_verified: true,
    inbound_auth: email.verifiedBy,
  });
  if (error) {
    // Two deliveries racing: the unique index refused the second.
    return error.code === '23505' ? { status: 'duplicate' } : { status: 'ignored' };
  }

  await replyToSender(email, id);
  return { status: 'created', postId: id };
}

/**
 * A short reply to the lawyer with the link to check and publish, when an
 * outgoing email service is set up. Without one, the draft simply waits on
 * the admin Work page; nothing fails.
 */
async function replyToSender(email: InboundEmail, postId: string): Promise<void> {
  const token = process.env.POSTMARK_SERVER_TOKEN ?? '';
  const from = process.env.INBOUND_REPLY_FROM ?? '';
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  if (!token || !from || !site) return;

  const link = `${site.replace(/\/$/, '')}/admin/work/${postId}`;
  try {
    await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-postmark-server-token': token,
      },
      body: JSON.stringify({
        From: from,
        To: email.fromEmail,
        Subject: `Draft ready: ${email.subject || 'your work'}`.slice(0, 200),
        TextBody: [
          'Your email is now a draft on the work board.',
          '',
          `Check it, take out any client names, and press Publish: ${link}`,
          '',
          ...(email.attachments.length > 0
            ? [
                'Attachments are not taken from email. If the work needs a file, add it on the',
                'draft page, where you confirm nothing in it identifies a client.',
                '',
              ]
            : []),
          'Nobody can see it until you publish it.',
        ].join('\n'),
        MessageStream: 'outbound',
      }),
    });
  } catch {
    // The draft exists either way; a reply that did not send is not a failure.
  }
}
