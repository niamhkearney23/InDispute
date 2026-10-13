/**
 * The fail-secure switch (SITE_ACCESS) on the real website against real
 * Supabase: the same build run three times, open (IT_APP_URL, from app.sh),
 * staff-closed and closed (started here on their own ports).
 *
 * The strongest check replays a real staff action. An administrator who has
 * typed the code switches the firm's leaderboard on through Admin on the open
 * site; that exact request (same session, same action) is then sent to the
 * staff-closed site, at a learner page's address, where it must change
 * nothing. Sent to the open site again it does change the setting, which
 * proves the replay is a working request.
 */
import './target-guard';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { IT, PASSWORD, TARGET, browserOptions, person, service, totp, type Person } from './helpers';

const OPEN = process.env.IT_APP_URL ?? 'http://127.0.0.1:3124';
const STAFF_CLOSED = 'http://127.0.0.1:3126';
const CLOSED = 'http://127.0.0.1:3127';
const CRON_SECRET = 'it-cron-secret-not-a-real-one-0123456789';
const APP_DIR = path.join(__dirname, '..');

let browser: Browser;
const servers: ChildProcess[] = [];

async function startApp(port: number, siteAccess: string) {
  const child = spawn('npx', ['next', 'start', '-p', String(port)], {
    cwd: APP_DIR,
    env: {
      ...process.env,
      NEXT_DIST_DIR: '.next-it',
      NEXT_PUBLIC_SUPABASE_URL: IT.SUPABASE_IT_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: IT.SUPABASE_IT_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: IT.SUPABASE_IT_SERVICE_KEY,
      CRON_SECRET,
      AI_PROVIDER: 'none',
      SITE_ACCESS: siteAccess,
    },
    stdio: 'ignore',
  });
  servers.push(child);
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(`http://127.0.0.1:${port}/icon`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`the ${siteAccess} copy did not start`);
}

before(async () => {
  browser = await chromium.launch(browserOptions());
  await Promise.all([startApp(3126, 'staff-closed'), startApp(3127, 'closed')]);
});
after(async () => {
  await browser?.close();
  for (const s of servers) s.kill('SIGTERM');
});

