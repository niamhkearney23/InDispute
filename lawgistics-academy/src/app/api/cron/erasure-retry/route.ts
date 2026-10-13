import { applyWorkBoardRetention, retryIncompleteErasures } from '@/lib/account/erasure';
import { handleErasureCron } from '@/lib/account/erasure-cron';

/**
 * Called once a day by Vercel's scheduler (vercel.json, "crons"): finishes
 * any account deletion that did not finish, and replaces work-board text
 * that is past the retention period. Requires `Authorization: Bearer
 * <CRON_SECRET>`; off (404) when CRON_SECRET is not set. See
 * src/lib/account/erasure-cron.ts.
 */

export const dynamic = 'force-dynamic';
// Vercel Hobby allows up to sixty seconds; the retry stops starting new
// deletions after forty-five so it finishes inside that.
export const maxDuration = 60;

export async function GET(request: Request) {
  return handleErasureCron(request, process.env.CRON_SECRET, {
    retry: () => retryIncompleteErasures({ limit: 25, deadline: Date.now() + 45_000 }),
    retention: () => applyWorkBoardRetention(),
  });
}
