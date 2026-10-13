/**
 * Two-step sign-in for staff, against real Supabase Auth.
 *
 * The website already sends staff to type a code. These tests are about the
 * other door: the browser holds the public key and the person's own token,
 * so anybody with a staff member's password alone could sign in through
 * Supabase's API and read the database directly, never touching the
 * website. A staff role must count only once the code has been typed.
 */
import './target-guard';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { person, signIn, totp, service, asToken } from './helpers';

/**
 * Whether this token can read a staff-only record: the certification
 * register, which only staff read (is_coach() in its read policy).
 */
async function canSeeRegister(token: string): Promise<boolean> {
  const { data, error } = await asToken(token).from('certification_trainees').select('id').eq('id', registerId);
  if (error) throw error;
  return (data ?? []).length === 1;
}

/** Whether this token can read another person's profile (administrators only). */
async function canSeeLearner(token: string, learnerId: string): Promise<boolean> {
  const { data, error } = await asToken(token).from('profiles').select('id').eq('id', learnerId);
  if (error) throw error;
  return (data ?? []).length === 1;
}

let registerId = '';
before(async () => {
  const { data, error } = await service()
    .from('certification_trainees')
    .insert({ full_name: 'Register Trainee', firm_name: 'Firm' })
    .select('id')
    .single();
  if (error) throw error;
  registerId = data.id;
});

test('a staff password alone opens nothing a learner could not see', async () => {
  const learner = await person('learner');
  const coach = await person('coach');
  const admin = await person('admin');

  // The baseline: a learner reads neither.
  const other = await person('learner');
  assert.equal(await canSeeLearner(other.accessToken, learner.id), false);
  assert.equal(await canSeeRegister(other.accessToken), false);

  // Password only: neither does staff.
  assert.equal(
    await canSeeRegister(coach.accessToken),
    false,
    'a coach signed in with a password alone reads the register through the API',
  );
  assert.equal(
    await canSeeLearner(admin.accessToken, learner.id),
    false,
    'an administrator signed in with a password alone reads a learner through the API',
  );
});

test('the staff role counts once the code has been typed, and only then', async () => {
  const learner = await person('learner');
  const coach = await person('coach');

  const { data: factor, error: enrollError } = await coach.client.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'phone',
  });
  if (enrollError) throw enrollError;
  const secret = factor.totp.secret;

  // A wrong code is refused by Auth itself.
  const wrong = await coach.client.auth.mfa.challengeAndVerify({ factorId: factor.id, code: '000000' });
  assert.ok(wrong.error, 'a wrong code was accepted');

  const right = await coach.client.auth.mfa.challengeAndVerify({ factorId: factor.id, code: totp(secret) });
  if (right.error) throw right.error;
  const { data: level } = await coach.client.auth.mfa.getAuthenticatorAssuranceLevel();
  assert.equal(level?.currentLevel, 'aal2');
  const aal2Token = right.data.access_token;
  assert.equal(await canSeeRegister(aal2Token), true, 'with the code typed, a coach reads the register');

  // Signing in again with the password puts the session back to aal1, and
  // the staff role stops counting until the code is typed again.
  const again = await signIn(coach.email, coach.id);
  const { data: againLevel } = await again.client.auth.mfa.getAuthenticatorAssuranceLevel();
  assert.equal(againLevel?.currentLevel, 'aal1');
  assert.equal(againLevel?.nextLevel, 'aal2');
  assert.equal(await canSeeRegister(again.accessToken), false);
  void learner;
});

test('the service role, which the server uses, is not affected', async () => {
  const learner = await person('learner');
  const { data, error } = await service().from('profiles').select('id').eq('id', learner.id);
  if (error) throw error;
  assert.equal(data?.length, 1);
});
