/* Print is where a claims mistake is most expensive: a page can be edited in a
   minute, a printed run of five hundred cards cannot. So the copy in the build
   script is linted the same way the theme and the captions are. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = readFileSync(path.join(root, 'scripts', 'build-print.mjs'), 'utf8');

/* Only the copy, not the code: pull the piece bodies and labels out. */
const copy = [...script.matchAll(/body: `([\s\S]*?)`/g)].map((m) => m[1]).join('\n');
assert.ok(copy.length > 200, 'could not find the piece copy in the build script');

test('no outcome claims on anything that goes to a printer', () => {
  const CLAIMS = [
    /improves? (your )?sleep/i,
    /aids? sleep/i,
    /helps? you (fall )?asleep/i,
    /better sleep/i,
    /deeper sleep/i,
    /sleep quality/i,
    /promotes?\b/i,
    /reduces? (stress|anxiety|tension)/i,
    /relieves?\b/i,
    /soothes?\b/i,
    /calms?\b/i,
    /anxiety/i,
    /insomnia/i,
    /therapeutic/i,
    /wellness/i,
    /restorative/i
  ];
  for (const pattern of CLAIMS) {
    const hit = copy.match(pattern);
    assert.equal(hit, null, `print copy: "${hit && hit[0]}" is an outcome claim`);
  }
});

test('the ritual card instructs, it does not promise', () => {
  const PROMISES = [
    /you('| wi)ll (sleep|feel|drift|relax)/i,
    /guarantees?/i,
    /proven/i,
    /works?\b/i
  ];
  for (const pattern of PROMISES) {
    const hit = copy.match(pattern);
    assert.equal(hit, null, `print copy: "${hit && hit[0]}" promises an outcome`);
  }
  /* And it must keep its own escape hatch: the line that says it is not a
     prescription is the difference between an invitation and a regimen. */
  assert.match(copy, /is a prescription|not a prescription/i,
    'the ritual card must keep its "none of this is a prescription" line');
});

test('house style holds on paper too', () => {
  assert.ok(!copy.includes('—'), 'em dash in print copy');
  const US = [/\borganiz/i, /\bcustomiz/i, /\bpersonaliz/i, /\bcolor\b/i, /\bfavorite/i];
  for (const pattern of US) {
    const hit = copy.match(pattern);
    assert.equal(hit, null, `print copy: American spelling "${hit && hit[0]}"`);
  }
});

test('the ritual card matches the ritual the site teaches', () => {
  /* The box card and the site's featured ritual are the same ritual. If the
     night reset changes on the site, this fails and the card gets reprinted
     knowingly rather than drifting. */
  for (const line of ['Phone down', 'Lights low', 'mask on']) {
    assert.ok(copy.includes(line), `ritual card is missing "${line}"`);
  }
  const site = readFileSync(
    path.join(root, '..', 'sleep-shop', 'rituals.html'), 'utf8'
  );
  for (const line of ['Phone down', 'Lights low']) {
    assert.ok(site.includes(line), `the site ritual no longer says "${line}" — card and site have drifted`);
  }
});

test('bleed and safe margins are sane', () => {
  const bleed = Number(script.match(/const BLEED = (\d+)/)[1]);
  const safe = Number(script.match(/const SAFE = (\d+)/)[1]);
  assert.ok(bleed >= 3, 'printers want at least 3 mm of bleed');
  assert.ok(safe >= 3, 'text closer than 3 mm to the trim gets clipped');
});
