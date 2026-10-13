import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { regionProblem } from '../src/lib/region';

test('the code does not pin one region for every firm', () => {
  // One code base serves Malaysian and Australian firms, each with its own
  // Vercel project; a region in vercel.json would put them all in one place.
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
  assert.equal(config.regions, undefined);
});

test('an administrator is told when the server runs somewhere else', () => {
  assert.equal(regionProblem({ VERCEL: '1', EXPECTED_FUNCTION_REGION: 'sin1', VERCEL_REGION: 'sin1' }), null);
  assert.match(regionProblem({ VERCEL: '1', EXPECTED_FUNCTION_REGION: 'sin1', VERCEL_REGION: 'syd1' }) ?? '', /syd1.*sin1/);
  assert.match(regionProblem({ VERCEL: '1', VERCEL_REGION: 'iad1' }) ?? '', /EXPECTED_FUNCTION_REGION/);
  assert.equal(regionProblem({ EXPECTED_FUNCTION_REGION: 'sin1' }), null, 'off Vercel there is nothing to check');
});
