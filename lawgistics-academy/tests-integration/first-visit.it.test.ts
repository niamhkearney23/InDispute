/**
 * The first visit against real Supabase and the real website (the owner,
 * November 2026): "Hi, what should we call you", the cartoon and a few
 * choices, then the diagnostic with nothing else open until it is done,
 * and never again after it.
 *
 * Whether a country has published questions depends on what earlier tests
 * left in the database, so each test asks and checks the side it is on:
 * held when there are questions, never held when there are none.
 */
import './target-guard';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, type Browser, type Page } from 'playwright';
import { PASSWORD, browserOptions, person, service, type Person } from './helpers';

const APP = process.env.IT_APP_URL ?? 'http://127.0.0.1:3124';

let browser: Browser;
before(async () => {
  browser = await chromium.launch(browserOptions());
});
after(async () => browser?.close());

async function questionsOpen(country: 'AU' | 'MY'): Promise<boolean> {
  const { count, error } = await service()
    .from('v_question_delivery')
    .select('question_id', { count: 'exact', head: true })
    .eq('country', country);
  if (error) throw error;
  return (count ?? 0) > 0;
}

async function signedIn(p: Person): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto(`${APP}/login`, { waitUntil: 'load' });
  await page.fill('#email', p.email);
  await page.fill('#password', PASSWORD);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 }),
    page.click('button[type=submit]'),
  ]);
  await page.waitForLoadState('load');
  return page;
}

const path = (page: Page) => new URL(page.url()).pathname;
const FIRST_TEST = 'First, a test to see where you are.';

/**
 * Where a page ends up. The pages under the app's layout stream behind its
 * loading placeholder, so a page's redirect reaches the browser as an
 * instruction after the page has loaded, not as a 307: wait for the
 * address to settle before reading it.
 */
async function open(page: Page, asked: string, expected: string): Promise<string> {
  await page.goto(`${APP}${asked}`, { waitUntil: 'load' });
  await page.waitForURL((u) => u.pathname === expected, { timeout: 10000 }).catch(() => {});
  await page.waitForLoadState('networkidle').catch(() => {});
  // Expected to stay: give a late redirect the time it would take to arrive.
  if (asked === expected) {
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle').catch(() => {});
  }
  return path(page);
}

test('somebody set up but not diagnosed sees only the test, and every other page sends them back', async () => {
  const country = (await questionsOpen('MY')) ? 'MY' : 'AU';
  const held = await questionsOpen(country);
  const p = await person('learner', country);
  const now = new Date().toISOString();
  const { error } = await service().from('profiles').update({ onboarded_at: now }).eq('id', p.id);
  if (error) throw error;

  const page = await signedIn(p);
  assert.equal(await open(page, '/dashboard', '/dashboard'), '/dashboard');
  const today = await page.content();
  if (held) {
    assert.match(today, new RegExp(FIRST_TEST));
    assert.doesNotMatch(today, /Your next task/, 'Today showed more than the test');
    for (const asked of ['/modules', '/skills', '/work', '/courts', '/programme']) {
      assert.equal(await open(page, asked, '/dashboard'), '/dashboard', `${asked} opened during the diagnostic`);
    }
    // Their account stays open: to sign out, change a password or leave.
    assert.equal(await open(page, '/account', '/account'), '/account');
  } else {
    // Without questions the diagnostic cannot be taken, so nobody is held.
    assert.doesNotMatch(today, new RegExp(FIRST_TEST));
    assert.equal(await open(page, '/modules', '/modules'), '/modules');
  }

  // Once it is done, the hold is gone for good.
  const done = await service().from('profiles').update({ diagnostic_completed_at: now }).eq('id', p.id);
  if (done.error) throw done.error;
  assert.equal(await open(page, '/modules', '/modules'), '/modules');
  assert.equal(await open(page, '/dashboard', '/dashboard'), '/dashboard');
  assert.doesNotMatch(await page.content(), new RegExp(FIRST_TEST), 'the test was asked for again');
  await page.context().close();
});

test('the first steps save the name and cartoon, keep the programme, and go to the diagnostic', async () => {
  const held = await questionsOpen('MY');
  const p = await person('learner', 'MY');
  const page = await signedIn(p);
  assert.equal(await open(page, '/dashboard', '/onboarding'), '/onboarding', 'somebody new was not sent to their first steps');
  assert.equal(await open(page, '/modules', '/onboarding'), '/onboarding', 'Learn opened before the first steps');

  await page.fill('#first-name', 'Mei Ling');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Surprise me' }).click();
  await page.getByRole('button', { name: 'Keep this' }).click();
  await page.getByRole('button', { name: /Law student/ }).click();
  await page.getByRole('button', { name: /15 min/ }).click();
  await page.getByRole('button', { name: /Peninsular Malaysia/ }).click();
  // Somebody tampering with the form cannot move themselves onto a programme.
  await page.evaluate(() => {
    const track = document.querySelector<HTMLInputElement>('input[name=track]');
    if (track) track.value = 'litigation_trainee';
  });
  await Promise.all([
    page.waitForURL((u) => u.pathname !== '/onboarding', { timeout: 20000 }),
    page.getByRole('button', { name: held ? 'Start the test' : 'Go to Today' }).click(),
  ]);
  await page.waitForLoadState('networkidle').catch(() => {});
  assert.equal(path(page), held ? '/diagnostic' : '/dashboard');
  if (held) assert.match(await page.content(), new RegExp(FIRST_TEST));

  const { data, error } = await service()
    .from('profiles')
    .select('display_name, track, daily_goal_minutes, home_jurisdiction, avatar_style, onboarded_at')
    .eq('id', p.id)
    .single();
  if (error) throw error;
  assert.equal(data.display_name, 'Mei Ling');
  assert.equal(data.track, 'general', 'the form moved somebody onto the trainee programme');
  assert.equal(data.daily_goal_minutes, 15);
  assert.equal(data.home_jurisdiction, 'MY_MALAYA');
  assert.ok(data.onboarded_at);
  assert.ok(data.avatar_style && typeof data.avatar_style === 'object', 'the cartoon was not saved');
  await page.context().close();
});
