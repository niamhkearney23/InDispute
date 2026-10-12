import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

import {
  MAX_DEVICES,
  TWO_STEP_CODE_PATH,
  TWO_STEP_SETUP_PATH,
  canAddDevice,
  canRemoveDevice,
  cleanCode,
  codePathFor,
  deviceName,
  groupSecret,
  isStaff,
  needsCodeNow,
  returnPath,
  setupPathFor,
  staffReturnPath,
  twoStepDecision,
  twoStepEnforced,
  twoStepProblem,
  verifiedFactors,
} from '../src/lib/auth/two-step';
import { qrImageSource } from '../src/lib/auth/two-step-qr';

/**
 * Two-step sign-in for staff.
 *
 * The rules are pure functions and are tested as such. The guard is tested
 * structurally as well, the same way the authorisation contract is: a guard
 * function that forgets to ask is an open door that no page test would
 * notice, because the page still renders.
 */

const ROOT = path.join(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

/* -------------------------------------------------------------------------- */
/* The switch                                                                 */
/* -------------------------------------------------------------------------- */

test('two-step sign-in is required when STAFF_TWO_STEP is not set at all', () => {
  assert.equal(twoStepEnforced(undefined, undefined), true);
  assert.equal(twoStepEnforced('', undefined), true);
});

test('the default really is read from the environment, and is on', () => {
  const saved = { flag: process.env.STAFF_TWO_STEP, vercel: process.env.VERCEL_ENV };
  delete process.env.STAFF_TWO_STEP;
  delete process.env.VERCEL_ENV;
  try {
    assert.equal(twoStepEnforced(), true);
    process.env.STAFF_TWO_STEP = 'off';
    assert.equal(twoStepEnforced(), false);
  } finally {
    if (saved.flag === undefined) delete process.env.STAFF_TWO_STEP;
    else process.env.STAFF_TWO_STEP = saved.flag;
    if (saved.vercel === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = saved.vercel;
  }
});

test('only the word off switches it off, so a typo fails safe', () => {
  assert.equal(twoStepEnforced('off', undefined), false);
  assert.equal(twoStepEnforced(' OFF ', undefined), false);
  for (const other of ['false', '0', 'no', 'of', 'disabled', 'on', 'true']) {
    assert.equal(twoStepEnforced(other, undefined), true, other);
  }
});

test('a Vercel production deployment ignores the switch', () => {
  assert.equal(twoStepEnforced('off', 'production'), true);
  assert.equal(twoStepEnforced('off', 'preview'), false);
});

/* -------------------------------------------------------------------------- */
/* The decision                                                               */
/* -------------------------------------------------------------------------- */

test('staff with no device are sent to set one up', () => {
  for (const aal of [null, 'aal1', 'aal2']) {
    assert.equal(
      twoStepDecision({ isStaff: true, verifiedFactorCount: 0, aal, enforced: true }),
      'setup',
      String(aal),
    );
  }
});

test('staff with a device who have only typed a password are asked for the code', () => {
  for (const aal of [null, undefined, 'aal1', 'AAL2', '']) {
    assert.equal(
      twoStepDecision({ isStaff: true, verifiedFactorCount: 1, aal, enforced: true }),
      'code',
      String(aal),
    );
  }
});

test('staff with a device and a code-checked session are let in', () => {
  assert.equal(twoStepDecision({ isStaff: true, verifiedFactorCount: 1, aal: 'aal2', enforced: true }), 'allow');
  assert.equal(twoStepDecision({ isStaff: true, verifiedFactorCount: 2, aal: 'aal2', enforced: true }), 'allow');
});

test('learners are never stopped by the staff rule', () => {
  for (const verifiedFactorCount of [0, 1, 2]) {
    for (const aal of [null, 'aal1', 'aal2']) {
      assert.equal(
        twoStepDecision({ isStaff: false, verifiedFactorCount, aal, enforced: true }),
        'allow',
      );
    }
  }
});

test('with the switch off, staff are let in without a device', () => {
  assert.equal(twoStepDecision({ isStaff: true, verifiedFactorCount: 0, aal: null, enforced: false }), 'allow');
  assert.equal(twoStepDecision({ isStaff: true, verifiedFactorCount: 1, aal: 'aal1', enforced: false }), 'allow');
});

test('anybody with a device is asked for the code at sign-in, nobody without one', () => {
  assert.equal(needsCodeNow({ verifiedFactorCount: 1, aal: 'aal1', enforced: true }), true);
  assert.equal(needsCodeNow({ verifiedFactorCount: 1, aal: null, enforced: true }), true);
  assert.equal(needsCodeNow({ verifiedFactorCount: 1, aal: 'aal2', enforced: true }), false);
  assert.equal(needsCodeNow({ verifiedFactorCount: 0, aal: 'aal1', enforced: true }), false);
  assert.equal(needsCodeNow({ verifiedFactorCount: 1, aal: 'aal1', enforced: false }), false);
});

test('any one of the three staff flags makes somebody staff', () => {
  assert.equal(isStaff({ isAdmin: true }), true);
  assert.equal(isStaff({ isCoach: true }), true);
  assert.equal(isStaff({ isFirmAdmin: true }), true);
  assert.equal(isStaff({ isAdmin: false, isCoach: false, isFirmAdmin: false }), false);
  assert.equal(isStaff(null), false);
});

test('an unfinished setup is not a device', () => {
  const factors = [
    { id: 'a', status: 'verified', factor_type: 'totp' },
    { id: 'b', status: 'unverified', factor_type: 'totp' },
  ];
  assert.deepEqual(verifiedFactors(factors).map((f) => f.id), ['a']);
  assert.deepEqual(verifiedFactors(undefined), []);
});

/* -------------------------------------------------------------------------- */
/* Devices                                                                    */
/* -------------------------------------------------------------------------- */

test('two devices at most, and a second only from a code-checked session', () => {
  assert.equal(MAX_DEVICES, 2);
  assert.equal(canAddDevice({ verifiedFactorCount: 0, aal: 'aal1' }), true);
  assert.equal(canAddDevice({ verifiedFactorCount: 1, aal: 'aal1' }), false);
  assert.equal(canAddDevice({ verifiedFactorCount: 1, aal: 'aal2' }), true);
  assert.equal(canAddDevice({ verifiedFactorCount: 2, aal: 'aal2' }), false);
});

test('staff keep their last device; learners may turn it off; nobody removes one on a password alone', () => {
  const on = { enforced: true };
  assert.equal(canRemoveDevice({ ...on, isStaff: true, verifiedFactorCount: 1, aal: 'aal2' }), false);
  assert.equal(canRemoveDevice({ ...on, isStaff: true, verifiedFactorCount: 2, aal: 'aal2' }), true);
  assert.equal(canRemoveDevice({ ...on, isStaff: false, verifiedFactorCount: 1, aal: 'aal2' }), true);
  assert.equal(canRemoveDevice({ ...on, isStaff: false, verifiedFactorCount: 2, aal: 'aal1' }), false);
  assert.equal(canRemoveDevice({ ...on, isStaff: true, verifiedFactorCount: 2, aal: 'aal1' }), false);
  assert.equal(canRemoveDevice({ ...on, isStaff: false, verifiedFactorCount: 0, aal: 'aal2' }), false);
});

test('device names are unique on one account', () => {
  const now = new Date('2026-10-12T09:00:00Z');
  const first = deviceName([], now);
  assert.equal(first, 'Authenticator app added 12 Oct 2026');
  const second = deviceName([{ friendly_name: first }], now);
  assert.equal(second, 'Authenticator app added 12 Oct 2026 (2)');
  assert.notEqual(deviceName([{ friendly_name: first }, { friendly_name: second }], now), second);
});

/* -------------------------------------------------------------------------- */
/* Small helpers                                                              */
/* -------------------------------------------------------------------------- */

test('a code is six digits, with spaces and dashes forgiven', () => {
  assert.equal(cleanCode('123456'), '123456');
  assert.equal(cleanCode('123 456'), '123456');
  assert.equal(cleanCode('123-456'), '123456');
  for (const bad of ['12345', '1234567', 'abcdef', '', null, 123456]) {
    assert.equal(cleanCode(bad), null, String(bad));
  }
});

test('after the code, only a path on this site, and never the code step again', () => {
  assert.equal(returnPath('/admin/work'), '/admin/work');
  assert.equal(returnPath('https://evil.com'), '/dashboard');
  assert.equal(returnPath(TWO_STEP_CODE_PATH), '/dashboard');
  assert.equal(returnPath(`${TWO_STEP_CODE_PATH}?next=/admin`), '/dashboard');
  assert.equal(returnPath(null), '/dashboard');
  assert.equal(returnPath(undefined, TWO_STEP_SETUP_PATH), TWO_STEP_SETUP_PATH);
});

test('staff come back to the staff page they asked for, and only a staff page', () => {
  assert.equal(staffReturnPath('/admin', '/admin/work'), '/admin');
  assert.equal(staffReturnPath('/admin/review?tab=2', '/admin/work'), '/admin/review?tab=2');
  assert.equal(staffReturnPath('/dashboard', '/admin/work'), '/admin/work');
  assert.equal(staffReturnPath('/administrator', '/admin/work'), '/admin/work');
  assert.equal(staffReturnPath('//evil.com/admin', '/admin/work'), '/admin/work');
  assert.equal(staffReturnPath(null, '/admin'), '/admin');
});

test('the two addresses carry where to come back to', () => {
  assert.equal(codePathFor('/admin?x=1'), '/two-step?next=%2Fadmin%3Fx%3D1');
  assert.equal(setupPathFor('/admin/work'), '/account/two-step?next=%2Fadmin%2Fwork');
});

test('Supabase refusals are put in plain words', () => {
  assert.match(twoStepProblem('over_request_rate_limit'), /Wait five minutes/);
  assert.match(twoStepProblem(undefined, 429), /Wait five minutes/);
  assert.match(twoStepProblem('mfa_totp_enroll_not_enabled'), /switched off for this site/);
  assert.match(twoStepProblem('mfa_verification_failed'), /did not work/);
});

test('the secret is grouped for typing without changing it', () => {
  assert.equal(groupSecret('ABCDEFGHIJ'), 'ABCD EFGH IJ');
  assert.equal(groupSecret('ABCDEFGHIJ').replace(/ /g, ''), 'ABCDEFGHIJ');
});

test('the QR picture is sent as base64, so a colour in it cannot cut it short', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#000000"/></svg>';
  const out = qrImageSource(`data:image/svg+xml;utf-8,${svg}`);
  assert.ok(out?.startsWith('data:image/svg+xml;base64,'));
  assert.ok(!out?.includes('#'));
  assert.equal(Buffer.from(out!.split(',')[1], 'base64').toString('utf8'), svg);
  assert.equal(qrImageSource(svg)?.startsWith('data:image/svg+xml;base64,'), true);
  assert.equal(qrImageSource('<script>alert(1)</script>'), null);
});

/* -------------------------------------------------------------------------- */
/* The guard: every function asks                                             */
/* -------------------------------------------------------------------------- */

interface GuardFunction {
  name: string;
  body: string;
}

function guardFunctions(): GuardFunction[] {
  const text = read('src/lib/admin/guard.ts');
  const source = ts.createSourceFile('guard.ts', text, ts.ScriptTarget.Latest, true);
  const found: GuardFunction[] = [];
  for (const statement of source.statements) {
    if (!ts.isFunctionDeclaration(statement) || !statement.name) continue;
    found.push({ name: statement.name.text, body: stripComments(statement.body?.getText() ?? '') });
  }
  return found;
}

const EXPORTED_GUARDS = [
  'requireAdmin',
  'checkAdmin',
  'requireCoach',
  'checkCoach',
  'requireReviewer',
  'checkReviewer',
  'requireFirmAdmin',
  'checkFirmAdmin',
];

test('the guard still has exactly the eight functions this test checks', () => {
  const text = read('src/lib/admin/guard.ts');
  const exported = [...text.matchAll(/export async function (\w+)/g)].map((m) => m[1]).sort();
  assert.deepEqual(exported, [...EXPORTED_GUARDS].sort());
});

test('every require function sends staff to two-step sign-in, after the role check', () => {
  const all = guardFunctions();
  for (const name of EXPORTED_GUARDS.filter((n) => n.startsWith('require'))) {
    const fn = all.find((f) => f.name === name);
    assert.ok(fn, name);
    // requireReviewer is requireCoach plus a narrower role: it inherits the
    // ask by calling it first, before returning anything.
    if (name === 'requireReviewer') {
      assert.match(fn.body, /^\{\s*const staff = await requireCoach\(\);/, name);
      continue;
    }
    const ask = fn.body.indexOf('await requireStaffTwoStep(user,');
    const role = fn.body.search(/redirect\('\/dashboard'\)/);
    const done = fn.body.indexOf('return {');
    assert.ok(ask !== -1, `${name} must ask for two-step sign-in`);
    assert.ok(role !== -1 && role < ask, `${name} must check the role first`);
    assert.ok(ask < done, `${name} must ask before it returns`);
  }
});

test('every check function refuses staff who have not passed two-step sign-in', () => {
  const all = guardFunctions();
  for (const name of EXPORTED_GUARDS.filter((n) => n.startsWith('check'))) {
    const fn = all.find((f) => f.name === name);
    assert.ok(fn, name);
    // The only way to hand back an id is through the two-step answer.
    const returns = [...fn.body.matchAll(/return ([^;]+);/g)].map((m) => m[1].trim());
    const giving = returns.filter((r) => r !== 'null');
    assert.deepEqual(
      giving,
      ['(await passesStaffTwoStep(user)) ? user.id : null'],
      `${name} returns an id only when two-step sign-in has passed`,
    );
  }
});

test('the helpers ask for aal2 from the signed token, and the devices from Supabase', () => {
  const all = guardFunctions();
  const decide = all.find((f) => f.name === 'staffTwoStep');
  assert.ok(decide);
  assert.match(decide.body, /twoStepEnforced\(\)/);
  assert.match(decide.body, /verifiedFactors\(user\.factors\)/);
  assert.match(decide.body, /await verifiedAal\(user\.id\)/);
  assert.match(decide.body, /twoStepDecision\(\{ isStaff: true,/);

  const pass = all.find((f) => f.name === 'passesStaffTwoStep');
  assert.match(pass?.body ?? '', /=== 'allow'/);
  const send = all.find((f) => f.name === 'requireStaffTwoStep');
  assert.match(send?.body ?? '', /decision === 'setup'\) redirect\(setupPathFor/);
  assert.match(send?.body ?? '', /decision === 'code'\) redirect\(codePathFor/);

  const server = stripComments(read('src/lib/auth/two-step-server.ts'));
  assert.match(server, /auth\.getClaims\(\)/, 'the level comes from a verified token');
  assert.match(server, /claims\.sub !== userId\) return null/, 'and from this user\'s token');
  assert.doesNotMatch(server, /getSession\(/, 'never from the unverified cookie');
});

test('the middleware sends anybody with a device to the code step, but not from it', () => {
  const middleware = stripComments(read('src/middleware.ts'));
  assert.match(middleware, /pathname !== TWO_STEP_CODE_PATH/);
  assert.match(middleware, /needsCodeNow\(/);
  assert.match(middleware, /twoStepEnforced\(\)/);
  // The address the guard sends staff back to is always the middleware's own.
  const setAt = middleware.indexOf('request.headers.set(\n    REQUEST_PATH_HEADER');
  assert.ok(setAt !== -1 && setAt < middleware.indexOf('NextResponse.next({ request })'));
});

/* -------------------------------------------------------------------------- */
/* What the people who run it are told                                       */
/* -------------------------------------------------------------------------- */

test('the switch is documented, and the visual check sets it', () => {
  assert.match(read('.env.example'), /^# STAFF_TWO_STEP=off$/m);
  assert.match(read('tools/visual-qa/README.md'), /^STAFF_TWO_STEP=off$/m);
});

test('removing a lost device is written down for an administrator', () => {
  for (const rel of ['docs/NEW-FIRM.md', 'src/app/(app)/account/two-step/page.tsx']) {
    const text = read(rel);
    assert.match(text, /Authentication/, rel);
    assert.match(text, /Remove MFA factors/, rel);
  }
});
