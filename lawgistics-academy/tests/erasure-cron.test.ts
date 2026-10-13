import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import {
  MIN_CRON_SECRET,
  cronDecision,
  handleErasureCron,
  secretMatches,
  type CronWork,
  type OperationalRun,
} from '../src/lib/account/erasure-cron';
import {
  ALERT_TIMEOUT_MS,
  DEFAULT_RETRY_LIMIT,
  type AlertPayload,
  type OutstandingJob,
  type RunStatus,
} from '../src/lib/account/erasure-monitoring';

/**
 * The daily job that finishes deletions and applies the retention period
 * (0045). It can reach every unfinished deletion with the service role, so
 * the one thing that matters is that nobody but Vercel's scheduler can start
 * it: off without CRON_SECRET, refused without the right bearer token, and
 * nothing run before the check passes.
 *
 * Since 0049 it also has to be honest: 200 only when no deletion is left
 * unfinished, judged from what the database says afterwards, every run
 * recorded, and an alert carrying counts only.
 */

const ROOT = path.join(import.meta.dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const SECRET = 'a-long-enough-cron-secret-value';
const NOW = new Date('2026-10-13T03:17:00Z');
const HOUR = 3_600_000;
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * HOUR).toISOString();

/** Ids that look like real ones, so a test can look for them in what goes out. */
const IDS = [
  '0f8fad5b-d9cb-469f-a165-70867728950e',
  '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  '9b2d1c7e-3f4a-4b8e-a1d2-5e6f7a8b9c0d',
  'c56a4180-65aa-42ec-a945-5fd21dec0538',
];

interface PretendSettings {
  jobs: OutstandingJob[];
  /** Ids that finish when tried. */
  finishes: string[];
  /** How many the retry gets through before the deadline stops it. */
  deadlineAfter: number | null;
  previous: RunStatus | null;
  failRetry: boolean;
  failRetention: boolean;
  failOutstanding: boolean;
  failPrevious: boolean;
  failRecord: boolean;
}

/** A pretend nightly run over a list of unfinished deletions, the list being the database. */
function pretend(settings: Partial<PretendSettings> = {}) {
  const s: PretendSettings = {
    jobs: [],
    finishes: [],
    deadlineAfter: null,
    previous: null,
    failRetry: false,
    failRetention: false,
    failOutstanding: false,
    failPrevious: false,
    failRecord: false,
    ...settings,
  };
  let jobs = s.jobs.map((j) => ({ ...j }));
  const ran: string[] = [];
  const records: OperationalRun[] = [];
  const limits: number[] = [];
  const work: CronWork = {
    async retry(limit) {
      ran.push('retry');
      limits.push(limit);
      if (s.failRetry) throw new Error('database down');
      const triedIds: string[] = [];
      let completed = 0;
      for (const job of jobs.slice(0, limit)) {
        if (s.deadlineAfter !== null && triedIds.length >= s.deadlineAfter) break;
        triedIds.push(job.userId);
        job.attempts += 1;
        if (s.finishes.includes(job.userId)) completed += 1;
      }
      jobs = jobs.filter((j) => !(triedIds.includes(j.userId) && s.finishes.includes(j.userId)));
      return { triedIds, completed };
    },
    async retention() {
      ran.push('retention');
      if (s.failRetention) throw new Error('retention down');
      return 3;
    },
    async outstanding() {
      ran.push('outstanding');
      if (s.failOutstanding) throw new Error('cannot read');
      return jobs.map((j) => ({ ...j }));
    },
    async previousStatus() {
      ran.push('previous');
      if (s.failPrevious) throw new Error('cannot read runs');
      return s.previous;
    },
    async recordRun(run) {
      ran.push('record');
      if (s.failRecord) throw new Error('insert refused');
      records.push(run);
    },
  };
  return { ran, work, records, limits };
}

/** A webhook that records what it was sent. */
function hook(
  answer: (url: string, init: RequestInit) => Promise<Response> = async () => new Response('ok'),
) {
  const posts: Array<{ url: string; body: AlertPayload; init: RequestInit }> = [];
  const fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    posts.push({ url: String(url), body: JSON.parse(String(init?.body)), init: init ?? {} });
    return answer(String(url), init ?? {});
  }) as typeof globalThis.fetch;
  return { posts, fetch };
}

const WEBHOOK = 'https://hooks.slack.test/services/T000/B000/secret-token-xyz';
const ENV = { ALERT_WEBHOOK_URL: WEBHOOK, NEXT_PUBLIC_SITE_URL: 'https://academy.test/' };

