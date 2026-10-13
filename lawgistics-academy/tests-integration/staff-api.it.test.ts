/**
 * Staff records through the database API directly, the way anybody holding
 * a staff member's password could reach them without the website: for each
 * kind of record a staff role opens, a password-only token (aal1) must get
 * what a learner gets, and the same account after typing the code (aal2)
 * gets the staff view. Reads and writes, coach and administrator.
 */
import './target-guard';
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { asToken, person, service, signIn, totp, type Person } from './helpers';

interface StaffSessions {
  person: Person;
  passwordOnly: string;
  withCode: string;
}

/** A staff account with an authenticator app, signed in both ways. */
async function staff(role: 'coach' | 'admin'): Promise<StaffSessions> {
  const p = await person(role);
  const { data: factor, error } = await p.client.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'phone' });
  if (error) throw error;
  const verified = await p.client.auth.mfa.challengeAndVerify({ factorId: factor.id, code: totp(factor.totp.secret) });
  if (verified.error) throw verified.error;
  const fresh = await signIn(p.email, p.id); // a new sign-in: password only, aal1
  return { person: p, passwordOnly: fresh.accessToken, withCode: verified.data.access_token };
}

let coach: StaffSessions;
let admin: StaffSessions;
let learner: Person;
let other: Person;
const ids: Record<string, string> = {};

before(async () => {
  coach = await staff('coach');
  admin = await staff('admin');
  learner = await person('learner', 'MY');
  other = await person('learner', 'MY');
  const db = service();
  const now = new Date().toISOString();

  const trainee = await db
    .from('certification_trainees')
    .insert({ full_name: 'Staff API Trainee', firm_name: 'Firm', created_by: coach.person.id })
    .select('id')
    .single();
  if (trainee.error) throw trainee.error;
  ids.trainee = trainee.data.id;
  const entry = await db
    .from('certification_entries')
    .insert({ trainee_id: ids.trainee, box_number: 1, case_no: 'REF-1', created_by: coach.person.id })
    .select('id')
    .single();
  if (entry.error) throw entry.error;
  ids.entry = entry.data.id;

  const post = await db
    .from('work_posts')
    .insert({ title: 'A letter of demand', posted_by: coach.person.id, published: true, published_at: now, trainees_only: false, country: 'MY' })
    .select('id')
    .single();
  if (post.error) throw post.error;
  ids.post = post.data.id;
  const message = await db
    .from('work_messages')
    .insert({ post_id: ids.post, thread_user_id: learner.id, sender_id: learner.id, body: 'Who should it go to?' })
    .select('id')
    .single();
  if (message.error) throw message.error;
  ids.message = message.data.id;

  const cert = await db.from('certificates').insert({ user_id: learner.id, country: 'MY', matters: 5 }).select('id').single();
  if (cert.error) throw cert.error;
  ids.certificate = cert.data.id;
  const decision = await db
    .from('onboarding_decisions')
    .insert({ user_id: learner.id, decision: 'cleared', decided_by: admin.person.id })
    .select('id')
    .single();
  if (decision.error) throw decision.error;
  ids.decision = decision.data.id;
});

/** How many of the given rows this token can read. */
async function reads(token: string, table: string, column: string, value: string): Promise<number> {
  const { data, error } = await asToken(token).from(table).select(column).eq(column, value);
  if (error) return 0;
  return (data ?? []).length;
}

const STAFF_READS: Array<{ what: string; who: 'coach' | 'admin'; table: string; column: string; id: () => string }> = [
  { what: 'the certification register', who: 'coach', table: 'certification_trainees', column: 'id', id: () => ids.trainee },
  { what: 'certification entries', who: 'coach', table: 'certification_entries', column: 'id', id: () => ids.entry },
  { what: "a learner's work-board thread", who: 'coach', table: 'work_messages', column: 'id', id: () => ids.message },
  { what: "a learner's certificate", who: 'coach', table: 'certificates', column: 'id', id: () => ids.certificate },
  { what: "another person's profile", who: 'admin', table: 'profiles', column: 'id', id: () => learner.id },
  { what: 'onboarding decisions', who: 'admin', table: 'onboarding_decisions', column: 'id', id: () => ids.decision },
];

for (const r of STAFF_READS) {
  test(`${r.what}: a learner no, password only no, with the code yes (${r.who})`, async () => {
    const s = r.who === 'coach' ? coach : admin;
    assert.equal(await reads(other.accessToken, r.table, r.column, r.id()), 0, 'another learner read it');
    assert.equal(await reads(s.passwordOnly, r.table, r.column, r.id()), 0, `a ${r.who} with a password alone read it`);
    assert.equal(await reads(s.withCode, r.table, r.column, r.id()), 1, `a ${r.who} with the code typed could not read it`);
  });
}

test('a coach with a password alone cannot change the certification register', async () => {
  const attempt = await asToken(coach.passwordOnly)
    .from('certification_entries')
    .update({ note: 'changed with a password alone' })
    .eq('id', ids.entry)
    .select('id');
  assert.equal(attempt.data?.length ?? 0, 0);
  const { data } = await service().from('certification_entries').select('note').eq('id', ids.entry).single();
  assert.notEqual(data!.note, 'changed with a password alone');

  const withCode = await asToken(coach.withCode)
    .from('certification_entries')
    .update({ note: 'corrected by the coach' })
    .eq('id', ids.entry)
    .select('id');
  assert.equal(withCode.data?.length, 1, 'a coach with the code typed could not correct an entry');
});

test('an administrator with a password alone cannot make anybody staff', async () => {
  const attempt = await asToken(admin.passwordOnly).from('profiles').update({ is_coach: true }).eq('id', other.id).select('id');
  assert.ok(attempt.error || (attempt.data ?? []).length === 0, 'a password alone granted a staff role');
  const { data } = await service().from('profiles').select('is_coach').eq('id', other.id).single();
  assert.equal(data!.is_coach, false);
});

test('a learner cannot make themselves staff, with or without a code', async () => {
  const attempt = await asToken(learner.accessToken).from('profiles').update({ is_admin: true }).eq('id', learner.id).select('id');
  assert.ok(attempt.error || (attempt.data ?? []).length === 0);
  const { data } = await service().from('profiles').select('is_admin').eq('id', learner.id).single();
  assert.equal(data!.is_admin, false);
});
