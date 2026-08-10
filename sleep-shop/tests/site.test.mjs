/* Runs the real browser sources under node:vm with a stub localStorage, so the
   catalogue and cart logic are tested exactly as the pages load them. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES = ['assets/js/data.js', 'assets/js/store.js', 'assets/js/art.js'];

function loadSandbox(seed = new Map()) {
  const sandbox = {
    console,
    localStorage: {
      getItem: (key) => (seed.has(key) ? seed.get(key) : null),
      setItem: (key, value) => seed.set(key, String(value)),
      removeItem: (key) => seed.delete(key)
    }
  };
  const context = createContext(sandbox);
  for (const file of SOURCES) {
    runInContext(readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  }
  return { sandbox, seed };
}

const htmlFiles = readdirSync(root).filter((f) => f.endsWith('.html'));
const jsFiles = readdirSync(path.join(root, 'assets/js')).map((f) => `assets/js/${f}`);
const readAll = (files) => files.map((f) => [f, readFileSync(path.join(root, f), 'utf8')]);

/* ------------------------------------------------------------- catalogue */

test('the box and its eight pieces are complete', () => {
  const { sandbox } = loadSandbox();
  const { SLEEP_BOX: box, SLEEP_CONTENTS: contents, SLEEP_GROUNDS: grounds } = sandbox;

  assert.ok(box.price > 0, 'the box needs a price');
  assert.ok(box.ribbons.length >= 2, 'there should be a ribbon choice');
  box.ribbons.forEach((r) => {
    assert.ok(r.label, 'ribbon needs a label');
    assert.match(r.swatch, /^#[0-9a-f]{6}$/i, `${r.label}: bad swatch`);
  });
  assert.ok(Object.keys(box.specs).length >= 4, 'the box needs specs');
  assert.ok(box.description.length >= 2, 'the box needs a description');

  /* "Eight pieces, one ritual" is the brand line — the data has to back it up. */
  assert.equal(contents.length, 8, 'the box promises eight pieces');

  const ids = new Set();
  for (const piece of contents) {
    assert.match(piece.id, /^[a-z0-9-]+$/, `${piece.id}: id should be a slug`);
    assert.ok(!ids.has(piece.id), `${piece.id}: duplicate id`);
    ids.add(piece.id);
    assert.ok(piece.name && piece.blurb && piece.detail, `${piece.id}: missing copy`);
    assert.ok(piece.material, `${piece.id}: needs a material`);
    assert.ok(grounds[piece.ground], `${piece.id}: unknown ground ${piece.ground}`);
  }
});

test('every ground in the data is one of the five brand grounds', () => {
  const { sandbox } = loadSandbox();
  const allowed = ['cocoa', 'oxblood', 'powder', 'cream', 'stripe'];
  assert.deepEqual(Object.keys(sandbox.SLEEP_GROUNDS).sort(), allowed.slice().sort());
  for (const g of Object.values(sandbox.SLEEP_GROUNDS)) {
    assert.match(g.bg, /^#[0-9a-f]{6}$/i);
    assert.match(g.ink, /^#[0-9a-f]{6}$/i);
  }
});

test('artwork renders an svg for the box and every piece', () => {
  const { sandbox } = loadSandbox();
  const items = [sandbox.SLEEP_BOX, ...sandbox.SLEEP_CONTENTS];
  for (const item of items) {
    const svg = sandbox.SleepArt.render(item);
    assert.ok(svg.startsWith('<svg'), `${item.name}: no svg produced`);
    assert.ok(svg.includes('aria-label'), `${item.name}: svg needs a label`);
    assert.ok(!svg.includes('undefined'), `${item.name}: svg contains "undefined"`);
    assert.ok(!svg.includes('NaN'), `${item.name}: svg contains "NaN"`);
  }
  /* Every named scene should draw something, including the ones only the
     pages reference by name. */
  for (const scene of sandbox.SleepArt.scenes) {
    const svg = sandbox.SleepArt.render({ art: scene, ground: 'cocoa', name: scene });
    assert.ok(svg.length > 400, `${scene}: scene looks empty`);
  }
});

test('a photo replaces the drawing wherever one is set', () => {
  const { sandbox } = loadSandbox();
  const html = sandbox.SleepArt.render(
    { art: 'mask', ground: 'cocoa', name: 'Silk eye mask', photo: 'photos/eye-mask.jpg' }
  );
  assert.match(html, /^<img class="art art--photo"/, 'photo did not replace the svg');
  assert.match(html, /src="photos\/eye-mask\.jpg"/);
  assert.match(html, /alt="Silk eye mask"/, 'a photo still needs alt text');
  assert.match(html, /loading="lazy"/);

  /* An empty photo must fall through to the drawing, not render a broken img. */
  const drawn = sandbox.SleepArt.render({ art: 'mask', ground: 'cocoa', name: 'x', photo: '' });
  assert.ok(drawn.startsWith('<svg'));
});

test('every photo path that is set points at a file that exists', () => {
  const { sandbox } = loadSandbox();
  const declared = [
    { where: 'box', photo: sandbox.SLEEP_BOX.photo },
    ...sandbox.SLEEP_BOX.shots.map((s, i) => ({ where: `box.shots[${i}]`, photo: s.photo })),
    ...sandbox.SLEEP_CONTENTS.map((p) => ({ where: p.id, photo: p.photo }))
  ];
  /* Every image slot must be declared, even when it is still empty — that is
     what makes the shot list and the site impossible to get out of step. */
  for (const entry of declared) {
    assert.equal(typeof entry.photo, 'string', `${entry.where}: missing a photo slot`);
    if (!entry.photo) continue;
    assert.ok(existsSync(path.join(root, entry.photo)),
      `${entry.where}: photo not found — ${entry.photo}`);
  }
  assert.equal(declared.length, 12, 'expected 12 image slots: the box, 3 shots, 8 pieces');
});

test('artwork escapes labels rather than injecting markup', () => {
  const { sandbox } = loadSandbox();
  const svg = sandbox.SleepArt.render(sandbox.SLEEP_BOX, { label: '"><script>x</script>' });
  assert.ok(!svg.includes('<script>'), 'label was not escaped');
});

/* ------------------------------------------------------------------ cart */

test('boxes with the same ribbon and message merge, different ones do not', () => {
  const { sandbox } = loadSandbox();
  const Store = sandbox.SleepStore;

  Store.add('Oxblood', 'Happy birthday', 1);
  Store.add('Oxblood', 'Happy birthday', 1);
  let s = Store.summary();
  assert.equal(s.lines.length, 1, 'identical boxes should merge');
  assert.equal(s.count, 2);

  /* Same ribbon, different message — two different people, two lines. */
  Store.add('Oxblood', 'Thank you for everything', 1);
  assert.equal(Store.summary().lines.length, 2);

  /* Same message, different ribbon — also distinct. */
  Store.add('Powder blue', 'Happy birthday', 1);
  assert.equal(Store.summary().lines.length, 3);

  Store.remove('Oxblood', 'Happy birthday');
  assert.equal(Store.summary().lines.length, 2);

  Store.clear();
  assert.equal(Store.summary().count, 0);
});

test('an unknown ribbon falls back rather than creating a junk line', () => {
  const { sandbox } = loadSandbox();
  const Store = sandbox.SleepStore;
  Store.add('Chartreuse', '', 1);
  const lines = Store.summary().lines;
  assert.equal(lines.length, 1);
  assert.equal(lines[0].ribbon, Store.defaultRibbon());
});

test('gift messages are tidied and capped at the card length', () => {
  const { sandbox } = loadSandbox();
  const Store = sandbox.SleepStore;
  const limit = sandbox.SLEEP_CONFIG.giftMessageLimit;

  assert.equal(Store.tidyMessage('  spaced   out \n line  '), 'spaced out line');
  assert.equal(Store.tidyMessage('x'.repeat(limit + 80)).length, limit);
  assert.equal(Store.tidyMessage(null), '');

  Store.add('Oxblood', '  Sleep   well  ', 1);
  assert.equal(Store.summary().lines[0].message, 'Sleep well');
});

test('editing a message moves the line, and merges it if it collides', () => {
  const { sandbox } = loadSandbox();
  const Store = sandbox.SleepStore;

  Store.add('Oxblood', 'First message', 1);
  Store.add('Oxblood', 'Second message', 2);
  assert.equal(Store.summary().lines.length, 2);

  Store.setMessage('Oxblood', 'First message', 'Edited message');
  let lines = Store.summary().lines;
  assert.equal(lines.length, 2);
  /* Edited in place — a box must not jump down the cart because you fixed a typo. */
  assert.equal(lines[0].message, 'Edited message', 'the edited box moved');
  assert.equal(lines[1].message, 'Second message');

  /* Editing one line to match another must merge rather than duplicate. */
  Store.setMessage('Oxblood', 'Edited message', 'Second message');
  lines = Store.summary().lines;
  assert.equal(lines.length, 1, 'colliding messages should merge');
  assert.equal(lines[0].qty, 3, 'quantities should add up');
});

test('editing a message on a line that is gone changes nothing', () => {
  const { sandbox } = loadSandbox();
  const Store = sandbox.SleepStore;
  Store.add('Oxblood', 'Only line', 1);
  Store.setMessage('Oxblood', 'Not a real line', 'Something else');
  const lines = Store.summary().lines;
  assert.equal(lines.length, 1);
  assert.equal(lines[0].message, 'Only line');
});

test('delivery is free unless express is chosen', () => {
  const { sandbox } = loadSandbox();
  const Store = sandbox.SleepStore;
  const fee = sandbox.SLEEP_CONFIG.expressFee;
  const price = sandbox.SLEEP_BOX.price;

  Store.add('Powder blue', '', 1);
  assert.equal(Store.summary().shipping, 0);
  assert.equal(Store.summary().total, price);

  const express = Store.summary({ express: true });
  assert.equal(express.shipping, fee);
  assert.equal(express.total, price + fee);
});

test('an empty cart is never charged for express', () => {
  const { sandbox } = loadSandbox();
  const summary = sandbox.SleepStore.summary({ express: true });
  assert.equal(summary.count, 0);
  assert.equal(summary.shipping, 0);
  assert.equal(summary.total, 0);
});

test('promo codes discount the subtotal and stack with express', () => {
  const { sandbox } = loadSandbox();
  const Store = sandbox.SleepStore;

  Store.add('Oxblood', '', 2); /* $298 */
  const discounted = Store.summary({ promo: 'FIRSTRUN' });
  assert.equal(discounted.discountRate, 0.1);
  assert.equal(discounted.discount, 29.8);
  assert.equal(discounted.total, 268.2);

  const both = Store.summary({ promo: 'firstrun', express: true });
  assert.equal(both.total, 268.2 + sandbox.SLEEP_CONFIG.expressFee);

  assert.equal(Store.promoRate('  FIRSTRUN '), 0.1, 'codes tolerate whitespace');
  assert.equal(Store.promoRate('NOPE'), 0);
  assert.equal(Store.promoRate(null), 0);
});

test('written counts the boxes that carry a card message', () => {
  const { sandbox } = loadSandbox();
  const Store = sandbox.SleepStore;
  Store.add('Oxblood', 'For Sam', 1);
  Store.add('Powder blue', '', 1);
  const summary = Store.summary();
  assert.equal(summary.lines.length, 2);
  assert.equal(summary.written, 1);
});

test('the cart survives a page load and ignores junk', () => {
  const seed = new Map();
  const first = loadSandbox(seed).sandbox;
  first.SleepStore.add('Oxblood', 'Sleep well', 2);

  const second = loadSandbox(seed).sandbox;
  assert.equal(second.SleepStore.summary().count, 2, 'cart did not persist');
  assert.equal(second.SleepStore.summary().lines[0].message, 'Sleep well');

  seed.set('sleepshop.cart.v1', '{ not json');
  assert.equal(loadSandbox(seed).sandbox.SleepStore.summary().count, 0,
    'corrupt storage should read as empty');

  seed.set('sleepshop.cart.v1', JSON.stringify([
    { ribbon: 'Chartreuse', message: '', qty: 3 },
    { ribbon: 'Oxblood', message: 'Kept', qty: 1 }
  ]));
  const lines = loadSandbox(seed).sandbox.SleepStore.summary().lines;
  assert.equal(lines.length, 1, 'lines with an unknown ribbon should be dropped');
  assert.equal(lines[0].message, 'Kept');
});

test('subscribers are notified when the cart changes', () => {
  const { sandbox } = loadSandbox();
  const seen = [];
  const off = sandbox.SleepStore.subscribe((s) => seen.push(s.count));
  sandbox.SleepStore.add('Oxblood', '', 1);
  sandbox.SleepStore.add('Oxblood', '', 1);
  off();
  sandbox.SleepStore.add('Oxblood', '', 1);
  assert.deepEqual(seen, [1, 2], 'unsubscribe should stop the callbacks');
});

test('prices format as Australian dollars', () => {
  const { sandbox } = loadSandbox();
  const money = sandbox.SleepStore.money;
  assert.equal(money(149), '$149');
  assert.equal(money(268.2), '$268.20');
});

/* --------------------------------------------------- brand and compliance */

/* The brand plan is explicit: captions and copy stay inside rest, ritual,
   comfort and care. Outcome claims are what turn a gift box into a
   therapeutic good in the eyes of the TGA, so they fail the build. */
const CLAIM_PATTERNS = [
  /sleep quality/i,
  /improves? (your )?sleep/i,
  /better sleep/i,
  /helps? you (fall )?asleep/i,
  /stress relief/i,
  /reduces? (stress|anxiety)/i,
  /anxiety/i,
  /wellbeing/i,
  /wellness/i,
  /therapeutic/i,
  /clinically/i,
  /insomnia/i,
  /cures?\b/i,
  /treats? (a )?(condition|symptom)/i
];

test('no therapeutic or outcome claims anywhere in the copy', () => {
  for (const [file, source] of readAll([...htmlFiles, ...jsFiles])) {
    for (const pattern of CLAIM_PATTERNS) {
      const hit = source.match(pattern);
      assert.equal(hit, null,
        `${file}: outcome claim "${hit && hit[0]}" — the plan rules this language out`);
    }
  }
});

/* No testimonials until there are real ones with written permission: a mocked
   up review is a straightforward Australian Consumer Law problem. */
test('no invented testimonials, star ratings or review counts', () => {
  for (const [file, source] of readAll([...htmlFiles, ...jsFiles])) {
    assert.ok(!/<blockquote/i.test(source), `${file}: contains a testimonial blockquote`);
    assert.ok(!/★|✩|<figcaption/i.test(source), `${file}: contains star ratings or a quote caption`);
    assert.ok(!/\b\d[\d,]*\s+reviews?\b/i.test(source), `${file}: quotes a review count`);
  }
});

test('the script accent is used sparingly, never for a whole paragraph', () => {
  for (const [file, source] of readAll(htmlFiles)) {
    for (const match of source.matchAll(/class="script"[^>]*>([\s\S]*?)</g)) {
      const words = match[1].trim().split(/\s+/).filter(Boolean).length;
      assert.ok(words > 0 && words <= 8,
        `${file}: script accent runs to ${words} words — it is for one phrase`);
    }
  }
});

/* ------------------------------------------------------------------ html */

test('every page loads the shared chrome and the brand fonts', () => {
  for (const [file, html] of readAll(htmlFiles)) {
    assert.match(html, /^<!doctype html>/i, `${file}: missing doctype`);
    assert.match(html, /<html lang="en-AU">/, `${file}: missing lang`);
    assert.match(html, /<title>[^<]+<\/title>/, `${file}: missing title`);
    assert.match(html, /<meta name="description"/, `${file}: missing description`);
    assert.ok(html.includes('data-site-header'), `${file}: no header mount`);
    assert.ok(html.includes('data-site-footer'), `${file}: no footer mount`);
    assert.ok(html.includes('assets/js/ui.js'), `${file}: ui.js not loaded`);
    assert.ok(html.includes('assets/css/styles.css'), `${file}: stylesheet not linked`);
    assert.ok(html.includes('id="main"'), `${file}: no main landmark`);
    assert.ok(html.includes('class="skip-link"'), `${file}: no skip link`);
    assert.ok(html.includes('Playfair+Display'), `${file}: display font not loaded`);
  }
});

test('every page carries share metadata that matches its title', () => {
  for (const [file, html] of readAll(htmlFiles)) {
    for (const tag of ['og:title', 'og:description', 'og:type', 'twitter:card']) {
      assert.ok(html.includes(`"${tag}"`), `${file}: missing ${tag}`);
    }
    const title = html.match(/<title>([^<]+)<\/title>/)[1];
    const og = html.match(/property="og:title" content="([^"]+)"/)[1];
    assert.equal(og, title, `${file}: og:title does not match <title>`);
  }
});

test('internal links point at files that exist', () => {
  for (const [file, html] of readAll(htmlFiles)) {
    const hrefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
    for (const href of hrefs) {
      if (!href || href.startsWith('#') || href.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
      const target = href.split(/[?#]/)[0];
      assert.ok(existsSync(path.join(root, target)), `${file}: broken link to ${target}`);
    }
  }
});

test('nothing still links to the pages that were removed', () => {
  const gone = ['shop.html', 'product.html', 'quiz.html', 'guides.html'];
  for (const [file, source] of readAll([...htmlFiles, ...jsFiles])) {
    for (const page of gone) {
      assert.ok(!source.includes(page), `${file}: still references ${page}`);
    }
  }
});

test('the sitemap lists the pages worth indexing, and only those', () => {
  const sitemap = readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const listed = [...sitemap.matchAll(/<loc>[^<]*\/([^/<]+)<\/loc>/g)].map((m) => m[1]);

  const skip = new Set(['cart.html', '404.html']);
  const expected = htmlFiles.filter((f) => !skip.has(f)).sort();
  assert.deepEqual(listed.slice().sort(), expected, 'sitemap is out of step with the pages');

  for (const page of listed) {
    assert.ok(existsSync(path.join(root, page)), `sitemap lists a missing page: ${page}`);
  }
});

test('the 404 page is noindex and the cart is disallowed in robots.txt', () => {
  assert.match(readFileSync(path.join(root, '404.html'), 'utf8'),
    /<meta name="robots" content="noindex">/);
  const robots = readFileSync(path.join(root, 'robots.txt'), 'utf8');
  assert.match(robots, /Disallow: \/cart\.html/);
  assert.match(robots, /Sitemap: /);
});

test('the price is stated once, in data.js, and echoed consistently', () => {
  const { sandbox } = loadSandbox();
  const price = sandbox.SLEEP_BOX.price;
  /* Pages may hard-code the headline price in copy; if they do it must agree. */
  for (const [file, html] of readAll(htmlFiles)) {
    for (const match of html.matchAll(/\$(\d[\d,]*)\b/g)) {
      const value = Number(match[1].replace(/,/g, ''));
      const known = [price, sandbox.SLEEP_CONFIG.expressFee];
      assert.ok(known.includes(value), `${file}: mentions $${match[1]}, which is not a real price`);
    }
  }
});
