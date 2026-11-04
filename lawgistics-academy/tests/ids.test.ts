import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

/**
 * Zod 4's `uuid()` accepts only RFC 4122 versions and variants, so an id
 * Postgres holds happily, such as one written by hand in a migration or a
 * fixture ('44444444-4444-...'), was refused and the page said "not found".
 * Found by the device sweep, November 2026. Ids are checked for shape with
 * `z.guid()`; the database decides whether one exists.
 */

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? files(p) : /\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
}

test('ids are checked for shape, not for an RFC version', () => {
  const strict = files(path.join(__dirname, '..', 'src')).filter((f) => /\.uuid\(/.test(fs.readFileSync(f, 'utf8')));
  assert.deepEqual(strict, [], 'use z.guid() for ids');
  for (const id of ['44444444-4444-4444-4444-444444444444', 'eeee0045-0000-0000-0000-000000000001', crypto.randomUUID()]) {
    assert.equal(z.guid().safeParse(id).success, true, id);
  }
  for (const bad of ['', 'nope', '../../etc/passwd', '44444444-4444-4444-4444-44444444444']) {
    assert.equal(z.guid().safeParse(bad).success, false, bad);
  }
});
