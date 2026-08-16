/* Checks that the Claude proxy only does what it is supposed to do. It spends
   our API key and our money, so the questions are: whose pages can call it,
   which models, how big, and how often.

   The Netlify copy enforced none of that at one point, forwarding any model at
   any size from any origin. Nothing caught it, hence this file.

     node tools/proxy-guards.mjs        # from lawgistics-site; no dependencies

   Exits non-zero on the first broken guard, so it can gate a deploy. Nothing
   leaves the machine: fetch is stubbed and the key below is a placeholder.

   Guards run in order (origin, rate limit, key, body), so a placeholder key is
   needed to reach the model check at all. The first version of this file had
   no key set and every case returned 503 before validation ever ran. */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HANDLER = join(dirname(fileURLToPath(import.meta.url)), '..', 'netlify', 'functions', 'claude.mjs');

process.env.ANTHROPIC_API_KEY = 'test-key-not-real';
let forwarded = null;
globalThis.fetch = async (_url, init) => {
  forwarded = JSON.parse(init.body);
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};

const { default: handler } = await import(HANDLER);

const post = (body, headers = { origin: 'https://lawgistics.my' }) =>
  new Request('https://lawgistics.my/claude', {
    method: 'POST', headers, body: JSON.stringify(body),
  });

const ok = { model: 'claude-opus-5', max_tokens: 16000, messages: [{ role: 'user', content: 'hi' }] };

const cases = [
  ['rejects an off-list model', post({ ...ok, model: 'gpt-4' }), 400],
  ['rejects the model advocacy used to ask for', post({ ...ok, model: 'claude-opus-4-8' }), 400],
  ['allows opus 5', post(ok), 200],
  ['allows fable 5', post({ ...ok, model: 'claude-fable-5' }), 200],
  ['still allows haiku (courtpack, home page)', post({ ...ok, model: 'claude-haiku-4-5' }), 200],
  ['rejects a foreign origin', post(ok, { origin: 'https://evil.example' }), 403],
  ['rejects a request with no origin', post(ok, {}), 403],
  ['rejects GET', new Request('https://lawgistics.my/claude', { method: 'GET', headers: { origin: 'https://lawgistics.my' } }), 405],
  ['rejects malformed json', new Request('https://lawgistics.my/claude', { method: 'POST', headers: { origin: 'https://lawgistics.my' }, body: '{oops' }), 400],
  ['rejects a body with no messages', post({ model: 'claude-opus-5' }), 400],
];

let bad = 0;
for (const [name, req, want] of cases) {
  const got = (await handler(req)).status;
  if (got !== want) bad++;
  console.log(`${got === want ? 'ok  ' : 'FAIL'}  ${String(got).padEnd(4)} (want ${want})  ${name}`);
}

// The cap is what advocacy depends on: 16000 must survive, not be clamped.
await handler(post(ok));
const kept = forwarded.max_tokens === 16000;
if (!kept) bad++;
console.log(`${kept ? 'ok  ' : 'FAIL'}  max_tokens forwarded as ${forwarded.max_tokens} (want 16000)`);

// And anything greedier than the cap is still clamped.
await handler(post({ ...ok, max_tokens: 999999 }));
const clamped = forwarded.max_tokens === 16000;
if (!clamped) bad++;
console.log(`${clamped ? 'ok  ' : 'FAIL'}  999999 clamped to ${forwarded.max_tokens} (want 16000)`);

let last = 0;
for (let i = 0; i < 14; i++) {
  last = (await handler(post(ok, { origin: 'https://lawgistics.my', 'x-forwarded-for': '9.9.9.9' }))).status;
}
if (last !== 429) bad++;
console.log(`${last === 429 ? 'ok  ' : 'FAIL'}  ${last} (want 429)  rate limited after 12 in a minute`);

console.log(bad === 0 ? '\nall guards hold' : `\n${bad} FAILED`);
process.exit(bad === 0 ? 0 : 1);
