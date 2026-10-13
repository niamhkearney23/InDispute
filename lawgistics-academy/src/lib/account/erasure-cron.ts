import { timingSafeEqual } from 'node:crypto';

/**
 * The daily job behind `/api/cron/erasure-retry` (0045): finish deletions
 * that did not finish, and apply the work board's retention period.
 *
 * Vercel's scheduler calls it with `Authorization: Bearer <CRON_SECRET>`.
 * Without CRON_SECRET set (16 characters or more) the route is off and
 * answers 404, so a deployment that never set it exposes nothing. With it
 * set, anything else gets 401 and nothing runs. Kept apart from the route
 * file so the tests can drive it with a pretend job.
 */

/** The shortest secret accepted. Vercel suggests at least sixteen characters. */
export const MIN_CRON_SECRET = 16;

/** Constant-time compare, so the secret cannot be guessed a character at a time. */
export function secretMatches(presented: string, expected: string): boolean {
  const a = Buffer.from(presented, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  // timingSafeEqual throws on different lengths, and the throw would itself
  // be the signal it exists to hide.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type CronDecision = 'off' | 'refused' | 'allowed';

/** Whether this request may run the job. */
export function cronDecision(authorization: string | null, secret: string | undefined): CronDecision {
  const expected = secret ?? '';
  if (expected.length < MIN_CRON_SECRET) return 'off';
  const header = authorization ?? '';
  const presented = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!presented || !secretMatches(presented, expected)) return 'refused';
  return 'allowed';
}

export interface CronWork {
  retry(): Promise<{ tried: number; completed: number; stillIncomplete: number }>;
  retention(): Promise<number>;
}

/**
 * The whole handler, given the secret and the work to do. The check comes
 * first and nothing else is touched before it passes.
 */
export async function handleErasureCron(
  request: Request,
  secret: string | undefined,
  work: CronWork,
): Promise<Response> {
  const decision = cronDecision(request.headers.get('authorization'), secret);
  if (decision === 'off') return new Response('Not found', { status: 404 });
  if (decision === 'refused') {
    return Response.json({ error: 'Not authorised' }, { status: 401 });
  }

  // Each half runs whatever the other did, and says what happened.
  let retried: Awaited<ReturnType<CronWork['retry']>> | { error: string };
  try {
    retried = await work.retry();
  } catch (error) {
    console.error('retrying deletions failed:', error);
    retried = { error: 'Retrying deletions failed; see the server log.' };
  }
  let redacted: number | { error: string };
  try {
    redacted = await work.retention();
  } catch (error) {
    console.error('applying the work board retention period failed:', error);
    redacted = { error: 'The retention period could not be applied; see the server log.' };
  }

  const failed = 'error' in retried || typeof redacted !== 'number';
  return Response.json({ deletions: retried, retentionRedacted: redacted }, { status: failed ? 500 : 200 });
}
