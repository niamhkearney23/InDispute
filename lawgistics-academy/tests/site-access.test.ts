import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import {
  ALWAYS_RUNNING_PATHS,
  MAINTENANCE_PATH,
  SITE_ACCESS_VALUES,
  STAFF_ONLY_PATHS,
  maintenanceHtml,
  maintenanceWords,
  normalisePath,
  pathDecision,
  signedInUseOpen,
  siteAccess,
  staffAreaOpen,
  type SiteAccess,
} from '../src/lib/security/site-access';
import { twoStepDecision, twoStepEnforced, needsCodeNow } from '../src/lib/auth/two-step';

/**
 * The site access switch (SITE_ACCESS), as pure functions.
 *
 * The owner's rule: when something goes wrong, restrict access first, and
 * nothing about the switch may ever relax a control. These tests hold the
 * parsing to "unknown means closed", the path decisions to "only ever
 * refuse", and two-step sign-in to "untouched by any value".
 */

const ROOT = path.join(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

/** Values somebody might type into Vercel's settings screen, sensible and not. */
const ODD_VALUES: Array<string | undefined> = [
  undefined,
  '',
  ' ',
  'open',
  'OPEN',
  ' Open ',
  'opened',
  'opn',
  'staff-closed',
  'Staff-Closed',
  ' STAFF-CLOSED\n',
  'staff_closed',
  'staffclosed',
  'staff closed',
  'closed',
  'CLOSED',
  'close',
  'off',
  'on',
  'none',
  'false',
  'true',
  '0',
  '1',
  'disabled',
  'public',
  'mfa-off',
  'open,staff-closed',
  'open;',
  '"open"',
  'ｏｐｅｎ',
];

/** Paths across the site: public, learner, staff, routes, odd spellings. */
const PATHS = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/trainee',
  '/auth/callback',
  '/auth/sign-out',
  '/two-step',
  '/account/two-step',
  '/dashboard',
  '/learn',
  '/account',
  '/certificate/pdf',
  '/join/abc',
  '/goodbye',
  '/setup',
  '/admin',
  '/admin/',
  '/admin/review',
  '/admin/reports/export/progress',
  '/ADMIN/review',
  '/%61dmin',
  '//admin',
  '/administrator-guide',
  '/api/inbound/work',
  '/api/digest',
  '/api/stripe/webhook',
  '/api/cron/erasure-retry',
  '/api/cron/erasure-retry/',
  '/maintenance',
  '/does-not-exist',
];

/* -------------------------------------------------------------------------- */
/* Reading the setting                                                        */
/* -------------------------------------------------------------------------- */

test('unset is open; the three names are themselves in any case; everything else is closed', () => {
  assert.equal(siteAccess(undefined), 'open');
  assert.equal(siteAccess('open'), 'open');
  assert.equal(siteAccess(' Open '), 'open');
  assert.equal(siteAccess('OPEN'), 'open');
  assert.equal(siteAccess('staff-closed'), 'staff-closed');
  assert.equal(siteAccess('Staff-Closed'), 'staff-closed');
  assert.equal(siteAccess(' STAFF-CLOSED\n'), 'staff-closed');
  assert.equal(siteAccess('closed'), 'closed');
  assert.equal(siteAccess('CLOSED'), 'closed');
  for (const odd of ['', ' ', 'opened', 'off', 'on', 'staff_closed', 'staff closed', 'none', 'false', '0', '"open"', 'ｏｐｅｎ']) {
    assert.equal(siteAccess(odd), 'closed', `"${odd}" must be treated as closed`);
  }
});

test('the default really is read from the environment at the time of asking', () => {
  const saved = process.env.SITE_ACCESS;
  try {
    delete process.env.SITE_ACCESS;
    assert.equal(siteAccess(), 'open');
    process.env.SITE_ACCESS = 'staff-closed';
    assert.equal(siteAccess(), 'staff-closed');
    process.env.SITE_ACCESS = 'nonsense';
    assert.equal(siteAccess(), 'closed');
    process.env.SITE_ACCESS = '';
    assert.equal(siteAccess(), 'closed');
  } finally {
    if (saved === undefined) delete process.env.SITE_ACCESS;
    else process.env.SITE_ACCESS = saved;
  }
});

test('only open lets staff in, and only closed stops everybody', () => {
  assert.deepEqual(
    SITE_ACCESS_VALUES.map((m) => [m, staffAreaOpen(m), signedInUseOpen(m)]),
    [
      ['open', true, true],
      ['staff-closed', false, true],
      ['closed', false, false],
    ],
  );
});

/* -------------------------------------------------------------------------- */
/* Paths                                                                      */
/* -------------------------------------------------------------------------- */

test('open changes nothing: every path carries on to the usual checks', () => {
  for (const p of PATHS) {
    assert.equal(pathDecision('open', p), 'continue', p);
    assert.equal(pathDecision('open', p, { serverAction: true }), 'continue', p);
  }
});

