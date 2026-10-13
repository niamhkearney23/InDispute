import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  CRON_STALE_HOURS,
  REPEAT_FAILURE_ATTEMPTS,
  REPEAT_FAILURE_HOURS,
  adminErasureNotices,
  alertLevelFor,
  alertPayload,
  assessErasureRun,
  cronIsStale,
  deletionsUrlFrom,
  failedRepeatedly,
  retryLimitFrom,
  statusFor,
  waitedFor,
  webhookTarget,
  type AdminErasureInput,
  type LastRun,
  type OutstandingJob,
} from '../src/lib/account/erasure-monitoring';
import { retryIncompleteErasures, type ErasureDeps } from '../src/lib/account/erasure';
import { readAdminErasureNotices } from '../src/lib/account/erasure-monitor-store';

/**
 * How worried to be about unfinished deletions (0049): the level of a
 * nightly run, the alert's words, and the notice on every admin page. All
 * pure, so every level and every way of getting it is checked here.
 */

const ROOT = path.join(import.meta.dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const NOW = new Date('2026-10-13T03:17:00Z');
const HOUR = 3_600_000;
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * HOUR).toISOString();
const job = (id: string, attempts = 1, waitedHours = 2): OutstandingJob => ({
  userId: id,
  requestedAt: hoursAgo(waitedHours),
  attempts,
});

test('the thresholds live in one place and are the agreed numbers', () => {
  assert.equal(REPEAT_FAILURE_ATTEMPTS, 3);
  assert.equal(REPEAT_FAILURE_HOURS, 72);
  assert.equal(CRON_STALE_HOURS, 36);
  for (const file of [
    'src/lib/account/erasure-cron.ts',
    'src/lib/account/erasure-monitor-store.ts',
    'src/components/erasure-alert.tsx',
    'src/app/admin/deletions/nightly-runs.tsx',
  ]) {
    const code = read(file);
    assert.doesNotMatch(code, /\b(72|36)\b/, `${file} repeats a threshold`);
  }
});

test('nothing unfinished is ok', () => {
  const a = assessErasureRun([], { triedIds: ['a', 'b'], completed: 2 }, NOW);
  assert.equal(a.status, 'ok');
  assert.deepEqual(a.counts, {
    outstanding: 0,
    tried: 2,
    completed: 2,
    stillFailing: 0,
    notAttempted: 0,
    repeatedlyFailing: 0,
    oldestOutstandingHours: null,
  });
});

test('unfinished but every one tried tonight and none repeatedly is a warning', () => {
  const a = assessErasureRun([job('a', 1), job('b', 2)], { triedIds: ['a', 'b', 'c'], completed: 1 }, NOW);
  assert.equal(a.status, 'warning');
  assert.equal(a.counts.stillFailing, 2);
  assert.equal(a.counts.notAttempted, 0);
  assert.equal(a.counts.oldestOutstandingHours, 2);
});

test('the batch limit leaving some untried escalates: not attempted is what is unfinished and was not tried', () => {
  const outstanding = ['a', 'b', 'c', 'd'].map((id) => job(id, 1));
  const a = assessErasureRun(outstanding, { triedIds: ['a'], completed: 0 }, NOW);
  assert.equal(a.status, 'escalate');
  assert.equal(a.counts.tried, 1);
  assert.equal(a.counts.stillFailing, 1);
  assert.equal(a.counts.notAttempted, 3);
});

test('the deadline leaving some untried escalates, using the real retry', async () => {
  const ids = ['a', 'b', 'c'];
  const deps = {
    incompleteJobs: async (limit: number) => ids.slice(0, limit),
  } as unknown as ErasureDeps;
  // The deadline has passed before the first: nothing is tried.
  const report = await retryIncompleteErasures({ deps, limit: 25, deadline: Date.now() - 1 });
  assert.deepEqual(report, { tried: 0, completed: 0, stillIncomplete: 0, triedIds: [] });
  const a = assessErasureRun(ids.map((id) => job(id, 1)), report, NOW);
  assert.equal(a.status, 'escalate');
  assert.equal(a.counts.notAttempted, 3);
});

