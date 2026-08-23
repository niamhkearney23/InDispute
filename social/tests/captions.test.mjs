/* Captions are where the legal risk actually lives. The website copy gets read
   carefully once; captions get written on a phone on a Sunday night. So the
   same rules apply here, enforced the same way. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const calendar = JSON.parse(readFileSync(path.join(root, 'calendar.json'), 'utf8'));
const readme = readFileSync(path.join(root, 'README.md'), 'utf8');

const posts = calendar.weeks.flatMap((week) =>
  week.posts.map((post) => ({ ...post, ref: `week ${week.week} ${post.day}` }))
);
const captions = posts.map((p) => [p.ref, p.caption]);

/* ---------------------------------------------------- therapeutic claims */

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
  /anxiety/i,
  /insomnia/i,
  /therapeutic/i,
  /wellness/i,
  /wellbeing/i,
  /clinically/i,
  /restorative/i,
  /switch off your (mind|brain)/i,
  /sleep like/i
];

test('no caption implies a health outcome', () => {
  for (const [ref, caption] of captions) {
    for (const pattern of CLAIMS) {
      const hit = caption.match(pattern);
      assert.equal(
        hit,
        null,
        `${ref}: "${hit && hit[0]}". Captions stay inside rest, ritual, comfort, ` +
          'care and the object itself.'
      );
    }
  }
});

/* "Give the gift of sleep" was blocked here for a year of commits, then chosen
   as the brand line anyway — deliberately, by the founder, with the trade-off
   in front of them. The line is allowed; the decision and its reasoning must
   stay written down in the README so nobody re-litigates it by accident, and
   everything underneath the line stays inside the strict rules above. */
test('the tagline decision is recorded, and nothing escalates beyond the line itself', () => {
  assert.ok(
    /gift of sleep/i.test(readme),
    'the README must record why the tagline is allowed and where the line is drawn'
  );
  /* The tagline is the ceiling. Anything that promises more than the gesture —
     delivering, guaranteeing, providing sleep — is still a claims problem. */
  const ESCALATIONS = [
    /guarantees? sleep/i,
    /delivers sleep/i,
    /provides sleep/i,
    /gift of (better|deeper) sleep/i
  ];
  const everything = JSON.stringify(calendar);
  for (const pattern of ESCALATIONS) {
    const hit = everything.match(pattern);
    assert.equal(hit, null, `"${hit && hit[0]}" goes past the line the tagline draws`);
  }
});

/* ------------------------------------------------------------ house style */

test('no em dashes, and Australian spelling', () => {
  const US = [/\borganiz/i, /\bpersonaliz/i, /\bcustomiz/i, /\bapologiz/i, /\bfavorite/i, /\bcolor\b/i, /\bpajama/i];
  for (const [ref, caption] of captions) {
    assert.ok(!caption.includes('—'), `${ref}: contains an em dash`);
    for (const pattern of US) {
      const hit = caption.match(pattern);
      assert.equal(hit, null, `${ref}: American spelling "${hit && hit[0]}"`);
    }
  }
});

test('no testimonials or counts before there are real ones', () => {
  for (const [ref, caption] of captions) {
    assert.ok(!/★|⭐/.test(caption), `${ref}: star glyphs`);
    assert.ok(!/\b\d[\d,]*\s+(reviews?|customers|five stars)\b/i.test(caption), `${ref}: a count`);
    assert.ok(!/"[^"]{30,}"\s*[-–]\s*\w/.test(caption), `${ref}: looks like a quoted testimonial`);
  }
});

test('no discounting or urgency, because we do not run sales', () => {
  const PRESSURE = [
    /\d+%\s*off/i, /\bdiscount/i, /\bpromo code/i, /\bhurry\b/i,
    /\blimited time\b/i, /\blast chance\b/i, /\bdon'?t miss\b/i,
    /\bselling fast\b/i, /\balmost gone\b/i, /\bends (today|tonight)\b/i
  ];
  for (const [ref, caption] of captions) {
    for (const pattern of PRESSURE) {
      const hit = caption.match(pattern);
      assert.equal(hit, null, `${ref}: "${hit && hit[0]}" is pressure, not the brand`);
    }
  }
});

/* -------------------------------------------------------------- the grid */

