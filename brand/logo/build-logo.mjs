/* The Sleep Shop logo, direction D: the wordmark alone, set in Playfair
   Display, sentence case, with one thin accent rule beneath it. No icon —
   the brands named in the brief (a luxury hotel bedside, a beautiful
   skincare brand) mostly let the type carry the whole thing, and an earlier
   ribbon-bow mark tried to solve a problem the brand did not have: the box
   art already carries that motif, the logo does not need to repeat it.

   No "Melbourne" anywhere in the mark itself — that lives in body copy
   (the footer paragraph, the announcement bar), not in the logo.

   The favicon and app icon are not a separate "icon design": they are the
   same wordmark's first letter, in the same face, since a multi-word
   wordmark cannot survive being shrunk to 16px.

   Outputs: the full lockup (wordmark + rule) in cocoa and cream, the bare
   wordmark without the rule for tight spaces, and the "S" letterform for
   the favicon and app icon.

   Usage: node build-logo.mjs */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, 'export');
const THEME_ASSETS = path.resolve(root, '..', '..', 'shopify-theme', 'assets');

const COCOA = '#3B2318';
const CREAM = '#F2E9DC';
const ROSE = '#7A4A52';

const FACES = [
  ['ss-playfair-display-400-latin.woff2', 'Playfair Display', 'normal', 400]
];

async function embedFaces() {
  let css = '';
  for (const [file, family, style, weight] of FACES) {
    const b64 = (await readFile(path.join(THEME_ASSETS, file))).toString('base64');
    css += `@font-face{font-family:"${family}";font-style:${style};font-weight:${weight};src:url(data:font/woff2;base64,${b64}) format("woff2")}\n`;
  }
  return css;
}

function lockupSvg(ink, rule, bg) {
  /* Text set with SVG <text> rather than HTML, so the export is one vector
     file with no external font dependency once opened elsewhere. Playfair
     Display must still be installed or embedded to render correctly; the
     PNG exports are the safe fallback for anywhere that cannot guarantee
     the font. */
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 92">
  ${bg ? `<rect width="300" height="92" fill="${bg}"/>` : ''}
  <text x="0" y="54" font-family="Playfair Display, Georgia, serif" font-size="50" fill="${ink}">Sleep Shop</text>
  <rect x="2" y="72" width="46" height="2.4" fill="${rule}"/>
</svg>`;
}

function wordmarkSvg(ink, bg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 60">
  ${bg ? `<rect width="300" height="60" fill="${bg}"/>` : ''}
  <text x="0" y="46" font-family="Playfair Display, Georgia, serif" font-size="50" fill="${ink}">Sleep Shop</text>
</svg>`;
}

function letterSvg(ink, bg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  ${bg ? `<rect width="120" height="120" fill="${bg}"/>` : ''}
  <text x="60" y="82" font-family="Playfair Display, Georgia, serif" font-size="72" fill="${ink}" text-anchor="middle">S</text>
</svg>`;
}

async function main() {
  await mkdir(out, { recursive: true });
  const faceCss = await embedFaces();

  const files = {
    'lockup-cocoa.svg': lockupSvg(COCOA, ROSE, null),
    'lockup-cream.svg': lockupSvg(CREAM, '#D9BDBB', null),
    'wordmark-cocoa.svg': wordmarkSvg(COCOA, null),
    'wordmark-cream.svg': wordmarkSvg(CREAM, null),
    'letter-cocoa.svg': letterSvg(COCOA, null),
    'letter-cream.svg': letterSvg(CREAM, null)
  };
  for (const [name, svg] of Object.entries(files)) {
    await writeFile(path.join(out, name), svg);
  }

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox']
  });

  async function shot(svg, w, h, file, scale = 4) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
    await page.setContent(`<style>${faceCss}html,body{margin:0}</style>${svg}`);
    await page.evaluate(() => document.fonts.ready);
    const loaded = await page.evaluate(() => [...document.fonts].some((f) => f.status === 'loaded'));
    if (!loaded) throw new Error(`${file}: brand face did not load`);
    await page.screenshot({ path: path.join(out, file), omitBackground: true });
    await page.close();
  }

  await shot(lockupSvg(COCOA, ROSE, null), 300, 92, 'lockup-cocoa.png');
  await shot(lockupSvg(CREAM, '#D9BDBB', null), 300, 92, 'lockup-cream.png');
  await shot(wordmarkSvg(COCOA, null), 300, 60, 'wordmark-cocoa.png');
  await shot(wordmarkSvg(CREAM, null), 300, 60, 'wordmark-cream.png');
  await shot(letterSvg(CREAM, COCOA), 32, 32, 'favicon-32.png', 8);
  await shot(letterSvg(CREAM, COCOA), 512, 512, 'app-icon-512.png');
  await shot(letterSvg(COCOA, null), 200, 200, 'letter-cocoa.png');
  await shot(letterSvg(CREAM, null), 200, 200, 'letter-cream.png');

  await browser.close();
  console.log(`written to ${out}/`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
