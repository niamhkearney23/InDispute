import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LIST_PAGE,
  listStoredFiles,
  retryIncompleteErasures,
  runErasure,
  type ErasureDeps,
  type ErasureJob,
  type ErasureProgress,
  type StoredEntry,
} from '../src/lib/account/erasure';
import {
  adminErasureMessage,
  goodbyeCopy,
  goodbyePath,
  parsePending,
  type ErasureOutcome,
} from '../src/lib/account/erasure-rules';

/**
 * Deleting an account, run against a pretend Supabase (0045). Every call the
 * deletion makes goes through ErasureDeps, so each one can be made to fail,
 * and the job it records is checked the way the database would check it: a
 * completed job with a step missing is refused, as the constraint
 * account_erasures_complete_means_every_step refuses it.
 */

const USER = '0f8fad5b-d9cb-469f-a165-70867728950e';
const ADMIN = '33333333-3333-3333-3333-333333333333';

interface World {
  deps: ErasureDeps;
  job: () => ErasureJob | null;
  files: Map<string, Set<string>>;
  calls: string[];
  set: (patch: Partial<Settings>) => void;
}

interface Settings {
  exists: boolean;
  staff: boolean;
  failDatabase: boolean;
  authFailures: number;
  failList: boolean;
  failRemove: boolean;
  /** Storage says it removed one fewer than asked, and leaves that one. */
  removeShort: boolean;
  /** Storage says it removed everything and quietly removes nothing. */
  removeLies: boolean;
  failSave: boolean;
  /** Recording paths erase_account reports clearing. */
  cleared: string[];
}

function world(initialFiles: Record<string, string[]>, settings: Partial<Settings> = {}): World {
  const s: Settings = {
    exists: true,
    staff: false,
    failDatabase: false,
    authFailures: 0,
    failList: false,
    failRemove: false,
    removeShort: false,
    removeLies: false,
    failSave: false,
    cleared: [],
    ...settings,
  };
  const files = new Map<string, Set<string>>();
  for (const [bucket, paths] of Object.entries(initialFiles)) files.set(bucket, new Set(paths));
  let job: ErasureJob | null = null;
  const calls: string[] = [];
  let clock = Date.parse('2026-10-13T00:00:00Z');

  const deps: ErasureDeps = {
    now: () => new Date((clock += 1000)),
    async staffFlags() {
      calls.push('staffFlags');
      return s.exists ? { isStaff: s.staff } : null;
    },
    async loadJob() {
      return job ? { ...job, pendingFiles: [...job.pendingFiles] } : null;
    },
    async eraseDatabase(_userId, requestedBy) {
      calls.push('eraseDatabase');
      if (s.failDatabase) throw new Error('database down');
      const at = new Date(clock).toISOString();
      job ??= {
        userId: USER,
        requestedBy,
        requestedAt: at,
        databaseDoneAt: at,
        sessionsDoneAt: at,
        authDoneAt: null,
        storageDoneAt: null,
        pendingFiles: [...s.cleared],
        attempts: 0,
        lastAttemptAt: null,
        lastError: null,
        completedAt: null,
      };
      return [...s.cleared];
    },
    async revokeSessions() {
      calls.push('revokeSessions');
    },
    async closeSignIn() {
      calls.push('closeSignIn');
      if (s.authFailures > 0) {
        s.authFailures -= 1;
        throw new Error('auth server unavailable');
      }
    },
    async listFolder(bucket, folder, page): Promise<StoredEntry[]> {
      calls.push(`list ${bucket} ${folder} ${page.offset}`);
      if (s.failList) throw new Error('storage list failed');
      const prefix = `${folder}/`;
      const children = new Map<string, StoredEntry>();
      for (const path of files.get(bucket) ?? []) {
        if (!path.startsWith(prefix)) continue;
        const rest = path.slice(prefix.length);
        const slash = rest.indexOf('/');
        if (slash === -1) children.set(rest, { name: rest, id: `id-${path}` });
        else children.set(rest.slice(0, slash), { name: rest.slice(0, slash), id: null });
      }
      return [...children.values()]
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(page.offset, page.offset + page.limit);
    },
    async removeFiles(bucket, paths) {
      calls.push(`remove ${bucket} ${paths.length}`);
      if (s.failRemove) throw new Error('storage remove failed');
      if (s.removeLies) return paths.length;
      const held = files.get(bucket) ?? new Set<string>();
      let removed = 0;
      for (const [i, path] of paths.entries()) {
        if (s.removeShort && i === paths.length - 1) continue;
        if (held.delete(path)) removed += 1;
      }
      return removed;
    },
    async saveProgress(_userId, progress: ErasureProgress) {
      calls.push('saveProgress');
      if (s.failSave) throw new Error('could not write the job');
      if (!job) throw new Error('no job');
      const next: ErasureJob = {
        ...job,
        attempts: progress.attempts,
        lastAttemptAt: progress.lastAttemptAt,
        lastError: progress.lastError,
        sessionsDoneAt: progress.sessionsDoneAt ?? job.sessionsDoneAt,
        authDoneAt: progress.authDoneAt ?? job.authDoneAt,
        storageDoneAt: progress.storageDoneAt ?? job.storageDoneAt,
        pendingFiles: progress.pendingFiles ?? job.pendingFiles,
        completedAt: progress.completedAt ?? job.completedAt,
      };
      // The database's own rule.
      if (
        next.completedAt &&
        !(next.databaseDoneAt && next.sessionsDoneAt && next.authDoneAt && next.storageDoneAt)
      ) {
        throw new Error('account_erasures_complete_means_every_step');
      }
      job = next;
    },
    async incompleteJobs() {
      return job && !job.completedAt ? [job.userId] : [];
    },
  };

  return {
    deps,
    job: () => job,
    files,
    calls,
    set: (patch) => Object.assign(s, patch),
  };
}