const call = (headers: Record<string, string> = { authorization: `Bearer ${SECRET}` }) =>
  new Request('https://academy.test/api/cron/erasure-retry', { headers });

async function run(
  world: ReturnType<typeof pretend>,
  options: {
    env?: Record<string, string | undefined>;
    fetch?: typeof globalThis.fetch;
    alertTimeoutMs?: number;
  } = {},
) {
  const res = await handleErasureCron(call(), SECRET, world.work, {
    env: options.env ?? ENV,
    fetch: options.fetch ?? hook().fetch,
    now: () => NOW,
    alertTimeoutMs: options.alertTimeoutMs,
    siteName: 'Test Academy',
  });
  const body = await res.json();
  return { res, body };
}

const job = (i: number, attempts = 0, waitedHours = 1): OutstandingJob => ({
  userId: IDS[i],
  requestedAt: hoursAgo(waitedHours),
  attempts,
});

test('without CRON_SECRET the route is off and runs nothing', async () => {
  for (const secret of [undefined, '', 'short']) {
    const w = pretend({ jobs: [job(0)] });
    const res = await handleErasureCron(call({ authorization: `Bearer ${secret ?? ''}` }), secret, w.work);
    assert.equal(res.status, 404);
    assert.deepEqual(w.ran, []);
  }
  assert.equal(
    cronDecision(`Bearer ${'x'.repeat(MIN_CRON_SECRET - 1)}`, 'x'.repeat(MIN_CRON_SECRET - 1)),
    'off',
  );
});

test('a missing, wrong or non-bearer token is refused, runs nothing, records nothing and alerts nobody', async () => {
  for (const headers of [
    {} as Record<string, string>,
    { authorization: 'Bearer ' },
    { authorization: 'Bearer wrong-secret-of-some-length' },
    { authorization: `Basic ${SECRET}` },
    { authorization: SECRET },
    { authorization: `Bearer ${SECRET}x` },
  ]) {
    const w = pretend({ jobs: [job(0)] });
    const h = hook();
    const res = await handleErasureCron(call(headers), SECRET, w.work, { env: ENV, fetch: h.fetch });
    assert.equal(res.status, 401, JSON.stringify(headers));
    assert.deepEqual(w.ran, []);
    assert.equal(h.posts.length, 0);
  }
});

test('everything finished: 200, ok, recorded, and no alert', async () => {
  const w = pretend({ jobs: [job(0), job(1)], finishes: [IDS[0], IDS[1]] });
  const h = hook();
  const { res, body } = await run(w, { fetch: h.fetch });
  assert.equal(res.status, 200);
  assert.equal(body.status, 'ok');
  assert.deepEqual(body.deletions, {
    outstanding: 0,
    tried: 2,
    completed: 2,
    stillFailing: 0,
    notAttempted: 0,
    repeatedlyFailing: 0,
    oldestOutstandingHours: null,
  });
  assert.equal(body.retentionRedacted, 3);
  assert.deepEqual(w.ran, ['retry', 'retention', 'outstanding', 'previous', 'record']);
  assert.equal(h.posts.length, 0);
  assert.equal(w.records.length, 1);
  assert.equal(w.records[0].status, 'ok');
  assert.equal(w.records[0].job, 'erasure-retry');
  assert.equal(w.records[0].alertSent, false);
  assert.equal(w.records[0].alertError, null);
  assert.equal(w.records[0].startedAt, NOW.toISOString());
});

test('nothing to do at all is ok too', async () => {
  const w = pretend();
  const { res, body } = await run(w);
  assert.equal(res.status, 200);
  assert.equal(body.status, 'ok');
});

test('a deletion still failing after it was tried is a warning, and the run is not 200', async () => {
  const w = pretend({ jobs: [job(0), job(1)], finishes: [IDS[0]] });
  const h = hook();
  const { res, body } = await run(w, { fetch: h.fetch });
  assert.equal(res.status, 503);
  assert.equal(body.status, 'warning');
  assert.equal(body.deletions.outstanding, 1);
  assert.equal(body.deletions.stillFailing, 1);
  assert.equal(body.deletions.notAttempted, 0);
  assert.equal(h.posts.length, 1);
  assert.equal(h.posts[0].url, WEBHOOK);
  assert.equal(h.posts[0].body.level, 'warning');
  assert.match(h.posts[0].body.text, /1 account deletion is not finished/);
  assert.match(h.posts[0].body.text, /https:\/\/academy\.test\/admin\/deletions/);
  assert.equal(w.records[0].status, 'warning');
  assert.equal(w.records[0].alertSent, true);
});

