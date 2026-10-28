/**
 * The Advocacy Studio (0053) against real Supabase: Auth, PostgREST with each
 * person's own token, and real Storage.
 *
 * Recordings: the bucket is private and has no storage policy, so nobody
 * reads or writes a recording with their own token; a file arrives only
 * through a one-time upload link the server made for exactly its path, and
 * plays only through a short-lived link the server signed. Rows: a learner
 * reads their own attempts and nobody else's, a coach reads one only when it
 * was shared and only with the code typed, and nobody writes the Studio's
 * tables from a browser. The access log cannot be read from a browser or
 * changed by anybody, the server included.
 */
import './target-guard';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { anon, asToken, person, service, signIn, totp, type Person } from './helpers';

const BUCKET = 'studio-recordings';
const HASH = 'a'.repeat(64);

let learner: Person;
let other: Person;
let coach: Person;
let coachWithCode: string;
let coachPasswordOnly: string;
let privateAttempt: string;
let sharedAttempt: string;
let sharedPath: string;

async function consent(p: Person, sharing: boolean) {
  const { error } = await service().from('studio_consents').insert({
    user_id: p.id,
    notice_version: '2026-10',
    recording: true,
    ai_processing: false,
    trainer_sharing: sharing,
  });
  if (error) throw error;
}

async function attempt(p: Person, shared: boolean): Promise<{ id: string; path: string }> {
  const id = randomUUID();
  const path = `${p.id}/${id}/recording.webm`;
  const { error } = await service().from('studio_attempts').insert({
    id,
    user_id: p.id,
    exercise_key: 'free-practice',
    exercise_hash: HASH,
    recording_kind: 'video',
    recording_path: path,
    recording_mime: 'video/webm',
    recording_seconds: 30,
    recording_bytes: 16,
    ai_processing: false,
    shared_with_trainer: shared,
  });
  if (error) throw error;
  return { id, path };
}

before(async () => {
  learner = await person('learner', 'MY');
  other = await person('learner', 'MY');
  coach = await person('coach', 'MY');
  const { data: factor, error } = await coach.client.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'phone' });
  if (error) throw error;
  const verified = await coach.client.auth.mfa.challengeAndVerify({ factorId: factor.id, code: totp(factor.totp.secret) });
  if (verified.error) throw verified.error;
  coachWithCode = verified.data.access_token;
  coachPasswordOnly = (await signIn(coach.email, coach.id)).accessToken;

  await consent(learner, true);
  privateAttempt = (await attempt(learner, false)).id;
  const shared = await attempt(learner, true);
  sharedAttempt = shared.id;
  sharedPath = shared.path;
});

test('a recording reaches the bucket only through the server’s one-time link, for exactly its path', async () => {
  const bytes = new Blob([new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])], {
    type: 'video/webm',
  });

  // With their own token, a learner cannot put a file anywhere in the bucket,
  // not even in their own folder.
  const direct = await asToken(learner.accessToken)
    .storage.from(BUCKET)
    .upload(`${learner.id}/${randomUUID()}/recording.webm`, bytes, { contentType: 'video/webm' });
  assert.ok(direct.error, 'a direct upload is refused');

  // The server's link uploads exactly one file to exactly its place.
  const { data: link, error: linkError } = await service().storage.from(BUCKET).createSignedUploadUrl(sharedPath);
  assert.equal(linkError, null, linkError?.message);
  const sent = await anon().storage.from(BUCKET).uploadToSignedUrl(sharedPath, link!.token, bytes, {
    contentType: 'video/webm',
  });
  assert.equal(sent.error, null, sent.error?.message);

  // The same link cannot be used to put a file somewhere else.
  const elsewhere = await anon()
    .storage.from(BUCKET)
    .uploadToSignedUrl(`${other.id}/${randomUUID()}/recording.webm`, link!.token, bytes, { contentType: 'video/webm' });
  assert.ok(elsewhere.error, 'a link for one path does not write another');
});

