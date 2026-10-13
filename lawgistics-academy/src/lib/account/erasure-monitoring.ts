/**
 * Watching the deletions (0049). The nightly job used to answer 200 whenever
 * it ran, even with deletions left unfinished, so a firm could believe
 * everything was done when it was not. This module decides, from what the
 * database says is still outstanding, how worried anybody should be, and
 * words it: for the nightly route's answer, for the alert it sends, and for
 * the notice administrators see on every admin page.
 *
 * Pure: no Supabase, no environment, no clock of its own. Every number that
 * decides a level lives here and nowhere else.
 */

/** A deletion tried this many times or more and still unfinished has failed repeatedly. */
export const REPEAT_FAILURE_ATTEMPTS = 3;
/** A deletion unfinished for longer than this has failed repeatedly, however few tries. */
export const REPEAT_FAILURE_HOURS = 72;
/** No record of the nightly job for longer than this means it is not running. */
export const CRON_STALE_HOURS = 36;
/** How many deletions one nightly run tries, unless ERASURE_RETRY_LIMIT says otherwise. */
export const DEFAULT_RETRY_LIMIT = 25;
export const MIN_RETRY_LIMIT = 1;
export const MAX_RETRY_LIMIT = 100;
/** How long the alert webhook is given to answer. */
export const ALERT_TIMEOUT_MS = 5_000;
/** The name the nightly deletion job's runs are recorded under in operational_runs. */
export const ERASURE_JOB = 'erasure-retry';

const HOUR = 3_600_000;

export type RunStatus = 'ok' | 'warning' | 'escalate';

/** An unfinished deletion, as much of it as the levels need. No name, no email. */
export interface OutstandingJob {
  userId: string;
  requestedAt: string;
  attempts: number;
}

/** What the nightly retry reports about its own run. */
export interface RetryReport {
  /** Each deletion it tried, finished or not. */
  triedIds: string[];
  completed: number;
}

/** The counts one run is judged and recorded by. Counts only: nobody is named. */
export interface ErasureCounts {
  outstanding: number;
  tried: number;
  completed: number;
  stillFailing: number;
  notAttempted: number;
  repeatedlyFailing: number;
  /** Whole hours the oldest unfinished deletion has waited; null when none is waiting. */
  oldestOutstandingHours: number | null;
}

export interface ErasureAssessment {
  status: RunStatus;
  counts: ErasureCounts;
}

/** ERASURE_RETRY_LIMIT, a whole number from 1 to 100; anything else is the default. */
export function retryLimitFrom(raw: string | undefined): number {
  const text = (raw ?? '').trim();
  if (!/^\d{1,3}$/.test(text)) return DEFAULT_RETRY_LIMIT;
  const n = Number(text);
  return n >= MIN_RETRY_LIMIT && n <= MAX_RETRY_LIMIT ? n : DEFAULT_RETRY_LIMIT;
}

function hoursWaiting(job: OutstandingJob, now: Date): number {
  const since = Date.parse(job.requestedAt);
  if (Number.isNaN(since)) return 0;
  return Math.max(0, (now.getTime() - since) / HOUR);
}

/** Tried three times or more, or waiting more than seventy-two hours. */
export function failedRepeatedly(job: OutstandingJob, now: Date): boolean {
  return job.attempts >= REPEAT_FAILURE_ATTEMPTS || hoursWaiting(job, now) > REPEAT_FAILURE_HOURS;
}

/** What is unfinished right now, whatever any run did. */
export function summariseOutstanding(
  outstanding: OutstandingJob[],
  now: Date,
): { outstanding: number; repeatedlyFailing: number; oldestOutstandingHours: number | null } {
  let oldest: number | null = null;
  for (const job of outstanding) {
    const h = hoursWaiting(job, now);
    oldest = oldest === null ? h : Math.max(oldest, h);
  }
  return {
    outstanding: outstanding.length,
    repeatedlyFailing: outstanding.filter((job) => failedRepeatedly(job, now)).length,
    oldestOutstandingHours: oldest === null ? null : Math.floor(oldest),
  };
}

/**
 * The level of one nightly run, from the deletions still unfinished after it
 * (read back from the database) and what it tried.
 *
 *   ok        nothing is unfinished.
 *   warning   something is unfinished, but every one was tried this run and
 *             none has failed repeatedly.
 *   escalate  any has failed repeatedly, or any was not tried this run (the
 *             batch limit or the deadline stopped it).
 *
 * `retry` is null when the retry itself failed, which tried nothing: then
 * everything unfinished counts as not attempted.
 */
