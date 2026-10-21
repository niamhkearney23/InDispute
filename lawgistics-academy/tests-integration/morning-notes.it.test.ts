/**
 * Morning notes (0050) against real Supabase: Auth, PostgREST with each
 * person's own token, and the real website.
 *
 * Through the API: a coach writes only after typing the code and only in
 * their own name, only the author changes a note, nobody deletes one (not
 * even the service role), and each person reads only the notes meant for
 * them. Through the website: a coach writes a note at Admin, Morning notes
 * and a learner in that country sees it at the top of Today.
 */
import './target-guard';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { PASSWORD, anon, asToken, browserOptions, person, service, signIn, totp, type Person } from './helpers';

const APP = process.env.IT_APP_URL ?? 'http://127.0.0.1:3124';
const TODAY_KL = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date());

interface Coach {
  person: Person;
  secret: string;
  passwordOnly: string;
  withCode: string;
}

async function coachWithCode(): Promise<Coach> {
  const p = await person('coach', 'MY');
  const { data: factor, error } = await p.client.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'phone' });
  if (error) throw error;
  const verified = await p.client.auth.mfa.challengeAndVerify({ factorId: factor.id, code: totp(factor.totp.secret) });
  if (verified.error) throw verified.error;
  const fresh = await signIn(p.email, p.id);
  return { person: p, secret: factor.totp.secret, passwordOnly: fresh.accessToken, withCode: verified.data.access_token };
}

async function ready(p: Person, patch: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  const { error } = await service()
    .from('profiles')
    .update({ onboarded_at: now, diagnostic_completed_at: now, timezone: 'Asia/Kuala_Lumpur', ...patch })
    .eq('id', p.id);
  if (error) throw error;
}

let coach: Coach;
let otherCoach: Coach;
let myLearner: Person;
let auLearner: Person;
let trainee: Person;
const marker = `it-${Date.now()}`;
const ids: Record<string, string> = {};

before(async () => {
  coach = await coachWithCode();
  otherCoach = await coachWithCode();
  myLearner = await person('learner', 'MY');
  auLearner = await person('learner', 'AU');
  trainee = await person('learner', 'MY');
  await ready(myLearner);
  await ready(auLearner, { timezone: 'Australia/Sydney' });
  await ready(trainee, { track: 'litigation_trainee', trainee_approved_at: new Date().toISOString() });
});

test('a coach writes a note only after typing the code, and only in their own name', async () => {
  const withCode = asToken(coach.withCode);
  for (const [key, row] of [
    ['both', { body: `${marker} for both countries`, for_date: TODAY_KL, country: null, trainees_only: false }],
    ['my', { body: `${marker} for Malaysia`, for_date: TODAY_KL, country: 'MY', trainees_only: false }],
    ['trainees', { body: `${marker} trainees only`, for_date: TODAY_KL, country: 'MY', trainees_only: true }],
  ] as const) {
    const { data, error } = await withCode.from('morning_notes').insert(row).select('id, author_id').single();
    assert.equal(error, null, `${key}: ${error?.message}`);
    assert.equal(data!.author_id, coach.person.id);
    ids[key] = data!.id;
  }

  const passwordOnly = await asToken(coach.passwordOnly)
    .from('morning_notes')
    .insert({ body: `${marker} password only`, for_date: TODAY_KL });
  assert.ok(passwordOnly.error, 'a coach with a password alone wrote a note');

  const asOther = await withCode
    .from('morning_notes')
    .insert({ body: `${marker} not mine`, for_date: TODAY_KL, author_id: otherCoach.person.id });
  assert.ok(asOther.error, 'a coach wrote a note in another coach\'s name');

  const learnerWrite = await asToken(myLearner.accessToken)
    .from('morning_notes')
    .insert({ body: `${marker} learner`, for_date: TODAY_KL });
  assert.ok(learnerWrite.error, 'a learner wrote a note');
});

