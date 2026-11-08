/**
 * Exams (0056), against real Supabase and the real website: a mock exam sat
 * in the browser from the Exams page to its result, only signed-off training
 * questions on the paper (never a diagnostic-only one), the server's clock
 * refusing an answer after time is up, and one person never reading
 * another's result.
 */
import './target-guard';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, type Browser } from 'playwright';
import { PASSWORD, browserOptions, person, service, type Person } from './helpers';
import { seedContent } from '../src/lib/setup/seed-content';
import { submitAnswer } from '../src/lib/training/service';
import { examReview, startExam } from '../src/lib/exams/service';

const APP = process.env.IT_APP_URL ?? 'http://127.0.0.1:3124';

let browser: Browser;
let coachId: string;
const published: string[] = [];
let diagnosticQuestionId: string;

/** Signs off and publishes one current version, as a reviewer would. */
async function signAndPublish(row: { id: string; question_id: string; updated_at: string }) {
  const db = service();
  const now = new Date().toISOString();
  const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const signed = await db
    .from('question_versions')
    .update({ verification_status: 'human_verified', verified_by: coachId, verified_at: now, reviewed_by: coachId, reviewed_at: now, review_due_on: due })
    .eq('id', row.id)
    .eq('updated_at', row.updated_at)
    .select('id');
  if (signed.error) throw signed.error;
  const pub = await db.from('questions').update({ status: 'published' }).eq('id', row.question_id);
  if (pub.error) throw pub.error;
}

before(async () => {
  browser = await chromium.launch(browserOptions());
  await seedContent(service());
  coachId = (await person('coach', 'MY')).id;
  const db = service();
  // Four ordinary Malaysian questions, and one of the diagnostic's own.
  const pick = async (diagnosticOnly: boolean, n: number) => {
    const { data, error } = await db
      .from('question_versions')
      .select('id, question_id, updated_at, questions!inner(country, status, diagnostic_only)')
      .eq('is_current', true)
      .eq('question_type', 'multiple_choice')
      .is('court', null)
      .eq('questions.country', 'MY')
      .eq('questions.diagnostic_only', diagnosticOnly)
      .neq('verification_status', 'human_verified')
      .eq('review_flagged', false)
      .limit(n);
    if (error) throw error;
    return (data ?? []) as Array<{ id: string; question_id: string; updated_at: string }>;
  };
  for (const row of await pick(false, 4)) {
    await signAndPublish(row);
    published.push(row.question_id);
  }
  const [diag] = await pick(true, 1);
  await signAndPublish(diag);
  diagnosticQuestionId = diag.question_id;
});
after(async () => browser?.close());

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

test('a mock exam, sat in the browser: signed-off training questions only, marked at the end', async () => {
  const p = await learner();
  const page = await (await browser.newContext()).newPage();
  await page.goto(`${APP}/login`, { waitUntil: 'load' });
  await page.fill('#email', p.email);
  await page.fill('#password', PASSWORD);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 }), page.click('button[type=submit]')]);

  await page.goto(`${APP}/exams`, { waitUntil: 'load' });
  const start = page.getByRole('button', { name: 'Start the mock exam' });
  await start.waitFor({ timeout: 15000 });
  await page.waitForFunction(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.includes('Start the mock exam'));
    return b && !(b as HTMLButtonElement).disabled;
  });
  await Promise.all([page.waitForURL(/\/train\//, { timeout: 20000 }), start.click()]);
  const sessionId = new URL(page.url()).pathname.split('/').pop()!;

  // The paper: only published, signed-off training questions.
  const db = service();
  const { data: session } = await db.from('training_sessions').select('kind, target_minutes, exam_settings').eq('id', sessionId).single();
  assert.equal(session?.kind, 'exam');
  assert.equal(session?.target_minutes, 60);
  const { data: slots } = await db.from('training_session_questions').select('question_id').eq('session_id', sessionId);
  const ids = (slots ?? []).map((s) => s.question_id as string);
  assert.ok(ids.length >= 1);
  assert.ok(!ids.includes(diagnosticQuestionId), 'the diagnostic’s own question is never on an exam');
  const { data: qs } = await db.from('questions').select('id, status, diagnostic_only').in('id', ids);
  assert.ok((qs ?? []).every((q) => q.status === 'published' && q.diagnostic_only === false));

  // Answer every question: no verdict on screen, straight to the next.
  for (let i = 0; i < ids.length; i++) {
    await page.getByRole('group', { name: 'Answer options' }).waitFor({ timeout: 15000 });
    assert.equal(await page.getByText('Correct.', { exact: true }).count(), 0, 'nothing is marked mid-exam');
    await page.getByRole('group', { name: 'Answer options' }).getByRole('button').first().click();
    const confirm = page.getByRole('button', { name: /Confirm (answer|and finish)/ });
    if (i === ids.length - 1) {
      await Promise.all([page.waitForURL(/\/exams\/[0-9a-f-]+$/, { timeout: 20000 }), confirm.click()]);
    } else {
      const heading = await page.locator('h1').first().textContent();
      await confirm.click();
      await page.waitForFunction((h) => document.querySelector('h1')?.textContent !== h, heading, { timeout: 15000 });
    }
  }
  await page.getByText('Exam result').waitFor({ timeout: 15000 });
  await page.getByRole('heading', { name: 'Your answers' }).waitFor();
  const { data: done } = await db.from('training_sessions').select('status, total_answered').eq('id', sessionId).single();
  assert.equal(done?.status, 'completed');
  assert.equal(done?.total_answered, ids.length);
  await page.close();
});

test('the server keeps the clock: no answer is recorded after time is up', async () => {
  const p = await learner();
  const started = await startExam(p.id, { mode: 'drill', areas: [], difficulty: 'any', pool: 'all', count: 10, minutes: 10 });
  assert.ok('sessionId' in started, JSON.stringify(started));
  const sessionId = (started as { sessionId: string }).sessionId;
  const db = service();
  // An hour ago, so its ten minutes are long over.
  await db.from('training_sessions').update({ started_at: new Date(Date.now() - 3600_000).toISOString() }).eq('id', sessionId);
  const { data: slot } = await db.from('training_session_questions').select('question_version_id').eq('session_id', sessionId).limit(1).single();
  const reply = await submitAnswer({
    userId: p.id,
    sessionId,
    questionVersionId: slot!.question_version_id as string,
    selectedOptionIds: ['a'],
    confidence: null,
    responseMs: 1000,
  });
  assert.deepEqual(reply, { error: 'Time is up. This exam has ended.' });
  const { count } = await db.from('user_question_attempts').select('id', { count: 'exact', head: true }).eq('session_id', sessionId);
  assert.equal(count, 0, 'nothing recorded');
});

test('one exam at a time, and nobody reads another person’s result', async () => {
  const a = await learner();
  const b = await learner();
  const first = await startExam(a.id, { mode: 'mock', areas: [], difficulty: 'any', pool: 'all', count: 40, minutes: 60 });
  const second = await startExam(a.id, { mode: 'drill', areas: [], difficulty: 'any', pool: 'all', count: 10, minutes: 0 });
  assert.deepEqual(second, first, 'a second start goes back to the one running');
  const sessionId = (first as { sessionId: string }).sessionId;
  await service().from('training_sessions').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', sessionId);
  assert.ok(await examReview(a.id, sessionId));
  assert.equal(await examReview(b.id, sessionId), null);
  // And a learner's own token cannot write an exam session.
  const { error } = await b.client.from('training_sessions').insert({ user_id: b.id, kind: 'exam', planned_question_count: 1 });
  assert.ok(error, 'learners do not write sessions');
});
