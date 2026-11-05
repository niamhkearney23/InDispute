/**
 * The email a learner gets when a coach marks their work (the owner,
 * November 2026: "can they get sent emails when work is marked"). Pure, so
 * the words can be tested.
 *
 * It says that there is feedback and where, never what the feedback is. The
 * comments stay behind the sign-in: an inbox is read on shared screens and
 * forwarded, and a coach's paragraph about somebody's work is theirs to read
 * in the academy, not in a mail client.
 */

export type FeedbackKind = 'work' | 'matter' | 'studio';

export interface FeedbackEmailInput {
  /** The learner's first name, or null. */
  firstName: string | null;
  kind: FeedbackKind;
  /** The work post's title, the practice file's title, or the exercise's. */
  title: string;
  /** Work and matters have a verdict; a Studio review has none. */
  verdict: 'good' | 'again' | null;
  /** The full address of the page with the feedback, or null when unknown. */
  link: string | null;
  /** The academy's full name, from the brand (a firm's own name when it has one). */
  academy: string;
}

export interface Email {
  subject: string;
  text: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** One line, no line breaks a mail header could be split on, not too long. */
function oneLine(value: string, max = 120): string {
  const flat = value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

export function feedbackEmail(input: FeedbackEmailInput): Email {
  const title = oneLine(input.title) || 'your work';
  const quoted = `“${title}”`;
  const subject =
    input.kind === 'studio'
      ? `Your coach reviewed your recording: ${quoted}`
      : input.verdict === 'good'
        ? `Your coach marked ${quoted}: Good`
        : input.verdict === 'again'
          ? `Your coach asked for another go at ${quoted}`
          : `Your coach marked ${quoted}`;

  const lead =
    input.kind === 'studio'
      ? `Your coach has reviewed your Advocacy Studio recording, ${quoted}.`
      : input.verdict === 'good'
        ? `Your coach has marked ${quoted} Good. It counts on your Progress page.`
        : input.verdict === 'again'
          ? `Your coach has asked for another go at ${quoted}. Read what they said, change what they pointed to, and hand in the new version.`
          : `Your coach has marked ${quoted}.`;

  const where = input.link
    ? 'Their comments are in the academy, under what you handed in:'
    : `Their comments are in the ${input.academy}, under what you handed in. Sign in to read them.`;
  const why = `You are getting this because your coach marked your work in the ${input.academy}. The comments are kept there, not in this email.`;
  const greeting = input.firstName ? `Hello ${oneLine(input.firstName, 40)},` : 'Hello,';

  const text = [greeting, '', lead, '', where, ...(input.link ? [input.link] : []), '', why].join('\n');

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f3ec;">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1b2333;line-height:1.55;font-size:16px;">
<p style="margin:0 0 6px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#746c5a;">${escapeHtml(input.academy)}</p>
<p style="margin:0 0 16px;">${escapeHtml(greeting)}</p>
<p style="margin:0 0 16px;">${escapeHtml(lead)}</p>
<p style="margin:0 0 20px;">${escapeHtml(where)}</p>
${
  input.link
    ? `<p style="margin:0 0 28px;"><a href="${escapeHtml(input.link)}" style="display:inline-block;background:#14203a;color:#f6f3ec;text-decoration:none;padding:12px 20px;border-radius:5px;font-weight:600;">Read the feedback</a></p>`
    : ''
}
<p style="margin:0;font-size:13px;color:#746c5a;">${escapeHtml(why)}</p>
</div></body></html>`;

  return { subject, text, html };
}