const someFiles = () => ({
  avatars: [`${USER}/avatar.png`, 'someone-else/avatar.png'],
  'matter-recordings': [`${USER}/attempt-1/1.webm`, `${USER}/attempt-2/1.webm`],
});

function isNotSuccess(outcome: ErasureOutcome) {
  assert.notEqual(outcome.kind, 'complete');
  assert.ok(goodbyePath(outcome).includes('pending='), 'the person is sent to the unfinished page');
  const copy = goodbyeCopy(parsePending(new URL(goodbyePath(outcome), 'https://x.test').searchParams.get('pending') ?? ''));
  assert.doesNotMatch(copy.heading, /has been deleted/i, 'the person is not told it is deleted');
  assert.match(copy.body.join(' '), /has not finished yet/);
  assert.match(copy.body.join(' '), /retried automatically/);
  assert.match(copy.body.join(' '), /cannot use this account/);
  const admin = adminErasureMessage(outcome);
  assert.equal(admin.ok, false, 'the administrator is not told it is done');
  assert.doesNotMatch(admin.text, /^Deleted\./);
}

test('a deletion where everything works finishes, and only then is complete', async () => {
  const w = world(someFiles());
  const outcome = await runErasure(USER, { requestedBy: USER, deps: w.deps });
  assert.deepEqual(outcome, { kind: 'complete' });
  const job = w.job()!;
  assert.ok(job.databaseDoneAt && job.sessionsDoneAt && job.authDoneAt && job.storageDoneAt);
  assert.ok(job.completedAt);
  assert.equal(job.attempts, 1);
  assert.equal(job.lastError, null);
  assert.equal(job.requestedBy, USER);
  assert.deepEqual([...w.files.get('avatars')!], ['someone-else/avatar.png'], 'only their own files go');
  assert.equal(w.files.get('matter-recordings')!.size, 0);
  // Sign-in is closed after the database, and the sessions revoked again after it.
  const order = w.calls.filter((c) => ['eraseDatabase', 'closeSignIn', 'revokeSessions'].includes(c));
  assert.deepEqual(order, ['eraseDatabase', 'closeSignIn', 'revokeSessions']);
  assert.equal(goodbyePath(outcome), '/goodbye');
  assert.equal(adminErasureMessage(outcome).ok, true);
});