async function signIn(context: BrowserContext, base: string, p: Person): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`${base}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', p.email);
  await page.fill('#password', PASSWORD);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 }), page.click('button[type=submit]')]);
  return page;
}

/** An administrator with an authenticator app, signed in on the open site with the code typed. */
async function adminWithCode(context: BrowserContext): Promise<Person> {
  const admin = await person('admin');
  const { data: factor, error } = await admin.client.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'phone' });
  if (error) throw error;
  const first = await admin.client.auth.mfa.challengeAndVerify({ factorId: factor.id, code: totp(factor.totp.secret) });
  if (first.error) throw first.error;
  const page = await signIn(context, OPEN, admin);
  await page.goto(`${OPEN}/admin/firm`, { waitUntil: 'networkidle' });
  if (new URL(page.url()).pathname === '/two-step') {
    if (Date.now() % 30000 > 26000) await page.waitForTimeout(30000 - (Date.now() % 30000) + 500);
    await page.fill('input[name=code]', totp(factor.totp.secret, Date.now() + 30000));
    await Promise.all([page.waitForURL((u) => u.pathname.startsWith('/admin'), { timeout: 20000 }), page.click('button[type=submit]')]);
  }
  assert.match(new URL(page.url()).pathname, /^\/admin/);
  await page.close();
  (admin as Person & { factorSecret: string }).factorSecret = factor.totp.secret;
  return admin;
}

async function leaderboardOn(): Promise<boolean> {
  const { data } = await service().from('firm_settings').select('leaderboard_enabled').limit(1).single();
  return Boolean(data?.leaderboard_enabled);
}
async function setLeaderboard(on: boolean) {
  const { error } = await service().from('firm_settings').update({ leaderboard_enabled: on }).neq('leaderboard_enabled', on);
  if (error) throw error;
}

test('staff-closed: a real staff action, replayed at a learner address, changes nothing', async () => {
  const context = await browser.newContext();
  await adminWithCode(context);
  await setLeaderboard(false);

  // Capture the real request the open site sends when the box is ticked.
  const page = await context.newPage();
  await page.goto(`${OPEN}/admin/firm`, { waitUntil: 'networkidle' });
  await page.check('input[name=enabled]');
  const [request] = await Promise.all([
    page.waitForRequest((r) => r.method() === 'POST' && Boolean(r.headers()['next-action'])),
    page.click('form:has(input[name=enabled]) button[type=submit]'),
  ]);
  await page.waitForTimeout(1500);
  assert.equal(await leaderboardOn(), true, 'the action did not work on the open site');
  const headers = { ...request.headers() };
  const body = request.postDataBuffer() ?? Buffer.alloc(0);
  delete headers['content-length'];

  // The same request, the same session cookies, to the staff-closed copy,
  // at its own address and at a learner page's.
  for (const where of ['/admin/firm', '/dashboard']) {
    await setLeaderboard(false);
    const res = await context.request.post(`${STAFF_CLOSED}${where}`, { headers, data: body });
    assert.equal(await leaderboardOn(), false, `the staff action ran on the staff-closed site at ${where} (HTTP ${res.status()})`);
  }

  // The control: replayed to the open site at a learner address, it works.
  await setLeaderboard(false);
  await context.request.post(`${OPEN}/dashboard`, { headers, data: body });
  assert.equal(await leaderboardOn(), true, 'the replayed request is not a working request, so the check above proves nothing');
  await setLeaderboard(false);
  await context.close();
});

test('staff-closed: Admin shows the maintenance page; learners carry on', async () => {
  const anonAdmin = await fetch(`${STAFF_CLOSED}/admin/review`, { redirect: 'manual' });
  assert.equal(anonAdmin.status, 503);
  assert.match(await anonAdmin.text(), /maintenance/i);
  const exportRoute = await fetch(`${STAFF_CLOSED}/admin/reports/export/active`, { redirect: 'manual' });
  assert.equal(exportRoute.status, 503);

  const learner = await person('learner', 'MY');
  const now = new Date().toISOString();
  await service().from('profiles').update({ onboarded_at: now, diagnostic_completed_at: now }).eq('id', learner.id);
  const context = await browser.newContext();
  const page = await signIn(context, STAFF_CLOSED, learner);
  const res = await page.goto(`${STAFF_CLOSED}/dashboard`, { waitUntil: 'networkidle' });
  assert.equal(res?.status(), 200);
  assert.equal(new URL(page.url()).pathname, '/dashboard');
  await context.close();
});

test('closed: nothing opens and nobody signs in, but deletions keep finishing', async () => {
  for (const where of ['/', '/login', '/dashboard', '/admin', '/auth/callback']) {
    const res = await fetch(`${CLOSED}${where}`, { redirect: 'manual' });
    assert.equal(res.status, 503, `${where} answered ${res.status} while closed`);
  }
  const signIn = await fetch(`${CLOSED}/login`, { method: 'POST', headers: { 'next-action': 'x' }, redirect: 'manual' });
  assert.equal(signIn.status, 503);

  const cron = await fetch(`${CLOSED}/api/cron/erasure-retry`, { headers: { Authorization: `Bearer ${CRON_SECRET}` } });
  assert.ok([200, 503].includes(cron.status), `the nightly job answered ${cron.status}`);
  const json = (await cron.json()) as { status?: string };
  assert.ok(json.status, 'the nightly job did not run while closed');
  const smuggled = await fetch(`${CLOSED}/api/cron/erasure-retry`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CRON_SECRET}`, 'next-action': 'x' },
  });
  assert.equal(smuggled.status, 503, 'a server action got through on the nightly job address');
});

test('the route back: open again, and staff still need the code', async () => {
  const coach = await person('coach');
  const { data: factor, error } = await coach.client.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'phone' });
  if (error) throw error;
  await coach.client.auth.mfa.challengeAndVerify({ factorId: factor.id, code: totp(factor.totp.secret) });
  const context = await browser.newContext();
  const page = await signIn(context, OPEN, coach);
  await page.goto(`${OPEN}/admin/work`, { waitUntil: 'networkidle' });
  assert.equal(new URL(page.url()).pathname, '/two-step', 'a password alone opened Admin on the open site');
  await context.close();
  void TARGET;
});
