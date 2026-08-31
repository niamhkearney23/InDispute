/* The Sleep Shop logo: a mark plus a wordmark, built from the same ribbon-bow
   language already used in the site's generated artwork (assets/js/art.js,
   the `bow()` helper on the box scenes), so the logo and the product art
   read as one visual system rather than two separate decisions.

   Outputs: the mark alone, and the full horizontal lockup, each in a cocoa
   version (for light grounds) and a cream version (for dark grounds), as
   SVG and PNG, plus a square favicon derived from the mark.

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

const FACES = [
  ['ss-playfair-display-400-latin.woff2', 'Playfair Display', 'normal', 400],
  ['ss-inter-400-latin.woff2', 'Inter', 'normal', 400],
  ['ss-inter-500-latin.woff2', 'Inter', 'normal', 500]
];

async function embedFaces() {
  let css = '';
  for (const [file, family, style, weight] of FACES) {
    const b64 = (await readFile(path.join(THEME_ASSETS, file))).toString('base64');
    css += `@font-face{font-family:"${family}";font-style:${style};font-weight:${weight};src:url(data:font/woff2;base64,${b64}) format("woff2")}\n`;
  }
  return css;
}

/* The mark: two ribbon loops crossing over a tied knot, drawn as clean single
   -weight strokes rather than the filled shapes the product art uses — a
   logo has to work at 16px, where fills clog into a blob. Built at a 120
   unit square so it centres easily inside any frame. */
function markPaths(stroke) {
  return `
    <g fill="none" stroke="${stroke}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M60 66C40 40 8 44 8 62c0 16 26 20 52 8"/>
      <path d="M60 66C80 40 112 44 112 62c0 16-26 20-52 8"/>
      <path d="M60 66C40 96 30 112 36 118c7 6 20-8 30-38"/>
      <path d="M60 66C80 96 90 112 84 118c-7 6-20-8-30-38"/>
      <circle cx="60" cy="64" r="9"/>
    </g>`;
}

function markSvg(stroke, bg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  ${bg ? `<rect width="120" height="120" fill="${bg}"/>` : ''}
  ${markPaths(stroke)}
</svg>`;
}

/* The full lockup: mark, then "Sleep Shop" in the display face, then
   "MELBOURNE" tracked wide beneath it in the utility face, exactly the
   voice already used in the site header. */
function lockupSvg(ink, bg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 140">
  ${bg ? `<rect width="520" height="140" fill="${bg}"/>` : ''}
  <g transform="translate(10,10) scale(0.83)">${markPaths(ink)}</g>
  <text x="150" y="72" font-family="Playfair Display, Georgia, serif" font-size="52" fill="${ink}">Sleep Shop</text>
  <text x="152" y="98" font-family="Inter, Arial, sans-serif" font-size="13" letter-spacing="5" fill="${ink}" opacity="0.62">MELBOURNE</text>
</svg>`;
}

function wordmarkSvg(ink, bg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 70">
  ${bg ? `<rect width="340" height="70" fill="${bg}"/>` : ''}
  <text x="0" y="46" font-family="Playfair Display, Georgia, serif" font-size="46" fill="${ink}">Sleep Shop</text>
</svg>`;
}

async function main() {
  await mkdir(out, { recursive: true });
  const faceCss = await embedFaces();

  const files = {
    'mark-cocoa.svg': markSvg(COCOA, null),
    'mark-cream.svg': markSvg(CREAM, null),
    'lockup-cocoa-on-cream.svg': lockupSvg(COCOA, CREAM),
    'lockup-cream-on-cocoa.svg': lockupSvg(CREAM, COCOA),
    'wordmark-cocoa.svg': wordmarkSvg(COCOA, null),
    'wordmark-cream.svg': wordmarkSvg(CREAM, null)
  };

  for (const [name, svg] of Object.entries(files)) {
    await writeFile(path.join(out, name), svg);
  }

  /* PNG renders: the mark at icon sizes, the lockup at a usable web size,
     each checked for the brand face actually loading rather than trusting
     the string to have worked. */
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox']
  });

  async function shot(svg, w, h, file, scale = 4) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
    await page.setContent(`<style>${faceCss}html,body{margin:0}</style>${svg}`);
    if (svg.includes('Playfair')) {
      await page.evaluate(() => document.fonts.ready);
      const loaded = await page.evaluate(() => [...document.fonts].some((f) => f.status === 'loaded'));
      if (!loaded) throw new Error(`${file}: brand face did not load`);
    }
    await page.setViewportSize({ width: w, height: h });
    await page.screenshot({ path: path.join(out, file), omitBackground: true });
    await page.close();
  }

  await shot(markSvg(COCOA, null), 120, 120, 'mark-cocoa.png');
  await shot(markSvg(CREAM, null), 120, 120, 'mark-cream.png');
  await shot(markSvg(CREAM, COCOA), 512, 512, 'app-icon-512.png');
  await shot(markSvg(COCOA, CREAM), 32, 32, 'favicon-32.png', 8);
  await shot(lockupSvg(COCOA, null), 520, 140, 'lockup-cocoa.png');
  await shot(lockupSvg(CREAM, null), 520, 140, 'lockup-cream.png');
  await shot(wordmarkSvg(COCOA, null), 340, 70, 'wordmark-cocoa.png');
  await shot(wordmarkSvg(CREAM, null), 340, 70, 'wordmark-cream.png');

  await browser.close();
  console.log(`written to ${out}/`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
