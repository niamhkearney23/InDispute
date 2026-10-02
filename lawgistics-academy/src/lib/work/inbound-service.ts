import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { getProvider } from '@/lib/ai/provider';
import { WORK_FILE_TYPES } from './links';
import {
  INBOUND_SYSTEM,
  driveLinkIn,
  inboundPrompt,
  parseDraft,
  plainDraft,
  usableAttachment,
} from './inbound';
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
 */

/** A recognised attachment, inside what the request limit allows. */
const ATTACHMENT_MAX_BYTES = 3 * 1024 * 1024;

export type InboundResult =
  | { status: 'created'; postId: string }
  | { status: 'duplicate' }
  | { status: 'ignored' };

export async function draftFromEmail(email: InboundEmail): Promise<InboundResult> {
  const db = createServiceClient();

  // The sender has to be staff here, by the address on their account.
  const { data: sender } = await db
    .from('profiles')
    .select('id, country, is_admin, is_coach, display_name')
    .ilike('email', email.fromEmail)
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

  // The AI tidies the email into a post; without it, the subject and the
  // email itself are the post. Either way it is a draft for the lawyer.
  const fallback = plainDraft(email);
  let draft = fallback;
  const provider = getProvider();
  if (provider) {
    try {
      const reply = await provider.complete({
        system: INBOUND_SYSTEM,
        prompt: inboundPrompt(email, new Date().toISOString().slice(0, 10)),
        maxTokens: 900,
        temperature: 0.2,
      });
      draft = parseDraft(reply, fallback) ?? fallback;
    } catch {
      draft = fallback;
    }
  }

  const id = crypto.randomUUID();
  let filePath: string | null = null;
  let fileName: string | null = null;
  const attachment = usableAttachment(email.attachments, ATTACHMENT_MAX_BYTES);
  if (attachment) {
    const path = `posts/${id}/${crypto.randomUUID()}.${WORK_FILE_TYPES[attachment.contentType]}`;
    const { error } = await db.storage
      .from('work')
      .upload(path, Buffer.from(attachment.content, 'base64'), {
        contentType: attachment.contentType,
        upsert: false,
      });
    if (!error) {
      filePath = path;
      fileName = attachment.name;
    }
  }

  const { error } = await db.from('work_posts').insert({
    id,
    kind: 'task',
    title: draft.title,
    instructions: draft.instructions,
    file_path: filePath,
    file_name: fileName,
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
    inbound_verified: email.spfPass,
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
          'Nobody can see it until you publish it.',
        ].join('\n'),
        MessageStream: 'outbound',
      }),
    });
  } catch {
    // The draft exists either way; a reply that did not send is not a failure.
  }
}
