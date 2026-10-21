/**
 * Content that stops being approved, against real Supabase and the real
 * website: a sign-off that runs out, a question withdrawn (flagged) or
 * reworded into a new version while a learner has it on screen, what the
 * API gives a learner directly, two approval changes at once, and the job
 * that takes lapsed content back to the review queue (0051, 0052).
 *
 * The rule under test: a learner is never given the answer or explanation
 * of a question no lawyer currently stands behind, not even mid-session,
 * and what they answered before is kept.
 */
import './target-guard';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, type Browser, type Page } from 'playwright';
import { spawn } from 'node:child_process';
import { IT, PASSWORD, TARGET, asToken, browserOptions, person, service, sql, totp, type Person } from './helpers';
import { getCoachNote } from '../src/lib/training/service';
import { seedContent } from '../src/lib/setup/seed-content';

const APP = process.env.IT_APP_URL ?? 'http://127.0.0.1:3124';
const CRON_SECRET = 'it-cron-secret-not-a-real-one-0123456789';
const today = () => new Date().toISOString().slice(0, 10);

let browser: Browser;
let coachId: string;
before(async () => {
  browser = await chromium.launch(browserOptions());
  // The bank as the app loads it: nothing published, nothing signed (0044).
  // Loading again on a database that has it changes nothing.
  await seedContent(service());
  coachId = (await person('coach', 'MY')).id;
});
after(async () => browser?.close());

/** Questions this run has already used, so no test inherits another's. */
const used = new Set<string>();

/** A Malaysian question nobody has signed off yet, signed off and published now, due in a month. */
async function publishedQuestion(): Promise<{ questionId: string; versionId: string; explanation: string; correct: string[] }> {
  const db = service();
  const { data: rows, error } = await db
    .from('question_versions')
    .select('id, question_id, updated_at, explanation, correct_option_ids, questions!inner(country, status)')
    .eq('is_current', true)
    .neq('verification_status', 'human_verified')
    // Never one a reviewer (or an earlier run) flagged: flagging it again
    // would change nothing, so would not withdraw it.
    .eq('review_flagged', false)
    .eq('question_type', 'multiple_choice')
    // Court questions are answered on a diagram; these use the plain list.
    .is('court', null)
    .eq('questions.country', 'MY')
    .eq('questions.status', 'requires_review')
    .limit(200);
  if (error) throw error;
  const data = (rows ?? []).find((r) => !used.has(r.question_id as string));
  if (!data) throw new Error('no unused unsigned Malaysian question left to test with');
  used.add(data.question_id as string);
  const now = new Date().toISOString();
  const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const signed = await db
    .from('question_versions')
    .update({ verification_status: 'human_verified', verified_by: coachId, verified_at: now, reviewed_by: coachId, reviewed_at: now, review_due_on: due })
    .eq('id', data.id)
    .eq('updated_at', data.updated_at)
    .select('id');
  if (signed.error) throw signed.error;
  assert.equal(signed.data?.length, 1);
  const pub = await db.from('questions').update({ status: 'published' }).eq('id', data.question_id);
  if (pub.error) throw pub.error;
  return {
    questionId: data.question_id as string,
    versionId: data.id as string,
    explanation: data.explanation as string,
    correct: data.correct_option_ids as string[],
  };
}

async function learner(): Promise<Person> {
  const p = await person('learner', 'MY');
  const now = new Date().toISOString();
  const { error } = await service()
    .from('profiles')
    .update({ onboarded_at: now, diagnostic_completed_at: now, timezone: 'Asia/Kuala_Lumpur' })
    .eq('id', p.id);
  if (error) throw error;
  return p;
}

/** A one-question session for this learner, as startSession would make it. */
async function sessionWith(p: Person, q: { questionId: string; versionId: string }): Promise<string> {
  const db = service();
  const s = await db
    .from('training_sessions')
    .insert({ user_id: p.id, kind: 'daily', planned_question_count: 1, target_minutes: 10 })
    .select('id')
    .single();
  if (s.error) throw s.error;
  const slot = await db
    .from('training_session_questions')
    .insert({ session_id: s.data.id, question_id: q.questionId, question_version_id: q.versionId, position: 0 });
  if (slot.error) throw slot.error;
  return s.data.id as string;
}

