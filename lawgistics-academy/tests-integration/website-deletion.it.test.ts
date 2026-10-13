/**
 * Deleting an account through the website, in a real browser, against real
 * Supabase, and the nightly retry the way Vercel calls it. Needs the app from
 * `tools/integration/app.sh up` at IT_APP_URL.
 */
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, type Browser, type Page } from 'playwright';
import { PASSWORD, anon, person, service, service_container, waitUntilUp, type Person } from './helpers';

const APP = process.env.IT_APP_URL ?? 'http://127.0.0.1:3124';
const CRON_SECRET = 'it-cron-secret-not-a-real-one-0123456789';
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
let browser: Browser;

before(async () => {
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  });
});
after(async () => {
  await browser?.close();
  service_container('storage', 'start');
  await waitUntilUp('storage');
});

async function signedIn(p: Person): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', p.email);
  await page.fill('#password', PASSWORD);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 }),
    page.click('button[type=submit]'),
  ]);
  return page;
}

async function deleteThroughThePage(page: Page, email: string) {
  await page.goto(`${APP}/account`, { waitUntil: 'networkidle' });
  await page.click('summary:has-text("Delete my account")');
  await page.fill('input[name=confirmWord]', 'DELETE');
  await page.fill('input[name=confirmEmail]', email);
  await Promise.all([
    page.waitForURL((u) => u.pathname.startsWith('/goodbye'), { timeout: 30000 }),
    page.click('button:has-text("Delete my account for good")'),
  ]);
}

test('deleting your own account on the website: told it is done, and locked out', async () => {
  const learner = await person('learner', 'MY');
  const page = await signedIn(learner);
  await deleteThroughThePage(page, learner.email);
  const text = await page.locator('main').innerText();
  assert.match(text, /Your account has been deleted/);
  assert.doesNotMatch(text, /anonymous|anonymised/i);

  // The same browser, with whatever it still holds, gets nowhere.
  await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' });
  assert.match(new URL(page.url()).pathname, /^\/login/);
  assert.ok((await anon().auth.signInWithPassword({ email: learner.email, password: PASSWORD })).error);
});

test('with Storage down, the website says what is unfinished, and the nightly retry finishes it', async () => {
  const learner = await person('learner', 'AU');
  const { error } = await service()
    .storage.from('avatars')
    .upload(`${learner.id}/photo.png`, PNG, { contentType: 'image/png', upsert: true });
  if (error) throw error;
  const page = await signedIn(learner);

  service_container('storage', 'stop');
  await deleteThroughThePage(page, learner.email);
  service_container('storage', 'start');
  await waitUntilUp('storage');

  const text = await page.locator('main').innerText();
  assert.doesNotMatch(text, /Your account has been deleted\./, 'told it was all done while a file was left');
  assert.match(text, /Signed out/i);
  assert.match(new URL(page.url()).search, /pending=files/);

  await page.goto(`${APP}/dashboard`, { waitUntil: 'networkidle' });
  assert.match(new URL(page.url()).pathname, /^\/login/, 'the half-deleted account still opened the dashboard');

  // The nightly call: refused without the secret, does the work with it.
  const refused = await fetch(`${APP}/api/cron/erasure-retry`);
  assert.ok(refused.status === 401 || refused.status === 403, `got ${refused.status} without the secret`);
  const wrong = await fetch(`${APP}/api/cron/erasure-retry`, { headers: { Authorization: 'Bearer nope' } });
  assert.ok(wrong.status === 401 || wrong.status === 403);
  const ran = await fetch(`${APP}/api/cron/erasure-retry`, { headers: { Authorization: `Bearer ${CRON_SECRET}` } });
  assert.equal(ran.status, 200);

  const { data: job } = await service().from('account_erasures').select('completed_at').eq('user_id', learner.id).single();
  assert.ok(job?.completed_at, 'the nightly retry did not finish the deletion');
  const { data: files } = await service().storage.from('avatars').list(learner.id);
  assert.deepEqual(files ?? [], []);
});
