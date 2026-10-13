import { applyWorkBoardRetention, retryIncompleteErasures } from '@/lib/account/erasure';
import { handleErasureCron } from '@/lib/account/erasure-cron';
import { erasureRunStore } from '@/lib/account/erasure-monitor-store';

/**
 * Called once a day by Vercel's scheduler (vercel.json, "crons"): finishes
 * any account deletion that did not finish, and replaces work-board text
 * that is past the retention period. Requires `Authorization: Bearer
 * <CRON_SECRET>`; off (404) when CRON_SECRET is not set. Answers 200 only
 * when no deletion is left unfinished, 503 otherwise, records every run and
 * alerts ALERT_WEBHOOK_URL when one is set (0049). See
 * src/lib/account/erasure-cron.ts.
 */

export const dynamic = 'force-dynamic';
// Vercel Hobby allows up to sixty seconds; the retry stops starting new
// deletions after forty-five so it finishes inside that, with time left to
// read back what is unfinished, record the run and send the alert (five
// seconds at most).
export const maxDuration = 60;

export async function GET(request: Request) {
  return handleErasureCron(request, process.env.CRON_SECRET, {
    retry: (limit) => retryIncompleteErasures({ limit, deadline: Date.now() + 45_000 }),
    retention: () => applyWorkBoardRetention(),
    ...erasureRunStore(),
  }, { env: process.env });
}
