import { timingSafeEqual } from 'node:crypto';
import { brand } from '@/lib/brand';
import {
  ALERT_TIMEOUT_MS,
  ERASURE_JOB,
  alertLevelFor,
  alertPayload,
  assessErasureRun,
  deletionsUrlFrom,
  retryLimitFrom,
  webhookTarget,
  type AlertLevel,
  type AlertPayload,
  type ErasureCounts,
  type OutstandingJob,
  type RetryReport,
  type RunStatus,
} from './erasure-monitoring';

/**
 * The daily job behind `/api/cron/erasure-retry` (0045): finish deletions
 * that did not finish, and apply the work board's retention period.
 *
 * Vercel's scheduler calls it with `Authorization: Bearer <CRON_SECRET>`.
 * Without CRON_SECRET set (16 characters or more) the route is off and
 * answers 404, so a deployment that never set it exposes nothing. With it
 * set, anything else gets 401 and nothing runs. Kept apart from the route
 * file so the tests can drive it with a pretend job.
 *
 * Since 0049 the answer is honest: after retrying, the handler reads back
 * from the database every deletion still unfinished, judges the run
 * (`assessErasureRun`: ok, warning or escalate), records it in
 * `operational_runs`, and answers 200 only when nothing is unfinished. Any
 * other level is 503, so Vercel's cron view shows the run as failed, and an
 * alert goes to ALERT_WEBHOOK_URL when one is set. The answer and the alert
 * carry counts, ages and levels only: no names, emails or ids.
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

/** Everything the nightly run asks of the world. Each method throws when its call fails. */
export interface CronWork {
  /** Retries up to `limit` unfinished deletions; says which it tried. */
  retry(limit: number): Promise<RetryReport>;
  /** The work board's retention period; how many records it replaced. */
  retention(): Promise<number>;
  /** Every deletion not yet completed, read from the database after the retry. */
  outstanding(): Promise<OutstandingJob[]>;
  /** The level of this job's newest recorded run, or null when there is none. */
  previousStatus(): Promise<RunStatus | null>;
  /** Writes the run to operational_runs. */
  recordRun(run: OperationalRun): Promise<void>;
}

/** One run as operational_runs keeps it. Counts are null when they could not be read. */
export interface OperationalRun {
  job: string;
  startedAt: string;
  finishedAt: string;
  status: RunStatus;
  outstanding: number | null;
  tried: number;
  completed: number;
  stillFailing: number | null;
  notAttempted: number | null;
  repeatedlyFailing: number | null;
  oldestOutstandingHours: number | null;
  alertSent: boolean;
  alertError: string | null;
}

/** The settings the run reads, and what a test replaces. */
export interface CronOptions {
  /** Reads ALERT_WEBHOOK_URL, NEXT_PUBLIC_SITE_URL and ERASURE_RETRY_LIMIT; the route passes process.env. */
  env?: Record<string, string | undefined>;
  fetch?: typeof fetch;
  now?: () => Date;
  /** How long the webhook is given; ALERT_TIMEOUT_MS unless a test says otherwise. */
  alertTimeoutMs?: number;
  siteName?: string;
}

export interface AlertResult {
  level: AlertLevel | null;
  sent: boolean;
  error: string | null;
}

/**
 * Posts one alert. Never throws: whatever goes wrong comes back as a fixed
 * sentence for the run's record, never the webhook's address or its reply.
 */
export async function sendAlert(
  rawUrl: string | undefined,
  payload: AlertPayload,
  options: { fetch?: typeof fetch; timeoutMs?: number } = {},
): Promise<{ sent: boolean; error: string | null }> {
  try {
    const target = webhookTarget(rawUrl);
    if (!target) return { sent: false, error: 'No ALERT_WEBHOOK_URL is set, so no alert was sent.' };
    if ('refused' in target) return { sent: false, error: target.refused };
    const timeoutMs = options.timeoutMs ?? ALERT_TIMEOUT_MS;
    const post = options.fetch ?? globalThis.fetch;
    const response = await post(target.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'error',
      cache: 'no-store',
    });
    if (!response.ok) return { sent: false, error: `The webhook answered ${response.status}.` };
    return { sent: true, error: null };
  } catch (error) {
    const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
    if (name === 'TimeoutError' || name === 'AbortError') {
      return { sent: false, error: 'The webhook did not answer in time.' };
    }
    return { sent: false, error: 'The webhook could not be reached.' };
  }
}

