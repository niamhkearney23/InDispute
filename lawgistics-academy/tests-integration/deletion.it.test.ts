/**
 * Deleting an account, against real Supabase Auth, the REST API and Storage,
 * including what happens when Auth or Storage is down part way through.
 *
 * The deletion code is the app's own (`runErasure` with the service-role
 * dependencies), pointed at the throwaway Supabase. Failures are real: the
 * Auth or Storage container is stopped, not mocked.
 */
import './target-guard';
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { runErasure, retryIncompleteErasures, serviceErasureDeps, type ErasureDeps } from '../src/lib/account/erasure';
import { goodbyePath } from '../src/lib/account/erasure-rules';
import {
  ANON_KEY,
  PASSWORD,
  TARGET,
  URL,
  anon,
  asToken,
  person,
  service,
  service_container,
  waitUntilUp,
  type Person,
} from './helpers';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

after(async () => {
  // Whatever happened, leave the stack running for the next file.
  if (TARGET !== 'local') return;
  service_container('auth', 'start');
  service_container('storage', 'start');
  await waitUntilUp('auth');
  await waitUntilUp('storage');
});

/**
 * Auth or Storage failing part way through a deletion. On the local stack the
 * service is really stopped. On hosted staging, which cannot be stopped, the
 * one call the app makes to that service fails instead, with everything else
 * real; the returned deps are what the deletion runs with during the outage.
 */
function outage(kind: 'auth' | 'storage', real: ErasureDeps): { deps: ErasureDeps; end: () => Promise<void> } {
  if (TARGET === 'local') {
    service_container(kind, 'stop');
    return {
      deps: real,
      end: async () => {
        service_container(kind, 'start');
        await waitUntilUp(kind);
      },
    };
  }
  const down = async () => {
    throw new Error(`${kind} is not answering (injected for the staging run)`);
  };
  const deps: ErasureDeps =
    kind === 'auth'
      ? { ...real, closeSignIn: down }
      : { ...real, listFolder: down, removeFiles: down };
  return { deps, end: async () => {} };
}

async function learnerWithPhoto(): Promise<Person> {
  const learner = await person('learner', 'MY');
  const { error } = await service()
    .storage.from('avatars')
    .upload(`${learner.id}/photo.png`, PNG, { contentType: 'image/png', upsert: true });
  if (error) throw error;
  return learner;
}

async function photosOf(id: string): Promise<string[]> {
  const { data, error } = await service().storage.from('avatars').list(id);
  if (error) throw error;
  return (data ?? []).map((f) => f.name);
}

async function job(id: string) {
  const { data, error } = await service().from('account_erasures').select('*').eq('user_id', id).single();
  if (error) throw error;
  return data;
}

/** Everything a person could try with what their browser already holds. */
async function whatTheyCanStillDo(p: Person) {
  const client = asToken(p.accessToken);
  const ownProfile = await client.from('profiles').select('id, display_name').eq('id', p.id);
  const ownAnswers = await client.from('user_question_attempts').select('id').eq('user_id', p.id);
  const ownPhotos = await fetch(`${URL}/storage/v1/object/list/avatars`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${p.accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ prefix: p.id, limit: 10 }),
  });
  const photoList = ownPhotos.ok ? ((await ownPhotos.json()) as unknown[]) : [];
  return {
    readsProfile: !ownProfile.error && (ownProfile.data ?? []).length > 0,
    answersError: ownAnswers.error?.message ?? null,
    restError: ownProfile.error?.message ?? null,
    listsPhotos: photoList.length > 0,
  };
}

