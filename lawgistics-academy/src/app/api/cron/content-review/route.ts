import { cronDecision } from '@/lib/account/erasure-cron';
import { returnLapsedContent } from '@/lib/review/lapse';

/**
 * Called once a day by Vercel's scheduler (vercel.json, "crons"): takes every
 * question and daily fact whose lawyer's sign-off has run out back to the
 * review queue (0052). Requires `Authorization: Bearer <CRON_SECRET>`; off
 * (404) when CRON_SECRET is not set. 500 when it could not run, so Vercel's
 * cron view shows it. Learners stop receiving lapsed content on the day
 * whether or not this runs (0051); this puts it in front of a reviewer.
 */

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const decision = cronDecision(request.headers.get('authorization'), process.env.CRON_SECRET);
  if (decision === 'off') return new Response('Not found', { status: 404 });
  if (decision === 'refused') return new Response('Unauthorized', { status: 401 });
  const result = await returnLapsedContent();
  if (!result) return Response.json({ ok: false }, { status: 500 });
  return Response.json({ ok: true, returned: result });
}
