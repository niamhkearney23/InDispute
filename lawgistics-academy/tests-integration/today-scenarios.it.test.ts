/**
 * "Set for today" against real Supabase and the real website, one scenario
 * at a time: what a learner's Today page actually lists after the state is
 * set up through the database the way the app's own server would write it.
 *
 * Written after the independent review found that an intern lost every way
 * to their homework outside a working day, and that work sent back could be
 * pushed off the list. Weekends and public holidays cannot be forced on a
 * real clock; those cases are covered in tests/today-list.test.ts against
 * the same function the page uses (homeworkLines).
 */
import './target-guard';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, type Browser, type Page } from 'playwright';
import { PASSWORD, asToken, browserOptions, person, service, signIn, totp, type Person } from './helpers';

const APP = process.env.IT_APP_URL ?? 'http://127.0.0.1:3124';
const KL = 'Asia/Kuala_Lumpur';
const dayInKl = (offsetDays: number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: KL }).format(new Date(Date.now() + offsetDays * 86400000));

let browser: Browser;
before(async () => {
  browser = await chromium.launch(browserOptions());
});
after(async () => browser?.close());

async function learner(country: 'AU' | 'MY', patch: Record<string, unknown> = {}): Promise<Person> {
  const p = await person('learner', country);
  const now = new Date().toISOString();
  const { error } = await service()
    .from('profiles')
    .update({ onboarded_at: now, diagnostic_completed_at: now, timezone: KL, ...patch })
    .eq('id', p.id);
  if (error) throw error;
  return p;
}

/** Signed in on the website, on Today. */
async function today(p: Person): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  // 'load', not 'domcontentloaded': a form pressed before the page's script
  // is running posts back to /login, which is the test racing the page.
  await page.goto(`${APP}/login`, { waitUntil: 'load' });
  await page.fill('#email', p.email);
  await page.fill('#password', PASSWORD);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 }),
    page.click('button[type=submit]'),
  ]);
  await page.goto(`${APP}/dashboard`, { waitUntil: 'domcontentloaded' });
  return page;
}

/** The text of the "Set for today" section, as shown. */
async function list(page: Page): Promise<string> {
  await page.reload({ waitUntil: 'domcontentloaded' });
  const section = page.getByRole('region', { name: 'Set for today' });
  await section.waitFor({ timeout: 15000 });
  return (await section.innerText()).replace(/\s+/g, ' ');
}

async function questionsOpen(country: 'AU' | 'MY'): Promise<boolean> {
  const { count, error } = await service()
    .from('v_question_delivery')
    .select('question_id', { count: 'exact', head: true })
    .eq('country', country);
  if (error) throw error;
  return (count ?? 0) > 0;
}

