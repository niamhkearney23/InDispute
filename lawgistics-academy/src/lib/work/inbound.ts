/**
 * Work that arrives by email: reading the inbound service's message and
 * turning it into a draft post. Pure, so it is tested directly; the part that
 * touches the database is in inbound-service.ts.
 *
 * The shape read here is Postmark's inbound webhook. Only the fields used are
 * typed, and everything is treated as untrusted text: it came from whoever
 * sent the email.
 */
import { WORK_FILE_TYPES, isTrustedWorkLink } from './links';

export interface InboundAttachment {
  name: string;
  contentType: string;
  /** Base64, as the inbound service sends it. */
  content: string;
  size: number;
}

export interface InboundEmail {
  fromEmail: string;
  fromName: string;
  subject: string;
  text: string;
  messageId: string;
  /** Whether the sending domain's SPF check passed, if the service said. */
  spfPass: boolean;
  attachments: InboundAttachment[];
}

interface PostmarkPayload {
  FromFull?: { Email?: unknown; Name?: unknown };
  From?: unknown;
  Subject?: unknown;
  TextBody?: unknown;
  StrippedTextReply?: unknown;
  MessageID?: unknown;
  Headers?: Array<{ Name?: unknown; Value?: unknown }>;
  Attachments?: Array<{ Name?: unknown; ContentType?: unknown; Content?: unknown; ContentLength?: unknown }>;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

/** The bare address out of "Name <address>" or a plain address, lower-cased. */
export function bareAddress(value: string): string {
  const angled = /<([^>]+)>/.exec(value);
  return (angled ? angled[1] : value).trim().toLowerCase();
}

/** The inbound service's JSON as an email, or null when it is not one. */
export function readPostmark(body: unknown): InboundEmail | null {
  if (!body || typeof body !== 'object') return null;
  const p = body as PostmarkPayload;
  const fromEmail = bareAddress(str(p.FromFull?.Email) || str(p.From));
  const messageId = str(p.MessageID).trim();
  if (!fromEmail.includes('@') || !messageId) return null;

  const spf = (p.Headers ?? []).find((h) => str(h.Name).toLowerCase() === 'received-spf');
  return {
    fromEmail,
    fromName: str(p.FromFull?.Name).trim(),
    subject: str(p.Subject).trim(),
    // The reply without the quoted thread underneath, when the service found
    // one; otherwise the whole text.
    text: (str(p.StrippedTextReply).trim() || str(p.TextBody)).trim(),
    messageId,
    spfPass: /^\s*pass\b/i.test(str(spf?.Value)),
    attachments: (p.Attachments ?? []).map((a) => ({
      name: str(a.Name).replace(/[\\/]/g, ' ').trim().slice(0, 200) || 'Attached file',
      contentType: str(a.ContentType).split(';')[0].trim().toLowerCase(),
      content: str(a.Content),
      size: typeof a.ContentLength === 'number' ? a.ContentLength : 0,
    })),
  };
}

/** The first attachment the board can hold: a PDF, a Word file or an image. */
export function usableAttachment(
  attachments: InboundAttachment[],
  maxBytes: number,
): InboundAttachment | null {
  return (
    attachments.find(
      (a) => WORK_FILE_TYPES[a.contentType] && a.content && a.size > 0 && a.size <= maxBytes,
    ) ?? null
  );
}

/** The first Google Drive or Docs link in the email, if there is one. */
export function driveLinkIn(text: string): string | null {
  for (const match of text.matchAll(/https:\/\/[^\s<>"')]+/g)) {
    if (isTrustedWorkLink(match[0])) return match[0];
  }
  return null;
}

/** "Fwd: Re: Draft the chronology" becomes "Draft the chronology". */
export function cleanSubject(subject: string): string {
  return subject.replace(/^\s*((re|fw|fwd)\s*:\s*)+/i, '').trim();
}

export interface DraftPost {
  title: string;
  instructions: string;
  dueOn: string | null;
  expectedMinutes: number | null;
  /** How many people may take it. Null is no limit. */
  maxClaims: number | null;
}

/** The plain draft: subject as title, the email as the instructions. */
export function plainDraft(email: InboundEmail): DraftPost {
  return {
    title: (cleanSubject(email.subject) || 'Work from email').slice(0, 200),
    instructions: email.text.slice(0, 8000),
    dueOn: null,
    expectedMinutes: null,
    maxClaims: null,
  };
}

/**
 * What the AI is asked. It tidies the email into a post; it does not add
 * anything the lawyer did not write, and it is told to leave names in place
 * rather than guess, because the lawyer checks the draft before it goes up.
 */
export const INBOUND_SYSTEM = [
  'You turn a lawyer’s email into a piece of work for junior lawyers on a training board.',
  'Use only what the email says. Do not add legal content, steps or facts of your own.',
  'Reply with JSON only: {"title": string under 120 characters, "instructions": string, "dueOn": "YYYY-MM-DD" or null, "expectedMinutes": number or null, "maxClaims": number or null}.',
  'instructions: the task in the lawyer’s words, tidied into short paragraphs or a list, without greetings, sign-offs or email signatures.',
  'dueOn: only if the email gives a date. expectedMinutes: only if it says how long. maxClaims: only if it says how many people should do it.',
].join(' ');

export function inboundPrompt(email: InboundEmail, today: string): string {
  return [`Today is ${today}.`, `Subject: ${email.subject}`, '', email.text.slice(0, 8000)].join('\n');
}

/** The AI's reply as a draft, or null when it is not usable. */
export function parseDraft(reply: string, fallback: DraftPost): DraftPost | null {
  const json = /\{[\s\S]*\}/.exec(reply)?.[0];
  if (!json) return null;
  try {
    const raw = JSON.parse(json) as Record<string, unknown>;
    const title = typeof raw.title === 'string' ? raw.title.trim().slice(0, 200) : '';
    const instructions = typeof raw.instructions === 'string' ? raw.instructions.trim().slice(0, 8000) : '';
    if (!title || !instructions) return null;
    const dueOn =
      typeof raw.dueOn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.dueOn) ? raw.dueOn : null;
    const minutes = Number(raw.expectedMinutes);
    const claims = Number(raw.maxClaims);
    return {
      title,
      instructions,
      dueOn,
      expectedMinutes: Number.isInteger(minutes) && minutes >= 1 && minutes <= 6000 ? minutes : null,
      maxClaims: Number.isInteger(claims) && claims >= 1 && claims <= 100 ? claims : fallback.maxClaims,
    };
  } catch {
    return null;
  }
}
