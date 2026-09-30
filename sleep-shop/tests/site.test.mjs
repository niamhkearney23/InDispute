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

test('the box, its four pieces, and the shelf are complete', () => {
  const { sandbox } = loadSandbox();
  const { SLEEP_BOX: box, SLEEP_PRODUCTS: products, SLEEP_GROUNDS: grounds } = sandbox;

  assert.ok(box.price > 0, 'the box needs a price');
  assert.ok(box.ribbons.length >= 2, 'there should be a ribbon choice');
  box.ribbons.forEach((r) => {
    assert.ok(r.label, 'ribbon needs a label');
    assert.match(r.swatch, /^#[0-9a-f]{6}$/i, `${r.label}: bad swatch`);
  });
  assert.ok(Object.keys(box.specs).length >= 4, 'the box needs specs');
  assert.ok(box.description.length >= 2, 'the box needs a description');

  /* The Gift of Sleep Box holds the four shelf pieces plus the ritual card
     and the message — the two lists must agree. */
  assert.equal(products.length, 4, 'the shelf holds the four pieces');
  assert.deepEqual(box.contents.slice().sort(), products.map((p) => p.id).sort(),
    'everything in the box is on the shelf, and nothing else');
  assert.ok(box.always.length >= 2, 'the ritual card and the message ride in every box');

  const ids = new Set([box.id]);
  for (const piece of products) {
    assert.match(piece.id, /^[a-z0-9-]+$/, `${piece.id}: id should be a slug`);
    assert.ok(!ids.has(piece.id), `${piece.id}: duplicate id`);
    ids.add(piece.id);
    assert.ok(piece.price > 0, `${piece.id}: needs a price`);
    assert.ok(piece.name && piece.blurb && piece.detail, `${piece.id}: missing copy`);
    assert.ok(piece.material, `${piece.id}: needs a material`);
    assert.ok(grounds[piece.ground], `${piece.id}: unknown ground ${piece.ground}`);
  }

  /* Future occasions are a promise, not a product — none may carry a price. */
  assert.ok(sandbox.SLEEP_OCCASIONS_TO_COME.length >= 5, 'the future list should exist');
  for (const name of sandbox.SLEEP_OCCASIONS_TO_COME) {
    assert.equal(typeof name, 'string', 'occasions to come are names only');
  }
});

test('every ground in the data is one of the five brand grounds', () => {
  const { sandbox } = loadSandbox();
  const allowed = ['cocoa', 'rose', 'powder', 'cream', 'stripe'];
  assert.deepEqual(Object.keys(sandbox.SLEEP_GROUNDS).sort(), allowed.slice().sort());
  for (const g of Object.values(sandbox.SLEEP_GROUNDS)) {
    assert.match(g.bg, /^#[0-9a-f]{6}$/i);
    assert.match(g.ink, /^#[0-9a-f]{6}$/i);
  }
});

test('artwork renders an svg for the box and every piece', () => {
  const { sandbox } = loadSandbox();
  const items = [sandbox.SLEEP_BOX, ...sandbox.SLEEP_PRODUCTS];
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
    { art: 'mask', ground: 'cocoa', name: 'Silk sleep mask', photo: 'photos/eye-mask.jpg' }
  );
  assert.match(html, /^<img class="art art--photo"/, 'photo did not replace the svg');
  assert.match(html, /src="photos\/eye-mask\.jpg"/);
  assert.match(html, /alt="Silk sleep mask"/, 'a photo still needs alt text');
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
    ...sandbox.SLEEP_PRODUCTS.map((p) => ({ where: p.id, photo: p.photo }))
  ];
  /* Every image slot must be declared, even when it is still empty — that is
     what makes the shot list and the site impossible to get out of step. */
  for (const entry of declared) {
    assert.equal(typeof entry.photo, 'string', `${entry.where}: missing a photo slot`);
    if (!entry.photo) continue;
    assert.ok(existsSync(path.join(root, entry.photo)),
      `${entry.where}: photo not found — ${entry.photo}`);
  }
  assert.equal(declared.length, 8, 'expected 8 image slots: the box, 3 shots, 4 pieces');
});

test('artwork escapes labels rather than injecting markup', () => {
  const { sandbox } = loadSandbox();
  const svg = sandbox.SleepArt.render(sandbox.SLEEP_BOX, { label: '"><script>x</script>' });
  assert.ok(!svg.includes('<script>'), 'label was not escaped');
});

test('prices format as Australian dollars', () => {
  const { sandbox } = loadSandbox();
  const money = sandbox.SleepStore.money;
  assert.equal(money(149), '$149');
  assert.equal(money(268.2), '$268.20');
});

/* --------------------------------------------------- brand and compliance */

/* The line "give the gift of sleep" is the brand, chosen deliberately. The
   rules below are what keep everything underneath it honest: the copy never
   promises an outcome in anyone's body or mind. Rest, ritual, comfort, care
   and the object itself. */
const CLAIM_PATTERNS = [
  /sleep quality/i,
  /improves? (your )?sleep/i,
  /better sleep/i,
  /deeper sleep/i,
  /helps? you (fall |get to )?(a)?sleep/i,
  /fall asleep faster/i,
  /stress relief/i,
  /reduces? (stress|anxiety)/i,
  /anxiety/i,
  /wellbeing/i,
  /wellness/i,
  /therapeutic/i,
  /clinically/i,
  /insomnia/i,
  /calms? (you|the mind|your mind)/i,
  /switch off your (mind|brain)/i,
  /cures?\b/i,
  /treats? (a )?(condition|symptom)/i
];

test('no therapeutic or outcome claims anywhere in the copy', () => {
  for (const [file, source] of readAll([...htmlFiles, ...jsFiles])) {
    for (const pattern of CLAIM_PATTERNS) {
      const hit = source.match(pattern);
      assert.equal(hit, null,
        `${file}: outcome claim "${hit && hit[0]}" — the brand rules this language out`);
    }
  }
});

/* The rituals are the riskiest copy on the site, because instructions slide
   into promises easily. A ritual step may say what to do and what it is like,
   never what it will do to you. */
test('the rituals describe actions, not outcomes', () => {
  const rituals = readFileSync(path.join(root, 'rituals.html'), 'utf8');
  const PROMISES = [
    /you('| wi)ll (sleep|feel|drift|relax)/i,
    /guarantees?/i,
    /proven/i,
    /works? every time/i,
    /science (says|shows)/i,
    /studies show/i
  ];
  for (const pattern of PROMISES) {
    const hit = rituals.match(pattern);
    assert.equal(hit, null, `rituals.html: "${hit && hit[0]}" promises an outcome`);
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

/* Palette discipline from the brief: cream and linen dominate, cocoa anchors,
   clay rose and powder blue are accents. If the accents outnumber the base
   the site has drifted into pastel. */
test('rose and powder appear as accents, not grounds for whole pages', () => {
  for (const [file, source] of readAll(htmlFiles)) {
    const powder = (source.match(/section--powder/g) || []).length;
    const rose = (source.match(/section--rose/g) || []).length;
    assert.ok(powder <= 1, `${file}: more than one powder section on a page`);
    assert.equal(rose, 0, `${file}: clay rose is a mark, not a section ground`);
  }
});

/* ---------------------------------------------------------------- rituals */

test('every ritual is shoppable and every id it names is real', () => {
  const { sandbox } = loadSandbox();
  const rituals = readFileSync(path.join(root, 'rituals.html'), 'utf8');
  const rows = [...rituals.matchAll(/data-ritual-shop="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(rows.length >= 3, 'each ritual carries a shop row');
  for (const row of rows) {
    for (const id of row.split(',')) {
      assert.ok(sandbox.SLEEP_FIND(id.trim()),
        `rituals.html: "${id.trim()}" is not a product in the catalogue`);
    }
  }
});

test('the home page features one ritual and links to it', () => {
  const home = readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(home, /rituals\.html#night-reset/, 'the featured ritual must deep-link');
  const rituals = readFileSync(path.join(root, 'rituals.html'), 'utf8');
  assert.match(rituals, /id="night-reset"/, 'the deep link must land somewhere');
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
  const gone = ['product.html', 'quiz.html', 'guides.html', 'cart.html'];
  for (const [file, source] of readAll([...htmlFiles, ...jsFiles])) {
    for (const page of gone) {
      assert.ok(!source.includes(page), `${file}: still references ${page}`);
    }
  }
});

test('the old product name is fully retired', () => {
  for (const [file, source] of readAll([...htmlFiles, ...jsFiles])) {
    assert.ok(!/Signature Sleep Box/.test(source),
      `${file}: still says "Signature Sleep Box" — the product is the Gift of Sleep Box now`);
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

test('the 404 page is noindex and robots.txt points at the sitemap', () => {
  assert.match(readFileSync(path.join(root, '404.html'), 'utf8'),
    /<meta name="robots" content="noindex">/);
  const robots = readFileSync(path.join(root, 'robots.txt'), 'utf8');
  assert.match(robots, /Sitemap: /);
});

test('every price in the copy is a real price from the catalogue', () => {
  const { sandbox } = loadSandbox();
  const known = [
    sandbox.SLEEP_BOX.price,
    sandbox.SLEEP_CONFIG.expressFee,
    ...sandbox.SLEEP_PRODUCTS.map((p) => p.price)
  ];
  /* Pages may hard-code the headline price in copy; if they do it must agree. */
  for (const [file, html] of readAll(htmlFiles)) {
    for (const match of html.matchAll(/\$(\d[\d,]*)\b/g)) {
      const value = Number(match[1].replace(/,/g, ''));
      assert.ok(known.includes(value), `${file}: mentions $${match[1]}, which is not a real price`);
    }
  }
});
