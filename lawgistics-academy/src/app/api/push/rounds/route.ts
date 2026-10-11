import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { pushConfigured, sendRoundReminders } from '@/lib/push/service';

/**
 * Round reminders, sent when a scheduler calls this every five minutes.
 *
 * It does nothing a person could not see coming: for each confirmed trainee
 * with notifications on, the round about to open on their own cohort's
 * clock, if one is, on a rounds day of their placement. Each reminder is
 * noted before it is sent, so calling twice in a minute buzzes nobody twice.
 *
 * Who calls it is the deployment's choice (docs/PHONE-APP.md): Vercel's own
 * cron sends `Authorization: Bearer $CRON_SECRET` by itself, and a Supabase
 * scheduled job can send the same header.
 *
 * Off unless switched on, like the digest. With CRON_SECRET unset or short,
 * or notifications not set up, this route 404s.
 */

export const dynamic = 'force-dynamic';

/** Constant-time compare, so the secret cannot be guessed a character at a time. */
function secretMatches(presented: string, expected: string): boolean {
  const a = Buffer.from(presented, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET ?? '';
  if (expected.length < 24 || !pushConfigured()) {
    return new NextResponse('Not found', { status: 404 });
  }

  const header = request.headers.get('authorization') ?? '';
  const presented = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!presented || !secretMatches(presented, expected)) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
  }

  const run = await sendRoundReminders();
  return NextResponse.json(
    { checkedAt: new Date().toISOString(), ...run },
    { headers: { 'cache-control': 'no-store' } },
  );
}
