/* Every page of the site at three widths, looking for the two ways a layout
   breaks on a phone without anyone noticing on a laptop: something wider than
   the screen, and text with no gutter between it and the edge of the glass.
   Both were present when the site first landed here, on seven pages between
   them, and neither is visible at desktop width.

   This checks ../../lawgistics-site, but it lives here because that folder is
   a static site with no package.json, and Node resolves a bare import like
   'playwright' by walking up from the importing file rather than from the
   working directory. Put it next to the site and there is no Playwright to
   find.

   Serve the site first, then point this at the port:

     python3 -m http.server 8466 --directory ../lawgistics-site
     node tools/site-qa/device-check.mjs 8466

   Exits non-zero when anything is found, so it can gate a deploy. */

import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'lawgistics-site');
const PORT = process.argv[2] || '8466';
/* Every page, plus the academy in each of its single-country forms. Those hide
   whole sections, and a section that leaves a stray margin behind is the kind
   of thing that only shows up at a phone width. */
const PAGES = [
  ...readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort(),
  'academy.html?only=au',
  'academy.html?only=my',
];
const WIDTHS = [
  { w: 393, h: 852, name: 'phone' },
  { w: 768, h: 1024, name: 'tablet' },
  { w: 1280, h: 900, name: 'desktop' },
];

// Honour a preinstalled browser when there is one, otherwise let Playwright
// find its own.
const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
);
const problems = [];
let checked = 0;

for (const v of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h } });
  // No live API in here, so anything off-box is aborted rather than left to
  // time out. Console errors caused by that are filtered below.
  await ctx.route('**/*', (r) =>
    r.request().url().startsWith(`http://localhost:${PORT}`) ? r.continue() : r.abort());

  for (const p of PAGES) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 120)));
    await page.goto(`http://localhost:${PORT}/${p}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);

    const r = await page.evaluate((vw) => {
      const doc = document.documentElement;
      const over = [];
      for (const el of document.querySelectorAll('*')) {
        const b = el.getBoundingClientRect();
        if (!b.width && !b.height) continue;
        if (getComputedStyle(el).position === 'fixed') continue;
        if (b.right + window.scrollX > vw + 1) {
          over.push(el.tagName.toLowerCase() +
            (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/)[0] : '') +
            '@' + Math.round(b.right + window.scrollX));
        }
      }
      // Text hard against the edge of the screen. Not an overflow, so the
      // check above cannot see it, but it reads as broken on a phone just the
      // same. Only headings and paragraphs, because banners and navigation
      // bars are meant to run full bleed.
      const flush = [];
      for (const el of document.querySelectorAll('h1, h2, h3, p, label')) {
        const b = el.getBoundingClientRect();
        if (!b.width || !el.textContent.trim()) continue;
        const left = b.left + window.scrollX;
        // Only the 0 to 6px band. Screen reader labels are parked at
        // left:-9999px and are not on screen at all, so they are not this
        // defect and flagging them buried the real result under 25 lines of
        // noise on the first run.
        if (left >= 0 && left < 6) {
          flush.push(el.tagName.toLowerCase() + ' "' + el.textContent.trim().slice(0, 28) + '"');
        }
      }
      return {
        scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth,
        over: over.slice(0, 4), flush: flush.slice(0, 2),
      };
    }, v.w);

    checked++;
    const scrolls = r.scrollWidth > r.clientWidth + 1;
    if (scrolls || errors.length || r.flush.length) {
      problems.push(`${v.name.padEnd(8)} ${p.padEnd(26)} ${scrolls ? `scrollWidth ${r.scrollWidth} > ${r.clientWidth}  ${r.over.join(' ')}` : ''}${r.flush.length ? `  no side gutter: ${r.flush.join(', ')}` : ''}${errors.length ? '  JS: ' + errors[0] : ''}`);
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();

console.log(`\n${checked} page and width combinations checked, ${problems.length} with problems`);
for (const p of problems) console.log('  ' + p);
process.exit(problems.length === 0 ? 0 : 1);
