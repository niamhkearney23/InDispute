import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { readPostmark } from '@/lib/work/inbound';
import { draftFromEmail } from '@/lib/work/inbound-service';

/**
 * Where the inbound email service delivers work that lawyers email in.
 *
 * Off unless INBOUND_EMAIL_TOKEN is set (24 characters or more), in which case
 * it answers 404 like any page that does not exist. The service sends the
 * token as the password of the webhook address
 * (https://inbound:TOKEN@site/api/inbound/work), which arrives here as Basic
 * authentication.
 *
 * Every email that is not from a coach or administrator here is answered 200
 * and dropped, so the service does not retry it and nobody can use the
 * address to find out who works at the firm. What a lawyer's email makes is a
 * draft; see draftFromEmail.
 */

export const dynamic = 'force-dynamic';

/** Constant-time compare, so the token cannot be guessed a character at a time. */
function tokenMatches(presented: string, expected: string): boolean {
  const a = Buffer.from(presented, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** The password out of a Basic authorisation header. */
function basicPassword(header: string): string {
  if (!header.startsWith('Basic ')) return '';
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const colon = decoded.indexOf(':');
  return colon === -1 ? '' : decoded.slice(colon + 1);
}

export async function POST(request: NextRequest) {
  const expected = process.env.INBOUND_EMAIL_TOKEN ?? '';
  if (expected.length < 24) {
    return new NextResponse('Not found', { status: 404 });
  }

  const presented = basicPassword(request.headers.get('authorization') ?? '');
  if (!presented || !tokenMatches(presented, expected)) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const email = readPostmark(body, process.env.INBOUND_AUTHSERV_ID ?? '');
  if (!email) return NextResponse.json({ ok: true });

  await draftFromEmail(email);
  // The same answer whether or not the sender is staff here.
  return NextResponse.json({ ok: true });
}
