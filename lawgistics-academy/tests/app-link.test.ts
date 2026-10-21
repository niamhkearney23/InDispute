import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Links do not preload in the background (src/components/app-link.tsx): each
 * preload of a signed-in page cost two calls to Supabase in the middleware
 * and brought back only the page's outline. One visit to Today made 16 of
 * them. The rule only holds if nothing goes round it.
 */
const SRC = path.join(__dirname, '..', 'src');

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? files(full) : /\.tsx?$/.test(e.name) ? [full] : [];
  });
}

test("nothing imports Next's link directly, so nothing preloads by accident", () => {
  const offenders = files(SRC)
    .filter((f) => !f.endsWith(path.join('components', 'app-link.tsx')))
    .filter((f) => /from ['"]next\/link['"]/.test(fs.readFileSync(f, 'utf8')))
    .map((f) => path.relative(SRC, f));
  assert.deepEqual(offenders, []);
});

test('the shared link turns preloading off unless a link asks for it', () => {
  const source = fs.readFileSync(path.join(SRC, 'components', 'app-link.tsx'), 'utf8');
  assert.match(source, /prefetch = false/);
  assert.match(source, /<NextLink prefetch=\{prefetch\}/);
});

test('nothing asks the router to preload by hand either', () => {
  const offenders = files(SRC)
    .filter((f) => /router\.prefetch\(|prefetch=\{?true/.test(fs.readFileSync(f, 'utf8')))
    .map((f) => path.relative(SRC, f));
  assert.deepEqual(offenders, []);
});