test('deletions the batch limit left untried escalate, and ERASURE_RETRY_LIMIT sets the limit', async () => {
  const w = pretend({ jobs: [job(0), job(1), job(2)], finishes: [IDS[0]] });
  const h = hook();
  const { res, body } = await run(w, { env: { ...ENV, ERASURE_RETRY_LIMIT: '1' }, fetch: h.fetch });
  assert.deepEqual(w.limits, [1]);
  assert.equal(res.status, 503);
  assert.equal(body.status, 'escalate');
  assert.equal(body.deletions.tried, 1);
  assert.equal(body.deletions.completed, 1);
  assert.equal(body.deletions.outstanding, 2);
  assert.equal(body.deletions.notAttempted, 2);
  assert.equal(h.posts[0].body.level, 'escalate');
  assert.match(h.posts[0].body.text, /2 were not attempted/);
  assert.equal(w.records[0].notAttempted, 2);
});

test('deletions the deadline left untried escalate', async () => {
  const w = pretend({ jobs: [job(0), job(1), job(2)], deadlineAfter: 1 });
  const { res, body } = await run(w);
  assert.equal(res.status, 503);
  assert.equal(body.status, 'escalate');
  assert.equal(body.deletions.tried, 1);
  assert.equal(body.deletions.stillFailing, 1);
  assert.equal(body.deletions.notAttempted, 2);
});

test('the default limit is twenty-five', async () => {
  const w = pretend();
  await run(w, { env: { ...ENV, ERASURE_RETRY_LIMIT: 'lots' } });
  assert.deepEqual(w.limits, [DEFAULT_RETRY_LIMIT]);
  assert.equal(DEFAULT_RETRY_LIMIT, 25);
});

test('a deletion tried three times escalates, even when tried tonight', async () => {
  const w = pretend({ jobs: [job(0, 2)] });
  const { res, body } = await run(w);
  assert.equal(res.status, 503);
  assert.equal(body.status, 'escalate');
  assert.equal(body.deletions.repeatedlyFailing, 1);
  assert.equal(body.deletions.notAttempted, 0);
});

test('a deletion waiting more than seventy-two hours escalates, however few tries', async () => {
  const w = pretend({ jobs: [job(0, 0, 80)] });
  const h = hook();
  const { res, body } = await run(w, { fetch: h.fetch });
  assert.equal(res.status, 503);
  assert.equal(body.status, 'escalate');
  assert.equal(body.deletions.repeatedlyFailing, 1);
  assert.equal(body.deletions.oldestOutstandingHours, 80);
  assert.match(h.posts[0].body.text, /waiting 3 days/);
});

test('the first ok run after one that was not sends one resolved message; the next ok run sends none', async () => {
  const first = pretend({ jobs: [job(0)], finishes: [IDS[0]], previous: 'escalate' });
  const h = hook();
  const { res } = await run(first, { fetch: h.fetch });
  assert.equal(res.status, 200);
  assert.equal(h.posts.length, 1);
  assert.equal(h.posts[0].body.level, 'resolved');
  assert.match(h.posts[0].body.text, /every account deletion is finished again/);
  assert.equal(first.records[0].alertSent, true);

  const second = pretend({ previous: 'ok' });
  const h2 = hook();
  await run(second, { fetch: h2.fetch });
  assert.equal(h2.posts.length, 0);

  const afterWarning = pretend({ previous: 'warning' });
  const h3 = hook();
  await run(afterWarning, { fetch: h3.fetch });
  assert.equal(h3.posts.length, 1);
  assert.equal(h3.posts[0].body.level, 'resolved');
});

