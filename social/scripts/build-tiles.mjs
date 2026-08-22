/* Builds the type led tiles as 1080 by 1080 images, straight from the
   calendar. Four of the nine tiles in every grid cycle are type on a solid
   ground, so this is roughly a third of the posting load done without a
   camera and without opening a design tool.

   SVG is written always. PNG is written when Chromium is available, since
   Instagram will not take an SVG.

   Usage: node scripts/build-tiles.mjs */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'tiles');

/* The five brand grounds. Ink is chosen for contrast against each. */
const GROUNDS = {
  cocoa: { bg: '#3B2318', ink: '#F2E9DC', quiet: '#C9B6A6' },
  rose: { bg: '#7A4A52', ink: '#F6E9E6', quiet: '#D9BDBB' },
  powder: { bg: '#AFC9DF', ink: '#2E4257', quiet: '#5A748C' },
  cream: { bg: '#F2E9DC', ink: '#3B2318', quiet: '#8B7A6E' },
  stripe: { bg: '#F2E9DC', ink: '#3B2318', quiet: '#8B7A6E', striped: true }
};

const escape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Wrap by width rather than by word count, so a long word does not blow the
   line out and a short line does not waste the tile. */
function wrap(text, perLine) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? line + ' ' + word : word;
    if (candidate.length > perLine && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function tile({ kind, text, tag, ground }) {
  const g = GROUNDS[ground] || GROUNDS.cocoa;
  const script = kind === 'script';

  /* The script face runs larger and wraps later, the display face is tighter.
     Both sit optically centred rather than mathematically centred: text reads
     better a little above the middle. */
  const perLine = script ? 18 : 15;
  const lines = wrap(text, perLine);
  const size = script
    ? Math.min(150, 900 / Math.max(...lines.map((l) => l.length)) * 2.1)
    : Math.min(118, 900 / Math.max(...lines.map((l) => l.length)) * 1.85);
  const leading = size * (script ? 1.12 : 1.16);
  const blockHeight = leading * lines.length;
  const top = 540 - blockHeight / 2 + size * 0.34 - 20;

  const stripes = g.striped
    ? `<pattern id="s" width="96" height="96" patternUnits="userSpaceOnUse">
         <rect width="96" height="96" fill="${g.bg}"/>
         <rect width="48" height="96" fill="#E6DACA"/>
       </pattern>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    ${stripes}
    <style>
      .d { font-family: "Playfair Display", Didot, Georgia, serif; font-weight: 400; }
      .s { font-family: "Cormorant Garamond", Didot, Georgia, serif; font-style: italic; font-weight: 300; }
      .u { font-family: Inter, Helvetica, Arial, sans-serif; font-size: 21px; letter-spacing: 4.4px; }
    </style>
  </defs>
  <rect width="1080" height="1080" fill="${g.striped ? 'url(#s)' : g.bg}"/>
  <text class="u" x="90" y="128" fill="${g.quiet}">${escape(String(tag).toUpperCase())}</text>
  <g class="${script ? 's' : 'd'}" fill="${g.ink}" font-size="${size.toFixed(1)}">
    ${lines
      .map(
        (line, i) =>
          `<text x="90" y="${(top + i * leading).toFixed(1)}">${escape(line)}</text>`
      )
      .join('\n    ')}
  </g>
  <text class="u" x="90" y="1002" fill="${g.quiet}">SLEEP SHOP, MELBOURNE</text>
</svg>`;
}

async function main() {
  const calendar = JSON.parse(await readFile(path.join(root, 'calendar.json'), 'utf8'));
  await mkdir(out, { recursive: true });

  const made = [];
  for (const week of calendar.weeks) {
    for (const post of week.posts) {
      if (!post.tile) continue;
      const name = `w${week.week}-${post.day.toLowerCase()}`;
      const svg = tile({ ...post.tile, ground: post.ground });
      await writeFile(path.join(out, `${name}.svg`), svg);
      made.push({ name, headline: post.headline });
    }
  }

  for (const post of calendar.evergreen?.posts ?? []) {
    if (!post.tile) continue;
    const name = `evergreen-${post.id}`;
    await writeFile(path.join(out, `${name}.svg`), tile({ ...post.tile, ground: post.ground }));
    made.push({ name, headline: post.tile.text });
  }

  console.log(`${made.length} tiles written to tiles/`);
  made.forEach((t) => console.log(`  ${t.name}.svg  ${t.headline}`));

  const chromium = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  if (!existsSync(chromium)) {
    console.log('\nChromium not found, so SVG only. Open the SVGs and export at 1080 square,');
    console.log('or run this where Chromium is installed to get PNGs.');
    return;
  }

  const { chromium: launcher } = await import('playwright-core').catch(() => ({}));
  if (!launcher) {
    console.log('\nplaywright-core is not installed, so SVG only. npm i -D playwright-core for PNGs.');
    return;
  }

  const browser = await launcher.launch({ executablePath: chromium, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  for (const { name } of made) {
    await page.goto('file://' + path.join(out, `${name}.svg`));
    await page.screenshot({ path: path.join(out, `${name}.png`) });
  }
  await browser.close();
  console.log(`${made.length} PNGs written, 1080 square, ready to post.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
