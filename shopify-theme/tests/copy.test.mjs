/* The hard constraints from the brief, enforced as tests rather than left to
   review. Two of these are legal requirements, not style preferences, so they
   fail the build. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(path.join(root, dir))) {
    const rel = path.join(dir, entry);
    if (statSync(path.join(root, rel)).isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

const liquid = walk('sections').concat(walk('snippets')).filter((f) => f.endsWith('.liquid'));
const templates = walk('templates').filter((f) => f.endsWith('.json'));
const config = ['config/settings_schema.json'];
const copyFiles = [...liquid, ...templates, ...config];

const read = (f) => readFileSync(path.join(root, f), 'utf8');
const all = () => copyFiles.map((f) => [f, read(f)]);

/* ------------------------------------------------ therapeutic claims */

/* TGA and ACCC. Anything implying a health outcome is out, however it is
   phrased. Describe feel, look, ritual, comfort and durability only. */
const CLAIMS = [
  /improves? (your )?sleep/i,
  /aids? sleep/i,
  /helps? you (fall )?asleep/i,
  /better sleep/i,
  /deeper sleep/i,
  /sleep quality/i,
  /promotes?\b/i,
  /reduces? (stress|anxiety|tension)/i,
  /stress relief/i,
  /relieves?\b/i,
  /soothes?\b/i,
  /calms? (you|the mind|your mind)/i,
  /anxiety/i,
  /insomnia/i,
  /therapeutic/i,
  /wellness/i,
  /wellbeing/i,
  /well-being/i,
  /clinically/i,
  /restorative/i,
  /heals?\b/i,
  /cures?\b/i,
  /remedy/i,
  /detox/i
];

test('no therapeutic or health claims anywhere', () => {
  for (const [file, source] of all()) {
    for (const pattern of CLAIMS) {
      const hit = source.match(pattern);
      assert.equal(
        hit,
        null,
        `${file}: "${hit && hit[0]}" implies a health outcome. TGA and ACCC rules ` +
          'allow feel, look, ritual, comfort and durability only.'
      );
    }
  }
});

/* -------------------------------------------------------- testimonials */

test('no testimonials, star ratings or review counts in markup', () => {
  for (const [file, source] of all()) {
    assert.ok(!/<blockquote/i.test(source), `${file}: testimonial markup`);
    assert.ok(!/★|✩|⭐/.test(source), `${file}: star glyphs`);
    assert.ok(!/\b\d[\d,]*\s+(reviews?|customers|happy)\b/i.test(source), `${file}: a review or customer count`);
    assert.ok(!/\b\d(\.\d)?\s*(out of|\/)\s*5\b/i.test(source), `${file}: a star rating`);
  }
});

/* --------------------------------------------------- savings and value */

test('no savings or value claims', () => {
  const VALUE = [/valued at/i, /\bvalue of\b/i, /\bRRP\b/, /\bsave \$/i, /\bworth \$/i, /\bwas \$/i, /\bnormally \$/i];
  for (const [file, source] of all()) {
    for (const pattern of VALUE) {
      const hit = source.match(pattern);
      assert.equal(hit, null, `${file}: value claim "${hit && hit[0]}"`);
    }
  }
});

/* -------------------------------------------------------- house style */

test('no em dashes in copy', () => {
  for (const [file, source] of all()) {
    assert.ok(!source.includes('—'), `${file}: contains an em dash`);
  }
});

test('Australian English', () => {
  /* Deliberately words that cannot appear in CSS or Liquid syntax, so this
     never has to guess whether a match is code or copy. */
  const US = [
    /\borganiz/i, /\bpersonaliz/i, /\bcustomiz/i, /\bapologiz/i, /\brecogniz/i,
    /\bfulfillment/i, /\bfavorite/i, /\bjewelry/i, /\bcolor(?!\s*:|-)/i, /\bpajama/i
  ];
  for (const [file, source] of all()) {
    /* "color" is Shopify's own setting type and a CSS property name, so strip
       those before checking, rather than exempting whole files. */
    const copy = source
      .replace(/"type"\s*:\s*"color"/g, '')
      .replace(/[a-z-]*color\s*:/gi, '');
    for (const pattern of US) {
      const hit = copy.match(pattern);
      assert.equal(hit, null, `${file}: American spelling "${hit && hit[0]}"`);
    }
  }
});

/* ------------------------------------------------------------- returns */

