import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import { awaitingFirm, countdown, daysUntil, settles } from '../src/lib/onboarding/rules';
import { hashToken, newToken } from '../src/lib/onboarding/invitations';

/**
 * Before you begin.
 *
 * The feature makes one promise to a firm: that when somebody is recorded as
 * cleared to begin, that record says who decided, when, and what was still
 * outstanding at the time, and that none of those three things can be changed
 * afterwards by anybody. Everything below defends some part of that.
 */

const ROOT = path.join(__dirname, '..');
const MIGRATION = fs.readFileSync(
  path.join(ROOT, 'supabase/migrations/0008_before_you_begin.sql'),
  'utf8',
);

/**
 * The schema with the prose taken out. As in the firm tests: this file's
 * comments name the things it deliberately does not do, so a test that scans
 * the raw text finds its own explanation and passes for the wrong reason.
 */
const SCHEMA_ONLY = MIGRATION.replace(/--.*$/gm, '');

const SERVICE = fs.readFileSync(path.join(ROOT, 'src/lib/onboarding/service.ts'), 'utf8');
const ACTIONS = fs.readFileSync(
  path.join(ROOT, 'src/app/admin/onboarding/actions.ts'),
  'utf8',
);

// -----------------------------------------------------------------------------
// What counts as done
// -----------------------------------------------------------------------------

test('reading is finished by the person who read it, and by nobody else', () => {
  assert.equal(settles('read', false, null, null), false);
  assert.equal(settles('read', false, '2026-08-01T00:00:00Z', null), true);

  // Even if a confirmation somehow existed against a reading step, it does not
  // make one. You cannot observe somebody reading, and the acknowledgement is
  // the only honest record there will ever be.
  assert.equal(settles('read', false, null, '2026-08-01T00:00:00Z'), false);
  assert.equal(awaitingFirm('read', true, '2026-08-01T00:00:00Z', null), false);
});

test('an item the firm checks needs both halves, in either order', () => {
  assert.equal(settles('sign', true, null, null), false);
  assert.equal(settles('sign', true, '2026-08-01T00:00:00Z', null), false, 'their word alone');
  assert.equal(settles('sign', true, null, '2026-08-01T00:00:00Z'), false, 'ours alone');
  assert.equal(settles('sign', true, '2026-08-01T00:00:00Z', '2026-08-02T00:00:00Z'), true);
});

test('an item the firm does not check is finished when they say so', () => {
  assert.equal(settles('task', false, '2026-08-01T00:00:00Z', null), true);
  assert.equal(awaitingFirm('task', false, '2026-08-01T00:00:00Z', null), false);
});

test('waiting on the firm is a state of its own, not merely "not done"', () => {
  // This is the whole worklist for whoever oversees it. If it collapsed into
  // "outstanding", a joiner who had done everything they could would be
  // indistinguishable from one who had done nothing.
  assert.equal(awaitingFirm('sign', true, '2026-08-01T00:00:00Z', null), true);
  assert.equal(awaitingFirm('sign', true, null, null), false, 'they have not done it yet');
  assert.equal(
    awaitingFirm('sign', true, '2026-08-01T00:00:00Z', '2026-08-02T00:00:00Z'),
    false,
    'already confirmed',
  );
});

// -----------------------------------------------------------------------------
// The countdown
// -----------------------------------------------------------------------------

const MELBOURNE = 'Australia/Melbourne';
const KL = 'Asia/Kuala_Lumpur';

test('the countdown is in whole days and survives the clocks changing', () => {
  // Australia puts its clocks forward on 4 October 2026, so one of the days in
  // this span is 23 hours long. Subtracting timestamps and dividing by
  // 86,400,000 gives 6.958 and rounds badly; counting calendar dates does not.
  const morning = new Date('2026-09-30T09:00:00+10:00');
  assert.equal(daysUntil('2026-10-07', MELBOURNE, morning), 7);

  assert.equal(daysUntil('2026-10-01', MELBOURNE, morning), 1);
  assert.equal(daysUntil('2026-09-30', MELBOURNE, morning), 0);
  assert.equal(daysUntil('2026-09-29', MELBOURNE, morning), -1);
});

test('the countdown is counted where the person is, not where the server is', () => {
  // The regression this exists for. These pages render on the server, which on
  // Vercel is UTC. Kuala Lumpur is eight hours ahead, so until 8am local it is
  // still the previous day in UTC, and a server-local calculation tells
  // somebody arriving at seven that they begin tomorrow. It is their first day
  // and they are early; they will notice.
  const morningInKL = new Date('2026-09-30T07:00:00+08:00');

  assert.equal(daysUntil('2026-09-30', KL, morningInKL), 0, 'they begin today');
  assert.equal(countdown('2026-09-30', KL, morningInKL), 'You begin today.');

  // Same instant, read in UTC, genuinely is the day before. The two answers
  // differing is the point: the timezone has to come from the person.
  assert.equal(daysUntil('2026-09-30', 'UTC', morningInKL), 1);
});

