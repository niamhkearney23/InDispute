import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/service';
import { MIN_CRON_SECRET, type CronWork, type OperationalRun } from './erasure-cron';
import {
  ERASURE_JOB,
  adminErasureNotices,
  type AdminErasureNotice,
  type LastRun,
  type OutstandingJob,
  type RunStatus,
} from './erasure-monitoring';

/**
 * Where the nightly run's monitoring reads and writes (0049): the unfinished
 * deletions in `account_erasures` and the record of each run in
 * `operational_runs`. Service role throughout; both tables are closed to
 * every signed-in person. Each function takes the client, so an integration
 * test can hand it a service-role client of its own.
 */

/** Rows read per request; Supabase returns at most a thousand. */
const PAGE = 1000;

/** Every deletion not completed, page by page. Throws when it cannot be read. */
export async function readOutstanding(db: SupabaseClient = createServiceClient()): Promise<OutstandingJob[]> {
  const jobs: OutstandingJob[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from('account_erasures')
      .select('user_id, requested_at, attempts')
      .is('completed_at', null)
      .order('requested_at', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Array<{ user_id: string; requested_at: string; attempts: number }>;
    for (const r of rows) jobs.push({ userId: r.user_id, requestedAt: r.requested_at, attempts: r.attempts });
    if (rows.length < PAGE) break;
  }
  return jobs;
}

/** One recorded run, as Admin, Deletions shows it. */
export interface RecordedRun {
  id: string;
  startedAt: string;
  finishedAt: string;
  status: RunStatus;
  outstanding: number | null;
  tried: number | null;
  completed: number | null;
  stillFailing: number | null;
  notAttempted: number | null;
  repeatedlyFailing: number | null;
  oldestOutstandingHours: number | null;
  alertSent: boolean;
  alertError: string | null;
}

interface RunRow {
  id: string;
  started_at: string;
  finished_at: string;
  status: RunStatus;
  outstanding: number | null;
  tried: number | null;
  completed: number | null;
  still_failing: number | null;
  not_attempted: number | null;
  repeatedly_failing: number | null;
  oldest_outstanding_hours: number | null;
  alert_sent: boolean;
  alert_error: string | null;
}

const RUN_SELECT =
  'id, started_at, finished_at, status, outstanding, tried, completed, still_failing, not_attempted, ' +
  'repeatedly_failing, oldest_outstanding_hours, alert_sent, alert_error';

/** The newest runs of the nightly deletion job, newest first. Throws when they cannot be read. */
export async function readRecentRuns(
  limit: number,
  db: SupabaseClient = createServiceClient(),
): Promise<RecordedRun[]> {
  const { data, error } = await db
    .from('operational_runs')
    .select(RUN_SELECT)
    .eq('job', ERASURE_JOB)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as RunRow[]).map((r) => ({
    id: r.id,
    startedAt: r.started_at,
    finishedAt: r.finished_at,
    status: r.status,
    outstanding: r.outstanding,
    tried: r.tried,
    completed: r.completed,
    stillFailing: r.still_failing,
    notAttempted: r.not_attempted,
    repeatedlyFailing: r.repeatedly_failing,
    oldestOutstandingHours: r.oldest_outstanding_hours,
    alertSent: r.alert_sent,
    alertError: r.alert_error,
  }));
}

/** Writes one run. Throws when the database refuses it. */
export async function recordRun(run: OperationalRun, db: SupabaseClient = createServiceClient()): Promise<void> {
  const { error } = await db.from('operational_runs').insert({
    job: run.job,
    started_at: run.startedAt,
    finished_at: run.finishedAt,
    status: run.status,
    outstanding: run.outstanding,
    tried: run.tried,
    completed: run.completed,
    still_failing: run.stillFailing,
    not_attempted: run.notAttempted,
    repeatedly_failing: run.repeatedlyFailing,
    oldest_outstanding_hours: run.oldestOutstandingHours,
    alert_sent: run.alertSent,
    alert_error: run.alertError,
  });
  if (error) throw new Error(error.message);
}

/**
 * The three monitoring parts of `CronWork`, backed by a service-role client.
 * The route adds the retry and the retention period itself. Without `db`
 * the client is made only when a method is called, so nothing is touched
 * before the handler has checked the secret.
 */
export function erasureRunStore(
  db?: SupabaseClient,
): Pick<CronWork, 'outstanding' | 'previousStatus' | 'recordRun'> {
  const client = () => db ?? createServiceClient();
  return {
    outstanding: () => readOutstanding(client()),
    async previousStatus() {
      const [last] = await readRecentRuns(1, client());
      return last?.status ?? null;
    },
    recordRun: (run) => recordRun(run, client()),
  };
}

/**
 * What the notice on every admin page says (`adminErasureNotices`), read
 * with the service role. Never throws and never fails silent: whatever could
 * not be read becomes a notice saying so.
 */
export async function readAdminErasureNotices(
  options: { db?: SupabaseClient; cronSecret?: string; now?: Date } = {},
): Promise<AdminErasureNotice[]> {
  const now = options.now ?? new Date();
  const cronConfigured = (options.cronSecret ?? '').length >= MIN_CRON_SECRET;
  let db: SupabaseClient | null = null;
  try {
    db = options.db ?? createServiceClient();
  } catch (error) {
    console.error('the deletion status could not be read:', error);
  }

  let outstanding: OutstandingJob[] | null = null;
  let lastRun: LastRun | null = null;
  let runsReadFailed = false;
  if (db) {
    try {
      outstanding = await readOutstanding(db);
    } catch (error) {
      console.error('reading unfinished deletions failed:', error);
    }
    try {
      const [last] = await readRecentRuns(1, db);
      lastRun = last ? { startedAt: last.startedAt, status: last.status, notAttempted: last.notAttempted } : null;
    } catch (error) {
      runsReadFailed = true;
      console.error('reading the nightly runs failed:', error);
    }
  } else {
    runsReadFailed = true;
  }

  return adminErasureNotices({ outstanding, lastRun, runsReadFailed, cronConfigured, now });
}