test('the returns page carries the consumer law notice and no final sale wording', () => {
  const returns = read('templates/page.returns.json');
  assert.ok(
    returns.includes('Nothing in this policy limits your rights under the Australian Consumer Law'),
    'returns page is missing the required Australian Consumer Law sentence'
  );
  for (const banned of [/no refunds/i, /all sales final/i, /final sale/i, /non-?refundable/i]) {
    const hit = returns.match(banned);
    assert.equal(hit, null, `returns page says "${hit && hit[0]}"`);
  }
});

/* ------------------------------------------------------ page structure */

test('every template parses and references sections that exist', () => {
  const available = new Set(
    readdirSync(path.join(root, 'sections')).map((f) => f.replace(/\.liquid$/, ''))
  );
  for (const file of templates) {
    let parsed;
    assert.doesNotThrow(() => {
      parsed = JSON.parse(read(file));
    }, `${file}: invalid JSON`);

    for (const [id, section] of Object.entries(parsed.sections)) {
      assert.ok(available.has(section.type), `${file}: section "${id}" uses missing ${section.type}.liquid`);
    }
    for (const id of parsed.order) {
      assert.ok(parsed.sections[id], `${file}: order lists "${id}" which is not defined`);
    }
  }
});

test('the product page carries every part of the brief, in order', () => {
  const product = JSON.parse(read('templates/product.signature-sleep-box.json'));
  assert.deepEqual(product.order, [
    'announcement', 'main', 'whats-inside', 'keepsake', 'founder', 'trust', 'reviews'
  ]);

  const main = product.sections.main;
  assert.deepEqual(main.block_order, ['eyebrow', 'title', 'price', 'description', 'buy', 'accordions']);

  /* All eight items must be listed, both in the accordion and the grid. */
  const inside = product.sections['whats-inside'];
  assert.equal(inside.block_order.length, 8, 'the box promises eight pieces');
  for (const key of inside.block_order) {
    const item = inside.blocks[key].settings;
    assert.ok(item.name, `${key}: missing a name`);
    assert.ok(item.image_alt && item.image_alt.length > 12, `${key}: needs descriptive alt text`);
  }
});

test('the reviews section ships empty', () => {
  const product = JSON.parse(read('templates/product.signature-sleep-box.json'));
  const reviews = product.sections.reviews;
  assert.ok(reviews, 'the reviews section should be present even while empty');
  assert.equal(reviews.blocks, undefined, 'no review blocks should exist before real reviews do');
  assert.ok(reviews.settings.empty_text.length > 40, 'the empty state needs an honest explanation');
});

/* ------------------------------------------------------------ the build */

test('the gift message field is a line item property with a counter', () => {
  const field = read('snippets/gift-message-field.liquid');
  assert.match(field, /name="properties\[Gift message\]"/, 'must submit as a line item property');
  assert.match(field, /maxlength="\{\{ limit \}\}"/, 'the limit must be enforced, not just counted');
  assert.match(field, /aria-describedby="ss-gift-counter"/, 'the counter must be announced to screen readers');
});

test('the buy box has one add to cart and no competing checkout button', () => {
  const main = read('sections/main-product-sleep-box.liquid');
  assert.equal((main.match(/type="submit"/g) || []).length, 1, 'exactly one submit button');
  assert.ok(!/\|\s*payment_button/.test(main), 'a dynamic checkout button competes with add to cart');
});

test('delivery promises are never hardcoded', () => {
  /* Anything that reads as a delivery promise has to come from settings, so
     the merchant sets it once and the pages cannot disagree. */
  for (const [file, source] of all()) {
    if (file.endsWith('settings_schema.json')) continue;
    const hit = source.match(/\b\d\s*(to|-)\s*\d\s*(business\s+)?days\b/i);
    assert.equal(hit, null, `${file}: hardcoded delivery estimate "${hit && hit[0]}"`);
  }
});

test('every image render passes alt text', () => {
  for (const file of liquid) {
    const source = read(file);
    for (const match of source.matchAll(/image_tag:([\s\S]*?)\n\s*\}\}/g)) {
      assert.ok(/alt:/.test(match[1]), `${file}: an image_tag call without alt`);
    }
  }
});

/* ------------------------------------------------------------ the range */