export function assessErasureRun(
  outstanding: OutstandingJob[],
  retry: RetryReport | null,
  now: Date,
): ErasureAssessment {
  const tried = new Set(retry?.triedIds ?? []);
  const summary = summariseOutstanding(outstanding, now);
  const stillFailing = outstanding.filter((job) => tried.has(job.userId)).length;
  const notAttempted = outstanding.length - stillFailing;
  const counts: ErasureCounts = {
    outstanding: summary.outstanding,
    tried: tried.size,
    completed: retry?.completed ?? 0,
    stillFailing,
    notAttempted,
    repeatedlyFailing: summary.repeatedlyFailing,
    oldestOutstandingHours: summary.oldestOutstandingHours,
  };
  return { status: statusFor(counts), counts };
}

/** The level for a set of counts. */
export function statusFor(counts: Pick<ErasureCounts, 'outstanding' | 'notAttempted' | 'repeatedlyFailing'>): RunStatus {
  if (counts.outstanding === 0) return 'ok';
  if (counts.repeatedlyFailing > 0 || counts.notAttempted > 0) return 'escalate';
  return 'warning';
}

export type AlertLevel = 'warning' | 'escalate' | 'resolved';

/**
 * Whether this run sends an alert, and which. Every run that is not ok says
 * so; the first ok run after one that was not says it is resolved, once.
 */
export function alertLevelFor(status: RunStatus, previous: RunStatus | null): AlertLevel | null {
  if (status !== 'ok') return status;
  if (previous && previous !== 'ok') return 'resolved';
  return null;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Days, rounded down, for a number of hours; "less than a day" under 24. */
export function waitedFor(hours: number): string {
  if (hours < 24) return 'less than a day';
  return plural(Math.floor(hours / 24), 'day', 'days');
}

/** The webhook's body. Counts and levels only: never a name, an email or an id. */
export interface AlertPayload {
  text: string;
  level: AlertLevel;
  /** Null when the unfinished deletions could not be read at all. */
  counts: ErasureCounts | null;
}

/**
 * The words of an alert. `deletionsUrl` is the Admin, Deletions page on this
 * deployment, or null when the site address is not set.
 */
export function alertPayload(
  level: AlertLevel,
  counts: ErasureCounts | null,
  site: { name: string; deletionsUrl: string | null },
): AlertPayload {
  const where = site.deletionsUrl ? `Admin, Deletions: ${site.deletionsUrl}` : 'Admin, Deletions';
  let text: string;
  if (!counts) {
    text =
      `${site.name} deletions needs action: last night's check could not read which account deletions are unfinished, ` +
      'so it cannot say whether any are waiting. Check Supabase is working, then open Admin, Deletions. ' +
      where;
  } else if (level === 'resolved') {
    text = `${site.name}: every account deletion is finished again. Nothing is waiting. ${where}`;
  } else {
    const parts = [
      `${plural(counts.outstanding, 'account deletion is', 'account deletions are')} not finished.`,
      `Last night's check tried ${counts.tried} and finished ${counts.completed}.`,
    ];
    if (counts.repeatedlyFailing > 0) {
      parts.push(`${plural(counts.repeatedlyFailing, 'has', 'have')} failed repeatedly.`);
    }
    if (counts.notAttempted > 0) {
      parts.push(`${plural(counts.notAttempted, 'was', 'were')} not attempted (the nightly limit or time ran out).`);
    }
    if (counts.oldestOutstandingHours !== null) {
      parts.push(`The oldest has been waiting ${waitedFor(counts.oldestOutstandingHours)}.`);
    }
    const head = level === 'escalate' ? 'needs action' : 'warning';
    const todo =
      level === 'escalate'
        ? 'An administrator should open Admin, Deletions today and follow the escalation steps in docs/SECURITY-SETUP.md, section 7a.'
        : 'It will be tried again tonight; an administrator can press Retry now.';
    text = `${site.name} deletions ${head}: ${parts.join(' ')} ${todo} ${where}`;
  }
  return { text, level, counts };
}

/** The address of Admin, Deletions, from NEXT_PUBLIC_SITE_URL, or null without one. */
export function deletionsUrlFrom(siteUrl: string | undefined): string | null {
  const base = (siteUrl ?? '').trim().replace(/\/+$/, '');
  if (!/^https?:\/\/[^\s/]+/i.test(base)) return null;
  return `${base}/admin/deletions`;
}

/**
 * ALERT_WEBHOOK_URL, accepted only as an https address. Anything else is
 * refused with a reason; the address itself is never repeated, since a Slack
 * or Teams webhook address is itself the key to post.
 */
export function webhookTarget(raw: string | undefined): { url: string } | { refused: string } | null {
  const text = (raw ?? '').trim();
  if (!text) return null;
  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    return { refused: 'ALERT_WEBHOOK_URL is not a web address, so no alert was sent.' };
  }
  if (parsed.protocol !== 'https:') {
    return { refused: 'ALERT_WEBHOOK_URL is not an https address, so no alert was sent.' };
  }
  if (parsed.username || parsed.password) {
    return { refused: 'ALERT_WEBHOOK_URL carries a user name or password, so no alert was sent.' };
  }
  return { url: parsed.toString() };
}

/* -------------------------------------------------------------------------- */
/* The notice on every admin page                                              */
/* -------------------------------------------------------------------------- */

