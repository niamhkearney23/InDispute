import 'server-only';

import { randomBytes } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/service';
import { ERASED_BAN, erasedEmail, type ErasureOutcome, type ErasureStep } from './erasure-rules';
import { WORK_BOARD_RETENTION_MONTHS } from './retention';

/**
 * A password nobody knows: 64 characters drawn from 48 random bytes. The
 * auth server refuses a password longer than 72 characters, so 64 random
 * bytes written out in full (88 characters in base64) would be turned away.
 */
export function unguessablePassword(): string {
  return randomBytes(48).toString('base64url');
}

/**
 * Deleting an account (0043, made resumable in 0045). The owner's decision:
 * remove the person's name, email, photo and what is only theirs, and keep
 * the firm's training record. What is kept is not anonymous: written
 * answers, messages a supervisor kept, attachments and certification records
 * may still identify somebody, and an administrator reviews them at Admin,
 * Deletions. The migrations' headers list what goes and what stays.
 *
 * A deletion is a job (`account_erasures`), one per person, with four steps,
 * each recorded when it finishes:
 *
 *   1. database: `erase_account`, one transaction. Clears the profile,
 *      deletes the tutor conversations, wrong-code attempts and an undecided
 *      code request, empties recordings, replaces the person's own
 *      work-board text unless kept for supervision, queues linked
 *      certification records for review, creates the job, and deletes every
 *      session and refresh token. If it fails nothing has changed. Once it
 *      has happened the person can no longer use the account: the database
 *      refuses them (`check_request` and a restrictive policy on every
 *      table) and the app treats them as signed out, whatever happens next.
 *   2. sessions: done inside step 1, and again straight after step 3, in
 *      case anything signed in between.
 *   3. signIn: the auth server. An address that cannot receive mail, a
 *      password nobody knows and a ban, then the sessions revoked again.
 *   4. files: the photo and the recordings, by listing the person's own
 *      folders page by page (Storage lists a hundred at a time by default),
 *      plus any path the database cleared. Every deletion must be confirmed:
 *      a listing error, a deletion error, or fewer files removed than were
 *      asked for, fails the step. A final listing must come back empty.
 *
 * `runErasure` runs whatever is not finished and records each step's success
 * or error. It sets `completed_at` only when all four have finished, and the
 * database refuses a completed job with a step missing. Running it again is
 * always safe: the administrator's Retry button and the daily job
 * (`/api/cron/erasure-retry`) do exactly that.
 *
 * Service role throughout, so every caller has already decided whose
 * account this is: the person's own session, or an administrator. Nothing
 * here takes an id from a form.
 *
 * Everything that talks to Supabase goes through `ErasureDeps`, so a test
 * can make any call fail. `serviceErasureDeps(client)` is the real thing; an
 * integration test can pass it a service-role client of its own.
 */

/** A deletion job as the database holds it. */
export interface ErasureJob {
  userId: string;
  requestedBy: string | null;
  requestedAt: string;
  databaseDoneAt: string | null;
  sessionsDoneAt: string | null;
  authDoneAt: string | null;
  storageDoneAt: string | null;
  /** Recording paths the database cleared, kept until the files are gone. */
  pendingFiles: string[];
  attempts: number;
  lastAttemptAt: string | null;
  lastError: string | null;
  completedAt: string | null;
}

/** What one run writes back to the job. Absent fields are left alone. */
export interface ErasureProgress {
  attempts: number;
  lastAttemptAt: string;
  lastError: string | null;
  sessionsDoneAt?: string;
  authDoneAt?: string;
  storageDoneAt?: string;
  pendingFiles?: string[];
  completedAt?: string;
}

/** One entry of a Storage listing. A folder comes back with no id. */
export interface StoredEntry {
  name: string;
  id: string | null;
}

/**
 * Everything a deletion asks of Supabase. Each method throws when the call
 * fails; none of them swallows an error.
 */
export interface ErasureDeps {
  /** The account's staff flags, or null when there is no such account. */
  staffFlags(userId: string): Promise<{ isStaff: boolean } | null>;
  loadJob(userId: string): Promise<ErasureJob | null>;
  /** `erase_account`: returns the recording paths it cleared. */
  eraseDatabase(userId: string, requestedBy: string | null): Promise<string[]>;
  /** `revoke_account_sessions`. */
  revokeSessions(userId: string): Promise<void>;
  /** The auth server: new address, unknown password, ban. */
  closeSignIn(userId: string): Promise<void>;
  /** One page of a Storage folder. */
  listFolder(
    bucket: string,
    folder: string,
    page: { offset: number; limit: number },
  ): Promise<StoredEntry[]>;
  /** Deletes the files; returns how many Storage says it removed. */
  removeFiles(bucket: string, paths: string[]): Promise<number>;
  saveProgress(userId: string, progress: ErasureProgress): Promise<void>;
  /** Up to `limit` unfinished jobs, the longest untried first. */
  incompleteJobs(limit: number): Promise<string[]>;
  now?(): Date;
}