test('a new learner with nothing set is told so, never shown a blank space', async () => {
  const p = await learner('AU', { timezone: 'Australia/Sydney' });
  const page = await today(p);
  const text = await list(page);
  if (await questionsOpen('AU')) {
    assert.match(text, /Today's questions/);
  } else {
    assert.match(text, /Nothing is set for today yet/);
  }
  assert.doesNotMatch(text, /Homework|Catch up|Practice file|you can take/);
  await page.context().close();
});

test('missed homework days: a catch-up line that counts down as days are ticked, and the homework page opens', async () => {
  const p = await learner('MY', { starts_on: dayInKl(-14) });
  const page = await today(p);
  const first = await list(page);
  const missed = Number(/Catch up on homework (\d+) earlier days? (?:is|are) not ticked off/.exec(first)?.[1]);
  assert.ok(missed >= 5, `expected at least five missed days two weeks in, saw: ${first}`);
  const { error } = await service().from('homework_declarations').insert({ user_id: p.id, day: 1, task_slug: 'it-day-1' });
  if (error) throw error;
  const second = await list(page);
  assert.match(second, new RegExp(`Catch up on homework ${missed - 1} earlier days? (?:is|are) not ticked off`));
  const link = page.getByRole('region', { name: 'Set for today' }).getByRole('link', { name: /Catch up on homework/ });
  assert.equal(await link.getAttribute('href'), '/homework');
  const res = await page.goto(`${APP}/homework`, { waitUntil: 'domcontentloaded' });
  assert.equal(res?.status(), 200);
  assert.equal(new URL(page.url()).pathname, '/homework', 'an intern was sent away from their homework');
  await page.context().close();
});

test('before the start date and after the last day, the homework is still one tap away', async () => {
  const early = await learner('MY', { starts_on: dayInKl(10) });
  const ep = await today(early);
  assert.match(await list(ep), /Homework Begins .*twenty tasks, one each working day/);
  await ep.context().close();

  const late = await learner('MY', { starts_on: dayInKl(-60) });
  const lp = await today(late);
  const text = await list(lp);
  assert.match(text, /Homework You finished the four weeks: 0 of 20 recorded/);
  assert.match(text, /Catch up on homework 20 earlier days are not ticked off/);
  await lp.context().close();
});

test('work with no due date: taken, handed in, sent back, handed in again, replied to, marked Good', async () => {
  const coach = await person('coach', 'MY');
  const p = await learner('MY');
  const db = service();
  const title = `IT chronology ${Date.now()}`;
  const post = await db
    .from('work_posts')
    .insert({ kind: 'task', title, country: 'MY', trainees_only: false, published: true, posted_by: coach.id })
    .select('id')
    .single();
  if (post.error) throw post.error;
  const postId = post.data.id as string;
  const claim = await asToken(p.accessToken).from('work_claims').insert({ post_id: postId, user_id: p.id });
  if (claim.error) throw claim.error;

  const page = await today(p);
  const line = () => list(page).then((t) => (t.includes(title) ? t.slice(t.indexOf(title), t.indexOf(title) + title.length + 60) : ''));

  assert.match(await line(), /No due date/, 'taken, nothing handed in');

  const hand = async (n: number) => {
    const { error } = await db.from('work_submissions').insert({
      post_id: postId,
      user_id: p.id,
      file_path: `submissions/${p.id}/${postId}/${n}.pdf`,
      file_name: `draft-${n}.pdf`,
      declared_clean: true,
    });
    if (error) throw error;
  };
  const mark = async (verdict: 'good' | 'again') => {
    const { data: latest } = await db
      .from('work_submissions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', p.id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();
    const { error } = await db
      .from('work_submissions')
      .update({ verdict, feedback: verdict === 'again' ? 'Dates out of order.' : 'Good.', marked_by: coach.id })
      .eq('id', latest!.id);
    if (error) throw error;
  };

  await hand(1);
  assert.match(await line(), /Handed in · waiting for your coach/);
  await mark('again');
  assert.match(await line(), /Your coach asked for another go/);
  await hand(2);
  assert.match(await line(), /Handed in · waiting for your coach/, 'the second hand-in replaces the sent-back state');
  const msg = await db.from('work_messages').insert({ post_id: postId, thread_user_id: p.id, sender_id: coach.id, body: 'Better. One question on paragraph 3.' });
  if (msg.error) throw msg.error;
  assert.match(await line(), /Your coach has replied/);
  await mark('good');
  assert.equal(await line(), '', 'work marked Good stays on the list');
  await page.context().close();
});

test('work open to take is counted only for the people it is for', async () => {
  const coach = await person('coach', 'MY');
  const intern = await learner('MY');
  const au = await learner('AU');
  const unconfirmed = await learner('MY', { track: 'litigation_trainee' });
  const confirmed = await learner('MY', { track: 'litigation_trainee', trainee_approved_at: new Date().toISOString() });
  // One at a time: four browsers signing in at once only tested the machine.
  const pages: Page[] = [];
  for (const who of [intern, au, unconfirmed, confirmed]) pages.push(await today(who));
  const count = async (page: Page) => Number(/(\d+) pieces of work you can take/.exec(await list(page))?.[1] ?? (/A piece of work you can take/.test(await list(page)) ? 1 : 0));
  const before = await Promise.all(pages.map(count));

  const db = service();
  for (const row of [
    { title: `IT Malaysia, everyone ${Date.now()}`, country: 'MY', trainees_only: false },
    { title: `IT Malaysia, trainees ${Date.now()}`, country: 'MY', trainees_only: true },
  ]) {
    const { error } = await db.from('work_posts').insert({ kind: 'task', published: true, posted_by: coach.id, ...row });
    if (error) throw error;
  }
  const afterCounts = await Promise.all(pages.map(count));
  assert.deepEqual(
    afterCounts.map((n, i) => n - before[i]),
    [1, 0, 1, 2],
    'intern +1 (everyone in Malaysia), Australian +0, unconfirmed trainee +1 (not the trainee one), confirmed trainee +2',
  );
  await Promise.all(pages.map((pg) => pg.context().close()));
});

test("a trainee-only morning note reaches a confirmed trainee's Today, not an unconfirmed one's", async () => {
  const coach = await person('coach', 'MY');
  const { data: factor, error } = await coach.client.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'phone' });
  if (error) throw error;
  const verified = await coach.client.auth.mfa.challengeAndVerify({ factorId: factor.id, code: totp(factor.totp.secret) });
  if (verified.error) throw verified.error;
  const words = `IT trainees only ${Date.now()}: bring the bundle.`;
  const note = await asToken(verified.data.access_token)
    .from('morning_notes')
    .insert({ body: words, for_date: dayInKl(0), country: 'MY', trainees_only: true });
  if (note.error) throw note.error;

  const confirmed = await today(await learner('MY', { track: 'litigation_trainee', trainee_approved_at: new Date().toISOString() }));
  const unconfirmed = await today(await learner('MY', { track: 'litigation_trainee' }));
  await confirmed.reload({ waitUntil: 'domcontentloaded' });
  await unconfirmed.reload({ waitUntil: 'domcontentloaded' });
  assert.match(await confirmed.content(), new RegExp(words.slice(0, 30)));
  assert.doesNotMatch(await unconfirmed.content(), new RegExp(words.slice(0, 30)), 'an unconfirmed trainee saw a trainee-only note');
  await confirmed.context().close();
  await unconfirmed.context().close();
});