test('nobody downloads a recording with their own token; the server’s short link plays it', async () => {
  for (const [who, token] of [
    ['the learner', learner.accessToken],
    ['another learner', other.accessToken],
    ['a coach with the code', coachWithCode],
  ] as const) {
    const { data, error } = await asToken(token).storage.from(BUCKET).download(sharedPath);
    assert.ok(error || !data, `${who} cannot download it directly`);
  }
  const anonymous = await anon().storage.from(BUCKET).download(sharedPath);
  assert.ok(anonymous.error || !anonymous.data, 'nor can anybody signed out');

  const { data: signed, error } = await service().storage.from(BUCKET).createSignedUrl(sharedPath, 60);
  assert.equal(error, null, error?.message);
  const res = await fetch(signed!.signedUrl);
  assert.equal(res.status, 200);
  assert.equal((await res.arrayBuffer()).byteLength, 16);

  const { data: bucket } = await service().storage.getBucket(BUCKET);
  assert.equal(bucket?.public, false, 'the bucket is private');
});

test('a learner reads their own attempts and nobody else’s', async () => {
  const own = await asToken(learner.accessToken).from('studio_attempts').select('id');
  assert.equal(own.error, null);
  assert.deepEqual(new Set(own.data!.map((r) => r.id)), new Set([privateAttempt, sharedAttempt]));

  const theirs = await asToken(other.accessToken).from('studio_attempts').select('id').eq('user_id', learner.id);
  assert.deepEqual(theirs.data ?? [], [], 'another learner sees none of them');
});

test('a coach reads only what was shared, and only with the code typed', async () => {
  const withCode = await asToken(coachWithCode).from('studio_attempts').select('id').eq('user_id', learner.id);
  assert.equal(withCode.error, null);
  assert.deepEqual(withCode.data!.map((r) => r.id), [sharedAttempt], 'the shared one, not the private one');

  const passwordOnly = await asToken(coachPasswordOnly).from('studio_attempts').select('id').eq('user_id', learner.id);
  assert.deepEqual(passwordOnly.data ?? [], [], 'a password alone shows a coach nothing');

  // Stopping sharing takes it away at once.
  await service().from('studio_attempts').update({ shared_with_trainer: false }).eq('id', sharedAttempt);
  const after = await asToken(coachWithCode).from('studio_attempts').select('id').eq('user_id', learner.id);
  assert.deepEqual(after.data ?? [], []);
  await service().from('studio_attempts').update({ shared_with_trainer: true }).eq('id', sharedAttempt);
});

test('nobody writes the Studio’s tables from a browser', async () => {
  const t = asToken(learner.accessToken);
  const c = await t.from('studio_consents').insert({
    user_id: learner.id,
    notice_version: '2026-10',
    recording: true,
    ai_processing: true,
    trainer_sharing: true,
  });
  assert.ok(c.error, 'consent is recorded by the server, never typed into the API');

  const a = await t.from('studio_attempts').insert({
    user_id: learner.id,
    exercise_key: 'free-practice',
    exercise_hash: HASH,
  });
  assert.ok(a.error, 'an attempt is made by the server');

  const u = await t.from('studio_attempts').update({ shared_with_trainer: false }).eq('id', sharedAttempt).select('id');
  assert.ok(u.error || (u.data ?? []).length === 0, 'a learner changes sharing only through the website');

  const r = await asToken(coachWithCode).from('studio_reviews').insert({
    attempt_id: sharedAttempt,
    reviewer_id: coach.id,
    feedback: 'Typed straight into the API.',
  });
  assert.ok(r.error, 'a review is saved by the server after its checks');
});

test('the access log: written by the server, read by nobody in a browser, changed by nobody', async () => {
  const { data: row, error } = await service()
    .from('studio_access_log')
    .insert({ attempt_id: sharedAttempt, staff_id: coach.id, action: 'opened' })
    .select('id')
    .single();
  assert.equal(error, null, error?.message);

  const read = await asToken(coachWithCode).from('studio_access_log').select('id');
  assert.ok(read.error || (read.data ?? []).length === 0, 'not readable from a browser, even by a coach');

  const changed = await service().from('studio_access_log').update({ action: 'reviewed' }).eq('id', row!.id);
  assert.ok(changed.error, 'the server cannot change an entry');
  const removed = await service().from('studio_access_log').delete().eq('id', row!.id);
  assert.ok(removed.error, 'the server cannot delete an entry');
});

test('a consent decision is kept: the server cannot change or delete one', async () => {
  const { data } = await service().from('studio_consents').select('id').eq('user_id', learner.id).limit(1).single();
  const changed = await service().from('studio_consents').update({ trainer_sharing: false }).eq('id', data!.id);
  assert.ok(changed.error, 'a later choice is a new row');
  const removed = await service().from('studio_consents').delete().eq('id', data!.id);
  assert.ok(removed.error);
});