test('the alert and the answer carry counts only: no id, name, email or the webhook address', async () => {
  const w = pretend({ jobs: [job(0, 5, 100), job(1), job(2)], deadlineAfter: 2 });
  const h = hook();
  const { body } = await run(w, { fetch: h.fetch });
  assert.equal(h.posts.length, 1);
  const sent = JSON.stringify(h.posts.map((p) => p.body));
  const answered = JSON.stringify(body);
  const recorded = JSON.stringify(w.records);
  for (const id of IDS) {
    assert.ok(!sent.includes(id.slice(0, 8)), 'an id, or part of one, went to the webhook');
    assert.ok(!answered.includes(id.slice(0, 8)), 'an id is in the answer');
    assert.ok(!recorded.includes(id.slice(0, 8)), 'an id is in the record');
  }
  assert.ok(!sent.includes('@') && !answered.includes('@'));
  assert.ok(!answered.includes('secret-token-xyz') && !recorded.includes('secret-token-xyz'));
  assert.deepEqual(Object.keys(h.posts[0].body).sort(), ['counts', 'level', 'text']);
  assert.deepEqual(Object.keys(h.posts[0].body.counts ?? {}).sort(), [
    'completed',
    'notAttempted',
    'oldestOutstandingHours',
    'outstanding',
    'repeatedlyFailing',
    'stillFailing',
    'tried',
  ]);
  for (const value of Object.values(h.posts[0].body.counts ?? {})) {
    assert.ok(value === null || typeof value === 'number');
  }
  assert.equal(h.posts[0].init.method, 'POST');
  assert.ok(h.posts[0].init.signal, 'the webhook is given a time limit');
});

test('a webhook that fails is recorded, never thrown, and the run still answers', async () => {
  const cases: Array<[() => Promise<Response>, RegExp]> = [
    [async () => new Response('nope', { status: 500 }), /answered 500/],
    [
      async () => {
        throw new TypeError('fetch failed');
      },
      /could not be reached/,
    ],
  ];
  for (const [answer, expected] of cases) {
    const w = pretend({ jobs: [job(0)] });
    const h = hook(answer);
    const { res, body } = await run(w, { fetch: h.fetch });
    assert.equal(res.status, 503);
    assert.equal(body.alert.sent, false);
    assert.match(body.alert.error, expected);
    assert.equal(w.records[0].alertSent, false);
    assert.match(w.records[0].alertError ?? '', expected);
  }
});

test('a webhook that does not answer is given up on', async () => {
  const w = pretend({ jobs: [job(0)] });
  const h = hook(
    (_url, init) =>
      new Promise((_resolve, reject) => {
        // The time limit's own timer does not keep a process alive; a server
        // is alive anyway, a test needs this.
        const alive = setTimeout(() => {}, 10_000);
        init.signal?.addEventListener('abort', () => {
          clearTimeout(alive);
          reject(init.signal?.reason);
        });
      }),
  );
  const { res, body } = await run(w, { fetch: h.fetch, alertTimeoutMs: 20 });
  assert.equal(res.status, 503);
  assert.equal(body.alert.sent, false);
  assert.match(body.alert.error, /did not answer in time/);
  assert.equal(ALERT_TIMEOUT_MS, 5000);
});

test('a webhook address that is not https is refused and never called', async () => {
  for (const url of [
    'http://hooks.slack.test/x',
    'javascript:alert(1)',
    'ftp://x.test/y',
    'not a url',
    'https://user:pw@x.test/',
  ]) {
    const w = pretend({ jobs: [job(0)] });
    const h = hook();
    const { res, body } = await run(w, { env: { ...ENV, ALERT_WEBHOOK_URL: url }, fetch: h.fetch });
    assert.equal(res.status, 503);
    assert.equal(h.posts.length, 0, url);
    assert.equal(body.alert.sent, false);
    assert.ok(w.records[0].alertError, url);
  }
  const w = pretend({ jobs: [job(0)] });
  const { body } = await run(w, { env: { ...ENV, ALERT_WEBHOOK_URL: 'http://hooks.slack.test/x' } });
  assert.match(body.alert.error, /not an https address/);
  assert.ok(!JSON.stringify(body).includes('hooks.slack.test'));
});

test('without a webhook the run still answers 503 and records that no alert went', async () => {
  const w = pretend({ jobs: [job(0)] });
  const { res, body } = await run(w, { env: { NEXT_PUBLIC_SITE_URL: 'https://academy.test' } });
  assert.equal(res.status, 503);
  assert.equal(body.alert.sent, false);
  assert.match(w.records[0].alertError ?? '', /No ALERT_WEBHOOK_URL/);
});

test('when the unfinished deletions cannot be read the run escalates', async () => {
  const w = pretend({ jobs: [job(0)], failOutstanding: true });
  const h = hook();
  const { res, body } = await run(w, { fetch: h.fetch });
  assert.equal(res.status, 503);
  assert.equal(body.status, 'escalate');
  assert.match(body.deletions.error, /could not be read/);
  assert.equal(h.posts[0].body.level, 'escalate');
  assert.equal(h.posts[0].body.counts, null);
  assert.equal(w.records[0].outstanding, null);
});