test('with Auth down, the database step still ends every way in, and a retry finishes the job', async () => {
  const learner = await learnerWithPhoto();
  const deps = serviceErasureDeps(service());

  // Before: the person reads their own profile.
  assert.equal((await whatTheyCanStillDo(learner)).readsProfile, true);

  const authDown = outage('auth', deps);
  const outcome = await runErasure(learner.id, { requestedBy: learner.id, deps: authDown.deps });
  assert.equal(outcome.kind, 'incomplete', 'a deletion with Auth down was reported finished');
  assert.ok(outcome.kind === 'incomplete' && outcome.pending.includes('signIn'));
  assert.notEqual(goodbyePath(outcome), '/goodbye', 'the person would have been told it was all done');

  // The database part is done and recorded.
  const halfway = await job(learner.id);
  assert.ok(halfway.database_done_at, 'the database step is not recorded');
  assert.ok(halfway.sessions_done_at, 'the sessions were not revoked in the database step');
  assert.equal(halfway.auth_done_at, null);
  assert.equal(halfway.completed_at, null);
  assert.match(halfway.last_error ?? '', /Sign-in/);

  // The token their browser holds no longer opens anything: the REST API
  // refuses the erased account outright, and Storage shows nothing.
  const access = await whatTheyCanStillDo(learner);
  assert.equal(access.readsProfile, false, 'the erased person still reads their profile');
  assert.match(access.restError ?? '', /deleted/i);
  assert.match((await whatTheyCanStillDo(learner)).answersError ?? '', /deleted/i);
  assert.equal(access.listsPhotos, false, 'the erased person still lists their photo');

  await authDown.end();

  // The refresh token was revoked in the database step, so the session
  // cannot be renewed.
  const refreshed = await anon().auth.refreshSession({ refresh_token: learner.refreshToken });
  assert.ok(refreshed.error, 'a revoked session was renewed');

  // Their password still works at Auth (the ban never happened), and still
  // opens nothing: the database refuses the account whatever Auth says.
  const again = await anon().auth.signInWithPassword({ email: learner.email, password: PASSWORD });
  assert.ok(!again.error && again.data.session, 'expected Auth to still let the password in, since the ban never happened');
  const fresh = { ...learner, accessToken: again.data.session!.access_token };
  const stillDoes = await whatTheyCanStillDo(fresh);
  assert.equal(stillDoes.readsProfile, false, 'a fresh sign-in reads the erased profile');
  assert.equal(stillDoes.listsPhotos, false, 'a fresh sign-in lists the erased photo');

  // The retry finishes it.
  const retried = await runErasure(learner.id, { deps });
  assert.equal(retried.kind, 'complete');
  const done = await job(learner.id);
  assert.ok(done.auth_done_at && done.storage_done_at && done.completed_at);
  assert.deepEqual(await photosOf(learner.id), []);

  // And now Auth itself turns them away.
  const after = await anon().auth.signInWithPassword({ email: learner.email, password: PASSWORD });
  assert.ok(after.error, 'the deleted account could still sign in after the deletion finished');
  const { data: user } = await service().auth.admin.getUserById(learner.id);
  assert.match(user.user?.email ?? '', /^erased-.*@invalid\.invalid$/);
});

test('with Storage down, the person is not told it is done, and the daily retry finishes it', async () => {
  const learner = await learnerWithPhoto();
  const deps = serviceErasureDeps(service());

  const storageDown = outage('storage', deps);
  const outcome = await runErasure(learner.id, { requestedBy: learner.id, deps: storageDown.deps });
  await storageDown.end();

  assert.equal(outcome.kind, 'incomplete', 'a deletion with Storage down was reported finished');
  assert.ok(outcome.kind === 'incomplete' && outcome.pending.includes('files'));
  assert.ok(outcome.kind === 'incomplete' && !outcome.pending.includes('signIn'));
  assert.match(goodbyePath(outcome), /pending=files/);

  const halfway = await job(learner.id);
  assert.equal(halfway.storage_done_at, null);
  assert.equal(halfway.completed_at, null);
  assert.match(halfway.last_error ?? '', /Files/);
  assert.deepEqual(await photosOf(learner.id), ['photo.png'], 'the photo should still be waiting');

  // Signing in is already closed, Storage or not.
  const signIn = await anon().auth.signInWithPassword({ email: learner.email, password: PASSWORD });
  assert.ok(signIn.error);

  // What the daily job runs.
  const summary = await retryIncompleteErasures({ deps, limit: 50 });
  assert.ok(summary.completed >= 1);
  const done = await job(learner.id);
  assert.ok(done.completed_at, 'the retry did not finish the deletion');
  assert.deepEqual(await photosOf(learner.id), []);
});

test('a finished deletion leaves no way back in, and is not repeated', async () => {
  const learner = await learnerWithPhoto();
  const deps = serviceErasureDeps(service());
  const first = await runErasure(learner.id, { requestedBy: learner.id, deps });
  assert.equal(first.kind, 'complete');

  const access = await whatTheyCanStillDo(learner);
  assert.equal(access.readsProfile, false);
  assert.equal(access.listsPhotos, false);
  assert.ok((await anon().auth.refreshSession({ refresh_token: learner.refreshToken })).error);
  assert.ok((await anon().auth.signInWithPassword({ email: learner.email, password: PASSWORD })).error);

  const { data: profile } = await service()
    .from('profiles')
    .select('display_name, email, erased_at, avatar_url')
    .eq('id', learner.id)
    .single();
  assert.equal(profile!.display_name, 'Deleted account');
  assert.ok(profile!.erased_at);
  assert.equal(profile!.avatar_url, null);

  const before = await job(learner.id);
  const again = await runErasure(learner.id, { deps });
  assert.equal(again.kind, 'complete');
  assert.equal((await job(learner.id)).attempts, before.attempts, 'a finished deletion ran again');
});