test('a job created after the retry read its list counts as not attempted, never as done', () => {
  const a = assessErasureRun([job('late', 0, 0)], { triedIds: [], completed: 0 }, NOW);
  assert.equal(a.status, 'escalate');
  assert.equal(a.counts.notAttempted, 1);
});

test('when the retry itself failed everything unfinished counts as not attempted', () => {
  const a = assessErasureRun([job('a'), job('b')], null, NOW);
  assert.equal(a.status, 'escalate');
  assert.equal(a.counts.tried, 0);
  assert.equal(a.counts.notAttempted, 2);
});

test('failing repeatedly: three attempts, or more than seventy-two hours waiting', () => {
  assert.equal(failedRepeatedly(job('a', 2, 71), NOW), false);
  assert.equal(failedRepeatedly(job('a', 3, 1), NOW), true);
  assert.equal(failedRepeatedly(job('a', 0, 72), NOW), false);
  assert.equal(failedRepeatedly(job('a', 0, 72.1), NOW), true);
  const byAttempts = assessErasureRun([job('a', 3)], { triedIds: ['a'], completed: 0 }, NOW);
  assert.equal(byAttempts.status, 'escalate');
  assert.equal(byAttempts.counts.repeatedlyFailing, 1);
  const byAge = assessErasureRun([job('a', 1, 100)], { triedIds: ['a'], completed: 0 }, NOW);
  assert.equal(byAge.status, 'escalate');
  assert.equal(byAge.counts.repeatedlyFailing, 1);
  assert.equal(byAge.counts.oldestOutstandingHours, 100);
});

test('the levels in one table', () => {
  assert.equal(statusFor({ outstanding: 0, notAttempted: 0, repeatedlyFailing: 0 }), 'ok');
  assert.equal(statusFor({ outstanding: 2, notAttempted: 0, repeatedlyFailing: 0 }), 'warning');
  assert.equal(statusFor({ outstanding: 2, notAttempted: 1, repeatedlyFailing: 0 }), 'escalate');
  assert.equal(statusFor({ outstanding: 2, notAttempted: 0, repeatedlyFailing: 1 }), 'escalate');
});

test('alerts: every run that is not ok, and one resolved message after', () => {
  assert.equal(alertLevelFor('warning', null), 'warning');
  assert.equal(alertLevelFor('escalate', 'escalate'), 'escalate');
  assert.equal(alertLevelFor('warning', 'ok'), 'warning');
  assert.equal(alertLevelFor('ok', 'escalate'), 'resolved');
  assert.equal(alertLevelFor('ok', 'warning'), 'resolved');
  assert.equal(alertLevelFor('ok', 'ok'), null);
  assert.equal(alertLevelFor('ok', null), null);
});

test('the alert names nobody and links to Admin, Deletions', () => {
  const counts = assessErasureRun(
    [job('0f8fad5b-d9cb-469f-a165-70867728950e', 4, 120)],
    { triedIds: [], completed: 0 },
    NOW,
  ).counts;
  const p = alertPayload('escalate', counts, { name: 'Academy', deletionsUrl: 'https://a.test/admin/deletions' });
  assert.equal(p.level, 'escalate');
  assert.ok(!JSON.stringify(p).includes('0f8fad5b'));
  assert.match(p.text, /1 account deletion is not finished/);
  assert.match(p.text, /1 has failed repeatedly/);
  assert.match(p.text, /1 was not attempted/);
  assert.match(p.text, /waiting 5 days/);
  assert.match(p.text, /section 7a/);
  assert.match(p.text, /https:\/\/a\.test\/admin\/deletions/);
  const resolved = alertPayload('resolved', assessErasureRun([], null, NOW).counts, { name: 'Academy', deletionsUrl: null });
  assert.match(resolved.text, /finished again/);
  assert.match(resolved.text, /Admin, Deletions$/);
});

