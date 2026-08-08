import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import { brand, safeAccent, safeInitial } from '../src/lib/brand';

/**
 * White labelling.
 *
 * The point is that another firm's name can go on this without a fork, so the
 * test is about the two ways that goes wrong: a name still hard-coded
 * somewhere, and a brand value reaching a stylesheet without being checked.
 */

const ROOT = path.join(__dirname, '..');

test('an accent colour is checked before it can reach a stylesheet', () => {
  // This value ends up in a style attribute. Hex only: enough for a brand
  // colour, and nothing that could carry a closing brace and a payload after it.
  assert.equal(safeAccent('#6b1f2a'), '#6b1f2a');
  assert.equal(safeAccent('#FFFFFF'), '#FFFFFF');
  assert.equal(safeAccent('  #123abc  '), '#123abc');

  // dotenv reads an unquoted `KEY=#1f3a6b` as an empty string, because the #
  // opens a comment. A firm sets their colour, nothing happens, and there is
  // no error to go on. The hash is optional so the natural form works.
  assert.equal(safeAccent('1f3a6b'), '#1f3a6b');
  assert.equal(safeAccent('  1F3A6B  '), '#1F3A6B');

  assert.equal(safeAccent('red'), null, 'named colours are not accepted');
  assert.equal(safeAccent('#fff'), null, 'short hex is not accepted');
  assert.equal(safeAccent('#6b1f2a; background: url(evil)'), null);
  assert.equal(safeAccent('} body { display: none'), null);
  assert.equal(safeAccent('url(javascript:alert(1))'), null);
  assert.equal(safeAccent(undefined), null);
  assert.equal(safeAccent(''), null);
});

test('the default brand is Lawgistics, and it is complete', () => {
  assert.equal(brand.name, 'Lawgistics');
  assert.equal(brand.suffix, 'Academy');
  assert.equal(brand.fullName, 'Lawgistics Academy');
  assert.ok(brand.tagline.length > 10);
  assert.equal(brand.accent, null, 'no accent set means the built-in burgundy');
  assert.equal(brand.initial, 'L');
});

test('the tab icon initial cannot carry anything into the SVG', () => {
  // This character is written straight into markup, so it is one letter or
  // digit or it is nothing.
  assert.equal(safeInitial('Lawgistics'), 'L');
  assert.equal(safeInitial('thomas philip'), 'T');
  assert.equal(safeInitial('  Ashurst'), 'A');
  assert.equal(safeInitial('4 Corners'), '4');

  assert.equal(safeInitial('"><script>alert(1)</script>'), 'S', 'punctuation is skipped');
  assert.equal(safeInitial('<<<'), 'A', 'nothing usable falls back');
  assert.equal(safeInitial(''), 'A');
  assert.equal(safeInitial('   '), 'A');
});

test('the tab icon is reachable without signing in', () => {
  // The icon is generated now, so it is served at /icon with no extension and
  // the middleware's "anything with an image extension" rule no longer covers
  // it. Left gated, a signed-out visitor gets a 307 to /login where the browser
  // asked for an image, and the landing page loses its icon.
  const source = fs.readFileSync(path.join(ROOT, 'src', 'middleware.ts'), 'utf8');
  const match = /matcher:\s*\[\s*'([^']+)'/.exec(source);
  assert.ok(match, 'middleware config.matcher should be a single-quoted pattern');

  const matcher = new RegExp(`^${match[1]}$`);

  assert.equal(matcher.test('/icon'), false, 'the tab icon must not be gated');
  assert.equal(matcher.test('/dashboard'), true, 'but the app still is');
  assert.equal(matcher.test('/admin/review'), true);
});

test('the product name is not hard-coded anywhere a firm would see it', () => {
  // Eight places had it, which is fine until a firm wants their own on it and
  // then it is eight places to miss one. Stylesheets and SVGs count: the tab
  // icon was the last one holding a name and a colour that were not the
  // deployment's.
  const offenders: string[] = [];

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(tsx?|css|svg)$/.test(entry.name)) continue;
      // lib/brand.ts is where the default legitimately lives.
      if (full.endsWith(path.join('lib', 'brand.ts'))) continue;

      const text = fs.readFileSync(full, 'utf8');
      text.split('\n').forEach((line, index) => {
        if (line.includes('Lawgistics')) {
          offenders.push(`${path.relative(ROOT, full)}:${index + 1}`);
        }
      });
    }
  };

  walk(path.join(ROOT, 'src'));

  assert.deepEqual(
    offenders,
    [],
    'read it from lib/brand instead, so another firm needs settings rather than a fork',
  );
});
