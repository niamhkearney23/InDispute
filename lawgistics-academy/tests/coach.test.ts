import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * The coach can judge, and cannot rewrite.
 *
 * A firm that buys this gives the review login to the lawyer who supervises the
 * juniors. They are not a one-off reviewer who signs a batch and leaves: they
 * log in every week, decide whether content is sound, and decide whether a
 * person is ready to be put in front of a client. That is a real role and it
 * needs real rights.
 *
 * What it must not include is writing content. Editing a question mints a new
 * version and clears its sign-off, so an account that could both edit and
 * verify could rewrite an item and sign its own rewrite in one sitting, with
 * the audit trail showing nothing but an ordinary review. The whole value of
 * the record is that the person who wrote a thing and the person who stood
 * behind it are two people, or at least two acts.
 *
 * The queue already has the right escape hatch: a coach who thinks an item is
 * wrong flags it with a note, and a flag without a note is refused. So there is
 * no case where the coach needs to reach for the editor.
 *
 * These are structural checks against the page files. They are cheap, and the
 * failure they exist for is cheap too: somebody moves a page to requireCoach
 * because a coach complained they could not get to it.
 */

const ROOT = path.join(import.meta.dirname, '..');

/** Pages that write content or change what the firm asks of people. */
const ADMIN_ONLY = [
  'src/app/admin/page.tsx',
  'src/app/admin/questions/new/page.tsx',
  'src/app/admin/questions/[id]/page.tsx',
  'src/app/admin/facts/page.tsx',
  'src/app/admin/facts/new/page.tsx',
  'src/app/admin/facts/[id]/page.tsx',
  'src/app/admin/firm/page.tsx',
  'src/app/admin/firm/new/page.tsx',
  'src/app/admin/firm/[id]/page.tsx',
  'src/app/admin/onboarding/invite/page.tsx',
  'src/app/admin/onboarding/steps/page.tsx',
  'src/app/admin/onboarding/steps/new/page.tsx',
  'src/app/admin/onboarding/steps/[id]/page.tsx',
];

/** Pages a coach is meant to open. */
const COACH_PAGES = [
  'src/app/admin/review/page.tsx',
  'src/app/admin/onboarding/page.tsx',
  'src/app/admin/onboarding/[userId]/page.tsx',
  // The coach's own sessions. Writing these is the one exception to "a coach
  // does not write content", and it is an exception because a session is not
  // the question bank: no version chain, no answer key, no sign-off, and it
  // never reaches the training engine. It is the coach's own teaching under
  // their own name.
  'src/app/admin/sessions/page.tsx',
  'src/app/admin/sessions/new/page.tsx',
  'src/app/admin/sessions/[id]/page.tsx',
];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

test('a coach cannot open any page that writes content', () => {
  const reachable = ADMIN_ONLY.filter((rel) => /requireCoach\(/.test(read(rel)));

  assert.deepEqual(
    reachable,
    [],
    'somebody who signs content off must not also be able to rewrite it',
  );
});

test('the admin-only list is real, not a list of paths that moved', () => {
  // Without this the test above passes triumphantly over files that no longer
  // exist, which is how a guard quietly stops guarding after a refactor.
  const missing = ADMIN_ONLY.filter((rel) => !fs.existsSync(path.join(ROOT, rel)));
  assert.deepEqual(missing, [], 'these paths should exist');
});

test('the pages a coach needs actually let a coach in', () => {
  // The other half. A split enforced by locking the coach out of everything is
  // not a split, it is a role nobody can use.
  const shut = COACH_PAGES.filter((rel) => !/requireCoach\(/.test(read(rel)));
  assert.deepEqual(shut, [], 'a coach signs off and watches their people');
});

test('the area gate lets a coach through and each page decides the rest', () => {
  const layout = read('src/app/admin/layout.tsx');
  assert.match(
    layout,
    /requireCoach\(/,
    'the layout is the floor for the area, so it cannot demand administrator',
  );
});

test('an administrator is a coach as well', () => {
  const guard = read('src/lib/admin/guard.ts');

  // Both guards must accept an administrator. If requireCoach only accepted the
  // coach flag, granting somebody admin would lock them out of the review queue
  // they were already using, which is the sort of thing found in production.
  assert.match(guard, /isAdmin && !profile\?\.isCoach|isAdmin \|\| profile\?\.isCoach/);

  const requireCoach = guard.slice(guard.indexOf('export async function requireCoach'));
  assert.match(
    requireCoach.slice(0, 500),
    /profile\?\.isAdmin/,
    'requireCoach must let an administrator through',
  );

  const checkCoach = guard.slice(guard.indexOf('export async function checkCoach'));
  assert.match(
    checkCoach.slice(0, 500),
    /profile\?\.isAdmin/,
    'checkCoach must let an administrator through',
  );
});

test('the coach flag cannot be granted from the browser', () => {
  const migration = read('supabase/migrations/0011_coach.sql');

  // The trigger is the only thing stopping an account promoting itself. It
  // guarded is_admin before this migration; widening a guard to cover a second
  // column is exactly the edit that silently covers only the first.
  assert.match(
    migration,
    /new\.is_coach is distinct from old\.is_coach/,
    'the privilege guard must cover the coach flag',
  );
  assert.match(
    migration,
    /new\.is_admin is distinct from old\.is_admin/,
    'and must still cover the administrator flag',
  );

  const guarantees = read('supabase/tests/schema-guarantees.sql');
  assert.match(
    guarantees,
    /a coach cannot promote themselves to administrator/,
    'and it is proved against a real Postgres, not just asserted here',
  );
});
