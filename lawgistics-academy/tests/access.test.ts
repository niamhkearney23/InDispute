import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  PRICES,
  accessReason,
  formatPrice,
  normaliseCode,
  subscriptionLive,
  traineeValue,
  type AccessFacts,
} from '../src/lib/access/rules';

const ROOT = path.resolve(__dirname, '..');

const nobody: AccessFacts = {
  paymentsOn: true,
  isStaff: false,
  traineeConfirmed: false,
  joinedByInvitation: false,
  firmConfirmed: false,
  paid: false,
};

test('while payments are off, everybody is in', () => {
  assert.equal(accessReason({ ...nobody, paymentsOn: false }), 'payments-off');
});

test('somebody on their own, unpaid, is not in', () => {
  assert.equal(accessReason(nobody), null);
});

test('people reached through a firm are in without paying', () => {
  assert.equal(accessReason({ ...nobody, isStaff: true }), 'staff');
  assert.equal(accessReason({ ...nobody, traineeConfirmed: true }), 'trainee');
  assert.equal(accessReason({ ...nobody, joinedByInvitation: true }), 'invited');
  assert.equal(accessReason({ ...nobody, firmConfirmed: true }), 'firm');
  assert.equal(accessReason({ ...nobody, paid: true }), 'paid');
});

test('the prices are the ones the owner chose', () => {
  assert.equal(formatPrice(PRICES.MY.month), 'RM 349');
  assert.equal(formatPrice(PRICES.MY.year), 'RM 2,990');
  assert.equal(formatPrice(PRICES.AU.month), 'A$209');
  assert.equal(formatPrice(PRICES.AU.year), 'A$1,790');
  assert.equal(formatPrice({ amount: 4950, currency: 'myr' }), 'RM 49.50');
});

test('a code is read the way a person would type it', () => {
  assert.equal(normaliseCode('thomas philip'), 'THOMAS-PHILIP');
  assert.equal(normaliseCode('  Thomas_Philip!  '), 'THOMAS-PHILIP');
  assert.equal(normaliseCode('tp-2026'), 'TP-2026');
  assert.equal(normaliseCode('ab'), null, 'too short to be a code');
  assert.equal(normaliseCode('!!!!'), null);
  assert.equal(normaliseCode('x'.repeat(40)), null, 'too long to be a code');
});

test('a subscription pays for today while it is active, or retrying within what was paid', () => {
  const now = new Date('2026-10-02T00:00:00Z');
  assert.equal(subscriptionLive('active', null, now), true);
  assert.equal(subscriptionLive('trialing', null, now), true);
  assert.equal(subscriptionLive('past_due', '2026-10-10T00:00:00Z', now), true);
  assert.equal(subscriptionLive('past_due', '2026-09-30T00:00:00Z', now), false);
  assert.equal(subscriptionLive('canceled', '2026-10-10T00:00:00Z', now), false);
  assert.equal(subscriptionLive(null, null, now), false);
});

test('every training page sends somebody who has not paid to the pricing page', () => {
  // The gate is one line at the top of each page, which is easy to forget on
  // a new one. These are the only pages somebody who has not paid may open.
  const open = new Set([
    'account/page.tsx',
    'account/password/page.tsx',
    'onboarding/page.tsx',
    'pricing/page.tsx',
  ]);
  const appDir = path.join(ROOT, 'src/app/(app)');
  const missing: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'page.tsx') {
        const rel = path.relative(appDir, full).split(path.sep).join('/');
        if (!open.has(rel) && !fs.readFileSync(full, 'utf8').includes('await requireAccess()')) {
          missing.push(rel);
        }
      }
    }
  };
  walk(appDir);
  assert.deepEqual(missing, [], 'add `await requireAccess();` at the top of these pages');
});

test('starting training and asking the AI check access on the server too', () => {
  // A page redirect is not enough on its own: an action can be called
  // without opening the page. These are the ones that start training or
  // spend money on the AI.
  const source = fs.readFileSync(path.join(ROOT, 'src/app/(app)/actions.ts'), 'utf8');
  for (const name of [
    'beginSession',
    'beginModule',
    'requestCoachNote',
    'startMatter',
    'askFollowUps',
  ]) {
    const start = source.indexOf(`export async function ${name}`);
    assert.ok(start >= 0, `${name} not found`);
    const next = source.indexOf('\nexport async function', start + 1);
    const body = source.slice(start, next === -1 ? undefined : next);
    assert.ok(body.includes('hasAccess(user.id)'), `${name} must check hasAccess(user.id)`);
  }
});

test('a trainee is told the real price their free place would cost, and no other number', () => {
  assert.equal(
    traineeValue(true).line,
    'Students on their own pay RM 2,990 a year for the Academy. For trainees it is included free.',
  );
  assert.equal(
    traineeValue(false).line,
    'Students on their own will pay RM 2,990 a year for the Academy. For trainees it is included free.',
  );
  assert.equal(traineeValue(true).price, formatPrice(PRICES.MY.year));
});
