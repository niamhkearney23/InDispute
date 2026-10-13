/**
 * Publication controls, against real Supabase: the content is loaded the
 * way the setup page loads it, and what a learner can then read is asked
 * through the REST API with the learner's own token, the way the browser
 * and the server's user client ask.
 */
import './target-guard';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { seedContent } from '../src/lib/setup/seed-content';
import { asToken, person, service, type Person } from './helpers';

let learnerAU: Person;
let learnerMY: Person;
let coachId: string;

before(async () => {
  await seedContent(service());
  learnerAU = await person('learner', 'AU');
  learnerMY = await person('learner', 'MY');
  coachId = (await person('coach')).id;
});

async function deliverable(p: Person): Promise<string[]> {
  const { data, error } = await asToken(p.accessToken).from('v_question_delivery').select('question_id');
  if (error) throw error;
  return (data ?? []).map((r) => r.question_id as string);
}

async function facts(p: Person): Promise<string[]> {
  const { data, error } = await asToken(p.accessToken).from('daily_facts').select('slug');
  if (error) throw error;
  return (data ?? []).map((r) => r.slug as string);
}

/** An Australian question whose current wording nobody has signed off. */
async function unsignedQuestion(): Promise<string> {
  const { data, error } = await service()
    .from('question_versions')
    .select('question_id, questions!inner(country, status)')
    .eq('is_current', true)
    .neq('verification_status', 'human_verified')
    .eq('questions.country', 'AU')
    .neq('questions.status', 'retired')
    .limit(1)
    .single();
  if (error) throw error;
  return data.question_id as string;
}

/** Every question a learner of this country may be given: signed and published. */
async function signedAndPublished(country: 'AU' | 'MY'): Promise<Set<string>> {
  const { data, error } = await service()
    .from('question_versions')
    .select('question_id, questions!inner(country, status)')
    .eq('is_current', true)
    .eq('verification_status', 'human_verified')
    .eq('questions.country', country)
    .eq('questions.status', 'published');
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.question_id as string));
}

/** The question's current version, signed off the way the review page signs it. */
async function signOff(questionId: string) {
  const db = service();
  const { data: current, error } = await db
    .from('question_versions')
    .select('id, updated_at')
    .eq('question_id', questionId)
    .eq('is_current', true)
    .single();
  if (error) throw error;
  const now = new Date().toISOString();
  const { data: updated, error: signError } = await db
    .from('question_versions')
    .update({
      verification_status: 'human_verified',
      verified_by: coachId,
      verified_at: now,
      reviewed_by: coachId,
      reviewed_at: now,
      review_flagged: false,
      review_note: null,
    })
    .eq('id', current.id)
    .eq('updated_at', current.updated_at)
    .select('id');
  if (signError) throw signError;
  assert.equal(updated?.length, 1);
}

test('loading the content publishes nothing, in either country', async () => {
  // Loading again on a database that already has content (as here, or a
  // live one) must not publish anything either.
  await seedContent(service());
  const db = service();
  const { data: published } = await db
    .from('questions')
    .select('id, question_versions!inner(verification_status, is_current)')
    .eq('status', 'published')
    .eq('question_versions.is_current', true)
    .neq('question_versions.verification_status', 'human_verified');
  assert.deepEqual(published ?? [], [], 'a question is published without a sign-off');
  const { count: total } = await db.from('questions').select('id', { count: 'exact', head: true });
  assert.ok((total ?? 0) > 100, `only ${total} questions loaded`);

  // Learners get exactly the signed and published ones of their own country.
  assert.deepEqual(new Set(await deliverable(learnerAU)), await signedAndPublished('AU'));
  assert.deepEqual(new Set(await deliverable(learnerMY)), await signedAndPublished('MY'));
  const { data: unsignedFacts } = await db
    .from('daily_facts')
    .select('slug')
    .eq('status', 'published')
    .neq('verification_status', 'human_verified');
  assert.deepEqual(unsignedFacts ?? [], []);
});