test('an unrecognised timezone falls back rather than taking the page down', () => {
  const noon = new Date('2026-09-30T12:00:00Z');
  assert.equal(daysUntil('2026-10-01', 'Mars/Olympus_Mons', noon), 1);
});

test('the countdown reads as a sentence at every distance', () => {
  const today = new Date('2026-09-30T09:00:00+10:00');
  assert.match(countdown('2026-10-07', MELBOURNE, today), /^You begin in 7 days,/);
  assert.match(countdown('2026-10-01', MELBOURNE, today), /^You begin tomorrow,/);
  assert.equal(countdown('2026-09-30', MELBOURNE, today), 'You begin today.');
  assert.match(countdown('2026-09-01', MELBOURNE, today), /^You began on/);
});

test('a distant or mistyped start date gives the date rather than a day count', () => {
  const today = new Date('2026-09-30T09:00:00+10:00');

  // A year typed as 2099 instead of 2029 would otherwise read "you begin in
  // 26,503 days", which tells a joiner nothing except that nobody checked.
  assert.equal(countdown('2099-03-02', MELBOURNE, today), 'You begin on 2 March 2099.');

  // The boundary holds on both sides, so a genuine two-month notice period
  // still gets the count somebody would find useful.
  assert.match(countdown('2026-11-29', MELBOURNE, today), /^You begin in 60 days,/);
  assert.equal(countdown('2026-11-30', MELBOURNE, today), 'You begin on 30 November 2026.');
});

// -----------------------------------------------------------------------------
// The record
// -----------------------------------------------------------------------------

test('nothing recorded can be edited or removed, by anybody', () => {
  // The evidentiary value of all three tables is that they only ever grow.
  // An administrator who could delete a declaration could remove the fact that
  // somebody told the firm they had signed something.
  for (const table of [
    'firm_step_declarations',
    'firm_step_confirmations',
    'onboarding_decisions',
  ]) {
    const policies = [
      ...SCHEMA_ONLY.matchAll(
        new RegExp(`create policy (\\w+) on public\\.${table}\\s+for (\\w+)`, 'g'),
      ),
    ];

    assert.ok(policies.length > 0, `${table} should have policies`);
    assert.deepEqual(
      policies.map((m) => m[2].toLowerCase()).sort(),
      ['insert', 'select'],
      `${table}: insert and select only, administrators included`,
    );
  }
});

test('every date in the record is the database’s, never the request’s', () => {
  for (const column of ['declared_at', 'confirmed_at', 'decided_at']) {
    assert.match(
      SCHEMA_ONLY,
      new RegExp(`new\\.${column}\\s*:=\\s*now\\(\\)`),
      `${column} must be stamped by a trigger, or a request could name its own date`,
    );
  }

  // And the triggers are actually attached, which the assertion above does not
  // prove on its own.
  for (const trigger of [
    'firm_step_declarations_stamp',
    'firm_step_confirmations_stamp',
    'onboarding_decisions_stamp',
  ]) {
    assert.ok(SCHEMA_ONLY.includes(trigger), `${trigger} should be created`);
  }
});

test('a confirmation and a decision carry the name of whoever made it', () => {
  // Without this the record says "the firm confirmed it", which nobody can
  // stand behind. The policies pin the column to the caller; the service passes
  // the signed-in administrator's own id, because the service role bypasses RLS.
  assert.match(
    SCHEMA_ONLY,
    /confirmed_by\s+uuid\s+not null\s+references auth\.users/,
    'a confirmation must name a real person',
  );
  assert.match(
    SCHEMA_ONLY,
    /decided_by\s+uuid\s+not null\s+references auth\.users/,
    'a decision must name a real person',
  );
  assert.ok(
    /with check \(public\.is_admin\(\) and confirmed_by = auth\.uid\(\)\)/.test(SCHEMA_ONLY),
    'an administrator must not be able to write somebody else’s name into confirmed_by',
  );
  assert.ok(
    /with check \(public\.is_admin\(\) and decided_by = auth\.uid\(\)\)/.test(SCHEMA_ONLY),
    'nor into decided_by',
  );
});