test('the site address and webhook address are checked', () => {
  assert.equal(deletionsUrlFrom('https://academy.test///'), 'https://academy.test/admin/deletions');
  assert.equal(deletionsUrlFrom(undefined), null);
  assert.equal(deletionsUrlFrom('academy.test'), null);
  assert.deepEqual(webhookTarget('https://hooks.slack.com/services/x'), { url: 'https://hooks.slack.com/services/x' });
  assert.equal(webhookTarget(''), null);
  assert.equal(webhookTarget(undefined), null);
  for (const bad of ['http://hooks.slack.com/x', 'file:///etc/passwd', 'data:text/plain,hi', 'nonsense', 'https://u:p@x.test']) {
    const t = webhookTarget(bad);
    assert.ok(t && 'refused' in t, bad);
    assert.ok(!('refused' in t && t.refused.includes(bad)), 'the refusal repeats the address');
  }
});

test('ERASURE_RETRY_LIMIT is a whole number from 1 to 100, anything else twenty-five', () => {
  assert.equal(retryLimitFrom('1'), 1);
  assert.equal(retryLimitFrom('100'), 100);
  assert.equal(retryLimitFrom(' 7 '), 7);
  for (const bad of [undefined, '', '0', '101', '-1', '2.5', '1e2', 'ten', '0x10', '999']) {
    assert.equal(retryLimitFrom(bad), 25, String(bad));
  }
});

test('ages read in whole days', () => {
  assert.equal(waitedFor(5), 'less than a day');
  assert.equal(waitedFor(24), '1 day');
  assert.equal(waitedFor(80), '3 days');
});

/* -------------------------------------------------------------------------- */
/* The notice on every admin page                                              */
/* -------------------------------------------------------------------------- */

const recent: LastRun = { startedAt: hoursAgo(10), status: 'warning', notAttempted: 0 };
const input = (patch: Partial<AdminErasureInput> = {}): AdminErasureInput => ({
  outstanding: [],
  lastRun: { ...recent, status: 'ok' },
  runsReadFailed: false,
  cronConfigured: true,
  now: NOW,
  ...patch,
});

test('all well: no notice', () => {
  assert.deepEqual(adminErasureNotices(input()), []);
});

test('a warning says how many are not finished, and nothing more', () => {
  const notices = adminErasureNotices(input({ outstanding: [job('a'), job('b')], lastRun: recent }));
  assert.equal(notices.length, 1);
  assert.equal(notices[0].level, 'warning');
  assert.equal(notices[0].title, '2 deletions are not finished.');
  assert.deepEqual(notices[0].details, []);
  assert.ok(notices[0].linkToDeletions);
  assert.equal(adminErasureNotices(input({ outstanding: [job('a')], lastRun: recent }))[0].title, '1 deletion is not finished.');
});

test('escalated by repeated failure: says how many and how long the oldest has waited', () => {
  const [n] = adminErasureNotices(input({ outstanding: [job('a', 3, 30), job('b', 1, 100)], lastRun: recent }));
  assert.equal(n.level, 'escalate');
  assert.equal(n.title, '2 deletions are not finished.');
  assert.deepEqual(n.details, ['2 have failed repeatedly.', 'The oldest has been waiting 4 days.']);
  assert.match(n.action, /section 7a/);
});

test('escalated by what last night did not reach', () => {
  const [n] = adminErasureNotices(
    input({ outstanding: [job('a'), job('b'), job('c')], lastRun: { ...recent, status: 'escalate', notAttempted: 2 } }),
  );
  assert.equal(n.level, 'escalate');
  assert.deepEqual(n.details, ['2 were not attempted last night.', 'The oldest has been waiting less than a day.']);
});

test('a nightly check that has not run for thirty-six hours is said, even with nothing unfinished', () => {
  const stale = adminErasureNotices(input({ lastRun: { ...recent, status: 'ok', startedAt: hoursAgo(37) } }));
  assert.equal(stale.length, 1);
  assert.equal(stale[0].title, 'The nightly deletion check is not running.');
  assert.equal(stale[0].level, 'escalate');
  assert.match(stale[0].details[0], /last ran 1 day ago/);
  assert.match(stale[0].action, /Cron Jobs/);
  assert.deepEqual(adminErasureNotices(input({ lastRun: { ...recent, status: 'ok', startedAt: hoursAgo(35) } })), []);
  const never = adminErasureNotices(input({ lastRun: null }));
  assert.equal(never[0].title, 'The nightly deletion check is not running.');
  assert.match(never[0].details[0], /no record of it ever running/);
  assert.equal(cronIsStale(null, NOW), true);
  assert.equal(cronIsStale({ ...recent, startedAt: 'not a date' }, NOW), true);
});

