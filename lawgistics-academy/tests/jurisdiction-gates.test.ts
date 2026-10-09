import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

/**
 * Australian and Malaysian law are kept strictly apart. These are the places
 * where a learner, a fact or a question changing country could carry one
 * country's law to the other's learners. The database side is proved against
 * a real Postgres in supabase/tests/schema-guarantees.sql; these check the
 * app does its part.
 */

const ROOT = path.resolve(__dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf8');

/** The body of one top-level function, from its signature to its closing brace. */
function functionBody(source: string, name: string): string {
  const start = source.search(new RegExp(`(?:async )?function ${name}\\b`));
  assert.ok(start >= 0, `${name} not found`);
  const rest = source.slice(start);
  return rest.slice(0, rest.indexOf('\n}\n') + 2);
}

test('the delivery view and the daily brief show a learner only their own country', () => {
  const sql = read('supabase/migrations/0038_jurisdiction_and_tutor.sql');
  const view = sql.slice(sql.indexOf('create or replace view public.v_question_delivery'));
  assert.match(view, /q\.country = public\.caller_country\(\)/);
  assert.match(view, /or public\.is_coach\(\)/);
  assert.match(view, /current_user in \('service_role'/);
  const policy = sql.slice(sql.indexOf('create policy daily_facts_read_published'));
  assert.match(policy, /status = 'published'\s+and \(public\.is_coach\(\) or country = public\.caller_country\(\)\)/);
  // The view must keep every column the app reads from it.
  for (const column of ['question_version_id', 'country', 'domain_slug', 'options', 'jurisdiction', 'court']) {
    assert.match(view, new RegExp(`\\b${column}\\b`), column);
  }
});

test('the app reads the delivery view only with the service role, so the new filter cannot hide its rows', () => {
  for (const file of [
    'src/lib/modules/service.ts',
    'src/lib/training/service.ts',
    'src/lib/intake/service.ts',
  ]) {
    const source = read(file);
    assert.ok(source.includes("from('v_question_delivery')"), file);
    assert.ok(!source.includes('createSupabaseServerClient'), `${file} reads with the signed-in user's client`);
  }
});

test('a fact moved to another jurisdiction loses its sign-off and comes down', () => {
  const body = functionBody(read('src/app/admin/facts/actions.ts'), 'updateFact');
  assert.match(body, /\.select\('[^']*\bjurisdiction\b[^']*'\)/);
  assert.match(body, /current\?\.jurisdiction !== parsed\.data\.jurisdiction/);
});

test('a question changes country only with its status, after the new version is in', () => {
  const body = functionBody(read('src/app/admin/actions.ts'), 'updateQuestion');
  const inserted = body.indexOf('await insertVersion(');
  assert.ok(inserted > 0);
  const countryWrites = [...body.matchAll(/\.update\(\{[^}]*\bcountry\b/g)].map((m) => m.index ?? -1);
  assert.ok(countryWrites.length > 0, 'the country is never updated');
  for (const at of countryWrites) {
    assert.ok(at > inserted, 'the country is written before the new version is saved');
  }
  // The published question is withdrawn and moved in one write.
  assert.match(body, /\.update\(\{ status: 'requires_review', country \}\)\s*\.eq\('id', questionId\)\s*\.eq\('status', 'published'\)/);
});

test('a resumed session shows only the learner’s current country', () => {
  const body = functionBody(read('src/lib/training/service.ts'), 'getSessionPlan');
  assert.match(body, /from\('profiles'\)\.select\('country'\)/);
  assert.match(body, /from\('v_question_delivery'\)\s*\.select\('\*'\)\s*\.eq\('country', profile\.country\)/);
});

test('the tutor never asks or marks a question from the other country', () => {
  const service = functionBody(read('src/lib/tutor/service.ts'), 'verifiedQuestion');
  assert.match(service, /country: Country/);
  assert.match(service, /\.eq\('questions\.country', country\)/);
  assert.match(service, /row\.questions\?\.country !== country/);

  const action = functionBody(read('src/app/(app)/tutor/actions.ts'), 'answerTutorQuestion');
  const stop = action.indexOf('testModule.country !== profile.country');
  assert.ok(stop > 0, 'answerTutorQuestion does not compare the module with the learner');
  assert.ok(stop < action.indexOf('addMessage('), 'the country is checked after something is saved');
  assert.match(action, /verifiedQuestion\(progress\.current, profile\.country\)/);

  const page = read('src/app/(app)/tutor/[id]/page.tsx');
  assert.match(page, /verifiedQuestion\(current, profile\.country\)/);
});

test('the first day of questions is found by country in the query', () => {
  const body = functionBody(read('src/lib/training/rounds-service.ts'), 'firstQuestionAt');
  assert.match(body, /\.eq\('questions\.country', country\)/);
  assert.doesNotMatch(body, /\.limit\(200\)/);
});