/** Signed in, on the session page with the question showing. `replies` collects what answering sends back. */
async function onQuestion(p: Person, sessionId: string): Promise<{ page: Page; replies: string[] }> {
  const page = await (await browser.newContext()).newPage();
  const replies: string[] = [];
  // Every answer the page sends is passed through and its reply kept whole,
  // before the browser can move on.
  await page.route('**/train/**', async (route) => {
    const req = route.request();
    try {
      if (req.method() !== 'POST' || !req.headers()['next-action']) return await route.continue();
      const res = await route.fetch();
      const body = await res.text();
      replies.push(body);
      await route.fulfill({ response: res, body });
    } catch {
      // The test closed the page while a later request (the coach note) was
      // still in flight; nothing of the answer's reply is lost by that.
    }
  });
  await page.goto(`${APP}/login`, { waitUntil: 'load' });
  await page.fill('#email', p.email);
  await page.fill('#password', PASSWORD);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 }), page.click('button[type=submit]')]);
  await page.goto(`${APP}/train/${sessionId}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('group', { name: 'Answer options' }).waitFor({ timeout: 15000 });
  return { page, replies };
}

/** Choose the first option and say how sure; wait for the answer's own reply, then the verdict panel. */
async function answer(page: Page, replies: string[]): Promise<string> {
  await page.getByRole('group', { name: 'Answer options' }).getByRole('button').first().click();
  const before = replies.length;
  await page.getByRole('button', { name: 'Guess', exact: true }).click();
  for (let i = 0; i < 150 && replies.length === before; i++) await page.waitForTimeout(100);
  assert.ok(replies.length > before, 'the answer was not sent');
  const panel = page.locator('section[aria-live="polite"]').last();
  await panel.waitFor({ timeout: 15000 });
  return (await panel.innerText()).replace(/\s+/g, ' ');
}

/** Nothing about a withdrawn answer is counted: no session total, no XP. */
async function nothingCounted(userId: string, sessionId: string) {
  const db = service();
  const { data: s } = await db.from('training_sessions').select('total_answered, correct_count').eq('id', sessionId).single();
  assert.equal(s?.total_answered, 0, 'a withdrawn answer was counted in the session');
  assert.equal(s?.correct_count, 0);
  const { count } = await db.from('xp_events').select('id', { count: 'exact', head: true }).eq('user_id', userId);
  assert.equal(count ?? 0, 0, 'XP was given for a withdrawn answer');
}

async function attempts(userId: string, versionId: string): Promise<number> {
  const { count, error } = await service()
    .from('user_question_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('question_version_id', versionId);
  if (error) throw error;
  return count ?? 0;
}

/** Nothing in the reply or on the page gives the answer or the explanation away. */
function assertNothingDisclosed(text: string, replies: string[], q: { explanation: string; correct: string[] }) {
  assert.match(text, /Not marked/);
  assert.doesNotMatch(text, /Correct\.|Not quite\./);
  const reply = replies.join('\n');
  assert.ok(reply.length > 0, 'the answer reply was not captured');
  assert.ok(!reply.includes(q.explanation.slice(0, 40)), 'the explanation was sent to the browser');
  assert.match(reply, /"withdrawn":true/);
  assert.match(reply, /"correctOptionIds":\[\]/, 'the answer key was sent to the browser');
}

test('control: a question still signed off is marked and explained as before', async () => {
  const q = await publishedQuestion();
  const p = await learner();
  const sessionId = await sessionWith(p, q);
  const { page, replies } = await onQuestion(p, sessionId);
  const text = await answer(page, replies);
  assert.match(text, /Correct\.|Not quite\./);
  assert.ok(text.includes(q.explanation.slice(0, 40)), 'a signed-off explanation was not shown');
  assert.match(replies.join('\n'), /"withdrawn":false/);
  assert.equal(await attempts(p.id, q.versionId), 1);
  await page.context().close();
});

test('a sign-off that runs out while the question is on screen: nothing marked, no answer, no explanation', async () => {
  const q = await publishedQuestion();
  const p = await learner();
  const sessionId = await sessionWith(p, q);
  const { page, replies } = await onQuestion(p, sessionId);
  const lapse = await service().from('question_versions').update({ review_due_on: today() }).eq('id', q.versionId).select('id');
  if (lapse.error) throw lapse.error;
  assertNothingDisclosed(await answer(page, replies), replies, q);
  assert.equal(await attempts(p.id, q.versionId), 0, 'an answer to an expired question was recorded and marked');
  await nothingCounted(p.id, sessionId);
  const { data: slot } = await service().from('training_session_questions').select('answered_at').eq('session_id', sessionId).single();
  assert.ok(slot?.answered_at, 'the session could not move on');
  await page.context().close();
});

test('a question flagged (withdrawn) while on screen: nothing marked, no answer, no explanation', async () => {
  const q = await publishedQuestion();
  const p = await learner();
  const sessionId = await sessionWith(p, q);
  const { page, replies } = await onQuestion(p, sessionId);
  const flag = await service().from('question_versions').update({ review_flagged: true, review_note: 'IT: wrong time limit' }).eq('id', q.versionId);
  if (flag.error) throw flag.error;
  const { data: status } = await service().from('questions').select('status').eq('id', q.questionId).single();
  assert.equal(status?.status, 'requires_review', 'flagging did not withdraw the question');
  assertNothingDisclosed(await answer(page, replies), replies, q);
  assert.equal(await attempts(p.id, q.versionId), 0);
  await page.context().close();
});

test('a question reworded into a new version while on screen: the old version is not marked or explained', async () => {
  const q = await publishedQuestion();
  const p = await learner();
  const sessionId = await sessionWith(p, q);
  const { page, replies } = await onQuestion(p, sessionId);
  // As the admin edit does (src/app/admin/actions.ts), through the server's
  // API so it runs against the hosted staging copy too: retire the current
  // version, mint the next, take the question back to review.
  const db = service();
  const { data: old, error: readError } = await db.from('question_versions').select('*').eq('id', q.versionId).single();
  if (readError) throw readError;
  const retire = await db.from('question_versions').update({ is_current: false }).eq('id', q.versionId);
  if (retire.error) throw retire.error;
  const mint = await db.from('question_versions').insert({
    question_id: old.question_id, version: old.version + 1, is_current: true, question_type: old.question_type,
    scenario: old.scenario, stem: `${old.stem} (revised)`, options: old.options, correct_option_ids: old.correct_option_ids,
    explanation: `${old.explanation} Revised.`, difficulty: old.difficulty, jurisdiction: old.jurisdiction,
    verification_status: 'requires_review',
  });
  if (mint.error) throw mint.error;
  const back = await db.from('questions').update({ status: 'requires_review' }).eq('id', q.questionId).eq('status', 'published');
  if (back.error) throw back.error;
  assertNothingDisclosed(await answer(page, replies), replies, q);
  assert.equal(await attempts(p.id, q.versionId), 0);
  await page.context().close();
});

test('what a learner answered before a question lapsed is kept, and the job takes it back to review with a record', async () => {
  const q = await publishedQuestion();
  const p = await learner();
  const sessionId = await sessionWith(p, q);
  const { page, replies } = await onQuestion(p, sessionId);
  await answer(page, replies);
  await page.context().close();
  assert.equal(await attempts(p.id, q.versionId), 1);

  await service().from('question_versions').update({ review_due_on: today() }).eq('id', q.versionId);

  const refused = await fetch(`${APP}/api/cron/content-review`);
  assert.equal(refused.status, 401, 'the job ran without the secret');
  const ran = await fetch(`${APP}/api/cron/content-review`, { headers: { Authorization: `Bearer ${CRON_SECRET}` } });
  assert.equal(ran.status, 200);
  const body = (await ran.json()) as { ok: boolean; returned: { questions: number } };
  assert.ok(body.ok && body.returned.questions >= 1, JSON.stringify(body));

  const db = service();
  const { data: version } = await db.from('question_versions').select('verification_status, review_note').eq('id', q.versionId).single();
  assert.equal(version?.verification_status, 'requires_review');
  assert.match(String(version?.review_note), /The sign-off ran out on/);
  const { data: question } = await db.from('questions').select('status').eq('id', q.questionId).single();
  assert.equal(question?.status, 'requires_review');
  const { data: lapse } = await db.from('content_lapses').select('signed_by, review_due_on').eq('question_version_id', q.versionId).single();
  assert.equal(lapse?.signed_by, coachId, 'who signed it off was not kept');
  assert.equal(lapse?.review_due_on, today());
  assert.equal(await attempts(p.id, q.versionId), 1, 'the learner\'s earlier answer was lost');
  const gone = await db.from('content_lapses').delete().eq('question_version_id', q.versionId);
  assert.ok(gone.error, 'the server deleted the record of a lapsed sign-off');
});

test('direct API: a learner cannot read an answer key, an expired question or fact, or the lapse record, or run the job', async () => {
  const q = await publishedQuestion();
  const p = await learner();
  const me = asToken(p.accessToken);

  const key = await me.from('question_versions').select('correct_option_ids, explanation').eq('id', q.versionId);
  assert.ok(key.error || (key.data ?? []).length === 0, 'a learner read a version, answer key and all');
  const viaView = await me.from('v_question_delivery').select('*').eq('question_version_id', q.versionId);
  assert.equal(viaView.error, null);
  assert.equal(viaView.data?.length, 1);
  assert.ok(!('correct_option_ids' in (viaView.data?.[0] ?? {})) && !('explanation' in (viaView.data?.[0] ?? {})),
    'the delivery view carries the answer key or explanation');

  await service().from('question_versions').update({ review_due_on: today() }).eq('id', q.versionId);
  const expired = await me.from('v_question_delivery').select('question_id').eq('question_version_id', q.versionId);
  assert.deepEqual(expired.data ?? [], [], 'an expired question was still offered through the API');

  const slug = `it-expiry-fact-${Date.now()}`;
  const fact = await service()
    .from('daily_facts')
    .insert({ slug, title: 'IT expiring fact', body: 'A fact long enough to be a daily fact body for the integration test of expiry.', jurisdiction: 'MY_GENERAL', country: 'MY', status: 'requires_review' })
    .select('id, updated_at')
    .single();
  if (fact.error) throw fact.error;
  const now = new Date().toISOString();
  const signFact = await service().from('daily_facts')
    .update({ verification_status: 'human_verified', verified_by: coachId, verified_at: now, reviewed_by: coachId, reviewed_at: now, review_due_on: today() })
    .eq('id', fact.data.id);
  if (signFact.error) throw signFact.error;
  const pubFact = await service().from('daily_facts').update({ status: 'published' }).eq('id', fact.data.id);
  if (pubFact.error) throw pubFact.error;
  const readFact = await me.from('daily_facts').select('slug').eq('slug', slug);
  assert.deepEqual(readFact.data ?? [], [], 'an expired daily fact was readable through the API');

  const lapses = await me.from('content_lapses').select('id').limit(1);
  assert.ok(lapses.error || (lapses.data ?? []).length === 0, 'a learner read the lapse record');
  const job = await me.rpc('return_lapsed_content');
  assert.ok(job.error, 'a learner ran the job');
});

test('two approval changes at once: two sign-offs of the same words, and a sign-off racing a rewrite', async () => {
  const db = service();
  const { data: v, error } = await db
    .from('question_versions')
    .select('id, updated_at')
    .eq('is_current', true)
    .neq('verification_status', 'human_verified')
    .limit(1)
    .single();
  if (error) throw error;
  const otherCoach = (await person('coach', 'MY')).id;
  const signAs = (who: string) => {
    const now = new Date().toISOString();
    return db
      .from('question_versions')
      .update({ verification_status: 'human_verified', verified_by: who, verified_at: now, reviewed_by: who, reviewed_at: now })
      .eq('id', v.id)
      .eq('updated_at', v.updated_at)
      .select('id');
  };
  const [a, b] = await Promise.all([signAs(coachId), signAs(otherCoach)]);
  const won = [a, b].filter((r) => !r.error && (r.data ?? []).length === 1).length;
  assert.equal(won, 1, 'both sign-offs of the same words went through, or neither did');

  // A sign-off made against the words as they were, racing a rewrite: the
  // words end up rewritten and not signed off, whichever lands first.
  const { data: w } = await db
    .from('question_versions')
    .select('id, updated_at')
    .eq('is_current', true)
    .neq('verification_status', 'human_verified')
    .neq('id', v.id)
    .limit(1)
    .single();
  const now = new Date().toISOString();
  await Promise.all([
    db.from('question_versions').update({ explanation: 'IT: rewritten while being signed.' }).eq('id', w!.id),
    db.from('question_versions')
      .update({ verification_status: 'human_verified', verified_by: coachId, verified_at: now, reviewed_by: coachId, reviewed_at: now })
      .eq('id', w!.id)
      .eq('updated_at', w!.updated_at),
  ]);
  const { data: end } = await db.from('question_versions').select('explanation, verification_status').eq('id', w!.id).single();
  assert.equal(end?.explanation, 'IT: rewritten while being signed.');
  assert.notEqual(end?.verification_status, 'human_verified', 'a rewrite nobody read ended up signed off');
});

test('staff with the code typed are not shown an expired daily fact on Today as if approved', async () => {
  const db = service();
  // An administrator: with the code typed they read every fact, approved or
  // not (daily_facts_admin_read), so only the page's own filter stands
  // between them and an expired one presented as the day's brief. A coach
  // reads through the learner policy, which already leaves it out.
  const coach = await person('admin', 'MY');
  const now = new Date().toISOString();
  await db.from('profiles').update({ onboarded_at: now, diagnostic_completed_at: now, timezone: 'Asia/Kuala_Lumpur' }).eq('id', coach.id);
  const { data: factor, error } = await coach.client.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'phone' });
  if (error) throw error;
  const v = await coach.client.auth.mfa.challengeAndVerify({ factorId: factor.id, code: totp(factor.totp.secret) });
  if (v.error) throw v.error;

  // Take every other Malaysian fact out of rotation for the test, so the
  // brief can only be this one; they are put back however the test ends.
  const others = await db.from('daily_facts').select('id').eq('country', 'MY').eq('status', 'published');
  for (const o of others.data ?? []) await db.from('daily_facts').update({ status: 'retired' }).eq('id', o.id);
  try {
  const slug = `it-staff-fact-${Date.now()}`;
  const title = `IT staff fact ${Date.now()}`;
  const f = await db.from('daily_facts')
    .insert({ slug, title, body: 'A fact long enough to be a daily fact body for the integration test of staff view.', jurisdiction: 'MY_GENERAL', country: 'MY', status: 'requires_review' })
    .select('id')
    .single();
  if (f.error) throw f.error;
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  await db.from('daily_facts').update({ verification_status: 'human_verified', verified_by: coachId, verified_at: now, reviewed_by: coachId, reviewed_at: now, review_due_on: tomorrow }).eq('id', f.data.id);
  const pub = await db.from('daily_facts').update({ status: 'published' }).eq('id', f.data.id);
  if (pub.error) throw pub.error;

  const page = await (await browser.newContext()).newPage();
  await page.goto(`${APP}/login`, { waitUntil: 'load' });
  await page.fill('#email', coach.email);
  await page.fill('#password', PASSWORD);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 }), page.click('button[type=submit]')]);
  await page.goto(`${APP}/dashboard`, { waitUntil: 'domcontentloaded' });
  if (new URL(page.url()).pathname === '/two-step') {
    if (Date.now() % 30000 > 26000) await page.waitForTimeout(30000 - (Date.now() % 30000) + 500);
    await page.fill('input[name=code]', totp(factor.totp.secret, Date.now() + 30000));
    await Promise.all([page.waitForURL((u) => u.pathname !== '/two-step', { timeout: 20000 }), page.click('button[type=submit]')]);
  }
  // Really at the code-typed level: Admin opens rather than asking for the code.
  await page.goto(`${APP}/admin`, { waitUntil: 'domcontentloaded' });
  assert.match(new URL(page.url()).pathname, /^\/admin/, 'the administrator is not at the code-typed level');
  // And at that level they can read an expired fact directly, so the test
  // below is about the page, not the policy.
  await page.goto(`${APP}/dashboard`, { waitUntil: 'domcontentloaded' });
  assert.ok((await page.content()).includes(title), 'control: the signed-off fact was not shown to staff');

  await db.from('daily_facts').update({ review_due_on: today() }).eq('id', f.data.id);
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert.ok(!(await page.content()).includes(title), 'staff were shown an expired fact on Today');
  await page.context().close();
  } finally {
    for (const o of others.data ?? []) await db.from('daily_facts').update({ status: 'published' }).eq('id', o.id);
  }
});

// Needs a second database connection holding a transaction open, which only
// the local stack offers; a hosted copy is reached through its API alone.
test('a withdrawal racing an answer: the answer waits for it, and is not marked against withdrawn content', { skip: TARGET !== 'local' && 'needs a direct database connection (local stack only)' }, async () => {
  const q = await publishedQuestion();
  const p = await learner();
  const sessionId = await sessionWith(p, q);
  // A reviewer flags the question in a transaction that is still open when
  // the answer arrives.
  const reviewer = spawn('psql', [IT.SUPABASE_IT_DB_URL, '-v', 'ON_ERROR_STOP=1', '-c',
    `begin; update public.question_versions set review_flagged = true, review_note = 'IT: racing' where id = '${q.versionId}'; select pg_sleep(3); commit;`]);
  const done = new Promise<number>((resolve) => reviewer.on('close', resolve));
  // Wait until the reviewer's transaction has made its change and is
  // sleeping on it (so it holds the row), not a guess.
  let holding = false;
  for (let i = 0; i < 100 && !holding; i++) {
    holding = sql(`select count(*) from pg_stat_activity where wait_event = 'PgSleep' and query like '%IT: racing%' and query not like '%pg_stat_activity%'`) === '1';
    if (!holding) await new Promise((r) => setTimeout(r, 50));
  }
  assert.ok(holding, 'the reviewer\'s transaction never got going');
  const started = Date.now();
  const { data, error } = await service().rpc('claim_answer', { p_session: sessionId, p_version: q.versionId, p_user: p.id });
  const waited = Date.now() - started;
  assert.equal(await done, 0, 'the reviewer\'s transaction failed');
  assert.equal(error, null, error?.message);
  assert.ok(waited > 1000, `the claim did not wait for the withdrawal in progress (${waited}ms)`);
  assert.equal((data as { result: string }).result, 'withdrawn', 'an answer was claimed against content withdrawn at the same moment');
  assert.ok(!JSON.stringify(data).includes('correct_option_ids'), 'the answer key came back');
});

test('a saved AI note is not handed back once the question is withdrawn', async () => {
  const q = await publishedQuestion();
  const p = await learner();
  const sessionId = await sessionWith(p, q);
  const db = service();
  const claim = await db.rpc('claim_answer', { p_session: sessionId, p_version: q.versionId, p_user: p.id });
  assert.equal((claim.data as { result: string }).result, 'offered');
  await db.from('user_question_attempts').insert({ user_id: p.id, question_id: q.questionId, question_version_id: q.versionId, session_id: sessionId, selected_option_ids: q.correct, is_correct: true });
  const note = 'IT: a saved note paraphrasing the explanation.';
  await db.from('training_session_questions').update({ coach_note: note, coach_note_at: new Date().toISOString() }).eq('session_id', sessionId);
  assert.deepEqual(await getCoachNote(p.id, sessionId, q.versionId), { coachNote: note }, 'control: the saved note was not handed back');
  await db.from('question_versions').update({ review_flagged: true, review_note: 'IT: withdrawn after the note' }).eq('id', q.versionId);
  assert.deepEqual(await getCoachNote(p.id, sessionId, q.versionId), { coachNote: null }, 'a saved note was handed back after withdrawal');
});