test('the mask pages carry the range without hardcoding a price', () => {
  const mask = read('sections/main-product-mask.liquid');
  const card = read('snippets/product-card.liquid');

  /* Every figure on a product page must come from the product, so the range
     can be repriced in admin without a theme deploy. */
  for (const [name, source] of [['mask section', mask], ['product card', card]]) {
    const hit = source.match(/\$\d/);
    assert.equal(hit, null, `${name}: hardcoded price`);
  }

  assert.match(mask, /data-variant-price/, 'the price must update with the colour');
  assert.match(mask, /product\.options\.size == 1/, 'the picker must bail out on multi option products');
  assert.equal((mask.match(/type="submit"/g) || []).length, 1, 'still exactly one add to cart');
  assert.ok(!/\|\s*payment_button/.test(mask), 'no competing checkout button on masks either');
});

test('the gift message on a mask is opt in', () => {
  const mask = read('sections/main-product-mask.liquid');
  assert.match(mask, /data-gift-toggle/, 'a mask is often bought for the buyer');
  assert.match(mask, /hidden>\s*\{% render 'gift-message-field' %\}/, 'the field starts closed');
  assert.match(mask, /field\.value = ''/, 'closing it must clear it, so an unseen field cannot submit');
});

test('the range reads a collection rather than a hand picked list', () => {
  const cross = read('sections/cross-sell.liquid');
  assert.match(cross, /collections\[section\.settings\.collection\]/,
    'adding a mask in admin should put it everywhere without a theme edit');
});

/* --------------------------------------------------------------- the type */

/* The stylesheet named three typefaces and nothing ever loaded them, so a
   real store would have rendered the whole site in Times New Roman while the
   CSS looked correct. Naming a face and shipping it are now checked together. */
test('every named typeface is actually loaded, and every loaded file exists', () => {
  const css = read('assets/sleep-shop.css');
  const fonts = read('snippets/ss-fonts.liquid');
  const assets = readdirSync(path.join(root, 'assets'));

  /* The first family in each stack is the brand face. The rest are fallbacks
     that come with the operating system and need no @font-face. */
  const named = [];
  for (const role of ['display', 'script', 'util']) {
    const stack = css.match(new RegExp(`--ss-${role}:\\s*([^;]+);`));
    assert.ok(stack, `--ss-${role} is not defined`);
    const first = stack[1].trim().split(',')[0].replace(/["']/g, '').trim();
    named.push([role, first]);
  }

  for (const [role, family] of named) {
    assert.ok(
      fonts.includes(`font-family: "${family}"`),
      `--ss-${role} asks for ${family} and ss-fonts.liquid never loads it, ` +
        'so the browser will silently use a fallback. Run npm run fonts.'
    );
  }

  for (const match of fonts.matchAll(/'([^']+\.woff2)'\s*\|\s*asset_url/g)) {
    assert.ok(assets.includes(match[1]), `ss-fonts.liquid points at a missing file: ${match[1]}`);
  }

  /* A weight declared in the CSS but never downloaded gets synthesised by the
     browser, which is what makes a light face look smeared on Android. */
  const loaded = new Set(
    [...fonts.matchAll(/font-family: "([^"]+)";\s*font-style: (\w+);\s*font-weight: (\d+);/g)]
      .map((m) => `${m[1]}|${m[2]}|${m[3]}`)
  );
  assert.ok(loaded.has('Inter|normal|300'), 'ss-body sets weight 300, so Inter 300 must ship');
  assert.ok(loaded.has('Inter|normal|500'), 'the instalment and arrives-by lines bold to 500');
  assert.ok(
    loaded.has('Cormorant Garamond|italic|300'),
    'the script face is only ever used italic at 300, so that is the file that must exist'
  );
});

test('the fonts snippet reaches every section', () => {
  /* ss-tokens is rendered by every Sleep Shop section, so hanging the fonts
     off it means a new section cannot forget them. */
  assert.match(read('snippets/ss-tokens.liquid'), /\{% render 'ss-fonts' %\}/);

  const sections = walk('sections').filter((f) => f.endsWith('.liquid'));
  for (const file of sections) {
    assert.match(read(file), /render 'ss-tokens'/, `${file}: no brand tokens, so no brand type`);
  }
});

test('the typefaces are self hosted, not fetched from Google on every page view', () => {
  for (const [file, source] of all()) {
    assert.ok(
      !/fonts\.(googleapis|gstatic)\.com/.test(source),
      `${file}: a third party font request costs a DNS lookup and a round trip ` +
        'before the first character paints. The faces are in assets/.'
    );
  }
});
