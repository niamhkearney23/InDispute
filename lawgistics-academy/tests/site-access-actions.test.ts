import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';

/**
 * Every server action, called directly, as a crafted POST would call it.
 *
 * A server action is reachable from any page's address with a `Next-Action`
 * header, so closing paths in the middleware is not enough: the action must
 * refuse by itself. This test loads every `'use server'` module in the app
 * and calls every action it exports, outside any request.
 *
 * Supabase is configured (an address where nothing listens), so an action
 * that gets as far as reading the caller's session calls Next's `cookies()`,
 * which throws outside a request; the service client throws if reached; and
 * `redirect` is replaced so its target can be read. An action has refused
 * when it returns, or redirects, without reaching any of those.
 *
 * The open runs prove the harness can tell: with the switch open, every
 * staff action does reach the session, so its refusal under staff-closed
 * is the switch and nothing else.
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:9';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'not-a-real-key';
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

class Redirected extends Error {
  constructor(readonly to: string) {
    super(`redirect to ${to}`);
  }
}
class Reached extends Error {}

/** Puts a stand-in module where `require` will find it first. */
function stub(id: string, exports: object) {
  const file = require.resolve(id);
  const m = new Module(file);
  m.filename = file;
  m.loaded = true;
  m.exports = exports;
  require.cache[file] = m;
}

// The real next/navigation needs React's browser build; these two are all
// the actions use, and they throw as the real ones do.
stub('next/navigation', {
  redirect: (to: string) => {
    throw new Redirected(to);
  },
  notFound: () => {
    throw new Redirected('not-found');
  },
});
stub('../src/lib/supabase/service', {
  createServiceClient: () => {
    throw new Reached('the service client');
  },
});

const APP = path.join(__dirname, '..', 'src', 'app');

function actionFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...actionFiles(full));
    else if (/\.tsx?$/.test(entry.name) && /^\s*['"]use server['"]/.test(fs.readFileSync(full, 'utf8'))) {
      out.push(full);
    }
  }
  return out;
}

interface Action {
  file: string;
  name: string;
  run: (...args: unknown[]) => Promise<unknown>;
}

let ACTIONS: Action[] = [];

test.before(async () => {
  for (const file of actionFiles(APP)) {
    const mod = (await import(file)) as Record<string, unknown>;
    for (const [name, value] of Object.entries(mod)) {
      if (typeof value === 'function') {
        ACTIONS.push({ file: path.relative(APP, file), name, run: value as Action['run'] });
      }
    }
  }
  ACTIONS = ACTIONS.sort((a, b) => a.name.localeCompare(b.name));
});

const isStaffAction = (a: Action) => a.file.startsWith(`admin${path.sep}`) || a.name === 'completeSetup';

type Outcome = { kind: 'returned' } | { kind: 'redirected'; to: string } | { kind: 'reached'; what: string };

/** Calls an action with a form, the way a posted form arrives, and says how far it got. */
async function call(action: Action, access: string | undefined): Promise<Outcome> {
  if (access === undefined) delete process.env.SITE_ACCESS;
  else process.env.SITE_ACCESS = access;
  try {
    await action.run(new FormData(), new FormData());
    return { kind: 'returned' };
  } catch (caught) {
    if (caught instanceof Redirected) return { kind: 'redirected', to: caught.to };
    return { kind: 'reached', what: caught instanceof Error ? caught.message : String(caught) };
  }
}

test('every action in the app was loaded', () => {
  // The same eighty-three the authorisation contract names.
  assert.equal(ACTIONS.length, 83);
  // Forty-seven under /admin, and first-run setup.
  assert.equal(ACTIONS.filter(isStaffAction).length, 48);
});

test('open: every staff action goes on to read the session, so the harness can tell', async () => {
  for (const action of ACTIONS.filter(isStaffAction)) {
    const outcome = await call(action, 'open');
    assert.equal(outcome.kind, 'reached', `${action.file} ${action.name} did not reach the session when open`);
  }
});

test('staff-closed: every staff action refuses before reading anything', async () => {
  for (const value of ['staff-closed', 'STAFF-CLOSED', ' staff-closed ']) {
    for (const action of ACTIONS.filter(isStaffAction)) {
      const outcome = await call(action, value);
      assert.notEqual(
        outcome.kind,
        'reached',
        `${action.file} ${action.name} went on under ${value}: ${outcome.kind === 'reached' ? outcome.what : ''}`,
      );
      if (outcome.kind === 'redirected') assert.doesNotMatch(outcome.to, /^\/admin/, action.name);
    }
  }
});

test('staff-closed: learners keep working', async () => {
  const learner = ACTIONS.filter((a) => !isStaffAction(a) && a.name !== 'join');
  assert.ok(learner.length >= 30);
  for (const action of learner) {
    const outcome = await call(action, 'staff-closed');
    assert.equal(outcome.kind, 'reached', `${action.file} ${action.name} stopped for learners`);
  }
});

test('closed, or any value nobody recognises: every action refuses before reading anything', async () => {
  for (const value of ['closed', 'CLOSED', '', 'off', 'opn', 'staff_closed']) {
    for (const action of ACTIONS) {
      const outcome = await call(action, value);
      assert.notEqual(
        outcome.kind,
        'reached',
        `${action.file} ${action.name} went on under "${value}": ${outcome.kind === 'reached' ? outcome.what : ''}`,
      );
    }
  }
});

test('the page guards send staff to the maintenance page; the check functions refuse', async () => {
  const guard = await import('../src/lib/admin/guard');
  const requires = [guard.requireAdmin, guard.requireCoach, guard.requireReviewer, guard.requireFirmAdmin];
  const checks = [guard.checkAdmin, guard.checkCoach, guard.checkReviewer, guard.checkFirmAdmin];
  for (const value of ['staff-closed', 'closed', 'nonsense']) {
    process.env.SITE_ACCESS = value;
    for (const fn of requires) {
      await assert.rejects(fn(), (e: unknown) => e instanceof Redirected && e.to === '/maintenance', fn.name);
    }
    for (const fn of checks) assert.equal(await fn(), null, fn.name);
  }
  // Open, the same calls go on to read the session.
  process.env.SITE_ACCESS = 'open';
  for (const fn of [...requires, ...checks]) {
    await assert.rejects(fn(), (e: unknown) => !(e instanceof Redirected), fn.name);
  }
});

test('getCurrentUser answers nobody while closed, and reads the session otherwise', async () => {
  const { getCurrentUser } = await import('../src/lib/supabase/server');
  for (const value of ['closed', 'Closed', '', 'garbage']) {
    process.env.SITE_ACCESS = value;
    assert.equal(await getCurrentUser(), null, value);
  }
  for (const value of [undefined, 'open', 'staff-closed']) {
    if (value === undefined) delete process.env.SITE_ACCESS;
    else process.env.SITE_ACCESS = value;
    await assert.rejects(getCurrentUser(), /cookies/, String(value));
  }
});