test('only the author changes a note, and nobody deletes one', async () => {
  const own = await asToken(coach.withCode)
    .from('morning_notes')
    .update({ body: `${marker} for both countries, corrected` })
    .eq('id', ids.both)
    .select('body');
  assert.equal(own.error, null, own.error?.message);
  assert.equal(own.data?.[0]?.body, `${marker} for both countries, corrected`);

  const other = await asToken(otherCoach.withCode)
    .from('morning_notes')
    .update({ body: `${marker} rewritten by a colleague` })
    .eq('id', ids.both);
  assert.ok(other.error, 'another coach changed the note');

  const learnerDelete = await asToken(myLearner.accessToken).from('morning_notes').delete().eq('id', ids.my).select('id');
  assert.equal(learnerDelete.data?.length ?? 0, 0, 'a learner deleted a note');
  const coachDelete = await asToken(coach.withCode).from('morning_notes').delete().eq('id', ids.my).select('id');
  assert.equal(coachDelete.data?.length ?? 0, 0, 'a coach deleted a note');
  const serverDelete = await service().from('morning_notes').delete().eq('id', ids.my);
  assert.ok(serverDelete.error, 'the service role deleted a note');

  const { data } = await service().from('morning_notes').select('id, body').in('id', [ids.both, ids.my]);
  assert.equal(data?.length, 2);
  assert.ok(data?.some((n) => n.body === `${marker} for both countries, corrected`));
});

test('each person reads only the notes meant for them', async () => {
  const read = async (token: string) => {
    const { data, error } = await asToken(token).from('morning_notes').select('body').like('body', `${marker}%`);
    if (error) throw error;
    return (data ?? []).map((n) => n.body).sort();
  };
  assert.deepEqual(await read(myLearner.accessToken), [
    `${marker} for Malaysia`,
    `${marker} for both countries, corrected`,
  ]);
  assert.deepEqual(await read(auLearner.accessToken), [`${marker} for both countries, corrected`]);
  assert.deepEqual(await read(trainee.accessToken), [
    `${marker} for Malaysia`,
    `${marker} for both countries, corrected`,
    `${marker} trainees only`,
  ]);
  const signedOut = await anon().from('morning_notes').select('body').like('body', `${marker}%`);
  assert.deepEqual(signedOut.data ?? [], [], 'somebody signed out read a note');
});

// -----------------------------------------------------------------------------
// The website
// -----------------------------------------------------------------------------

let browser: Browser;
before(async () => {
  browser = await chromium.launch(browserOptions());
});
after(async () => browser?.close());

async function signedIn(context: BrowserContext, p: Person): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`${APP}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#email', p.email);
  await page.fill('#password', PASSWORD);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 }),
    page.click('button[type=submit]'),
  ]);
  return page;
}

test('a coach writes a note on the website and a learner sees it at the top of Today', async () => {
  const writer = await coachWithCode();
  const context = await browser.newContext();
  const page = await signedIn(context, writer.person);
  await page.goto(`${APP}/admin/notes`, { waitUntil: 'domcontentloaded' });
  if (new URL(page.url()).pathname === '/two-step') {
    if (Date.now() % 30000 > 26000) await page.waitForTimeout(30000 - (Date.now() % 30000) + 500);
    await page.fill('input[name=code]', totp(writer.secret));
    await Promise.all([
      page.waitForURL((u) => u.pathname.startsWith('/admin'), { timeout: 20000 }),
      page.click('button[type=submit]'),
    ]);
    await page.goto(`${APP}/admin/notes`, { waitUntil: 'domcontentloaded' });
  }
  assert.equal(new URL(page.url()).pathname, '/admin/notes');

  const words = `${marker} website: round 2 before nine, then the chronology.`;
  await page.fill('#body', words);
  await page.fill('#forDate', TODAY_KL);
  await page.selectOption('#country', 'MY');
  await page.click('form button[type=submit]');
  await page.getByText('Saved. It shows at the top of Today').waitFor({ timeout: 15000 });
  await context.close();

  const { data: saved } = await service().from('morning_notes').select('author_id').eq('body', words).single();
  assert.equal(saved?.author_id, writer.person.id, 'the note was not saved in the coach\'s name');

  const learner = await person('learner', 'MY');
  await ready(learner);
  const lc = await browser.newContext();
  const today = await signedIn(lc, learner);
  await today.goto(`${APP}/dashboard`, { waitUntil: 'domcontentloaded' });
  const note = today.getByRole('region', { name: 'A note from your coach' });
  await note.waitFor({ timeout: 15000 });
  const text = await note.innerText();
  // Several coaches may have written for today; the latest is shown, and it is this one.
  assert.match(text, /website: round 2 before nine/);
  assert.match(await today.getByRole('heading', { name: 'Set for today' }).innerText(), /Set for today/i);
  await lc.close();

  const au = await person('learner', 'AU');
  await ready(au, { timezone: 'Asia/Kuala_Lumpur' });
  const ac = await browser.newContext();
  const auToday = await signedIn(ac, au);
  await auToday.goto(`${APP}/dashboard`, { waitUntil: 'domcontentloaded' });
  assert.doesNotMatch(await auToday.content(), /website: round 2 before nine/, 'a Malaysian note reached an Australian learner');
  await ac.close();
});
