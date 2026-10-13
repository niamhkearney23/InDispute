import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import {
  CONFIRM_WORD,
  ERASED_BAN,
  ERASED_NAME,
  confirmsErasure,
  confirmsWord,
  erasedEmail,
} from '../src/lib/account/erasure-rules';
import { ERASED_REFUSAL, erasedByCheck, signInRefused } from '../src/lib/auth/refused';
import { unguessablePassword } from '../src/lib/account/erasure';
import { REDACTED_TEXT, WORK_BOARD_RETENTION_MONTHS } from '../src/lib/account/retention';

/**
 * Deleting an account (0043). The rules are tested directly; the order of
 * steps in the two actions is read from the source, because it cannot be
 * reached without a database and an auth server. What the database does is
 * in the schema guarantees.
 */

const ROOT = path.join(import.meta.dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
function action(source: string, name: string): string {
  const start = source.indexOf(`export async function ${name}(`);
  assert.ok(start >= 0, `${name} not found`);
  const next = source.indexOf('\nexport ', start + 1);
  return source.slice(start, next === -1 ? undefined : next);
}

const MIGRATION = read('supabase/migrations/0043_account_erasure.sql');
const HARDENING = read('supabase/migrations/0045_erasure_hardening.sql');
const ACCOUNT = strip(read('src/app/(app)/account/actions.ts'));
const ADMIN = strip(read('src/app/admin/trainees/actions.ts'));

test('deleting needs the word and the account\'s own address, both', () => {
  const mine = 'Leah@Example.test';
  assert.ok(confirmsErasure('DELETE', 'leah@example.test', mine));
  assert.ok(confirmsErasure('  DELETE ', ' LEAH@example.TEST ', mine), 'spaces and the address\'s case are forgiven');
  assert.ok(!confirmsErasure('delete', 'leah@example.test', mine), 'the word is in capitals');
  assert.ok(!confirmsErasure('DELETE', 'someone@example.test', mine), 'another address is not yours');
  assert.ok(!confirmsErasure('DELETE', '', mine));
  assert.ok(!confirmsErasure('', 'leah@example.test', mine));
  assert.ok(!confirmsErasure('DELETE', 'leah@example.test', null), 'an account with no address cannot be matched');
  assert.ok(!confirmsErasure(null, null, mine));
  assert.ok(!confirmsErasure('DELETE', 'leah@example.test', ''), 'an empty address never matches an empty box');
  assert.equal(CONFIRM_WORD, 'DELETE');
});

test('an administrator types the word', () => {
  assert.ok(confirmsWord('DELETE'));
  assert.ok(!confirmsWord('Delete'));
  assert.ok(!confirmsWord(null));
});

test('the app and the database leave an erased account looking the same', () => {
  const id = '0f8fad5b-d9cb-469f-a165-70867728950e';
  assert.equal(erasedEmail(id), `erased-${id}@invalid.invalid`);
  assert.match(MIGRATION, /'erased-' \|\| uid::text \|\| '@invalid\.invalid'/);
  assert.match(MIGRATION, new RegExp(`display_name = '${ERASED_NAME}'`));
  assert.match(MIGRATION, /when email like 'erased-%@invalid\.invalid' then 'Deleted account'/);
});

test('the password is unguessable and short enough for the auth server', () => {
  const a = unguessablePassword();
  const b = unguessablePassword();
  assert.equal(a.length, 64);
  assert.ok(a.length <= 72, 'Supabase Auth refuses a password over 72 characters');
  assert.notEqual(a, b);
  assert.match(a, /^[A-Za-z0-9_-]+$/);
});

test('a banned account counts as signed out, until the ban ends', () => {
  const later = new Date(Date.now() + 60_000).toISOString();
  const earlier = new Date(Date.now() - 60_000).toISOString();
  assert.ok(signInRefused({ banned_until: later }));
  assert.ok(!signInRefused({ banned_until: earlier }));
  assert.ok(!signInRefused({ banned_until: null }));
  assert.ok(!signInRefused({}));
  assert.ok(!signInRefused(null));
  assert.ok(!signInRefused({ banned_until: 'not a date' }));
  assert.match(ERASED_BAN, /^\d+h$/);
});

test('every request and every action treat a banned or erased account as nobody', () => {
  const server = strip(read('src/lib/supabase/server.ts'));
  assert.match(server, /if \(!user \|\| signInRefused\(user\)\) return null;/);
  // Erased in the database counts as signed out even when the ban never
  // happened (0045).
  assert.match(server, /return \(await accountErased\(\)\) \? null : user;/);
  assert.match(server, /rpc\('caller_erased'\)[\s\S]*?erasedByCheck\(data, error\)/);
  const middleware = strip(read('src/middleware.ts'));
  assert.match(middleware, /const notBanned = signInRefused\(signedIn\) \? null : signedIn;/);
  assert.match(
    middleware,
    /const erased = notBanned \? await supabase\.rpc\('caller_erased'\) : null;\s*const user = erased && erasedByCheck\(erased\.data, erased\.error\) \? null : notBanned;/,
  );
  // Where a deleted person lands: open signed out, and never bounced.
  assert.match(middleware, /const PUBLIC_PATHS = \[[^\]]*'\/goodbye'/);
  assert.doesNotMatch(middleware, /const SIGNED_OUT_ONLY = \[[^\]]*'\/goodbye'/);
});

test('a person deletes their own account only after saying yes, and staff cannot', () => {
  const own = action(ACCOUNT, 'deleteMyAccount');
  const signedIn = own.indexOf('getCurrentUser(');
  const staff = own.indexOf('profile.isAdmin || profile.isCoach || profile.isFirmAdmin');
  const confirmed = own.indexOf('confirmsErasure(');
  const erased = own.indexOf('runErasure(user.id, { requestedBy: user.id })');
  assert.ok(signedIn >= 0 && staff > signedIn, 'staff are turned away');
  assert.ok(confirmed > staff, 'the confirmation is checked');
  assert.ok(erased > confirmed, 'and only then is anything erased');
  // The address compared is the session's, never another box on the form.
  assert.match(own, /confirmsErasure\(formData\.get\('confirmWord'\), formData\.get\('confirmEmail'\), user\.email\)/);
  // Refused means nothing changed, and the person stays on the page.
  assert.match(own, /if \(outcome\.kind === 'refused'\) return \{ error: outcome\.error \};/);
  // Signed out everywhere afterwards, then to a page that says what is true.
  assert.ok(own.indexOf("signOut({ scope: 'global' })") > erased);
  assert.ok(own.indexOf('redirect(goodbyePath(outcome))') > own.indexOf('signOut('));
  assert.doesNotMatch(own, /redirect\('\/goodbye'\)/, 'never a bare "deleted" page whatever happened');
});

test('an administrator deletes a learner only after typing the word', () => {
  const erase = action(ADMIN, 'eraseLearner');
  const checked = erase.indexOf('checkAdmin(');
  const confirmed = erase.indexOf("confirmsWord(formData.get('confirmWord'))");
  assert.ok(checked >= 0 && confirmed > checked);
  assert.ok(erase.indexOf('runErasure(id.data, { requestedBy: adminId })') > confirmed);
  // What the administrator is told comes from the outcome, never a fixed "Deleted".
  assert.match(erase, /adminErasureMessage\(outcome\)/);
});

test('the confirmation boxes are never filled in for anybody', () => {
  for (const file of ['src/app/(app)/account/delete-account-form.tsx', 'src/app/admin/trainees/[id]/erase-form.tsx']) {
    const form = read(file);
    assert.match(form, /name="confirmWord"/);
    assert.doesNotMatch(form, /defaultValue/, `${file} pre-fills a confirmation box`);
  }
  // The learner's own form names no account at all.
  assert.doesNotMatch(read('src/app/(app)/account/delete-account-form.tsx'), /type="hidden"/);
});

test('the erasure runs the database first, then sign-in, sessions and files', () => {
  const service = strip(read('src/lib/account/erasure.ts'));
  const run = service.slice(service.indexOf('export async function runErasure('));
  const db = run.indexOf('stepDatabase(');
  const signIn = run.indexOf('stepSignIn(');
  const files = run.indexOf('stepFiles(');
  assert.ok(db > 0 && signIn > db && files > signIn);
  assert.match(service, /email: erasedEmail\(userId\)/);
  assert.match(service, /ban_duration: ERASED_BAN/);
  assert.match(service, /password: unguessablePassword\(\)/);
  assert.match(service, /rpc\('erase_account', \{ uid: userId, by_whom: requestedBy \}\)/);
});

test('the app and the database refuse a deleted account in the same words', () => {
  assert.ok(HARDENING.includes(`message = '${ERASED_REFUSAL}'`));
  assert.match(HARDENING, /errcode = '42501'/);
  assert.ok(erasedByCheck(true, null));
  assert.ok(!erasedByCheck(false, null));
  assert.ok(!erasedByCheck(null, null));
  assert.ok(erasedByCheck(null, { code: '42501', message: ERASED_REFUSAL }));
  // Anything else is not taken as deleted: the database still refuses on
  // its own, and a passing fault must not sign everybody out.
  assert.ok(!erasedByCheck(null, { code: '42501', message: 'permission denied for function caller_erased' }));
  assert.ok(!erasedByCheck(null, { code: 'PGRST202', message: 'Could not find the function' }));
  assert.ok(!erasedByCheck(true, { code: '500', message: 'network' }));
});

test('removed text reads the same in the app and the database, and retention is one number', () => {
  for (const [reason, words] of Object.entries(REDACTED_TEXT)) {
    assert.ok(HARDENING.includes(`when '${reason}' then '${words}'`), `${reason} differs`);
  }
  assert.equal(WORK_BOARD_RETENTION_MONTHS, 24);
  // The database takes the period as an argument and has no number of its own.
  assert.match(HARDENING, /function public\.redact_expired_work_board\(months integer\)/);
  assert.match(
    strip(read('src/lib/account/erasure.ts')),
    /rpc\('redact_expired_work_board', \{\s*months: WORK_BOARD_RETENTION_MONTHS,?\s*\}\)/,
  );
  // And CLAUDE.md and the privacy notes say what it is.
  assert.match(read('CLAUDE.md'), new RegExp(`${WORK_BOARD_RETENTION_MONTHS} months`));
  assert.match(read('docs/SECURITY-SETUP.md'), new RegExp(`${WORK_BOARD_RETENTION_MONTHS} months`));
});

test('nothing calls what the firm keeps anonymous', () => {
  // The name, email and photo go; written work, messages, files and the
  // certification register may still identify somebody. Saying otherwise
  // overstates what deleting did.
  const files = [
    'src/app/(app)/account/page.tsx',
    'src/app/goodbye/page.tsx',
    'src/app/admin/trainees/[id]/page.tsx',
    'src/app/admin/deletions/page.tsx',
    'src/app/admin/deletions/[id]/page.tsx',
    'src/lib/account/erasure-rules.ts',
    'src/lib/account/erasure.ts',
    'supabase/migrations/0043_account_erasure.sql',
    'supabase/migrations/0045_erasure_hardening.sql',
    'CLAUDE.md',
    'docs/SECURITY-SETUP.md',
  ];
  for (const file of files) {
    // Saying it is not anonymous is the point; only a claim that it is fails.
    const text = read(file).replace(/\bnot\s+(?:called\s+)?anonymous/gi, '');
    assert.doesNotMatch(text, /anonymi[sz]|anonymous|nothing to say it was you|no identity in it/i, file);
  }
});
