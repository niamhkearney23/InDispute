import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import { buildCsp, makeNonce } from '../src/lib/security/csp';
import { EMBED_HOSTS } from '../src/lib/lessons/embed';

/**
 * The content security policy.
 *
 * What it buys is one thing: a script that reaches a page by any route other
 * than the app's own bundle does not run. That holds only while script-src
 * names a nonce, never 'unsafe-inline', and the page is rendered per request
 * so the nonce is fresh. Everything below defends one of those.
 */

const ROOT = path.join(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function directives(policy: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const part of policy.split(';')) {
    const [name, ...values] = part.trim().split(/\s+/);
    if (name) out.set(name, values);
  }
  return out;
}

const BASE = {
  nonce: 'abc123==',
  dev: false,
  supabaseUrl: 'https://abcdefgh.supabase.co',
  logo: null,
  upgradeInsecure: true,
};

test('scripts run only with this response nonce, and nothing inline does', () => {
  const policy = directives(buildCsp(BASE));
  const scripts = policy.get('script-src') ?? [];
  assert.ok(scripts.includes("'nonce-abc123=='"), 'script-src must carry the nonce');
  assert.ok(scripts.includes("'strict-dynamic'"), "script-src must carry 'strict-dynamic'");
  assert.ok(!scripts.includes("'unsafe-inline'"), "'unsafe-inline' in script-src undoes the nonce");
  assert.ok(!scripts.includes("'unsafe-eval'"), 'eval is for development only');
  assert.ok(!scripts.some((s) => s === '*' || s.startsWith('http')), 'no host may be trusted for scripts');
});

test('the directives that close the other ways in are all present', () => {
  const policy = directives(buildCsp(BASE));
  assert.deepEqual(policy.get('object-src'), ["'none'"]);
  assert.deepEqual(policy.get('base-uri'), ["'self'"]);
  assert.deepEqual(policy.get('frame-ancestors'), ["'none'"]);
  assert.deepEqual(policy.get('default-src'), ["'self'"]);
  assert.ok(policy.has('upgrade-insecure-requests'));
});

test('eval is allowed in development and nowhere else', () => {
  const dev = directives(buildCsp({ ...BASE, dev: true })).get('script-src') ?? [];
  assert.ok(dev.includes("'unsafe-eval'"));
  assert.ok(dev.includes("'nonce-abc123=='"), 'development keeps the nonce too');
});

test('Supabase is named by its own origin, not a wildcard', () => {
  const policy = directives(buildCsp({ ...BASE, supabaseUrl: 'http://127.0.0.1:54321/' }));
  for (const name of ['connect-src', 'img-src', 'media-src']) {
    assert.ok(policy.get(name)?.includes('http://127.0.0.1:54321'), `${name} must allow the configured Supabase`);
    assert.ok(!policy.get(name)?.some((v) => v.includes('*')), `${name} must not hold a wildcard`);
  }
  const none = directives(buildCsp({ ...BASE, supabaseUrl: '' }));
  assert.deepEqual(none.get('connect-src'), ["'self'"], 'no Supabase setting, no extra host');
});

test('a logo on another site is allowed as an image, a local one adds nothing', () => {
  const away = directives(buildCsp({ ...BASE, logo: 'https://firm.example.com/logo.png' }));
  assert.ok(away.get('img-src')?.includes('https://firm.example.com'));
  const home = directives(buildCsp({ ...BASE, logo: '/logo.png' }));
  assert.ok(!home.get('img-src')?.some((v) => v.startsWith('https://firm')));
});

test('every host a lesson or session may frame is one the policy allows', () => {
  const frames = directives(buildCsp(BASE)).get('frame-src') ?? [];
  for (const host of EMBED_HOSTS) assert.ok(frames.includes(`https://${host}`), host);
  assert.equal(frames.length, EMBED_HOSTS.size, 'and nothing else');
});

test('plain http addresses are not upgraded', () => {
  assert.ok(!directives(buildCsp({ ...BASE, upgradeInsecure: false })).has('upgrade-insecure-requests'));
});

test('a nonce is fresh every time and long enough not to guess', () => {
  const seen = new Set(Array.from({ length: 200 }, makeNonce));
  assert.equal(seen.size, 200);
  for (const n of seen) assert.match(n, /^[A-Za-z0-9+/]{22}==$/);
});

test('the middleware puts the policy on the request, where Next finds the nonce', () => {
  const source = read('src/middleware.ts');
  assert.match(source, /request\.headers\.set\('Content-Security-Policy', csp\)/);
  assert.match(source, /res\.headers\.set\('Content-Security-Policy', csp\)/);
});

test('every page renders per request, so no page is served with a stale nonce', () => {
  // A page built ahead of time has no nonce on its scripts and the policy
  // refuses them: the page shows but nothing on it works.
  const layout = read('src/app/layout.tsx');
  assert.match(layout, /await connection\(\);/);
  assert.doesNotMatch(read('next.config.ts'), /cacheComponents|ppr/, 'partial prerendering cannot carry a nonce');
});

test('downloads keep their own stricter policy', () => {
  const middleware = read('src/middleware.ts');
  const match = /const OWN_POLICY = \[([^\]]*)\]/.exec(middleware);
  assert.ok(match, 'the middleware no longer names OWN_POLICY; update this test with it');
  const own = [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

  const config = read('next.config.ts');
  for (const p of own) {
    assert.ok(config.includes(`'${p}`), `${p} has no policy of its own in next.config.ts`);
  }
  assert.match(config, /default-src 'none'; frame-ancestors 'none'; sandbox/);

  // Any route that sends a download must be on the list, or it gets the page
  // policy instead.
  const routes: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'route.ts') routes.push(full);
    }
  };
  walk(path.join(ROOT, 'src/app'));
  for (const file of routes) {
    if (!/downloadHeaders\(/.test(fs.readFileSync(file, 'utf8'))) continue;
    const url = path
      .relative(path.join(ROOT, 'src/app'), path.dirname(file))
      .split(path.sep)
      .filter((s) => !/^\(.*\)$/.test(s))
      .join('/');
    assert.ok(
      own.some((p) => `/${url}` === p || `/${url}`.startsWith(`${p}/`)),
      `/${url} sends a download but is not in OWN_POLICY`,
    );
  }
});
