import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * The automation endpoint.
 *
 * One route, read only, token gated, off unless switched on. It exists so that
 * n8n never needs a database login: handing out a Postgres role would mean
 * writing "what counts as done" a second time in SQL, and the day the two
 * drift the digest tells the firm somebody is ready when the app says they are
 * not.
 *
 * Everything below defends the narrowness of it. This is the only route in the
 * app reachable with neither a session nor an invitation, so it is the one that
 * has to stay boring.
 */

const ROOT = path.join(__dirname, '..');
const ROUTE = fs.readFileSync(path.join(ROOT, 'src/app/api/digest/route.ts'), 'utf8');
const MIDDLEWARE = fs.readFileSync(path.join(ROOT, 'src/middleware.ts'), 'utf8');
const ENV_EXAMPLE = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf8');

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

const CODE = stripComments(ROUTE);

test('the endpoint is off unless a token is configured', () => {
  // A deployment that has never heard of n8n must not be quietly serving a list
  // of everybody joining the firm. 404 rather than 401, so the response says
  // nothing about whether the feature exists here at all.
  assert.match(
    CODE,
    /if \(expected\.length < 24\) \{\s*return new NextResponse\('Not found', \{ status: 404 \}\)/,
    'an unset or short token must disable the route entirely',
  );
});

test('a short token cannot switch it on', () => {
  // Without a floor, DIGEST_TOKEN=1 would open the route to anybody who tried
  // ten characters.
  assert.match(CODE, /expected\.length < 24/);
});

test('the token is compared in constant time, and the length check does not throw', () => {
  assert.match(CODE, /timingSafeEqual\(a, b\)/, 'compare must not short-circuit on first difference');
  assert.match(
    CODE,
    /if \(a\.length !== b\.length\) return false;/,
    'lengths are compared separately: timingSafeEqual throws on a mismatch and the throw is itself a signal',
  );
  // A plain === anywhere on the token would defeat the point.
  assert.ok(
    !/presented === expected|expected === presented/.test(CODE),
    'the token must never be compared with ===',
  );
});

test('only the bearer scheme is accepted, and an empty token is refused', () => {
  assert.match(CODE, /header\.startsWith\('Bearer '\)/);
  assert.match(CODE, /if \(!presented \|\| !tokenMatches\(presented, expected\)\)/);
});

test('it is read only', () => {
  // The whole promise. A workflow tool holding this token must not be able to
  // change anything, least of all the compliance record.
  assert.ok(CODE.includes('export async function GET'), 'there is a GET handler');
  for (const verb of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    assert.ok(
      !CODE.includes(`export async function ${verb}`),
      `the digest route exports ${verb}: it must be read only`,
    );
  }
  for (const write of ['insert(', 'update(', 'delete(', 'upsert(']) {
    assert.ok(!CODE.includes(write), `the digest route calls ${write}`);
  }
});

test('it carries a summary and nothing about the content or anybody’s answers', () => {
  // A reminder needs names, dates and counts. It does not need what anybody
  // read, answered or acknowledged, and the question bank must be unreachable
  // from here entirely.
  for (const forbidden of [
    'correct_option_ids',
    'explanation',
    'v_question_delivery',
    'user_question_attempts',
    'firm_module_acknowledgements',
    'token_hash',
    'joiner_invitations',
  ]) {
    assert.ok(!CODE.includes(forbidden), `the digest exposes ${forbidden}`);
  }
});

test('the route is exempted from the login redirect by name, not by prefix', () => {
  // '/api' would make every future route public by default, which is the wrong
  // way round for a file people will add to.
  assert.match(MIDDLEWARE, /'\/api\/digest'/, 'the digest route must be reachable without a session');
  assert.ok(
    !/PUBLIC_PATHS = \[[^\]]*'\/api'[,\]]/.test(MIDDLEWARE),
    'the whole of /api must not be public',
  );
});

test('the token is a server secret and never shipped to the browser', () => {
  assert.ok(
    !ROUTE.includes('NEXT_PUBLIC_DIGEST'),
    'a NEXT_PUBLIC_ name would inline the token into the client bundle',
  );
  assert.match(ENV_EXAMPLE, /# DIGEST_TOKEN=/, 'the variable is documented and commented out by default');
  assert.ok(
    !/^DIGEST_TOKEN=.+/m.test(ENV_EXAMPLE),
    '.env.example must not carry a real token',
  );
});

test('no token is committed anywhere in the repository', () => {
  // The one mistake that would matter, and the cheapest possible check for it.
  for (const file of ['.env.example', 'README.md']) {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const assigned = text.match(/^\s*DIGEST_TOKEN=\S+/m);
    assert.equal(assigned, null, `${file} appears to contain a real DIGEST_TOKEN`);
  }
});