test('publishing a question nobody has signed off is refused, even by the server', async () => {
  const id = await unsignedQuestion();
  const { error } = await service().from('questions').update({ status: 'published' }).eq('id', id);
  assert.ok(error, 'an unsigned question was published');
  assert.match(error.message, /signed off/);
  assert.ok(!(await deliverable(learnerAU)).includes(id));
});

test('a signed-off question reaches learners in its own country only, and leaves when its wording changes', async () => {
  const db = service();
  const q = { id: await unsignedQuestion() };
  await signOff(q.id);
  const { error } = await db.from('questions').update({ status: 'published' }).eq('id', q.id);
  if (error) throw error;

  assert.ok((await deliverable(learnerAU)).includes(q.id));
  assert.ok(!(await deliverable(learnerMY)).includes(q.id), 'an Australian question reached a Malaysian learner');

  // Changing the explanation clears the sign-off (0040) and takes the
  // question back to review (0044) in the same statement.
  const { error: editError } = await db
    .from('question_versions')
    .update({ explanation: 'A different explanation nobody has read.' })
    .eq('question_id', q.id)
    .eq('is_current', true);
  if (editError) throw editError;

  const { data: after } = await db.from('questions').select('status').eq('id', q.id).single();
  assert.equal(after!.status, 'requires_review');
  assert.ok(!(await deliverable(learnerAU)).includes(q.id));
});

test('a daily fact is read only once it is signed off and published', async () => {
  const db = service();
  const { data: f } = await db
    .from('daily_facts')
    .select('id, slug, updated_at')
    .eq('country', 'AU')
    .neq('verification_status', 'human_verified')
    .limit(1)
    .single();
  const refused = await db.from('daily_facts').update({ status: 'published' }).eq('id', f!.id);
  assert.ok(refused.error, 'an unsigned fact was published');

  const now = new Date().toISOString();
  const { error } = await db
    .from('daily_facts')
    .update({ verification_status: 'human_verified', verified_by: coachId, verified_at: now, status: 'published' })
    .eq('id', f!.id)
    .eq('updated_at', f!.updated_at);
  if (error) throw error;
  assert.ok((await facts(learnerAU)).includes(f!.slug));
  assert.ok(!(await facts(learnerMY)).includes(f!.slug));
});

test('a learner cannot publish or sign anything themselves', async () => {
  const client = asToken(learnerAU.accessToken);
  const { data: q } = await service().from('questions').select('id').eq('country', 'AU').limit(1).single();
  const publish = await client.from('questions').update({ status: 'published' }).eq('id', q!.id).select('id');
  assert.equal(publish.data?.length ?? 0, 0);
  const sign = await client
    .from('question_versions')
    .update({ verification_status: 'human_verified' })
    .eq('question_id', q!.id)
    .select('id');
  assert.equal(sign.data?.length ?? 0, 0);
});

test('the server can update facts and question versions many times on one connection', async () => {
  // Postgres switches to a generic plan after about five runs of a trigger's
  // statement, and checks table permissions on the whole plan. A guard that
  // read auth.users directly passed the first few updates and then failed
  // every one with "permission denied for table users" (fixed in 0048).
  const db = service();
  const { data: facts } = await db.from('daily_facts').select('id, sort_order').limit(12);
  for (let round = 0; round < 2; round++) {
    for (const f of facts ?? []) {
      const { error } = await db.from('daily_facts').update({ sort_order: f.sort_order }).eq('id', f.id);
      assert.equal(error, null, `update ${round}: ${error?.message}`);
    }
  }
  const { data: versions } = await db.from('question_versions').select('id, difficulty').eq('is_current', true).limit(12);
  for (const v of versions ?? []) {
    const { error } = await db.from('question_versions').update({ difficulty: v.difficulty }).eq('id', v.id);
    assert.equal(error, null, error?.message);
  }
});
