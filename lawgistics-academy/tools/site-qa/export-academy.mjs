/* Export the academy page as one self-contained HTML file.
 *
 * The page on lawgistics.my is not portable. It pulls in a stylesheet and seven
 * scripts, the header and footer are injected at runtime, and the strands
 * themselves are rendered from a data file. Copy academy.html onto another site
 * and you get an empty shell.
 *
 * This renders the real page in a browser, waits for it to finish building
 * itself, and then writes out what is actually on screen with the stylesheet
 * inlined and the scripts gone. The result is one file that can be dropped
 * anywhere, opened from a desktop, or pasted into another site's page.
 *
 *   python3 -m http.server 8466 --directory ../lawgistics-site
 *   node tools/site-qa/export-academy.mjs 8466 au
 *
 * The country decides which strands are in it. Nothing is invented at export
 * time: what comes out is what that country's visitor sees.
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PORT = process.argv[2] || '8466';
const COUNTRY = (process.argv[3] || 'au').toLowerCase();
if (COUNTRY !== 'au' && COUNTRY !== 'my') {
  console.error(`Unknown country "${COUNTRY}". Use au or my.`);
  process.exit(1);
}

/* Where the page is going, so relative links still land somewhere real. The
   app links are already absolute and are left alone. */
const SITE = 'https://lawgistics.my';

const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  `academy-${COUNTRY === 'au' ? 'australia' : 'malaysia'}.html`,
);

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
);
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(`http://localhost:${PORT}/academy.html?c=${COUNTRY}`, {
  waitUntil: 'networkidle',
});
// The strands are painted by the page's own script. Without this the export is
// a page with an empty programme section, which is exactly the failure this
// tool exists to avoid.
await page.waitForSelector('.unit', { timeout: 15000 });

const css = await page.evaluate(async () => {
  const link = document.querySelector('link[rel="stylesheet"][href*="site.css"]');
  if (!link) return '';
  const res = await fetch(link.getAttribute('href'));
  return res.text();
});
if (!css) {
  console.error('Could not read site.css. Export aborted rather than writing a page with no styles.');
  await browser.close();
  process.exit(1);
}

const html = await page.evaluate(
  ({ css, site, country }) => {
    const doc = document;

    // Runtime furniture. The header and footer are built by the site's own
    // script and link all over lawgistics.my, which is somebody else's
    // navigation once this page is on another site.
    // The beta bar is injected by the site's own script and speaks for
    // lawgistics.my ("everything on the site is free while we are testing"),
    // which is a claim about somebody else's site once this file is elsewhere.
    for (const sel of [
      'header[data-header]',
      'footer[data-footer]',
      '[data-guide]',
      '.beta-bar',
      '.demo-bar',
      'script',
    ]) {
      doc.querySelectorAll(sel).forEach((n) => n.remove());
    }

    // The country switch goes: this file IS one country, and a switch that
    // cannot switch is worse than none.
    doc.querySelector('[data-country-pick]')?.closest('section')?.remove();

    // The daily question needs a script and a data file, and the question
    // itself is Malaysian. It cannot travel.
    doc.querySelector('#quiz')?.remove();

    // Reveal animations leave elements at zero opacity until the script runs,
    // and the script is gone. Strip the hooks so everything is simply visible.
    doc.querySelectorAll('[data-reveal]').forEach((n) => {
      n.removeAttribute('data-reveal');
      n.removeAttribute('style');
    });

    // Anything hidden because it belongs to the other country stays out: this
    // file is one country, and the script that would have shown or hidden it
    // is gone.
    doc.querySelectorAll('[hidden]').forEach((n) => n.remove());

    // Relative links would break on another domain. App links are absolute
    // already, and are left exactly as they are.
    doc.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (/^(https?:|mailto:|tel:|#)/.test(href)) return;
      a.setAttribute('href', `${site}/${href.replace(/^\.?\//, '')}`);
    });

    const style = doc.createElement('style');
    style.textContent = css;
    doc.head.appendChild(style);
    doc.querySelector('link[rel="stylesheet"][href*="site.css"]')?.remove();

    doc.title = country === 'au' ? 'Litigation Academy, Australia' : 'Litigation Academy, Malaysia';

    return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  },
  { css, site: SITE, country: COUNTRY },
);

await browser.close();

const banner = `<!--
  Litigation Academy, ${COUNTRY === 'au' ? 'Australia' : 'Malaysia'}. One self-contained file.

  Exported from lawgistics.my/academy.html. The stylesheet is inlined and the
  scripts are removed, so this is a static page: drop it on any site, open it
  from a desktop, or paste the <body> into a page you already have.

  Two things it needs from the network, and both degrade quietly:
    - Google Fonts, for Lora and Inter. Without them it falls back to Georgia
      and the system sans, and still reads correctly.
    - Nothing else. There are no images; the drawings are inline SVG.

  Links back to lawgistics.my are absolute. Links into the training app are
  absolute already. Regenerate with:
    node tools/site-qa/export-academy.mjs <port> ${COUNTRY}
-->\n`;

writeFileSync(OUT, banner + html);

// The article carries class="unit" or "unit unit--marked"; unit__num and the
// rest must not be counted, or four strands are reported as forty.
const counts = (html.match(/class="unit[ "]/g) || []).length;
console.log(`Wrote ${OUT}`);
console.log(`  ${counts} strands, ${(html.length / 1024).toFixed(0)}KB, no external files except fonts.`);