test('staff-closed shuts every staff path, however it is spelt, and nothing a learner uses', () => {
  const shut = [
    '/admin',
    '/admin/',
    '/admin/review',
    '/admin/reports/export/progress',
    '/ADMIN/review',
    '/%61dmin',
    '//admin',
    '/api/inbound/work',
    '/api/digest',
    '/setup',
    '/maintenance',
  ];
  for (const p of shut) assert.equal(pathDecision('staff-closed', p), 'maintenance', p);
  const open = [
    '/',
    '/login',
    '/auth/callback',
    '/two-step',
    '/account/two-step',
    '/dashboard',
    '/learn',
    '/account',
    '/certificate/pdf',
    '/join/abc',
    '/administrator-guide',
    '/api/stripe/webhook',
    '/api/cron/erasure-retry',
  ];
  for (const p of open) assert.equal(pathDecision('staff-closed', p), 'continue', p);
});

test('closed shuts every path except the nightly deletion job', () => {
  for (const p of PATHS) {
    const expected = ALWAYS_RUNNING_PATHS.includes(normalisePath(p)) ? 'continue' : 'maintenance';
    assert.equal(pathDecision('closed', p), expected, p);
  }
  assert.equal(pathDecision('closed', '/login'), 'maintenance', 'sign-in is refused');
  assert.equal(pathDecision('closed', '/auth/callback'), 'maintenance', 'an emailed sign-in link is refused');
});

test('the deletion job keeps running in every mode, but never carries a server action', () => {
  for (const mode of SITE_ACCESS_VALUES) {
    assert.equal(pathDecision(mode, '/api/cron/erasure-retry'), 'continue', mode);
  }
  assert.equal(pathDecision('closed', '/api/cron/erasure-retry', { serverAction: true }), 'maintenance');
  assert.equal(pathDecision('staff-closed', '/api/cron/erasure-retry', { serverAction: true }), 'maintenance');
  assert.ok(!STAFF_ONLY_PATHS.some((p) => '/api/cron/erasure-retry'.startsWith(p)));
});

test('a server action posted anywhere under closed meets the maintenance page', () => {
  for (const p of PATHS) {
    assert.equal(pathDecision('closed', p, { serverAction: true }), 'maintenance', p);
  }
});

test('each step up shuts at least what the step below shut', () => {
  const shut = (mode: SiteAccess, serverAction: boolean) =>
    new Set(PATHS.filter((p) => pathDecision(mode, p, { serverAction }) === 'maintenance'));
  for (const serverAction of [false, true]) {
    const [open, staff, closed] = SITE_ACCESS_VALUES.map((m) => shut(m, serverAction));
    for (const p of open) assert.ok(staff.has(p), `staff-closed opens ${p}`);
    for (const p of staff) assert.ok(closed.has(p), `closed opens ${p}`);
  }
});

/* -------------------------------------------------------------------------- */
/* Nothing relaxes                                                            */
/* -------------------------------------------------------------------------- */

test('no value of SITE_ACCESS makes two-step sign-in optional or opens what open keeps shut', () => {
  const saved = {
    access: process.env.SITE_ACCESS,
    flag: process.env.STAFF_TWO_STEP,
    vercel: process.env.VERCEL_ENV,
  };
  try {
    for (const value of ODD_VALUES) {
      if (value === undefined) delete process.env.SITE_ACCESS;
      else process.env.SITE_ACCESS = value;
      const mode = siteAccess();
      assert.ok(SITE_ACCESS_VALUES.includes(mode), `${value} gives a known mode`);

      // Two-step sign-in, read from the environment as the app reads it.
      delete process.env.STAFF_TWO_STEP;
      delete process.env.VERCEL_ENV;
      assert.equal(twoStepEnforced(), true, `two-step on with ${value}`);
      // STAFF_TWO_STEP=off is still ignored on a Vercel production deployment.
      process.env.STAFF_TWO_STEP = 'off';
      process.env.VERCEL_ENV = 'production';
      assert.equal(twoStepEnforced(), true, `off ignored in production with ${value}`);
      const enforced = twoStepEnforced();
      // Staff with an app and a password alone are still sent to the code.
      assert.equal(
        twoStepDecision({ isStaff: true, verifiedFactorCount: 1, aal: 'aal1', enforced }),
        'code',
      );
      assert.equal(
        twoStepDecision({ isStaff: true, verifiedFactorCount: 0, aal: 'aal1', enforced }),
        'setup',
      );
      assert.equal(needsCodeNow({ verifiedFactorCount: 1, aal: 'aal1', enforced }), true);

      // The paths: anything open sends to maintenance, this mode does too
      // (open sends none; the point is that no mode has an answer that
      // skips the checks behind it).
      for (const p of PATHS) {
        for (const serverAction of [false, true]) {
          const here = pathDecision(mode, p, { serverAction });
          assert.ok(here === 'continue' || here === 'maintenance');
          if (pathDecision('open', p, { serverAction }) === 'maintenance') {
            assert.equal(here, 'maintenance', `${value} opens ${p}`);
          }
        }
      }
      // Staff are let in only by exactly "open" (or by leaving it unset).
      if (staffAreaOpen(mode)) {
        assert.ok(value === undefined || value.trim().toLowerCase() === 'open', `${value} opened the staff area`);
      }
      if (signedInUseOpen(mode) && value !== undefined) {
        assert.ok(['open', 'staff-closed'].includes(value.trim().toLowerCase()), `${value} let people sign in`);
      }
    }
  } finally {
    for (const [key, val] of [
      ['SITE_ACCESS', saved.access],
      ['STAFF_TWO_STEP', saved.flag],
      ['VERCEL_ENV', saved.vercel],
    ] as const) {
      if (val === undefined) delete process.env[key];
      else process.env[key] = val;
    }
  }
});

