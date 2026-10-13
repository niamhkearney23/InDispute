import assert from 'node:assert/strict';
import test from 'node:test';

/**
 * The middleware with the site access switch, run for real.
 *
 * Supabase points at an address where nothing listens, so every request is
 * somebody signed out, exactly as a stranger posting to the site would be.
 * Each request is made once with the switch open and once with every other
 * value, and the rule is: either the maintenance page, or the very same
 * answer open gives. The switch never has a third answer.
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:9';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'not-a-real-key';

type Middleware = typeof import('../src/middleware').middleware;
let middleware: Middleware;
let NextRequestCtor: typeof import('next/server').NextRequest;

test.before(async () => {
  ({ middleware } = await import('../src/middleware'));
  ({ NextRequest: NextRequestCtor } = await import('next/server'));
});

interface Answer {
  status: number;
  location: string | null;
  maintenance: boolean;
  body: string;
  csp: string | null;
  cache: string | null;
}

async function ask(
  access: string | undefined,
  pathname: string,
  init: { method?: string; action?: boolean } = {},
): Promise<Answer> {
  if (access === undefined) delete process.env.SITE_ACCESS;
  else process.env.SITE_ACCESS = access;
  const headers = new Headers();
  if (init.action) headers.set('Next-Action', '7f00000000000000000000000000000000000000');
  const res = await middleware(
    new NextRequestCtor(`http://localhost${pathname}`, { method: init.method ?? 'GET', headers }),
  );
  const body = res.status === 503 ? await res.text() : '';
  return {
    status: res.status,
    location: res.headers.get('location'),
    maintenance: res.status === 503 && body.includes('closed for maintenance'),
    body,
    csp: res.headers.get('content-security-policy'),
    cache: res.headers.get('cache-control'),
  };
}

const PATHS = [
  '/',
  '/login',
  '/auth/callback?code=x',
  '/two-step',
  '/dashboard',
  '/learn',
  '/account',
  '/certificate/pdf',
  '/join/abc',
  '/setup',
  '/admin',
  '/admin/review',
  '/admin/reports/export/progress?format=csv',
  '/api/inbound/work',
  '/api/digest',
  '/api/stripe/webhook',
  '/api/cron/erasure-retry',
  '/maintenance',
];

const VALUES = [undefined, 'open', 'staff-closed', 'closed', '', 'off', 'OPEN', 'Staff-Closed', 'garbage'];

test('every value either shows the maintenance page or answers exactly as open does', async () => {
  for (const pathname of PATHS) {
    for (const init of [{}, { method: 'POST', action: true }]) {
      const open = await ask('open', pathname, init);
      assert.ok(!open.maintenance, `open shows maintenance at ${pathname}`);
      for (const value of VALUES) {
        const here = await ask(value, pathname, init);
        if (here.maintenance) continue;
        assert.equal(here.status, open.status, `${value} at ${pathname}`);
        assert.equal(here.location, open.location, `${value} at ${pathname}`);
      }
    }
  }
});

test('open: a signed-out visitor to a staff page is sent to sign in, as before', async () => {
  const res = await ask(undefined, '/admin');
  assert.equal(res.status, 307);
  assert.match(res.location ?? '', /\/login\?next=%2Fadmin$/);
  const missing = await ask(undefined, '/maintenance');
  assert.equal(missing.maintenance, false, 'open has no maintenance page');
});

test('staff-closed: staff pages, staff routes and setup are 503; learner pages are not', async () => {
  for (const p of ['/admin', '/admin/review', '/admin/reports/export/progress?format=csv', '/api/inbound/work', '/api/digest', '/setup', '/maintenance']) {
    const res = await ask('staff-closed', p, p === '/api/inbound/work' ? { method: 'POST' } : {});
    assert.equal(res.status, 503, p);
    assert.ok(res.maintenance, p);
    assert.match(res.body, /The staff area is closed for maintenance/);
    assert.equal(res.cache, 'no-store');
  }
  for (const p of ['/dashboard', '/learn', '/login', '/two-step']) {
    const res = await ask('staff-closed', p);
    assert.notEqual(res.status, 503, p);
  }
});

test('closed: every page, sign-in and every posted action is 503; the deletion job is not', async () => {
  for (const p of PATHS.filter((x) => x !== '/api/cron/erasure-retry')) {
    for (const init of [{}, { method: 'POST', action: true }]) {
      const res = await ask('closed', p, init);
      assert.equal(res.status, 503, p);
      assert.match(res.body, /The academy is closed for maintenance/);
    }
  }
  const cron = await ask('closed', '/api/cron/erasure-retry');
  assert.notEqual(cron.status, 503, 'the nightly deletion job still runs');
  assert.equal(cron.location, null);
  const posted = await ask('closed', '/api/cron/erasure-retry', { method: 'POST', action: true });
  assert.equal(posted.status, 503, 'but not as a carrier for a server action');
});

test('the maintenance page carries the nonce policy and runs nothing', async () => {
  for (const value of ['staff-closed', 'closed']) {
    const res = await ask(value, '/admin/reports/export/progress');
    // A download route normally keeps its own policy; the maintenance page
    // is a page, so it gets the page policy.
    assert.match(res.csp ?? '', /script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    assert.match(res.csp ?? '', /frame-ancestors 'none'/);
    assert.doesNotMatch(res.body, /<script/i);
  }
});
