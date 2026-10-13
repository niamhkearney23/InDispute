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
} from '../src/lib/account/erasure-cron';

/**
 * The daily job that finishes deletions and applies the retention period
 * (0045). It can reach every unfinished deletion with the service role, so
 * the one thing that matters is that nobody but Vercel's scheduler can start
 * it: off without CRON_SECRET, refused without the right bearer token, and
 * nothing run before the check passes.
 */

const ROOT = path.join(import.meta.dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const SECRET = 'a-long-enough-cron-secret-value';

function pretend() {
  const ran: string[] = [];
  const work: CronWork = {
    async retry() {
      ran.push('retry');
      return { tried: 1, completed: 1, stillIncomplete: 0 };
    },
    async retention() {
      ran.push('retention');
      return 3;
    },
  };
  return { ran, work };
}

const call = (headers: Record<string, string> = {}) =>
  new Request('https://academy.test/api/cron/erasure-retry', { headers });

test('without CRON_SECRET the route is off and runs nothing', async () => {
  for (const secret of [undefined, '', 'short']) {
    const { ran, work } = pretend();
    const res = await handleErasureCron(call({ authorization: `Bearer ${secret ?? ''}` }), secret, work);
    assert.equal(res.status, 404);
    assert.deepEqual(ran, []);
  }
  assert.equal(cronDecision(`Bearer ${'x'.repeat(MIN_CRON_SECRET - 1)}`, 'x'.repeat(MIN_CRON_SECRET - 1)), 'off');
});

test('a missing, wrong or non-bearer token is refused and runs nothing', async () => {
  for (const headers of [
    {} as Record<string, string>,
    { authorization: 'Bearer ' },
    { authorization: 'Bearer wrong-secret-of-some-length' },
    { authorization: `Basic ${SECRET}` },
    { authorization: SECRET },
    { authorization: `Bearer ${SECRET}x` },
  ]) {
    const { ran, work } = pretend();
    const res = await handleErasureCron(call(headers), SECRET, work);
    assert.equal(res.status, 401, JSON.stringify(headers));
    assert.deepEqual(ran, []);
  }
});

test('the right token runs both halves', async () => {
  const { ran, work } = pretend();
  const res = await handleErasureCron(call({ authorization: `Bearer ${SECRET}` }), SECRET, work);
  assert.equal(res.status, 200);
  assert.deepEqual(ran, ['retry', 'retention']);
  assert.deepEqual(await res.json(), {
    deletions: { tried: 1, completed: 1, stillIncomplete: 0 },
    retentionRedacted: 3,
  });
});

test('one half failing does not stop the other, and the run reports failure', async () => {
  const ran: string[] = [];
  const res = await handleErasureCron(call({ authorization: `Bearer ${SECRET}` }), SECRET, {
    async retry() {
      throw new Error('database down');
    },
    async retention() {
      ran.push('retention');
      return 0;
    },
  });
  assert.equal(res.status, 500);
  assert.deepEqual(ran, ['retention']);
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
});

test('Vercel calls it daily, the middleware lets it through, and the secret is documented', () => {
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
  assert.doesNotMatch(example, /NEXT_PUBLIC_CRON/);
});
