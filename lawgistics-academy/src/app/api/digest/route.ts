import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { onboardingRoster } from '@/lib/onboarding/service';
import { daysUntil } from '@/lib/onboarding/rules';

/**
 * A read-only digest of who is joining, for n8n or anything else that wants to
 * send a daily message about it.
 *
 * This is an HTTP endpoint rather than a database login, and that choice is the
 * point of the whole file.
 *
 * Handing n8n a Postgres role would mean writing "what counts as done" a second
 * time in SQL, and two implementations of that rule drift. The day they
 * disagree, the digest quietly tells the firm somebody is ready when the app
 * says they are not, which is worse than having no digest at all. Calling the
 * app instead means there is one answer to that question and everybody reads
 * it from the same place.
 *
 * It also means no database credential ever leaves the server. n8n gets a token
 * that can read one summary and nothing else, rather than a login that could
 * reach the whole schema.
 *
 * Off unless switched on. With DIGEST_TOKEN unset this route 404s, so a
 * deployment that has never heard of n8n does not quietly expose a list of
 * everybody joining the firm.
 */

export const dynamic = 'force-dynamic';

/** Constant-time compare, so the token cannot be guessed a character at a time. */
function tokenMatches(presented: string, expected: string): boolean {
  const a = Buffer.from(presented, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  // Compare lengths separately: timingSafeEqual throws on a mismatch, and the
  // throw itself would be the timing signal it exists to avoid.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const expected = process.env.DIGEST_TOKEN ?? '';

  // Not configured is not an error, it is off. A 404 says nothing about whether
  // the feature exists on this deployment.
  if (expected.length < 24) {
    return new NextResponse('Not found', { status: 404 });
  }

  const header = request.headers.get('authorization') ?? '';
  const presented = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!presented || !tokenMatches(presented, expected)) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
  }

  const roster = await onboardingRoster();

  // Deliberately narrow. This is a summary for a reminder, so it carries who is
  // joining and how much is outstanding, and nothing about what anybody
  // answered, read or acknowledged in detail.
  const joiners = roster
    .filter((person) => person.startsOn !== null)
    .map((person) => ({
      name: person.displayName,
      email: person.email,
      startsOn: person.startsOn,
      daysUntilStart: daysUntil(person.startsOn as string, 'UTC'),
      outstanding: person.outstandingCount,
      awaitingFirm: person.awaitingFirmCount,
      cleared: person.cleared,
    }));

  const notReady = joiners.filter((j) => !j.cleared && j.outstanding > 0);

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      joiners,
      // Precomputed so a workflow does not have to reimplement the judgement.
      startingWithinAFortnight: notReady.filter((j) => j.daysUntilStart <= 14 && j.daysUntilStart >= 0),
      alreadyStartedNotCleared: notReady.filter((j) => j.daysUntilStart < 0),
      waitingOnTheFirm: joiners.filter((j) => j.awaitingFirm > 0),
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}