test('the calendar is four posts a week for four weeks', () => {
  assert.equal(calendar.weeks.length, 4);
  for (const week of calendar.weeks) {
    assert.equal(week.posts.length, 4, `week ${week.week} should have four posts`);
    assert.deepEqual(
      week.posts.map((p) => p.day),
      ['Mon', 'Wed', 'Fri', 'Sun'],
      `week ${week.week} is off the Monday Wednesday Friday Sunday rhythm`
    );
  }
});

test('every post names a ground from the brand palette', () => {
  const allowed = ['cocoa', 'rose', 'powder', 'cream', 'stripe', 'alternating'];
  for (const post of posts) {
    assert.ok(allowed.includes(post.ground), `${post.ref}: unknown ground "${post.ground}"`);
  }
});

test('no two consecutive posts sit on the same ground', () => {
  /* Consistency of ground is what makes the feed look composed, but two
     identical grounds next to each other read as a repeat, not a system. */
  for (let i = 1; i < posts.length; i++) {
    if (posts[i].ground === 'alternating') continue;
    assert.notEqual(
      posts[i].ground,
      posts[i - 1].ground,
      `${posts[i].ref} repeats the ground from ${posts[i - 1].ref}`
    );
  }
});

test('roughly a third of posts need no camera', () => {
  const tiles = posts.filter((p) => p.tile);
  assert.ok(tiles.length >= 4, 'type tiles are what makes four a week sustainable');
  for (const post of tiles) {
    assert.ok(post.tile.text && post.tile.tag, `${post.ref}: a tile needs text and a tag`);
    assert.ok(
      ['script', 'display'].includes(post.tile.kind),
      `${post.ref}: tile kind must be script or display`
    );
    if (post.tile.kind === 'script') {
      const words = post.tile.text.trim().split(/\s+/).length;
      assert.ok(words <= 8, `${post.ref}: the script face is for one phrase, not ${words} words`);
    }
  }
});

test('every post says what to shoot, so nothing stalls on the day', () => {
  for (const post of posts) {
    assert.ok(post.shoot && post.shoot.length > 8, `${post.ref}: no shoot note`);
    /* A reel earns a short caption: the video is the content and a paragraph
       under it reads as a lack of confidence. Everything else needs a body. */
    const floor = /reel/i.test(post.format) ? 12 : 30;
    assert.ok(
      post.caption.length > floor,
      `${post.ref}: caption is too thin for a ${post.format}`
    );
  }
});

/* ---------------------------------------------------------------- the type */

/* The first run of these tiles went out in Chromium's default serif. The SVG
   named Playfair Display and Cormorant Garamond and nothing ever loaded them,
   which at a glance looks close enough to a Didone to be posted without
   noticing. The faces are embedded now, and that is checked rather than
   assumed. */
test('every generated tile carries its own typefaces', () => {
  const dir = path.join(root, 'tiles');
  if (!existsSync(dir)) return; /* tiles are generated, not committed prerequisites */

  const svgs = readdirSync(dir).filter((f) => f.endsWith('.svg'));
  assert.ok(svgs.length >= 4, 'no tiles to check, run npm run tiles');

  for (const file of svgs) {
    const svg = readFileSync(path.join(dir, file), 'utf8');
    const families = [...svg.matchAll(/@font-face\{font-family:"([^"]+)"/g)].map((m) => m[1]);

    assert.ok(
      families.includes('Playfair Display') &&
        families.includes('Cormorant Garamond') &&
        families.includes('Inter'),
      `${file}: a face is named in the stylesheet but not embedded, so it will ` +
        'render in whatever serif the machine happens to have'
    );
    assert.ok(
      /src:url\(data:font\/woff2;base64,/.test(svg),
      `${file}: the faces must be data URIs, or the tile only looks right here`
    );
  }
});

test('the tiles are set in the same faces as the shop', () => {
  /* One definition of what Sleep Shop is set in. The tile builder reads the
     woff2 files out of the theme rather than keeping its own copy, so the two
     cannot drift apart. */
  const builder = readFileSync(path.join(root, 'scripts', 'build-tiles.mjs'), 'utf8');
  assert.match(builder, /shopify-theme', 'assets'/, 'the tiles must read the theme fonts');

  const css = readFileSync(
    path.join(root, '..', 'shopify-theme', 'assets', 'sleep-shop.css'), 'utf8'
  );
  for (const [role, family] of [['display', 'Playfair Display'], ['script', 'Cormorant Garamond'], ['util', 'Inter']]) {
    assert.match(
      css, new RegExp(`--ss-${role}:\\s*"?${family}`),
      `the shop sets ${role} in something other than ${family}, so the tiles are off brand`
    );
  }
});
