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

/* ------------------------------------------------------------- catalogue */

test('every product is complete and internally consistent', () => {
  const { sandbox } = loadSandbox();
  const { HUSH_PRODUCTS: products, HUSH_CATEGORIES: categories } = sandbox;
  const slugs = new Set(categories.map((c) => c.slug));
  const seen = new Set();

  assert.ok(products.length >= 15, 'expected a real catalogue');

  for (const p of products) {
    assert.match(p.id, /^[a-z0-9-]+$/, `${p.id}: id should be a slug`);
    assert.ok(!seen.has(p.id), `${p.id}: duplicate id`);
    seen.add(p.id);

    assert.ok(p.name && p.blurb, `${p.id}: needs a name and blurb`);
    assert.ok(slugs.has(p.category), `${p.id}: unknown category ${p.category}`);
    assert.ok(p.price > 0, `${p.id}: price must be positive`);
    assert.ok(p.rating > 0 && p.rating <= 5, `${p.id}: rating out of range`);
    assert.ok(p.reviews > 0, `${p.id}: needs a review count`);
    assert.ok(Array.isArray(p.description) && p.description.length >= 1, `${p.id}: needs a description`);
    assert.ok(Array.isArray(p.features) && p.features.length >= 3, `${p.id}: needs features`);
    assert.ok(Object.keys(p.specs || {}).length >= 3, `${p.id}: needs specs`);
    assert.equal(p.tone.length, 3, `${p.id}: tone needs three colours`);
    p.tone.forEach((c) => assert.match(c, /^#[0-9a-f]{6}$/i, `${p.id}: bad colour ${c}`));

    if (p.sizes) {
      assert.ok(p.sizes.some((s) => s.delta === 0), `${p.id}: one size should be the base price`);
      p.sizes.forEach((s) => {
        assert.ok(p.price + s.delta > 0, `${p.id}: ${s.label} priced at or below zero`);
      });
    }
  }
});

test('every category has stock', () => {
  const { sandbox } = loadSandbox();
  for (const category of sandbox.HUSH_CATEGORIES) {
    const count = sandbox.HUSH_PRODUCTS.filter((p) => p.category === category.slug).length;
    assert.ok(count > 0, `${category.slug} has no products`);
  }
});

test('artwork renders an svg for every product', () => {
  const { sandbox } = loadSandbox();
  for (const p of sandbox.HUSH_PRODUCTS) {
    const svg = sandbox.HushArt.render(p);
    assert.ok(svg.startsWith('<svg'), `${p.id}: no svg produced`);
    assert.ok(svg.includes('aria-label'), `${p.id}: svg needs a label`);
    assert.ok(!svg.includes('undefined'), `${p.id}: svg contains "undefined"`);
    assert.ok(!svg.includes('NaN'), `${p.id}: svg contains "NaN"`);
  }
});

test('artwork escapes labels rather than injecting markup', () => {
  const { sandbox } = loadSandbox();
  const svg = sandbox.HushArt.render(sandbox.HUSH_PRODUCTS[0], { label: '"><script>x</script>' });
  assert.ok(!svg.includes('<script>'), 'label was not escaped');
});

/* ------------------------------------------------------------------ cart */

test('adding, merging and removing lines', () => {
  const { sandbox } = loadSandbox();
  const Store = sandbox.HushStore;

  Store.add('silk-sleep-mask');
  Store.add('silk-sleep-mask');
  let summary = Store.summary();
  assert.equal(summary.lines.length, 1, 'same item should merge into one line');
  assert.equal(summary.count, 2);
  assert.equal(summary.subtotal, 98);

  Store.add('cloudform-hybrid', 'King');
  Store.add('cloudform-hybrid', 'Queen');
  summary = Store.summary();
  assert.equal(summary.lines.length, 3, 'different sizes are separate lines');

  Store.remove('cloudform-hybrid', 'King');
  summary = Store.summary();
  assert.equal(summary.lines.length, 2);

  Store.setQty('silk-sleep-mask', null, 0);
  assert.equal(Store.summary().lines.length, 1, 'zero quantity removes the line');

  Store.clear();
  assert.equal(Store.summary().count, 0);
});

test('variant pricing follows the size delta', () => {
  const { sandbox } = loadSandbox();
  const Store = sandbox.HushStore;
  const mattress = Store.byId('cloudform-hybrid');

  assert.equal(Store.priceFor(mattress, 'Queen'), 1899);
  assert.equal(Store.priceFor(mattress, 'Single'), 1299);
  assert.equal(Store.priceFor(mattress, 'King'), 2199);
  assert.equal(Store.priceFor(mattress, 'Nonexistent'), 1899, 'unknown size falls back to base');
  assert.equal(Store.defaultVariant(mattress), 'Queen');

  const range = Store.priceRange(mattress);
  assert.equal(range.min, 1299);
  assert.equal(range.max, 2199);

  const mask = Store.byId('silk-sleep-mask');
  assert.equal(Store.priceRange(mask).min, 49);
  assert.equal(Store.priceRange(mask).max, 49);
  assert.equal(Store.defaultVariant(mask), null);
});

test('delivery is free above the threshold and charged below it', () => {
  const { sandbox } = loadSandbox();
  const Store = sandbox.HushStore;
  const { freeShippingFrom, shippingFlat } = sandbox.HUSH_CONFIG;

  Store.add('lavender-pillow-mist'); /* $34 */
  let summary = Store.summary();
  assert.equal(summary.shipping, shippingFlat);
  assert.equal(summary.freeShippingRemaining, freeShippingFrom - 34);
  assert.equal(summary.total, 34 + shippingFlat);

  Store.add('silk-sleep-mask'); /* +$49 = $83 */
  Store.add('bamboo-sleep-tee'); /* +$69 = $152 */
  summary = Store.summary();
  assert.equal(summary.shipping, 0);
  assert.equal(summary.freeShippingRemaining, 0);
  assert.equal(summary.total, 152);
});

test('an empty cart is never charged for delivery', () => {
  const { sandbox } = loadSandbox();
  const summary = sandbox.HushStore.summary();
  assert.equal(summary.count, 0);
  assert.equal(summary.shipping, 0);
  assert.equal(summary.total, 0);
});

test('promo codes discount the subtotal and can push delivery back on', () => {
  const { sandbox } = loadSandbox();
  const Store = sandbox.HushStore;

  Store.add('white-noise-machine'); /* $129, over the $99 threshold */
  assert.equal(Store.summary().shipping, 0);

  const discounted = Store.summary('SLEEPWELL');
  assert.equal(discounted.discountRate, 0.1);
  assert.equal(discounted.discount, 12.9);
  /* $129 - $12.90 = $116.10, still over $99, so delivery stays free. */
  assert.equal(discounted.shipping, 0);
  assert.equal(discounted.total, 116.1);

  const deeper = Store.summary('FIRSTNIGHT'); /* 15% -> $109.65, still free */
  assert.equal(deeper.shipping, 0);

  assert.equal(Store.promoRate('sleepwell'), 0.1, 'codes are case-insensitive');
  assert.equal(Store.promoRate('  SLEEPWELL '), 0.1, 'codes tolerate whitespace');
  assert.equal(Store.promoRate('NOPE'), 0);
  assert.equal(Store.promoRate(''), 0);
  assert.equal(Store.promoRate(null), 0);
});

test('a discount that drops the order under the threshold restores delivery', () => {
  const { sandbox } = loadSandbox();
  const Store = sandbox.HushStore;
  Store.add('bedside-diffuser'); /* $99 exactly — free delivery */
  assert.equal(Store.summary().shipping, 0);
  const discounted = Store.summary('SLEEPWELL'); /* $89.10 */
  assert.equal(discounted.shipping, sandbox.HUSH_CONFIG.shippingFlat);
});

test('the cart survives a page load and ignores junk', () => {
  const seed = new Map();
  const first = loadSandbox(seed).sandbox;
  first.HushStore.add('contour-cool-pillow', null, 2);

  const second = loadSandbox(seed).sandbox;
  assert.equal(second.HushStore.summary().count, 2, 'cart did not persist');

  seed.set('hush.cart.v1', '{ not json');
  const third = loadSandbox(seed).sandbox;
  assert.equal(third.HushStore.summary().count, 0, 'corrupt storage should read as empty');

  seed.set('hush.cart.v1', JSON.stringify([
    { id: 'discontinued-thing', variant: null, qty: 3 },
    { id: 'silk-sleep-mask', variant: null, qty: 1 }
  ]));
  const fourth = loadSandbox(seed).sandbox;
  const lines = fourth.HushStore.summary().lines;
  assert.equal(lines.length, 1, 'lines for unknown products should be dropped');
  assert.equal(lines[0].id, 'silk-sleep-mask');
});

test('subscribers are notified when the cart changes', () => {
  const { sandbox } = loadSandbox();
  const seen = [];
  const off = sandbox.HushStore.subscribe((s) => seen.push(s.count));
  sandbox.HushStore.add('merino-throw');
  sandbox.HushStore.add('merino-throw');
  off();
  sandbox.HushStore.add('merino-throw');
  assert.deepEqual(seen, [1, 2], 'unsubscribe should stop the callbacks');
});

test('prices format as Australian dollars', () => {
  const { sandbox } = loadSandbox();
  const money = sandbox.HushStore.money;
  assert.equal(money(1899), '$1,899');
  assert.equal(money(116.1), '$116.10');
});

/* ------------------------------------------------------------------ html */

test('every page loads the shared chrome and its own script', () => {
  for (const file of htmlFiles) {
    const html = readFileSync(path.join(root, file), 'utf8');
    assert.match(html, /^<!doctype html>/i, `${file}: missing doctype`);
    assert.match(html, /<html lang="en-AU">/, `${file}: missing lang`);
    assert.match(html, /<title>[^<]+<\/title>/, `${file}: missing title`);
    assert.match(html, /<meta name="description"/, `${file}: missing description`);
    assert.ok(html.includes('data-site-header'), `${file}: no header mount`);
    assert.ok(html.includes('data-site-footer'), `${file}: no footer mount`);
    assert.ok(html.includes('assets/js/ui.js'), `${file}: ui.js not loaded`);
    assert.ok(html.includes('assets/css/styles.css'), `${file}: stylesheet not linked`);
    assert.ok(html.includes('id="main"'), `${file}: no main landmark`);
  }
});

test('internal links point at files that exist', () => {
  for (const file of htmlFiles) {
    const html = readFileSync(path.join(root, file), 'utf8');
    const hrefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
    for (const href of hrefs) {
      /* Only local paths are checkable: skip schemes, protocol-relative and in-page anchors. */
      if (!href || href.startsWith('#') || href.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
      const target = href.split(/[?#]/)[0];
      assert.ok(existsSync(path.join(root, target)), `${file}: broken link to ${target}`);
    }
  }
});

test('product links in the pages resolve to real products', () => {
  const { sandbox } = loadSandbox();
  const ids = new Set(sandbox.HUSH_PRODUCTS.map((p) => p.id));
  for (const file of [...htmlFiles, ...readdirSync(path.join(root, 'assets/js')).map((f) => `assets/js/${f}`)]) {
    const source = readFileSync(path.join(root, file), 'utf8');
    for (const match of source.matchAll(/product\.html\?id=([a-z0-9-]+)/g)) {
      assert.ok(ids.has(match[1]), `${file}: links to unknown product ${match[1]}`);
    }
    for (const match of source.matchAll(/data-picks="([^"]+)"/g)) {
      for (const id of match[1].split(',')) {
        assert.ok(ids.has(id.trim()), `${file}: data-picks names unknown product ${id.trim()}`);
      }
    }
  }
});

test('category links in the pages resolve to real categories', () => {
  const { sandbox } = loadSandbox();
  const slugs = new Set(sandbox.HUSH_CATEGORIES.map((c) => c.slug));
  for (const file of htmlFiles) {
    const html = readFileSync(path.join(root, file), 'utf8');
    for (const match of html.matchAll(/shop\.html\?category=([a-z0-9-]+)/g)) {
      assert.ok(slugs.has(match[1]), `${file}: links to unknown category ${match[1]}`);
    }
  }
});
