import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import { MissingSettingError, requirePublicEnv, userFacingError } from '../src/lib/env';

/**
 * The fourth audit (0039), held in place. Most of these read the source,
 * because what they hold is an order of steps in a server action (ask, then
 * upload; reply, then save) that a unit test cannot reach without a
 * database. The database half of each is in the schema guarantees.
 */

const ROOT = path.join(import.meta.dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
/** One exported function's source, from its declaration to the next export. */
function action(source: string, name: string): string {
  const start = source.indexOf(`export async function ${name}(`);
  assert.ok(start >= 0, `${name} not found`);
  const next = source.indexOf('\nexport ', start + 1);
  return source.slice(start, next === -1 ? undefined : next);
}

const APP = strip(read('src/app/(app)/actions.ts'));
const ADMIN_WORK = strip(read('src/app/admin/work/actions.ts'));

test('a coach attaching a file or memo declares it identifies no client, before anything is uploaded', () => {
  const save = action(ADMIN_WORK, 'saveWorkPost');
  const asked = save.indexOf("formData.get('declaredClean') !== 'on'");
  assert.ok(asked > 0, 'the declaration is asked for');
  assert.ok(asked < save.indexOf('.upload('), 'and asked before the first upload');
  assert.match(save, /attaching \? \{ declared_clean: true \}/);
  const form = read('src/app/admin/work/work-post-form.tsx');
  assert.match(form, /name="declaredClean"/);
  assert.doesNotMatch(form, /name="declaredClean"[^>]*defaultChecked/, 'never pre-ticked');
});

test('a matter recording carries the same declaration', () => {
  const upload = action(APP, 'uploadMatterRecording');
  const asked = upload.indexOf("formData.get('recordingDeclaredClean') !== 'on'");
  assert.ok(asked > 0 && asked < upload.indexOf('.upload('));
  assert.match(upload, /recording_declared_clean: true/);
  assert.match(read('src/app/(app)/matters/[id]/matter-workspace.tsx'), /name="recordingDeclaredClean"/);
});

test('one form hands work in once, and a failed hand-in takes its file back out', () => {
  const submit = action(APP, 'submitWork');
  const checked = submit.indexOf(".eq('client_nonce', nonce)");
  assert.ok(checked > 0, 'a repeat of the form is looked for');
  assert.ok(checked < submit.indexOf('.upload('), 'before anything is uploaded');
  assert.match(submit, /client_nonce: nonce/);
  // On a refused insert, the file just stored is removed, by its own path.
  const failed = submit.slice(submit.indexOf('if (error) {'));
  assert.match(failed, /\.remove\(\[path\]\)/);
  assert.match(read('src/app/(app)/work/work-forms.tsx'), /name="nonce" value=\{nonce\}/);
});

test('wrong codes are counted and capped before a code is looked up', () => {
  const redeem = action(strip(read('src/app/(app)/pricing/actions.ts')), 'redeemCode');
  const counted = redeem.indexOf(".from('code_attempts')");
  assert.ok(counted > 0 && counted < redeem.indexOf(".from('access_codes')"));
  assert.match(redeem, /count >= CODE_ATTEMPTS_PER_HOUR/);
  assert.match(redeem, /countError \|\| count === null/, 'a count that cannot be read is the limit');
  assert.match(redeem, /insert\(\{ user_id: user\.id \}\)/);
});

test('every AI call gives up after a fixed time', () => {
  const provider = read('src/lib/ai/provider.ts');
  assert.equal((provider.match(/signal: AbortSignal\.timeout\(timeoutMs\)/g) ?? []).length, 2);
  assert.match(provider, /AI_TIMEOUT_MS = 25_000/);
});

test('an explanation to the tutor is saved only once the tutor has replied', () => {
  const send = action(strip(read('src/app/(app)/tutor/actions.ts')), 'sendExplanation');
  const asked = send.indexOf('provider.complete(');
  const saved = send.indexOf("addMessage(convo.id, { role: 'learner', body })");
  assert.ok(asked > 0 && saved > asked, 'the AI is asked before the learner message is saved');
  assert.match(send.slice(asked, saved), /if \(!reply\) \{\s*return/, 'and a failed reply returns first');
});

test('a learner never reads a database or storage message', () => {
  const sources = {
    'src/app/(app)/actions.ts': APP,
    'src/app/(app)/account/actions.ts': strip(read('src/app/(app)/account/actions.ts')),
    'src/lib/learning/selection.ts': strip(read('src/lib/learning/selection.ts')),
    'src/lib/training/service.ts': strip(read('src/lib/training/service.ts')),
  };
  for (const [file, source] of Object.entries(sources)) {
    // The one kept on purpose: P0001 is our own trigger's sentence.
    const kept = source.replace(/error\.code === 'P0001'\s*\?\s*error\.message/g, '');
    const raw = [
      // Returned as the error: { error: error.message } and the like.
      /error:\s*\w+\??\.message\b/g,
      // A caught error's words passed on.
      /caught\.message/g,
      // Or built into a thrown sentence that travels up to a button.
      /\$\{\w+\??\.message\}/g,
    ].flatMap((pattern) => kept.match(pattern) ?? []);
    assert.deepEqual(raw, [], `${file} hands a raw message back`);
  }
});

test('only the missing-setting message is shown as it is', () => {
  assert.throws(() => requirePublicEnv(), MissingSettingError);
  const missing = new MissingSettingError('NEXT_PUBLIC_SUPABASE_URL');
  assert.equal(userFacingError(missing, 'Fallback.'), missing.message);
  assert.match(missing.message, /missing its NEXT_PUBLIC_SUPABASE_URL setting/);
  assert.equal(
    userFacingError(new Error('duplicate key value violates unique constraint "x"'), 'Fallback.'),
    'Fallback.',
  );
  assert.equal(userFacingError('a string', 'Fallback.'), 'Fallback.');
});

test('sign-up and sign-in never show Supabase’s own words, so an address cannot be tested', () => {
  const form = strip(read('src/app/(auth)/auth-form.tsx'));
  assert.doesNotMatch(form, /setError\((signUpError|signInError|caught)\.message\)/);
  assert.match(form, /user_already_exists/);
  // An address with an account gets the same words as a new sign-up.
  assert.match(form, /already registered[^]*?setNotice\(CHECK_INBOX\)/);
  assert.match(form, /if \(!data\.session\) \{\s*setNotice\(CHECK_INBOX\)/);
});

test('the file the browser loads names no server secret', () => {
  const env = strip(read('src/lib/env.ts'));
  assert.doesNotMatch(env, /SERVICE_ROLE|ANTHROPIC|OPENAI|AI_PROVIDER|AI_MODEL/);
  assert.doesNotMatch(env, /server-only/, 'the browser client imports it');
  const server = read('src/lib/env-server.ts');
  assert.match(server, /^import 'server-only';/);
  assert.match(server, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(server, /ANTHROPIC_API_KEY/);
  assert.match(read('src/lib/supabase/client.ts'), /from '@\/lib\/env'/);
});

test('every env file is kept out of git except the example', () => {
  const ignore = read('.gitignore').split('\n').map((l) => l.trim());
  assert.ok(ignore.includes('.env*'));
  assert.ok(ignore.includes('!.env.example'));
});

test('error pages say what happened in plain words and never the error itself', () => {
  for (const file of ['src/app/global-error.tsx', 'src/app/(app)/error.tsx', 'src/app/admin/error.tsx']) {
    const source = read(file);
    assert.match(source, /^'use client';/, `${file} is a client component`);
    assert.match(source, /<ErrorView error=\{error\} retry=\{retry\}/, file);
  }
  const view = strip(read('src/components/error-view.tsx'));
  assert.match(view, /Try again/);
  assert.match(view, /onClick=\{\(\) => retry\(\)\}/);
  assert.doesNotMatch(view, /\{error\.(message|stack)\}/);
  assert.ok(fs.existsSync(path.join(ROOT, 'src/app/not-found.tsx')));
  assert.match(read('src/app/global-error.tsx'), /<html lang="en-AU">/);
});