test('one half failing does not stop the other, and the run reports failure', async () => {
  const w = pretend({ jobs: [job(0)], failRetry: true });
  const { res, body } = await run(w);
  assert.equal(res.status, 503);
  assert.equal(body.status, 'escalate');
  assert.equal(body.retryFailed, true);
  assert.equal(body.deletions.notAttempted, 1);
  assert.ok(w.ran.includes('retention'));

  const nothingLeft = pretend({ failRetry: true });
  assert.equal((await run(nothingLeft)).res.status, 500);

  const retention = pretend({ failRetention: true });
  const r = await run(retention);
  assert.equal(r.res.status, 500);
  assert.equal(r.body.status, 'ok');
  assert.ok(retention.ran.includes('record'));
});

test('a run that cannot be recorded is not reported as fine', async () => {
  const w = pretend({ failRecord: true });
  const { res, body } = await run(w);
  assert.equal(res.status, 500);
  assert.equal(body.recorded, false);
  const failing = pretend({ jobs: [job(0)], failRecord: true });
  assert.equal((await run(failing)).res.status, 503);
});

test('when the last run cannot be read no resolved message is sent, and the run goes on', async () => {
  const w = pretend({ failPrevious: true });
  const h = hook();
  const { res } = await run(w, { fetch: h.fetch });
  assert.equal(res.status, 200);
  assert.equal(h.posts.length, 0);
  assert.equal(w.records.length, 1);
});

test('the secret is compared in constant time, and lengths first', () => {
  assert.ok(secretMatches(SECRET, SECRET));
  assert.ok(!secretMatches(`${SECRET}!`, SECRET));
  assert.ok(!secretMatches('', SECRET));
  const code = strip(read('src/lib/account/erasure-cron.ts'));
  assert.match(code, /timingSafeEqual\(a, b\)/);
  assert.match(code, /if \(a\.length !== b\.length\) return false;/);
  assert.doesNotMatch(code, /presented === expected|expected === presented/);
});

test('the route hands every request to the checked handler, and nothing else', () => {
  const route = strip(read('src/app/api/cron/erasure-retry/route.ts'));
  assert.match(
    route,
    /export async function GET\(request: Request\) \{\s*return handleErasureCron\(request, process\.env\.CRON_SECRET, \{/,
  );
  for (const verb of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    assert.ok(!route.includes(`export async function ${verb}`), `the route exports ${verb}`);
  }
  // The work is only ever reached through the handler's object, after the check.
  assert.equal(route.match(/retryIncompleteErasures\(/g)?.length, 1);
  assert.equal(route.match(/applyWorkBoardRetention\(/g)?.length, 1);
  assert.ok(route.indexOf('handleErasureCron(') < route.indexOf('retryIncompleteErasures('));
  // The limit comes from the handler (ERASURE_RETRY_LIMIT), the record and
  // the alert settings from the real store and the environment.
  assert.match(route, /retry: \(limit\) => retryIncompleteErasures\(\{ limit, deadline:/);
  assert.match(route, /\.\.\.erasureRunStore\(\)/);
  assert.match(route, /\{ env: process\.env \}/);
});

test('Vercel calls it daily, the middleware lets it through, and the settings are documented', () => {
  const vercel = JSON.parse(read('vercel.json')) as {
    crons?: Array<{ path: string; schedule: string }>;
    regions?: string[];
  };
  const cron = vercel.crons?.find((c) => c.path === '/api/cron/erasure-retry');
  assert.ok(cron, 'vercel.json schedules the route');
  // Once a day is what Vercel Hobby allows: a fixed minute and hour, every day.
  assert.match(cron.schedule, /^\d{1,2} \d{1,2} \* \* \*$/);
  const middleware = strip(read('src/middleware.ts'));
  assert.match(middleware, /const PUBLIC_PATHS = \[[^\]]*'\/api\/cron\/erasure-retry'/);
  const example = read('.env.example');
  assert.match(example, /^# CRON_SECRET=$/m);
  assert.match(example, /^# ALERT_WEBHOOK_URL=$/m);
  assert.match(example, /^# ERASURE_RETRY_LIMIT=$/m);
  assert.doesNotMatch(example, /NEXT_PUBLIC_CRON|NEXT_PUBLIC_ALERT/);
});
