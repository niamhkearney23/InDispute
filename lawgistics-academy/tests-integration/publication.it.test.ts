/**
 * Publication controls, against real Supabase: the content is loaded the
 * way the setup page loads it, and what a learner can then read is asked
 * through the REST API with the learner's own token, the way the browser
 * and the server's user client ask.
 */
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
  const db = service();
  const { count: published } = await db
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');
  assert.equal(published, 0);
  const { count: total } = await db.from('questions').select('id', { count: 'exact', head: true });
  assert.ok((total ?? 0) > 100, `only ${total} questions loaded`);

  assert.deepEqual(await deliverable(learnerAU), []);
  assert.deepEqual(await deliverable(learnerMY), []);
  assert.deepEqual(await facts(learnerAU), []);
  assert.deepEqual(await facts(learnerMY), []);
});

test('publishing a question nobody has signed off is refused, even by the server', async () => {
  const db = service();
  const { data: q } = await db.from('questions').select('id').eq('country', 'AU').limit(1).single();
  const { error } = await db.from('questions').update({ status: 'published' }).eq('id', q!.id);
  assert.ok(error, 'an unsigned question was published');
  assert.match(error.message, /signed off/);
  assert.deepEqual(await deliverable(learnerAU), []);
});

test('a signed-off question reaches learners in its own country only, and leaves when its wording changes', async () => {
  const db = service();
  const { data: q } = await db.from('questions').select('id').eq('country', 'AU').limit(1).single();
  await signOff(q!.id);
  const { error } = await db.from('questions').update({ status: 'published' }).eq('id', q!.id);
  if (error) throw error;

  assert.deepEqual(await deliverable(learnerAU), [q!.id]);
  assert.deepEqual(await deliverable(learnerMY), [], 'an Australian question reached a Malaysian learner');

  // Changing the explanation clears the sign-off (0040) and takes the
  // question back to review (0044) in the same statement.
  const { error: editError } = await db
    .from('question_versions')
    .update({ explanation: 'A different explanation nobody has read.' })
    .eq('question_id', q!.id)
    .eq('is_current', true);
  if (editError) throw editError;

  const { data: after } = await db.from('questions').select('status').eq('id', q!.id).single();
  assert.equal(after!.status, 'requires_review');
  assert.deepEqual(await deliverable(learnerAU), []);
});

test('a daily fact is read only once it is signed off and published', async () => {
  const db = service();
  const { data: f } = await db.from('daily_facts').select('id, slug, updated_at').eq('country', 'AU').limit(1).single();
  const refused = await db.from('daily_facts').update({ status: 'published' }).eq('id', f!.id);
  assert.ok(refused.error, 'an unsigned fact was published');

  const now = new Date().toISOString();
  const { error } = await db
    .from('daily_facts')
    .update({ verification_status: 'human_verified', verified_by: coachId, verified_at: now, status: 'published' })
    .eq('id', f!.id)
    .eq('updated_at', f!.updated_at);
  if (error) throw error;
  assert.deepEqual(await facts(learnerAU), [f!.slug]);
  assert.deepEqual(await facts(learnerMY), []);
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