test('a stale check and unfinished deletions are both said', () => {
  const notices = adminErasureNotices(input({ outstanding: [job('a')], lastRun: { ...recent, startedAt: hoursAgo(50) } }));
  assert.deepEqual(
    notices.map((n) => n.title),
    ['The nightly deletion check is not running.', '1 deletion is not finished.'],
  );
});

test('without CRON_SECRET the check is not running, and the notice says what to set', () => {
  const notices = adminErasureNotices(input({ cronConfigured: false }));
  assert.equal(notices.length, 1);
  assert.equal(notices[0].title, 'The nightly deletion check is not running.');
  assert.match(notices[0].details[0], /CRON_SECRET is not set/);
  assert.match(notices[0].action, /Set CRON_SECRET in Vercel/);
});

test('what could not be read is said, never left out', () => {
  const runs = adminErasureNotices(input({ runsReadFailed: true, lastRun: null }));
  assert.equal(runs.length, 1);
  assert.equal(runs[0].level, 'unknown');
  assert.match(runs[0].title, /could not be read/);
  const jobs = adminErasureNotices(input({ outstanding: null }));
  assert.equal(jobs.length, 1);
  assert.match(jobs[0].title, /could not be read/);
  const both = adminErasureNotices(input({ outstanding: null, runsReadFailed: true, lastRun: null }));
  assert.equal(both.length, 2);
});

test('the reader turns a database that cannot be read into notices, and never throws', async () => {
  const broken = {
    from() {
      throw new Error('database down');
    },
  } as unknown as SupabaseClient;
  const notices = await readAdminErasureNotices({ db: broken, cronSecret: 'a-long-enough-cron-secret', now: NOW });
  assert.equal(notices.length, 2);
  for (const n of notices) assert.match(n.title, /could not be read/);

  const unconfigured = await readAdminErasureNotices({ db: broken, cronSecret: undefined, now: NOW });
  assert.equal(unconfigured[0].title, 'The nightly deletion check is not running.');
});

test('only administrators are shown the notice, on every admin page, and it fails safe', () => {
  const layout = read('src/app/admin/layout.tsx');
  assert.match(layout, /\{isAdmin \? <ErasureAlert \/> : null\}/);
  assert.equal(layout.match(/<ErasureAlert/g)?.length, 1);
  const component = read('src/components/erasure-alert.tsx');
  assert.match(component, /catch \(error\)/);
  assert.match(component, /notices = \[UNREADABLE\]/);
  assert.match(component, /readAdminErasureNotices\(\{ cronSecret: process\.env\.CRON_SECRET \}\)/);
  const page = read('src/app/admin/deletions/page.tsx');
  assert.match(page, /listNightlyRuns\(\)/);
  assert.match(page, /<NightlyRuns /);
});

test('the run record holds counts only, and the migration keeps it for the server', () => {
  const sql = read('supabase/migrations/0049_erasure_monitoring.sql');
  const table = sql.slice(sql.indexOf('create table if not exists public.operational_runs'), sql.indexOf(');', sql.indexOf('create table if not exists public.operational_runs')));
  assert.doesNotMatch(table, /user_id|email|name\b|display/);
  assert.match(sql, /revoke all on public\.operational_runs from public, anon, authenticated, service_role;/);
  assert.match(sql, /grant select, insert on public\.operational_runs to service_role;/);
  assert.match(sql, /before update or delete on public\.operational_runs/);
  assert.match(sql, /before truncate on public\.operational_runs/);
  assert.match(sql, /perform public\.refuse_erased_callers\(\)/);
});

test('the escalation steps and the settings are written down', () => {
  const doc = read('docs/SECURITY-SETUP.md');
  const section = doc.slice(doc.indexOf('## 7a.'), doc.indexOf('## 8.'));
  for (const words of [/ALERT_WEBHOOK_URL/, /Slack/, /Teams/, /warning/i, /escalate/i, /72 hours/, /Supabase status/i, /Retry/]) {
    assert.match(section, words);
  }
  assert.doesNotMatch(read('.env.example'), /^ALERT_WEBHOOK_URL=\S/m);
});