test('when the auth server fails, the job stays incomplete and a retry finishes it without redoing the database', async () => {
  const w = world(someFiles(), { authFailures: 1 });
  const first = await runErasure(USER, { requestedBy: ADMIN, deps: w.deps });
  assert.deepEqual(first, { kind: 'incomplete', pending: ['signIn'], recorded: true });
  isNotSuccess(first);
  let job = w.job()!;
  assert.equal(job.authDoneAt, null);
  assert.equal(job.completedAt, null);
  assert.ok(job.databaseDoneAt, 'the database step is recorded as done');
  assert.ok(job.storageDoneAt, 'the files step still ran and is recorded');
  assert.match(job.lastError ?? '', /^Sign-in: auth server unavailable/);

  const second = await runErasure(USER, { deps: w.deps });
  assert.deepEqual(second, { kind: 'complete' });
  job = w.job()!;
  assert.ok(job.authDoneAt && job.completedAt);
  assert.equal(job.attempts, 2);
  assert.equal(job.lastError, null);
  assert.equal(job.requestedBy, ADMIN, 'who asked is kept from the first run');
  assert.equal(w.calls.filter((c) => c === 'eraseDatabase').length, 1, 'the database step is not repeated');
  assert.equal(
    w.calls.filter((c) => c.startsWith('remove')).length,
    2,
    'the finished files step is not repeated either',
  );
});

test('a storage listing error never ends in a success', async () => {
  const w = world(someFiles(), { failList: true });
  const outcome = await runErasure(USER, { requestedBy: USER, deps: w.deps });
  assert.deepEqual(outcome, { kind: 'incomplete', pending: ['files'], recorded: true });
  isNotSuccess(outcome);
  const job = w.job()!;
  assert.equal(job.storageDoneAt, null);
  assert.equal(job.completedAt, null);
  assert.match(job.lastError ?? '', /^Files: storage list failed/);
  assert.equal(w.files.get('avatars')!.size, 2, 'nothing was taken as gone');

  w.set({ failList: false });
  assert.deepEqual(await runErasure(USER, { deps: w.deps }), { kind: 'complete' });
  assert.equal(w.files.get('matter-recordings')!.size, 0);
});

test('a storage deletion error never ends in a success', async () => {
  const w = world(someFiles(), { failRemove: true });
  const outcome = await runErasure(USER, { deps: w.deps });
  assert.equal(outcome.kind, 'incomplete');
  isNotSuccess(outcome);
  assert.match(w.job()!.lastError ?? '', /storage remove failed/);
  assert.equal(w.job()!.completedAt, null);
});

test('fewer files removed than were listed is a failure', async () => {
  const w = world(someFiles(), { removeShort: true });
  const outcome = await runErasure(USER, { deps: w.deps });
  assert.deepEqual(outcome, { kind: 'incomplete', pending: ['files'], recorded: true });
  isNotSuccess(outcome);
  assert.match(w.job()!.lastError ?? '', /only 0 of 1 files were removed|only \d+ of \d+ files were removed/);
});

test('storage saying it removed everything is checked by listing again', async () => {
  const w = world(someFiles(), { removeLies: true });
  const outcome = await runErasure(USER, { deps: w.deps });
  assert.equal(outcome.kind, 'incomplete');
  isNotSuccess(outcome);
  assert.match(w.job()!.lastError ?? '', /still there after deleting/);
});

test('listing reads every page, not just the first hundred', async () => {
  const many = Array.from({ length: 250 }, (_, i) => `${USER}/attempt-9/${String(i).padStart(3, '0')}.webm`);
  const w = world({ avatars: [], 'matter-recordings': many });
  const outcome = await runErasure(USER, { deps: w.deps });
  assert.deepEqual(outcome, { kind: 'complete' });
  assert.equal(w.files.get('matter-recordings')!.size, 0, 'all 250 are gone');
  const pages = w.calls.filter((c) => c.startsWith(`list matter-recordings ${USER}/attempt-9 `));
  // Three pages to delete (0, 100, 200), and three again to check nothing is left.
  assert.deepEqual(pages.slice(0, 3), [
    `list matter-recordings ${USER}/attempt-9 0`,
    `list matter-recordings ${USER}/attempt-9 100`,
    `list matter-recordings ${USER}/attempt-9 200`,
  ]);
  assert.equal(w.calls.filter((c) => c.startsWith('remove matter-recordings')).length, 3, 'in batches');
});

test('a folder of exactly one page asks for the next page and stops when it is empty', async () => {
  const exact = Array.from({ length: LIST_PAGE }, (_, i) => `${USER}/${String(i).padStart(3, '0')}.png`);
  const w = world({ avatars: exact });
  const found = await listStoredFiles(w.deps, 'avatars', USER);
  assert.equal(found.length, LIST_PAGE);
  assert.deepEqual(
    w.calls.filter((c) => c.startsWith('list')),
    [`list avatars ${USER} 0`, `list avatars ${USER} ${LIST_PAGE}`],
  );
});

