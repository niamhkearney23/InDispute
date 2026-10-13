/**
 * The nightly deletion check, the alert and the way back, against real
 * Supabase. Three deletions are left unfinished because Storage fails; the
 * nightly run, held to one deletion a night, must say so with 503, count the
 * ones it never reached, record the run, send an escalation alert with no
 * personal data, and show administrators a notice. Once Storage is back, the
 * next run finishes them all, answers 200, sends one "resolved" message and
 * the notice goes.
 *
 * The alert's network call goes to a stand-in that records what it was sent
 * (no real Slack or Teams); everything else is the real thing.
 */
import './target-guard';
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { applyWorkBoardRetention, retryIncompleteErasures, runErasure, serviceErasureDeps } from '../src/lib/account/erasure';
import { handleErasureCron, type CronWork } from '../src/lib/account/erasure-cron';
import { erasureRunStore, readAdminErasureNotices } from '../src/lib/account/erasure-monitor-store';
import { outage, person, service, service_container, TARGET, waitUntilUp, type Person } from './helpers';

const SECRET = 'it-cron-secret-not-a-real-one-0123456789';
const APP = process.env.IT_APP_URL ?? 'http://127.0.0.1:3124';
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

after(async () => {
  if (TARGET !== 'local') return;
  service_container('storage', 'start');
  await waitUntilUp('storage');
});

function work(): CronWork {
  const db = service();
  return {
    retry: (limit) => retryIncompleteErasures({ deps: serviceErasureDeps(db), limit }),
    retention: () => applyWorkBoardRetention(db),
    ...erasureRunStore(db),
  };
}

const sent: Array<{ url: string; body: string }> = [];
const alertFetch = (async (url: string | URL | Request, init?: RequestInit) => {
  sent.push({ url: String(url), body: String(init?.body ?? '') });
  return new Response('ok', { status: 200 });
}) as typeof fetch;

async function nightly(limit: string) {
  const res = await handleErasureCron(
    new Request('http://127.0.0.1/api/cron/erasure-retry', { headers: { authorization: `Bearer ${SECRET}` } }),
    SECRET,
    work(),
    {
      env: { ERASURE_RETRY_LIMIT: limit, ALERT_WEBHOOK_URL: 'https://alerts.example.test/hook', NEXT_PUBLIC_SITE_URL: APP },
      fetch: alertFetch,
    },
  );
  return {
    status: res.status,
    body: (await res.json()) as {
      status: string;
      deletions: { outstanding: number; notAttempted: number };
      alert: { sent: boolean };
    },
  };
}

test('unfinished deletions escalate, including the ones the batch limit left out, and recover', async () => {
  const db = service();
  const people: Person[] = [];
  for (let i = 0; i < 3; i++) {
    const p = await person('learner', 'MY');
    const { error } = await db.storage.from('avatars').upload(`${p.id}/photo.png`, PNG, { contentType: 'image/png', upsert: true });
    if (error) throw error;
    people.push(p);
  }

  // Storage fails part way through all three.
  const down = outage('storage', serviceErasureDeps(db));
  for (const p of people) {
    const outcome = await runErasure(p.id, { requestedBy: p.id, deps: down.deps });
    assert.equal(outcome.kind, 'incomplete');
  }

  // The night's run, one deletion allowed, Storage still down on the local
  // stack (on staging the one it tries may finish; the other two are still
  // never reached).
  const night = await nightly('1');
  assert.equal(night.status, 503, 'the nightly run answered OK with deletions unfinished');
  assert.equal(night.body.status, 'escalate');
  assert.ok(night.body.deletions.outstanding >= 2, JSON.stringify(night.body.deletions));
  assert.ok(night.body.deletions.notAttempted >= 2, 'the deletions the limit left out were not counted');
  assert.equal(night.body.alert.sent, true);

  const alert = sent.at(-1)!;
  const payload = JSON.parse(alert.body) as { level: string; text: string };
  assert.equal(payload.level, 'escalate');
  assert.match(payload.text, /admin\/deletions/);
  for (const p of people) {
    assert.ok(!alert.body.includes(p.id), 'the alert named a person by id');
    assert.ok(!alert.body.includes(p.email), 'the alert carried an email address');
  }

  const { data: runs } = await db.from('operational_runs').select('status, not_attempted, alert_sent').order('started_at', { ascending: false }).limit(1);
  assert.equal(runs?.[0]?.status, 'escalate');
  assert.equal(runs?.[0]?.alert_sent, true);

  const notices = await readAdminErasureNotices({ db, cronSecret: SECRET });
  assert.ok(notices.some((n) => n.level === 'escalate'), 'administrators are not told');

  // The real route on the website says the same over HTTP while Storage is
  // still down (local stack only: on staging the route's own retry, with
  // Storage working, would simply finish them).
  if (TARGET === 'local') {
    const route = await fetch(`${APP}/api/cron/erasure-retry`, { headers: { Authorization: `Bearer ${SECRET}` } });
    assert.equal(route.status, 503, 'the deployed route answered OK with deletions unfinished');
  }

  // Recovery: Storage back, the next night finishes everything.
  await down.end();
  const recovered = await nightly('25');
  assert.equal(recovered.status, 200, JSON.stringify(recovered.body));
  assert.equal(recovered.body.status, 'ok');
  assert.equal(recovered.body.deletions.outstanding, 0);
  assert.equal(JSON.parse(sent.at(-1)!.body).level, 'resolved', 'no all-clear was sent');
  for (const p of people) {
    const { data: job } = await db.from('account_erasures').select('completed_at').eq('user_id', p.id).single();
    assert.ok(job?.completed_at);
    const { data: files } = await db.storage.from('avatars').list(p.id);
    assert.deepEqual(files ?? [], []);
  }
  const after = await readAdminErasureNotices({ db, cronSecret: SECRET });
  assert.deepEqual(after.filter((n) => n.level !== 'unknown'), [], 'the notice stayed after recovery');
});

test('an administrator is told when the nightly check is not set up', async () => {
  const notices = await readAdminErasureNotices({ db: service(), cronSecret: '' });
  assert.ok(notices.length > 0, 'no notice without CRON_SECRET');
  assert.match(notices.map((n) => `${n.title} ${n.details.join(' ')}`).join(' '), /nightly/i);
});