test('the switch and two-step sign-in do not know about each other', () => {
  // Two-step sign-in reads only its own switch and Vercel's environment name;
  // the site access switch reads only SITE_ACCESS. Were either to start
  // reading the other, a value of one could quietly change the other.
  const twoStep = read('src/lib/auth/two-step.ts');
  assert.doesNotMatch(twoStep, /SITE_ACCESS|site-access|siteAccess/);
  const access = read('src/lib/security/site-access.ts').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(access, /two-step|twoStep|STAFF_TWO_STEP|aal/i);
  const envReads = access.match(/process\.env\.[A-Z_]+/g) ?? [];
  assert.deepEqual([...new Set(envReads)], ['process.env.SITE_ACCESS']);
});

/* -------------------------------------------------------------------------- */
/* The maintenance page                                                       */
/* -------------------------------------------------------------------------- */

test('the maintenance page is plain words with no script, dash or outside file', () => {
  for (const mode of ['staff-closed', 'closed'] as const) {
    const html = maintenanceHtml(mode, 'Lawgistics Academy');
    assert.match(html, /^<!doctype html>/);
    assert.match(html, /<html lang="en">/);
    assert.match(html, /name="viewport"/);
    assert.match(html, /closed for maintenance/);
    assert.doesNotMatch(html, /<script|<link|<img|src=|href=|@import|url\(/i, 'nothing to fetch or run');
    assert.doesNotMatch(html, /[\u2013\u2014]/, 'no en or em dashes');
    assert.doesNotMatch(html, / - /, 'no hyphen standing in for a dash');
  }
  assert.match(maintenanceHtml('staff-closed', 'X'), /Learners can carry on as normal/);
  assert.match(maintenanceHtml('closed', 'X'), /Nobody can sign in/);
  for (const mode of SITE_ACCESS_VALUES) {
    const { title, lines } = maintenanceWords(mode);
    for (const words of [title, ...lines]) assert.doesNotMatch(words, /[\u2013\u2014]/);
  }
});

test('the site name on the maintenance page is escaped', () => {
  const html = maintenanceHtml('closed', '<script>alert(1)</script> & "Co"');
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; &quot;Co&quot;/);
});

test('the maintenance page has its own address, closed in every mode but open', () => {
  assert.equal(MAINTENANCE_PATH, '/maintenance');
  assert.equal(pathDecision('open', MAINTENANCE_PATH), 'continue');
  assert.equal(pathDecision('staff-closed', MAINTENANCE_PATH), 'maintenance');
  assert.equal(pathDecision('closed', MAINTENANCE_PATH), 'maintenance');
});

test('paths are compared decoded, in lower case, without doubled or trailing slashes', () => {
  assert.equal(normalisePath('/Admin//Review/'), '/admin/review');
  assert.equal(normalisePath('/%61dmin'), '/admin');
  assert.equal(normalisePath('/'), '/');
  assert.equal(normalisePath('/%E0%A4%A'), '/%e0%a4%a');
});

/* -------------------------------------------------------------------------- */
/* Documentation and settings                                                 */
/* -------------------------------------------------------------------------- */

test('the switch is documented where the owner will look, and no rollback reopens two-step', () => {
  const rollback = read('docs/ROLLBACK.md');
  for (const value of SITE_ACCESS_VALUES) assert.match(rollback, new RegExp(`\`${value}\``));
  assert.match(rollback, /## When a security control may be relaxed/);
  assert.match(read('docs/RELEASE.md'), /docs\/ROLLBACK\.md|ROLLBACK\.md/);
  assert.match(read('.env.example'), /SITE_ACCESS/);
  assert.ok(fs.existsSync(path.join(ROOT, 'docs/SECURITY-EXCEPTIONS.md')));
  assert.ok(!fs.existsSync(path.join(ROOT, 'supabase/rollback/ROLLBACK-0047.sql')));
  for (const doc of ['docs/ROLLBACK.md', 'docs/RELEASE.md', 'docs/SECURITY-EXCEPTIONS.md', 'CLAUDE.md']) {
    assert.doesNotMatch(read(doc), /[\u2013\u2014]/, `${doc} has a dash`);
    assert.doesNotMatch(read(doc), /supabase\/rollback/, `${doc} points at a rollback file`);
  }
  // Nothing on Vercel sets the local-only switches.
  const vercel = read('vercel.json');
  assert.doesNotMatch(vercel, /STAFF_TWO_STEP|SITE_ACCESS|MOCK_/);
});
