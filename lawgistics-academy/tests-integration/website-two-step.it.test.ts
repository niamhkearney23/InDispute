/**
 * Staff two-step sign-in through the website itself, in a real browser,
 * against real Supabase Auth. Needs the app built and started against the
 * integration stack (`tools/integration/app.sh`), at IT_APP_URL.
 */
import './target-guard';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, type Browser, type Page } from 'playwright';
import { PASSWORD, person, totp } from './helpers';
import { browserOptions } from './helpers';

const APP = process.env.IT_APP_URL ?? 'http://127.0.0.1:3124';
let browser: Browser;

before(async () => {
  browser = await chromium.launch(browserOptions());
});
after(async () => browser?.close());

async function signInPage(page: Page, email: string) {
  await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', email);
  await page.fill('#password', PASSWORD);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 }),
    page.click('button[type=submit]'),
  ]);
}

/** Types a fresh code, waiting out the last seconds of a 30-second window. */
async function typeCode(page: Page, secret: string) {
  if (Date.now() % 30000 > 26000) await page.waitForTimeout(30000 - (Date.now() % 30000) + 500);
  await page.fill('input[name=code]', totp(secret));
}

test('an administrator is made to set up the app, then to type the code at every sign-in', async () => {
  const admin = await person('admin');
  const context = await browser.newContext();
  const page = await context.newPage();

  await signInPage(page, admin.email);
  await page.goto(`${APP}/admin/review`, { waitUntil: 'networkidle' });
  assert.match(new URL(page.url()).pathname, /^\/account\/two-step/, 'staff reached Admin without an app set up');

  await page.click('text=Set up an authenticator app');
  const keyBox = page.locator('p.font-mono');
  await keyBox.waitFor({ timeout: 20000 });
  const secret = (await keyBox.innerText()).replace(/\s+/g, '');
  assert.match(secret, /^[A-Z2-7]{16,}$/);

  // A wrong code is turned away with the page still there.
  await page.fill('input[name=code]', '000000');
  await page.click('form:has(input[name=code]) button[type=submit]');
  await page.waitForTimeout(1500);
  assert.match(new URL(page.url()).pathname, /^\/account\/two-step/);

  await typeCode(page, secret);
  await Promise.all([
    page.waitForURL((u) => u.pathname.startsWith('/admin'), { timeout: 20000 }),
    page.click('form:has(input[name=code]) button[type=submit]'),
  ]);
  assert.match(new URL(page.url()).pathname, /^\/admin/);
  await context.close();

  // A new sign-in with the password alone stops at the code step.
  const second = await browser.newContext();
  const page2 = await second.newPage();
  await signInPage(page2, admin.email);
  await page2.goto(`${APP}/admin/review`, { waitUntil: 'networkidle' });
  assert.equal(new URL(page2.url()).pathname, '/two-step', 'a password alone opened Admin');

  await page2.fill('input[name=code]', '111111');
  await page2.click('button[type=submit]');
  await page2.waitForTimeout(1500);
  assert.equal(new URL(page2.url()).pathname, '/two-step');

  await typeCode(page2, secret);
  await Promise.all([
    page2.waitForURL((u) => u.pathname.startsWith('/admin'), { timeout: 20000 }),
    page2.click('button[type=submit]'),
  ]);
  assert.match(new URL(page2.url()).pathname, /^\/admin\/review/);
  await second.close();
});

test('a learner with no app is not asked for a code', async () => {
  const learner = await person('learner');
  const context = await browser.newContext();
  const page = await context.newPage();
  await signInPage(page, learner.email);
  await page.goto(`${APP}/account`, { waitUntil: 'networkidle' });
  assert.equal(new URL(page.url()).pathname, '/account');
  await page.goto(`${APP}/admin`, { waitUntil: 'networkidle' });
  assert.ok(!new URL(page.url()).pathname.startsWith('/admin'), 'a learner reached Admin');
  await context.close();
});