test('what was outstanding at the moment of a decision is counted by the server', () => {
  // A stale browser tab must not be able to record that nothing was outstanding
  // at a moment when something was. The count is recomputed in the service and
  // the action never reads one from the form.
  assert.match(
    SERVICE,
    /outstanding_count: person\.state\.outstanding\.length/,
    'recordDecision must count for itself',
  );
  assert.ok(
    !/outstanding_count/.test(ACTIONS),
    'the action must not accept an outstanding count from anywhere',
  );
  assert.ok(
    !/formData\.get\(['"]outstandingCount['"]\)/.test(ACTIONS),
    'and certainly not from the form',
  );
});

test('a clearance is withdrawn by recording a withdrawal, not by deleting anything', () => {
  assert.match(SCHEMA_ONLY, /create type onboarding_decision as enum \('cleared', 'withdrawn'\)/);
  // No unique constraint on user_id: a person accumulates decisions over time
  // and the latest one is the current state. A unique constraint here would
  // force a withdrawal to overwrite the clearance it is undoing.
  assert.ok(
    !/onboarding_decisions[\s\S]*?unique \(user_id\)/.test(SCHEMA_ONLY),
    'decisions accumulate; the current state is the most recent one',
  );
  assert.match(
    SERVICE,
    /\.order\('decided_at', \{ ascending: false \}\)/,
    'the current state must be read as the latest decision',
  );
});

test('a start date is the firm’s fact about somebody, not their own setting', () => {
  // Somebody who could move their own start date could clear their own
  // deadline. RLS cannot restrict a single column, so this rides on the same
  // trigger that stops a learner making themselves an administrator.
  assert.match(
    SCHEMA_ONLY,
    /if new\.starts_on is distinct from old\.starts_on[\s\S]*?raise exception/,
    'starts_on must be guarded in guard_profile_privileges',
  );
});

test('an acknowledged or declared item cannot be deleted out from under the record', () => {
  // Deleting a step somebody has declared would orphan the fact that they did.
  const restricts = [...SCHEMA_ONLY.matchAll(/references public\.firm_steps \(id\) on delete (\w+)/g)];
  assert.ok(restricts.length >= 2, 'declarations and confirmations both point at a step');
  for (const match of restricts) {
    assert.equal(match[1], 'restrict', 'a step somebody has acted on must not be deletable');
  }
});

// -----------------------------------------------------------------------------
// The separation from training, as in 0007
// -----------------------------------------------------------------------------

test('the checklist is never verified by us and never entered into training', () => {
  for (const forbidden of ['verification_status', 'review_flagged', 'human_verified']) {
    assert.ok(
      !SCHEMA_ONLY.includes(forbidden),
      `0008 mentions ${forbidden}: a firm's own checklist does not go through our review queue`,
    );
  }

  for (const trainingTable of [
    'v_question_delivery',
    'user_question_attempts',
    'review_schedule',
    'user_concept_mastery',
  ]) {
    assert.ok(
      !SERVICE.includes(trainingTable),
      `the onboarding service touches ${trainingTable}: a checklist is a record, not a skill`,
    );
  }
});

test('a reading step points at a firm document and cannot be ticked without opening it', () => {
  assert.match(
    SCHEMA_ONLY,
    /check \(\(kind = 'read'\) = \(firm_module_id is not null\)\)/,
    'a reading step must point at a document, and nothing else may',
  );
  assert.match(
    SCHEMA_ONLY,
    /check \(kind <> 'read' or not needs_firm_check\)/,
    'nobody confirms that somebody else read something',
  );
  assert.match(
    SERVICE,
    /if \(step\.kind === 'read'\) \{\s*return \{ error: 'Open the document/,
    'declareStep must refuse a reading step rather than tick it',
  );
});

// -----------------------------------------------------------------------------
// The invitation token
// -----------------------------------------------------------------------------
// The link is the only credential that gets somebody into this system without
// an account already existing, so the token itself is worth testing directly
// rather than only through the source-scanning checks in the authorisation
// contract. Creating the account needs a real Supabase project and is not
// exercised here; these are the parts that can be.

test('a token is long, random, and url-safe', () => {
  const a = newToken();
  const b = newToken();

  assert.notEqual(a, b, 'two tokens must not collide');
  // 32 bytes as base64url. Shorter than this and guessing starts to be a
  // strategy rather than a fantasy.
  assert.ok(a.length >= 43, `token was only ${a.length} characters`);
  assert.match(a, /^[A-Za-z0-9_-]+$/, 'a token goes in a URL and must survive it intact');

  // A hundred tokens, all different. Not a randomness test, but it would catch
  // the failure that actually happens: a constant or a counter.
  const many = new Set(Array.from({ length: 100 }, () => newToken()));
  assert.equal(many.size, 100);
});

test('hashing a token is stable, one-way in practice, and sensitive to every character', () => {
  const token = newToken();

  assert.equal(hashToken(token), hashToken(token), 'the same token must always hash the same');
  assert.match(hashToken(token), /^[0-9a-f]{64}$/, 'SHA-256 as hex');
  assert.notEqual(hashToken(token), token, 'the stored value is not the token');
  assert.ok(!hashToken(token).includes(token.slice(0, 8)), 'the hash does not contain the token');

  // One character different is a completely different hash, so a near-miss
  // link cannot be walked towards a real one.
  const almost = `${token.slice(0, -1)}${token.endsWith('A') ? 'B' : 'A'}`;
  assert.notEqual(hashToken(almost), hashToken(token));
});