/**
 * The whole handler, given the secret and the work to do. The check comes
 * first and nothing else is touched before it passes.
 */
export async function handleErasureCron(
  request: Request,
  secret: string | undefined,
  work: CronWork,
  options: CronOptions = {},
): Promise<Response> {
  const decision = cronDecision(request.headers.get('authorization'), secret);
  if (decision === 'off') return new Response('Not found', { status: 404 });
  if (decision === 'refused') {
    return Response.json({ error: 'Not authorised' }, { status: 401 });
  }

  const env = options.env ?? {};
  const now = options.now ?? (() => new Date());
  const startedAt = now().toISOString();
  const limit = retryLimitFrom(env.ERASURE_RETRY_LIMIT);

  // Each half runs whatever the other did.
  let retried: RetryReport | null = null;
  try {
    retried = await work.retry(limit);
  } catch (error) {
    console.error('retrying deletions failed:', error);
  }
  let redacted: number | { error: string };
  try {
    redacted = await work.retention();
  } catch (error) {
    console.error('applying the work board retention period failed:', error);
    redacted = { error: 'The retention period could not be applied; see the server log.' };
  }

  // What is unfinished is read back from the database, not taken from what
  // the retry says it did: the limit and the deadline leave some untried.
  let status: RunStatus;
  let counts: ErasureCounts | null = null;
  try {
    const assessed = assessErasureRun(await work.outstanding(), retried, now());
    status = assessed.status;
    counts = assessed.counts;
  } catch (error) {
    console.error('reading the unfinished deletions failed:', error);
    status = 'escalate';
  }

  let previous: RunStatus | null = null;
  try {
    previous = await work.previousStatus();
  } catch (error) {
    console.error('reading the last nightly run failed:', error);
  }

  const level = alertLevelFor(status, previous);
  let alert: AlertResult = { level, sent: false, error: null };
  if (level) {
    const payload = alertPayload(level, counts, {
      name: options.siteName ?? brand.name,
      deletionsUrl: deletionsUrlFrom(env.NEXT_PUBLIC_SITE_URL),
    });
    alert = { level, ...(await sendAlert(env.ALERT_WEBHOOK_URL, payload, { fetch: options.fetch, timeoutMs: options.alertTimeoutMs })) };
  }

  let recorded = true;
  try {
    await work.recordRun({
      job: ERASURE_JOB,
      startedAt,
      finishedAt: now().toISOString(),
      status,
      outstanding: counts?.outstanding ?? null,
      tried: retried?.triedIds.length ?? 0,
      completed: retried?.completed ?? 0,
      stillFailing: counts?.stillFailing ?? null,
      notAttempted: counts?.notAttempted ?? null,
      repeatedlyFailing: counts?.repeatedlyFailing ?? null,
      oldestOutstandingHours: counts?.oldestOutstandingHours ?? null,
      alertSent: alert.sent,
      alertError: alert.error,
    });
  } catch (error) {
    recorded = false;
    console.error('recording the nightly run failed:', error);
  }

  // 200 only when nothing is unfinished and everything else worked too.
  const httpStatus =
    status !== 'ok' ? 503 : retried === null || typeof redacted !== 'number' || !recorded ? 500 : 200;
  return Response.json(
    {
      status,
      deletions: counts ?? {
        error: 'The unfinished deletions could not be read; see the server log.',
        tried: retried?.triedIds.length ?? 0,
        completed: retried?.completed ?? 0,
      },
      retryFailed: retried === null,
      retentionRedacted: redacted,
      alert,
      recorded,
    },
    { status: httpStatus },
  );
}