test('a recording the database cleared outside their folder is found and removed', async () => {
  const stray = 'legacy/old-recording.webm';
  const w = world(
    { avatars: [], 'matter-recordings': [stray, 'legacy/someone-else.webm'] },
    { cleared: [stray] },
  );
  assert.deepEqual(await runErasure(USER, { deps: w.deps }), { kind: 'complete' });
  assert.deepEqual([...w.files.get('matter-recordings')!], ['legacy/someone-else.webm']);
  assert.deepEqual(w.job()!.pendingFiles, []);
});

test('when the database step fails nothing else happens and nothing is claimed', async () => {
  const w = world(someFiles(), { failDatabase: true });
  const outcome = await runErasure(USER, { deps: w.deps });
  assert.equal(outcome.kind, 'refused');
  assert.match((outcome as { error: string }).error, /Nothing was changed/);
  assert.equal(w.job(), null);
  assert.ok(!w.calls.includes('closeSignIn'));
  assert.ok(!w.calls.some((c) => c.startsWith('remove')));
});

test('a staff account, or one that does not exist, is refused before anything runs', async () => {
  const staff = world(someFiles(), { staff: true });
  assert.equal((await runErasure(USER, { deps: staff.deps })).kind, 'refused');
  assert.deepEqual(staff.calls, ['staffFlags']);
  const missing = world(someFiles(), { exists: false });
  assert.equal((await runErasure(USER, { deps: missing.deps })).kind, 'refused');
  assert.deepEqual(missing.calls, ['staffFlags']);
});

test('a finished deletion is left alone', async () => {
  const w = world(someFiles());
  await runErasure(USER, { deps: w.deps });
  const before = w.calls.length;
  assert.deepEqual(await runErasure(USER, { deps: w.deps }), { kind: 'complete' });
  assert.deepEqual(w.calls.slice(before), ['staffFlags']);
});

test('when the progress cannot be recorded, it is not reported as finished', async () => {
  const w = world(someFiles(), { failSave: true });
  const outcome = await runErasure(USER, { deps: w.deps });
  assert.deepEqual(outcome, { kind: 'incomplete', pending: [], recorded: false });
  assert.equal(adminErasureMessage(outcome).ok, false);
  assert.equal(w.job()!.completedAt, null);
});

test('the daily retry finishes what is unfinished', async () => {
  const w = world(someFiles(), { authFailures: 1 });
  await runErasure(USER, { deps: w.deps });
  assert.equal(w.job()!.completedAt, null);
  const summary = await retryIncompleteErasures({ deps: w.deps });
  assert.deepEqual(summary, { tried: 1, completed: 1, stillIncomplete: 0, triedIds: [USER] });
  assert.ok(w.job()!.completedAt);
  assert.deepEqual(await retryIncompleteErasures({ deps: w.deps }), {
    tried: 0,
    completed: 0,
    stillIncomplete: 0,
    triedIds: [],
  });
});

test('the unfinished page shows only steps that exist, and says deleted only when nothing is pending', () => {
  assert.deepEqual(parsePending('files,signIn,<script>'), ['signIn', 'files']);
  assert.deepEqual(parsePending(undefined), []);
  assert.match(goodbyeCopy([]).heading, /has been deleted/);
  for (const copy of [goodbyeCopy([]), goodbyeCopy(['files'])]) {
    const all = `${copy.heading} ${copy.body.join(' ')}`;
    assert.match(all, /may still identify you/);
    assert.doesNotMatch(all, /anonym|nothing to say it was you/i);
  }
});

test('the work-board retention period is pending legal approval, so the daily job removes nothing by it', async () => {
  const { WORK_BOARD_RETENTION_APPROVED } = await import('../src/lib/account/retention');
  assert.equal(WORK_BOARD_RETENTION_APPROVED, false, 'the owner has not approved the retention period');
  const { applyWorkBoardRetention } = await import('../src/lib/account/erasure');
  let called = false;
  const db = { rpc: async () => { called = true; return { data: 5, error: null }; } } as never;
  assert.equal(await applyWorkBoardRetention(db), 0);
  assert.equal(called, false, 'the retention function ran without approval');
  assert.equal(await applyWorkBoardRetention(db, true), 5, 'once approved it runs');
});