test('a coach with a password alone sees a trainee-only note no more than the database lets them; with the code typed, they do', async () => {
  const author = await person('coach', 'MY');
  const { data: f, error: e } = await author.client.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'phone' });
  if (e) throw e;
  const v = await author.client.auth.mfa.challengeAndVerify({ factorId: f.id, code: totp(f.totp.secret) });
  if (v.error) throw v.error;
  const words = `IT staff view ${Date.now()}: trainees, the bundle first.`;
  const note = await asToken(v.data.access_token)
    .from('morning_notes')
    .insert({ body: words, for_date: dayInKl(0), country: 'MY', trainees_only: true });
  if (note.error) throw note.error;

  const coach = await person('coach', 'MY');
  const now = new Date().toISOString();
  const { error } = await service()
    .from('profiles')
    .update({ onboarded_at: now, diagnostic_completed_at: now, timezone: KL })
    .eq('id', coach.id);
  if (error) throw error;

  // No authenticator app yet: a password is all there is, and the database's
  // is_coach() is false at that level (0047). Today must agree.
  const plain = await today(coach);
  assert.equal(new URL(plain.url()).pathname, '/dashboard');
  assert.doesNotMatch(await plain.content(), new RegExp(words.slice(0, 30)), 'a password-only coach saw a trainee-only note');
  await plain.context().close();

  // With an app and the code typed, the same coach sees it.
  const { data: factor, error: fe } = await coach.client.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'phone' });
  if (fe) throw fe;
  const first = await coach.client.auth.mfa.challengeAndVerify({ factorId: factor.id, code: totp(factor.totp.secret) });
  if (first.error) throw first.error;
  const page = await (await browser.newContext()).newPage();
  await page.goto(`${APP}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#email', coach.email);
  await page.fill('#password', PASSWORD);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 }),
    page.click('button[type=submit]'),
  ]);
  await page.goto(`${APP}/dashboard`, { waitUntil: 'domcontentloaded' });
  if (new URL(page.url()).pathname === '/two-step') {
    if (Date.now() % 30000 > 26000) await page.waitForTimeout(30000 - (Date.now() % 30000) + 500);
    await page.fill('input[name=code]', totp(factor.totp.secret, Date.now() + 30000));
    await Promise.all([
      page.waitForURL((u) => u.pathname !== '/two-step', { timeout: 20000 }),
      page.click('button[type=submit]'),
    ]);
  }
  await page.goto(`${APP}/dashboard`, { waitUntil: 'domcontentloaded' });
  assert.equal(new URL(page.url()).pathname, '/dashboard');
  assert.match(await page.content(), new RegExp(words.slice(0, 30)), 'a coach with the code typed did not see the note');
  await page.context().close();
});

test('the notes page is for coaches with the code typed: a learner and a password-only coach are kept out', async () => {
  const l = await learner('MY');
  const lp = await today(l);
  await lp.goto(`${APP}/admin/notes`, { waitUntil: 'domcontentloaded' });
  assert.notEqual(new URL(lp.url()).pathname, '/admin/notes', 'a learner opened Admin, Morning notes');
  assert.equal(await lp.locator('#body').count(), 0);
  await lp.context().close();

  const coach = await person('coach', 'MY');
  const { data: factor, error } = await coach.client.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'phone' });
  if (error) throw error;
  const v = await coach.client.auth.mfa.challengeAndVerify({ factorId: factor.id, code: totp(factor.totp.secret) });
  if (v.error) throw v.error;
  const fresh = await signIn(coach.email, coach.id);
  const cp = await today(fresh);
  await cp.goto(`${APP}/admin/notes`, { waitUntil: 'domcontentloaded' });
  assert.equal(new URL(cp.url()).pathname, '/two-step', 'a coach with a password alone reached the notes page');
  await cp.context().close();
});
