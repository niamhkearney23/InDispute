/* The popups are the easiest place on a site to look desperate, so the rules
   that keep them premium are tests rather than good intentions. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(path.join(root, f), 'utf8');

const section = read('sections/sleep-popups.liquid');
const script = read('assets/sleep-popup.js');
const styles = read('assets/sleep-popup.css');
const copy = read('docs/popups.footer-group.json');
const everything = [
  ['sections/sleep-popups.liquid', section],
  ['assets/sleep-popup.js', script],
  ['docs/popups.footer-group.json', copy]
];

/* ------------------------------------------------------------ not desperate */

test('no discounting, urgency or pressure language', () => {
  const DESPERATE = [
    /\d+%\s*off/i,
    /\bdiscount/i,
    /\bcoupon/i,
    /\bpromo code/i,
    /\bhurry\b/i,
    /\bexpires?\b/i,
    /\blimited time\b/i,
    /\blast chance\b/i,
    /\bdon'?t miss\b/i,
    /\bact (now|fast)\b/i,
    /\bonly \d+ left\b/i,
    /\bends (today|tonight|soon)\b/i,
    /\bunlock\b/i,
    /\bclaim your\b/i,
    /\bexclusive offer\b/i,
    /\bVIP\b/
  ];
  for (const [file, source] of everything) {
    for (const pattern of DESPERATE) {
      const hit = source.match(pattern);
      assert.equal(hit, null, `${file}: "${hit && hit[0]}" reads as pressure, not as a premium brand`);
    }
  }
});

test('the decline is neutral, never a shame close', () => {
  const parsed = JSON.parse(copy);
  const blocks = parsed['sleep-popups'].blocks;
  for (const [name, block] of Object.entries(blocks)) {
    const decline = block.settings.decline || '';
    assert.ok(decline.length > 0, `${name}: needs a decline label`);
    /* Confirmshaming makes the customer say something self-deprecating in
       order to leave. It converts a little and costs a lot. */
    assert.ok(
      !/\bno,? (i|thanks).*(hate|don'?t|rather|full price|not interested)/i.test(decline),
      `${name}: decline label shames the customer`
    );
    assert.ok(decline.length < 30, `${name}: decline should be short and plain`);
  }
});

test('every popup says exactly what happens next', () => {
  const blocks = JSON.parse(copy)['sleep-popups'].blocks;
  for (const [name, block] of Object.entries(blocks)) {
    const done = block.settings.done_text || '';
    assert.ok(done.length > 40, `${name}: the success state must explain what happens next`);
    assert.ok(block.settings.fine_print, `${name}: needs fine print about frequency`);
  }
});

/* -------------------------------------------------------------- behaviour */

test('nothing renders unless Klaviyo is actually configured', () => {
  assert.match(section, /if settings\.ss_klaviyo_key != blank/, 'section must be gated on the public key');
  assert.match(section, /assign show = true/, 'each block must be gated on its own list ID');
  assert.match(script, /if \(!config\.key\) return;/, 'the script must bail without a key');
  assert.match(script, /if \(!root\.getAttribute\('data-list'\)\) return;/, 'no list means no popup');
});

test('popups stay off the cart and checkout unless they are the cart popup', () => {
  assert.match(script, /\/checkouts/, 'checkout must be excluded');
  assert.match(script, /data-allow-cart/, 'only the cart popup may opt in');
  assert.match(script, /data-needs-cart/, 'the cart popup needs an actual cart');
});

test('it asks once, and remembers', () => {
  assert.match(script, /remember\('subscribed', 365\)/, 'a subscriber is never asked again');
  assert.match(script, /if \(alreadySubscribed\(\)\) return;/, 'and that applies across every popup');
  assert.match(script, /if \(reason === 'dismissed'\) remember/, 'a dismissal must be remembered');
});

test('it fires on intent, never on arrival', () => {
  const blocks = JSON.parse(copy)['sleep-popups'].blocks;
  const welcome = blocks.welcome.settings;
  assert.ok(welcome.delay >= 5, 'a welcome popup inside five seconds interrupts before it offers');
  assert.ok(welcome.scroll >= 25, 'or it waits for real engagement');
});

test('exit intent is desktop only', () => {
  assert.match(
    script,
    /data-exit.*\n?.*pointer: coarse/s,
    'touch devices have no exit intent, and the substitutes guess wrong'
  );
});

/* ---------------------------------------------------------- accessibility */

test('the dialog is a real dialog', () => {
  assert.match(section, /role="dialog"/);
  assert.match(section, /aria-modal="true"/);
  assert.match(section, /aria-labelledby="pop-title-/);
  assert.match(section, /aria-label="Close"/);
  assert.match(script, /event\.key === 'Escape'/, 'Escape must close it');
  assert.match(script, /function trap\(/, 'focus must be trapped while it is open');
  assert.match(script, /role="alert"/.test(section) ? /./ : /never/, 'errors must be announced');
});

test('the keyboard does not ambush touch users', () => {
  assert.match(
    script,
    /pointer: coarse.*\n?.*field\.focus|!window\.matchMedia\('\(pointer: coarse\)'\)\.matches\) field\.focus/s,
    'autofocus on touch throws the keyboard over the offer'
  );
});

test('inputs are 16px so iOS does not zoom, and the close target is 44px', () => {
  assert.match(styles, /font-size: 1rem; \/\* 16px so iOS does not zoom/);
  assert.match(styles, /\.ss-pop__close \{[\s\S]*?width: 44px;[\s\S]*?height: 44px;/);
});

test('motion is optional', () => {
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});