/** The buckets that hold a person's own files, each under a folder named by their id. */
export const PERSONAL_BUCKETS = ['avatars', 'matter-recordings'] as const;

/** Storage's own default page size; a full page means there may be another. */
export const LIST_PAGE = 100;
/** How many paths go in one delete request. */
export const REMOVE_BATCH = 100;
/** Folders deeper than this are not expected and fail the step rather than loop. */
const MAX_DEPTH = 6;

function message(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

/**
 * Every file under a folder, at any depth, reading every page. Throws on any
 * listing error, so a folder that could not be read is never taken as empty.
 */
export async function listStoredFiles(
  deps: Pick<ErasureDeps, 'listFolder'>,
  bucket: string,
  folder: string,
  depth = 0,
): Promise<string[]> {
  if (depth > MAX_DEPTH) throw new Error(`${bucket}/${folder} is nested deeper than expected`);
  const files: string[] = [];
  for (let offset = 0; ; offset += LIST_PAGE) {
    const page = await deps.listFolder(bucket, folder, { offset, limit: LIST_PAGE });
    for (const entry of page) {
      const path = `${folder}/${entry.name}`;
      if (entry.id) files.push(path);
      else files.push(...(await listStoredFiles(deps, bucket, path, depth + 1)));
    }
    if (page.length < LIST_PAGE) break;
  }
  return files;
}

/** Step 1. Throws when the transaction failed, in which case nothing changed. */
export async function stepDatabase(
  deps: ErasureDeps,
  userId: string,
  requestedBy: string | null,
): Promise<string[]> {
  return deps.eraseDatabase(userId, requestedBy);
}

/** Step 2 on its own: every session and refresh token. */
export async function stepSessions(deps: ErasureDeps, userId: string): Promise<void> {
  await deps.revokeSessions(userId);
}

/**
 * Step 3: the auth server, then the sessions again, so nothing signed in
 * between the database step and the ban survives it.
 */
export async function stepSignIn(deps: ErasureDeps, userId: string): Promise<void> {
  await deps.closeSignIn(userId);
  await deps.revokeSessions(userId);
}

/**
 * Step 4: every file in the person's own folders, and any path the database
 * cleared that sits elsewhere. Throws unless every file was confirmed
 * removed and a fresh listing finds nothing left.
 */
export async function stepFiles(
  deps: ErasureDeps,
  userId: string,
  pendingFiles: string[],
): Promise<void> {
  for (const bucket of PERSONAL_BUCKETS) {
    const found = await listStoredFiles(deps, bucket, userId);
    const targets = new Set(found);

    // A recording the database cleared lives under the person's folder (0036
    // requires it), so the listing above already has it if it still exists.
    // One that does not is looked for in its own folder, never assumed.
    if (bucket === 'matter-recordings') {
      for (const path of pendingFiles) {
        if (path.startsWith(`${userId}/`) || targets.has(path)) continue;
        const slash = path.lastIndexOf('/');
        if (slash <= 0) continue;
        const siblings = await listStoredFiles(deps, bucket, path.slice(0, slash));
        if (siblings.includes(path)) targets.add(path);
      }
    }

    const paths = [...targets];
    for (let i = 0; i < paths.length; i += REMOVE_BATCH) {
      const batch = paths.slice(i, i + REMOVE_BATCH);
      const removed = await deps.removeFiles(bucket, batch);
      if (removed < batch.length) {
        throw new Error(`${bucket}: only ${removed} of ${batch.length} files were removed`);
      }
    }

    const left = await listStoredFiles(deps, bucket, userId);
    if (left.length > 0) {
      throw new Error(`${bucket}: ${left.length} file(s) still there after deleting`);
    }
  }
}

function doneSteps(job: ErasureJob): Record<ErasureStep, boolean> {
  return {
    database: Boolean(job.databaseDoneAt),
    sessions: Boolean(job.sessionsDoneAt),
    signIn: Boolean(job.authDoneAt),
    files: Boolean(job.storageDoneAt),
  };
}

/**
 * Runs whatever is unfinished of this person's deletion, records it, and
 * says how it came out. Safe to call any number of times.
 *
 * `requestedBy` is who asked (the person, or an administrator); it is only
 * recorded the first time, when the job is created.
 */
export async function runErasure(
  userId: string,
  options: { requestedBy?: string | null; deps?: ErasureDeps } = {},
): Promise<ErasureOutcome> {
  const deps = options.deps ?? serviceErasureDeps();
  const now = () => (deps.now ? deps.now() : new Date()).toISOString();

  let flags: { isStaff: boolean } | null;
  let job: ErasureJob | null;
  try {
    flags = await deps.staffFlags(userId);
    job = await deps.loadJob(userId);
  } catch (error) {
    console.error('reading an account for deletion failed:', message(error));
    return { kind: 'refused', error: 'The account could not be read. Nothing was changed. Please try again.' };
  }
  if (!flags) return { kind: 'refused', error: 'That account could not be found.' };
  // The database refuses this too; asking first gives a sentence instead.
  if (flags.isStaff) {
    return {
      kind: 'refused',
      error: 'A staff account is not deleted here. Take the staff role off at Admin, Staff first.',
    };
  }
  if (job?.completedAt) return { kind: 'complete' };

  // 1. The database.
  if (!job?.databaseDoneAt) {
    let cleared: string[];
    try {
      cleared = await stepDatabase(deps, userId, options.requestedBy ?? null);
    } catch (error) {
      console.error('erase_account failed:', message(error));
      return {
        kind: 'refused',
        error: 'The account could not be deleted. Nothing was changed. Please try again.',
      };
    }
    // The transaction made the job. Read it back; if that fails, carry on
    // from what the transaction is known to have done.
    const stamped = now();
    job =
      (await deps.loadJob(userId).catch(() => null)) ??
      ({
        userId,
        requestedBy: options.requestedBy ?? null,
        requestedAt: stamped,
        databaseDoneAt: stamped,
        sessionsDoneAt: stamped,
        authDoneAt: null,
        storageDoneAt: null,
        pendingFiles: cleared,
        attempts: 0,
        lastAttemptAt: null,
        lastError: null,
        completedAt: null,
      } satisfies ErasureJob);
  }

  const done = doneSteps(job);
  const progress: ErasureProgress = {
    attempts: job.attempts + 1,
    lastAttemptAt: now(),
    lastError: null,
  };
  const errors: string[] = [];

  // 3. Sign-in, which revokes the sessions again on the way out.
  if (!done.signIn) {
    try {
      await stepSignIn(deps, userId);
      progress.authDoneAt = now();
      progress.sessionsDoneAt = now();
      done.signIn = true;
      done.sessions = true;
    } catch (error) {
      errors.push(`Sign-in: ${message(error)}`);
    }
  }

  // 2. Sessions, should the database step's revocation not be recorded.
  if (!done.sessions) {
    try {
      await stepSessions(deps, userId);
      progress.sessionsDoneAt = now();
      done.sessions = true;
    } catch (error) {
      errors.push(`Sessions: ${message(error)}`);
    }
  }

  // 4. Files.
  if (!done.files) {
    try {
      await stepFiles(deps, userId, job.pendingFiles);
      progress.storageDoneAt = now();
      progress.pendingFiles = [];
      done.files = true;
    } catch (error) {
      errors.push(`Files: ${message(error)}`);
    }
  }

  const pending = (Object.keys(done) as ErasureStep[]).filter((step) => !done[step]);
  if (pending.length === 0) progress.completedAt = now();
  if (errors.length > 0) {
    progress.lastError = errors.join(' | ').slice(0, 2000);
    console.error(`deleting ${userId} is not finished:`, progress.lastError);
  }

  let recorded = true;
  try {
    await deps.saveProgress(userId, progress);
  } catch (error) {
    recorded = false;
    console.error('recording deletion progress failed:', message(error));
  }

  if (pending.length === 0 && recorded) return { kind: 'complete' };
  return { kind: 'incomplete', pending, recorded };
}

/**
 * The daily job: retries unfinished deletions, the longest untried first,
 * until `limit` have been tried or `deadline` (milliseconds since the epoch)
 * passes. Each runs on its own, so one failing does not stop the rest.
 */
export async function retryIncompleteErasures(
  options: { deps?: ErasureDeps; limit?: number; deadline?: number } = {},
): Promise<{ tried: number; completed: number; stillIncomplete: number }> {
  const deps = options.deps ?? serviceErasureDeps();
  const ids = await deps.incompleteJobs(options.limit ?? 25);
  let tried = 0;
  let completed = 0;
  for (const id of ids) {
    if (options.deadline && Date.now() > options.deadline) break;
    tried += 1;
    const outcome = await runErasure(id, { deps });
    if (outcome.kind === 'complete') completed += 1;
  }
  return { tried, completed, stillIncomplete: tried - completed };
}

/**
 * The retention period for the work board (WORK_BOARD_RETENTION_MONTHS).
 * Returns how many messages and comments were replaced.
 */
export async function applyWorkBoardRetention(
  db: SupabaseClient = createServiceClient(),
): Promise<number> {
  const { data, error } = await db.rpc('redact_expired_work_board', {
    months: WORK_BOARD_RETENTION_MONTHS,
  });
  if (error) throw new Error(error.message);
  return typeof data === 'number' ? data : 0;
}

interface JobRow {
  user_id: string;
  requested_by: string | null;
  requested_at: string;
  database_done_at: string | null;
  sessions_done_at: string | null;
  auth_done_at: string | null;
  storage_done_at: string | null;
  pending_files: string[] | null;
  attempts: number;
  last_attempt_at: string | null;
  last_error: string | null;
  completed_at: string | null;
}

export const JOB_SELECT =
  'user_id, requested_by, requested_at, database_done_at, sessions_done_at, auth_done_at, ' +
  'storage_done_at, pending_files, attempts, last_attempt_at, last_error, completed_at';

export function toJob(row: JobRow): ErasureJob {
  return {
    userId: row.user_id,
    requestedBy: row.requested_by,
    requestedAt: row.requested_at,
    databaseDoneAt: row.database_done_at,
    sessionsDoneAt: row.sessions_done_at,
    authDoneAt: row.auth_done_at,
    storageDoneAt: row.storage_done_at,
    pendingFiles: row.pending_files ?? [],
    attempts: row.attempts,
    lastAttemptAt: row.last_attempt_at,
    lastError: row.last_error,
    completedAt: row.completed_at,
  };
}

/** `ErasureDeps` backed by a service-role Supabase client. */
export function serviceErasureDeps(db: SupabaseClient = createServiceClient()): ErasureDeps {
  return {
    async staffFlags(userId) {
      const { data, error } = await db
        .from('profiles')
        .select('is_admin, is_coach, is_firm_admin')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      return { isStaff: Boolean(data.is_admin || data.is_coach || data.is_firm_admin) };
    },

    async loadJob(userId) {
      const { data, error } = await db
        .from('account_erasures')
        .select(JOB_SELECT)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toJob(data as unknown as JobRow) : null;
    },

    async eraseDatabase(userId, requestedBy) {
      const { data, error } = await db.rpc('erase_account', { uid: userId, by_whom: requestedBy });
      if (error) throw new Error(error.message);
      return (data as string[] | null) ?? [];
    },

    async revokeSessions(userId) {
      const { error } = await db.rpc('revoke_account_sessions', { uid: userId });
      if (error) throw new Error(error.message);
    },

    async closeSignIn(userId) {
      const { error } = await db.auth.admin.updateUserById(userId, {
        email: erasedEmail(userId),
        email_confirm: true,
        password: unguessablePassword(),
        ban_duration: ERASED_BAN,
        // A key set to null is removed. The name typed at sign-up lives here
        // as well as on the profile.
        user_metadata: { display_name: null },
      });
      if (error) throw new Error(error.message);
    },

    async listFolder(bucket, folder, page) {
      const { data, error } = await db.storage.from(bucket).list(folder, {
        limit: page.limit,
        offset: page.offset,
        sortBy: { column: 'name', order: 'asc' },
      });
      if (error) throw new Error(error.message);
      if (!data) throw new Error(`no listing came back for ${bucket}/${folder}`);
      return data.map((entry) => ({ name: entry.name, id: entry.id ?? null }));
    },

    async removeFiles(bucket, paths) {
      const { data, error } = await db.storage.from(bucket).remove(paths);
      if (error) throw new Error(error.message);
      return data?.length ?? 0;
    },

    async saveProgress(userId, progress) {
      const row: Record<string, unknown> = {
        attempts: progress.attempts,
        last_attempt_at: progress.lastAttemptAt,
        last_error: progress.lastError,
      };
      if (progress.sessionsDoneAt) row.sessions_done_at = progress.sessionsDoneAt;
      if (progress.authDoneAt) row.auth_done_at = progress.authDoneAt;
      if (progress.storageDoneAt) row.storage_done_at = progress.storageDoneAt;
      if (progress.pendingFiles) row.pending_files = progress.pendingFiles;
      if (progress.completedAt) row.completed_at = progress.completedAt;
      const { error } = await db.from('account_erasures').update(row).eq('user_id', userId);
      if (error) throw new Error(error.message);
    },

    async incompleteJobs(limit) {
      const { data, error } = await db
        .from('account_erasures')
        .select('user_id')
        .is('completed_at', null)
        .order('last_attempt_at', { ascending: true, nullsFirst: true })
        .limit(limit);
      if (error) throw new Error(error.message);
      return ((data ?? []) as Array<{ user_id: string }>).map((r) => r.user_id);
    },
  };
}