/** The newest recorded nightly run, as much as the notice needs. */
export interface LastRun {
  startedAt: string;
  status: RunStatus;
  notAttempted: number | null;
}

export interface AdminErasureInput {
  /** Unfinished deletions now, or null when they could not be read. */
  outstanding: OutstandingJob[] | null;
  /** The newest run of the nightly job, null when there is none. */
  lastRun: LastRun | null;
  /** True when the runs could not be read. */
  runsReadFailed: boolean;
  /** Whether CRON_SECRET is set well enough for the nightly job to run. */
  cronConfigured: boolean;
  now: Date;
}

export interface AdminErasureNotice {
  level: 'warning' | 'escalate' | 'unknown';
  /** The bold first words. */
  title: string;
  /** What else is true, one sentence each. */
  details: string[];
  /** What the administrator does about it. */
  action: string;
  /** True when it links to Admin, Deletions. */
  linkToDeletions: boolean;
}

/** Whether the nightly job has been recorded within CRON_STALE_HOURS. */
export function cronIsStale(lastRun: LastRun | null, now: Date): boolean {
  if (!lastRun) return true;
  const at = Date.parse(lastRun.startedAt);
  if (Number.isNaN(at)) return true;
  return now.getTime() - at > CRON_STALE_HOURS * HOUR;
}

/**
 * What the notice on every admin page says, or null when there is nothing to
 * say. Each problem is its own notice, worst first. When something could not
 * be read the answer is a notice saying so, never nothing.
 */
export function adminErasureNotices(input: AdminErasureInput): AdminErasureNotice[] {
  const notices: AdminErasureNotice[] = [];

  if (!input.cronConfigured) {
    notices.push({
      level: 'escalate',
      title: 'The nightly deletion check is not running.',
      details: [
        'CRON_SECRET is not set on this deployment, so unfinished deletions are not retried and nobody is alerted.',
      ],
      action:
        'Set CRON_SECRET in Vercel (Settings, Environment Variables, at least 16 characters) and redeploy: docs/SECURITY-SETUP.md, section 7a. Until then press Retry on Admin, Deletions yourself.',
      linkToDeletions: true,
    });
  } else if (input.runsReadFailed) {
    notices.push({
      level: 'unknown',
      title: 'Whether the nightly deletion check is running could not be read.',
      details: [],
      action: 'Reload the page. If this stays, check the database is up to date (UPDATE.sql) and Supabase is working.',
      linkToDeletions: true,
    });
  } else if (cronIsStale(input.lastRun, input.now)) {
    notices.push({
      level: 'escalate',
      title: 'The nightly deletion check is not running.',
      details: [
        input.lastRun
          ? `It last ran ${waitedFor((input.now.getTime() - Date.parse(input.lastRun.startedAt)) / HOUR)} ago; it should run every night.`
          : 'There is no record of it ever running.',
      ],
      action:
        'In Vercel open the project, Settings, Cron Jobs, and check /api/cron/erasure-retry is listed and enabled; then Logs for its last run. Meanwhile press Retry on Admin, Deletions yourself.',
      linkToDeletions: true,
    });
  }

  if (input.outstanding === null) {
    notices.push({
      level: 'unknown',
      title: 'Whether any deletion is unfinished could not be read just now.',
      details: [],
      action: 'Reload the page, or open Admin, Deletions. If this stays, check Supabase is working.',
      linkToDeletions: true,
    });
    return notices;
  }

  const summary = summariseOutstanding(input.outstanding, input.now);
  if (summary.outstanding === 0) return notices;

  // "Not attempted last night" is the newest run's own count, and only while
  // something is still unfinished.
  const notAttempted = input.lastRun?.notAttempted ?? 0;
  const level = statusFor({
    outstanding: summary.outstanding,
    repeatedlyFailing: summary.repeatedlyFailing,
    notAttempted,
  });
  const details: string[] = [];
  if (level === 'escalate') {
    if (summary.repeatedlyFailing > 0) {
      details.push(`${plural(summary.repeatedlyFailing, 'has', 'have')} failed repeatedly.`);
    }
    if (notAttempted > 0) {
      details.push(`${plural(notAttempted, 'was', 'were')} not attempted last night.`);
    }
    if (summary.oldestOutstandingHours !== null) {
      details.push(`The oldest has been waiting ${waitedFor(summary.oldestOutstandingHours)}.`);
    }
  }
  notices.push({
    level: level === 'escalate' ? 'escalate' : 'warning',
    title: `${plural(summary.outstanding, 'deletion is', 'deletions are')} not finished.`,
    details,
    action:
      level === 'escalate'
        ? 'Open Admin, Deletions and press Retry. If it still fails, follow the escalation steps in docs/SECURITY-SETUP.md, section 7a.'
        : 'The nightly check will try again; you can press Retry on Admin, Deletions now.',
    linkToDeletions: true,
  });
  return notices;
}
