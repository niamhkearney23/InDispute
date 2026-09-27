import assert from 'node:assert/strict';
import test from 'node:test';

import { safeNext } from '../src/lib/safe-next';

test('a path on this site is kept, with its query', () => {
  assert.equal(safeNext('/work/abc?tab=1', '/dashboard'), '/work/abc?tab=1');
  assert.equal(safeNext('/onboarding', '/dashboard'), '/onboarding');
});

test('anything that leaves the site falls back', () => {
  for (const bad of [
    'https://evil.com',
    '//evil.com',
    '/\\evil.com',
    '/\t/evil.com',
    '/\n/evil.com',
    'evil.com',
    '',
    null,
    undefined,
  ]) {
    assert.equal(safeNext(bad, '/dashboard'), '/dashboard', String(bad));
  }
});
