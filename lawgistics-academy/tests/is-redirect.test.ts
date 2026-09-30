import assert from 'node:assert/strict';
import test from 'node:test';

import { isRedirect } from '../src/lib/is-redirect';

test('the redirect signal is recognised by its digest or its message', () => {
  assert.equal(isRedirect({ digest: 'NEXT_REDIRECT;replace;/train/abc;307;' }), true);
  assert.equal(isRedirect(new Error('NEXT_REDIRECT')), true);
});

test('a real failure is not mistaken for a redirect', () => {
  assert.equal(isRedirect(new Error('Could not start the session.')), false);
  assert.equal(isRedirect(null), false);
  assert.equal(isRedirect('NEXT_REDIRECT'), false);
});