test('a staff account is refused, by the code and by the database', async () => {
  const coach = await person('coach');
  const outcome = await runErasure(coach.id, { deps: serviceErasureDeps(service()) });
  assert.equal(outcome.kind, 'refused');
  const direct = await service().rpc('erase_account', { uid: coach.id, by_whom: null });
  assert.ok(direct.error, 'the database erased a staff account');
  assert.match(direct.error.message, /staff/i);
});

test('nobody signed in can run the deletion functions themselves', async () => {
  const learner = await person('learner');
  const victim = await person('learner');
  const client = asToken(learner.accessToken);
  for (const [fn, args] of [
    ['erase_account', { uid: victim.id }],
    ['revoke_account_sessions', { uid: victim.id }],
  ] as const) {
    const { error } = await client.rpc(fn, args);
    assert.ok(error, `${fn} ran for a signed-in learner`);
  }
  const { data } = await client.from('account_erasures').select('user_id');
  assert.deepEqual(data ?? [], []);
  assert.equal((await whatTheyCanStillDo(victim)).readsProfile, true, 'the other account was touched');
});

test('with the credentials they still hold, a deleted person reaches none of their records', async () => {
  // Before: a learner with answers, a work-board thread, a certificate and a
  // photo, and the access token and refresh token their browser keeps.
  const learner = await learnerWithPhoto();
  const db = service();
  const now = new Date().toISOString();
  const coach = await person('coach');
  const { data: version } = await db.from('question_versions').select('id, question_id').eq('is_current', true).limit(1).single();
  if (version) {
    const { error } = await db.from('user_question_attempts').insert({
      user_id: learner.id,
      question_id: version.question_id,
      question_version_id: version.id,
      selected_option_ids: ['a'],
      is_correct: true,
    });
    if (error) throw error;
  }
  const post = await db
    .from('work_posts')
    .insert({ title: 'Deletion thread', posted_by: coach.id, published: true, published_at: now, trainees_only: false, country: 'MY' })
    .select('id')
    .single();
  if (post.error) throw post.error;
  const { error: msgError } = await db
    .from('work_messages')
    .insert({ post_id: post.data.id, thread_user_id: learner.id, sender_id: learner.id, body: 'My question.' });
  if (msgError) throw msgError;
  const { error: certError } = await db.from('certificates').insert({ user_id: learner.id, country: 'MY', matters: 5 });
  if (certError) throw certError;

  // While still an account: they read their own records.
  const before = asToken(learner.accessToken);
  assert.equal((await before.from('certificates').select('id').eq('user_id', learner.id)).data?.length, 1);
  assert.equal((await before.from('work_messages').select('id').eq('thread_user_id', learner.id)).data?.length, 1);

  const outcome = await runErasure(learner.id, { requestedBy: learner.id, deps: serviceErasureDeps(db) });
  assert.equal(outcome.kind, 'complete');

  // After: the same token gets nothing from any table, view or function.
  const client = asToken(learner.accessToken);
  for (const [table, column] of [
    ['profiles', 'id'],
    ['user_question_attempts', 'user_id'],
    ['training_sessions', 'user_id'],
    ['work_messages', 'thread_user_id'],
    ['work_claims', 'user_id'],
    ['work_submissions', 'user_id'],
    ['certificates', 'user_id'],
    ['matter_attempts', 'user_id'],
    ['homework_declarations', 'user_id'],
    ['user_streaks', 'user_id'],
    ['xp_events', 'user_id'],
    ['access_grants', 'user_id'],
  ] as const) {
    const { data, error } = await client.from(table).select(column).eq(column, learner.id);
    assert.ok(error || (data ?? []).length === 0, `${table} is still readable with the old token`);
    if (error) assert.match(error.message, /deleted/i, `${table} refused for another reason: ${error.message}`);
  }
  const view = await client.from('v_question_delivery').select('question_id').limit(1);
  assert.ok(view.error, 'the question delivery view still answers the old token');
  for (const [fn, args] of [
    ['weekly_leaderboard', {}],
    ['work_post_comments', { post: post.data.id }],
    ['work_board_people', {}],
  ] as const) {
    const { error } = await client.rpc(fn, args);
    assert.ok(error, `${fn} still answers the old token`);
  }
  const photo = await fetch(`${URL}/storage/v1/object/authenticated/avatars/${learner.id}/photo.png`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${learner.accessToken}` },
  });
  assert.notEqual(photo.status, 200, 'the old token still downloads the photo');

  // And the session cannot be renewed or started again.
  assert.ok((await anon().auth.refreshSession({ refresh_token: learner.refreshToken })).error);
  assert.ok((await anon().auth.signInWithPassword({ email: learner.email, password: PASSWORD })).error);
});
