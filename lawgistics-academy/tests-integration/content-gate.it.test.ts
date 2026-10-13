/**
 * The content gate (0046) through the REST API with a learner's own token:
 * matters, the lawyer's model answer, legal sources and the sign-off record
 * itself. Lessons and court maps live in the code and are gated on the
 * server; their tests are in tests/content-gate.test.ts.
 */
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { asToken, person, service, type Person } from './helpers';

let learner: Person;
let coachId: string;
let matterId: string;

before(async () => {
  learner = await person('learner', 'MY');
  coachId = (await person('coach')).id;
  const { data, error } = await service().from('matters').select('id').eq('country', 'MY').limit(1).single();
  if (error) throw error;
  matterId = data.id;
});

async function learnerSeesMatter(): Promise<boolean> {
  const { data, error } = await asToken(learner.accessToken).from('matters').select('id').eq('id', matterId);
  if (error) throw error;
  return (data ?? []).length === 1;
}

test('a published matter reaches a learner only with a sign-off, and not while flagged', async () => {
  const db = service();
  const now = new Date().toISOString();

  // Published but unsigned: the database itself keeps it from the learner.
  await db.from('matters').update({ published: true, published_at: now, verified_by: null, verified_at: null }).eq('id', matterId);
  const { data: state } = await db.from('matters').select('published, verified_by').eq('id', matterId).single();
  if (state?.published) assert.equal(await learnerSeesMatter(), false, 'an unsigned matter reached a learner');

  const signed = await db
    .from('matters')
    .update({ verified_by: coachId, verified_at: now, published: true, published_at: now, review_flagged: false })
    .eq('id', matterId)
    .select('id');
  if (signed.error) throw signed.error;
  assert.equal(await learnerSeesMatter(), true, 'a signed, published matter did not reach the learner');

  await db.from('matters').update({ review_flagged: true, review_note: 'Check the time limit.' }).eq('id', matterId);
  assert.equal(await learnerSeesMatter(), false, 'a flagged matter still reached the learner');
});

test('a learner reads no legal sources and no sign-off records', async () => {
  const client = asToken(learner.accessToken);
  const sources = await client.from('legal_sources').select('id');
  assert.deepEqual(sources.data ?? [], []);
  const signoffs = await client.from('content_signoffs').select('id');
  assert.ok(signoffs.error || (signoffs.data ?? []).length === 0);
  const write = await client
    .from('content_signoffs')
    .insert({ content_key: 'court-map-my', content_hash: 'a'.repeat(64), signed_by: learner.id });
  assert.ok(write.error, 'a learner wrote a sign-off');
});
