/**
 * Work that arrives by email: reading the inbound service's message and
 * turning it into a draft post. Pure, so it is tested directly; the part that
 * touches the database is in inbound-service.ts.
 *
 * The shape read here is Postmark's inbound webhook. Only the fields used are
 * typed, and everything is treated as untrusted text: it came from whoever
 * sent the email.
 */
import { isTrustedWorkLink } from './links';

/**
 * What was attached, by name only. Attachments are not stored: nobody has
 * declared them free of anything identifying a client, and a draft is not
 * where that is decided. The reply tells the lawyer to add the file on the
 * draft page, where the declaration is.
 */
export interface InboundAttachment {
  name: string;
}

export interface InboundEmail {
  fromEmail: string;
  fromName: string;
  subject: string;
  text: string;
  messageId: string;
  /**
   * What vouched for the From address, read from the receiving server's own
   * Authentication-Results header: 'dmarc' when DMARC passed for the From
   * domain, 'dkim' when a DKIM signature from the From domain itself passed,
   * null when neither did. SPF is not on the list: it checks the envelope
   * sender, which can be any domain at all, not the address people see.
   */
  verifiedBy: 'dmarc' | 'dkim' | null;
  attachments: InboundAttachment[];
}

/** One result in an Authentication-Results header, such as dkim=pass header.d=x. */
interface AuthResult {
  method: string;
  result: string;
  props: Map<string, string>;
}

/**
 * The results in one Authentication-Results header value. The first part is
 * the server that wrote it, then one result per semicolon. Comments in
 * brackets are dropped before reading, so "(2048-bit key)" or a comment made
 * to look like "header.d=firm.example" cannot be read as a property.
 */
export function parseAuthResults(value: string): AuthResult[] {
  let plain = value;
  // Brackets can nest in a comment; take the innermost out until none remain.
  for (let i = 0; i < 10 && /\([^()]*\)/.test(plain); i++) plain = plain.replace(/\([^()]*\)/g, ' ');
  const [, ...parts] = plain.split(';');
  const results: AuthResult[] = [];
  for (const part of parts) {
    const words = part.trim().split(/\s+/).filter(Boolean);
    const head = /^([a-z0-9-]+)=([a-z]+)$/i.exec(words[0] ?? '');
    if (!head) continue;
    const props = new Map<string, string>();
    for (const word of words.slice(1)) {
      const prop = /^([a-z0-9.-]+)=(.+)$/i.exec(word);
      if (prop) props.set(prop[1].toLowerCase(), prop[2].replace(/^"|"$/g, '').toLowerCase());
    }
    results.push({ method: head[1].toLowerCase(), result: head[2].toLowerCase(), props });
  }
  return results;
}

/**
 * What vouched for an email from `domain`, by the topmost
 * Authentication-Results header only. That one is added by the server that
 * received the email for us; every header under it arrived with the email,
 * and anybody sending one can write "dkim=pass" in their own. Either DMARC
 * passed for the From domain, or a DKIM signature whose signing domain is
 * exactly the From domain passed. Nothing else counts, SPF included.
 */
export function senderVerifiedBy(
  headers: Array<{ name: string; value: string }>,
  domain: string,
  /** When set, the topmost header must have been written by this server. */
  authservId = '',
): 'dmarc' | 'dkim' | null {
  const top = headers.find((h) => h.name.toLowerCase() === 'authentication-results');
  if (!top || !domain) return null;
  if (authservId && top.value.split(';')[0].trim().split(/\s+/)[0]?.toLowerCase() !== authservId.toLowerCase()) {
    return null;
  }
  const results = parseAuthResults(top.value);
  const dmarc = results.some(
    (r) =>
      r.method === 'dmarc' &&
      r.result === 'pass' &&
      // The domain DMARC was checked for, when the server says, has to be the
      // one the address is at.
      (r.props.get('header.from') ?? domain) === domain,
  );
  if (dmarc) return 'dmarc';
  const dkim = results.some(
    (r) => r.method === 'dkim' && r.result === 'pass' && r.props.get('header.d') === domain,
  );
  return dkim ? 'dkim' : null;
}

interface PostmarkPayload {
  FromFull?: { Email?: unknown; Name?: unknown };
  From?: unknown;
  Subject?: unknown;
  TextBody?: unknown;
  StrippedTextReply?: unknown;
  MessageID?: unknown;
  Headers?: Array<{ Name?: unknown; Value?: unknown }>;
  Attachments?: Array<{ Name?: unknown }>;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

/** The bare address out of "Name <address>" or a plain address, lower-cased. */
export function bareAddress(value: string): string {
  const angled = /<([^>]+)>/.exec(value);
  return (angled ? angled[1] : value).trim().toLowerCase();
}

/** The inbound service's JSON as an email, or null when it is not one. */
export function readPostmark(body: unknown, authservId = ''): InboundEmail | null {
  if (!body || typeof body !== 'object') return null;
  const p = body as PostmarkPayload;
  const fromEmail = bareAddress(str(p.FromFull?.Email) || str(p.From));
  const messageId = str(p.MessageID).trim();
  if (!fromEmail.includes('@') || !messageId) return null;

  // In the order the service gives them, which is the email's own order, so
  // the first is the topmost: the one our receiving server wrote.
  const headers = (p.Headers ?? []).map((h) => ({ name: str(h.Name), value: str(h.Value) }));
  const domain = fromEmail.split('@')[1] ?? '';
  return {
    fromEmail,
    fromName: str(p.FromFull?.Name).trim(),
    subject: str(p.Subject).trim(),
    // The reply without the quoted thread underneath, when the service found
    // one; otherwise the whole text.
    text: (str(p.StrippedTextReply).trim() || str(p.TextBody)).trim(),
    messageId,
    verifiedBy: senderVerifiedBy(headers, domain, authservId),
    attachments: (p.Attachments ?? []).map((a) => ({
      name: str(a.Name).replace(/[\\/]/g, ' ').trim().slice(0, 200) || 'Attached file',
    })),
  };
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
