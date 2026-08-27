/* Every page of the site, checked against WCAG 2.1 AA with axe.

   Written after a hand audit turned up three classes of fault that had been
   there since the site arrived and that nobody had seen, because none of them
   is visible if your eyes happen to work the way the designer's do:

     - eyebrow text on the dark sections at 3.1:1, and section ledes at 1.63:1,
       which is very nearly invisible;
     - links sitting mid-sentence marked by colour alone, at 1.13:1 against the
       words around them, so to a colour-blind reader they are ordinary words;
     - a tablist on the court pack whose children were plain buttons, which a
       screen reader announces as a broken widget rather than as tabs.

   Contrast in particular cannot be eyeballed. Every one of those was found by
   measuring and would have survived any number of careful looks.

   This checks ../../lawgistics-site, but it lives here for the same reason
   device-check.mjs does: that folder has no package.json, and Node resolves a
   bare import by walking up from the importing file.

   Serve the site first, then point this at the port:

     python3 -m http.server 8466 --directory ../lawgistics-site
     node tools/site-qa/a11y-check.mjs 8466

   Exits non-zero when anything is found, so it can gate a deploy. */

import { chromium } from 'playwright';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..', 'lawgistics-site');
const AXE = readFileSync(join(HERE, '..', '..', 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
const PORT = process.argv[2] || '8466';
const PAGES = readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();

/* The academy page is checked in both countries. It renders a different set of
   strands for each, so checking one leaves the other unchecked.

   The single-country pages are checked separately again. They are the same
   markup with whole sections removed, and removing a section is exactly how a
   heading level ends up skipped or a landmark ends up empty. */
const EXTRA = [
  'academy.html?c=au',
  'academy.html?only=au',
  'academy.html?only=my',
];

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
);
const ctx = await browser.newContext({ viewport: { width: 393, height: 900 } });

// No live API in here. Anything off-box is aborted rather than left to time
// out, which is also what stops a slow third party turning a fault into a pass.
await ctx.route('**/*', (route) => {
  const url = route.request().url();
  return url.includes(`localhost:${PORT}`) || url.startsWith('data:')
    ? route.continue()
    : route.abort();
});

const found = [];
let checked = 0;

for (const page of [...PAGES, ...EXTRA]) {
  const p = await ctx.newPage();
  try {
    await p.goto(`http://localhost:${PORT}/${page}`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    // The reveal animations start at zero opacity, and axe reads what is on
    // screen at the moment it runs. Without this, contrast is measured against
    // a half-faded element and reports faults that are not there.
    await p.waitForTimeout(800);
    await p.addScriptTag({ content: AXE });

    const result = await p.evaluate(async () =>
      window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      }),
    );

    for (const v of result.violations) {
      for (const node of v.nodes) {
        found.push({
          page,
          impact: v.impact,
          id: v.id,
          target: node.target.join(' '),
          why: ((node.any[0] || {}).message || v.help).replace(/\s+/g, ' ').slice(0, 140),
        });
      }
    }
    checked += 1;
  } catch (error) {
    found.push({
      page,
      impact: 'error',
      id: 'could-not-check',
      target: '',
      why: String(error).split('\n')[0].slice(0, 140),
    });
  }
  await p.close();
}

await browser.close();

const RANK = { critical: 0, serious: 1, moderate: 2, minor: 3, error: 0 };
found.sort((a, b) => (RANK[a.impact] ?? 9) - (RANK[b.impact] ?? 9));

for (const f of found) {
  console.log(`${f.impact.toUpperCase()}  ${f.id}`);
  console.log(`  ${f.page}  ${f.target}`);
  console.log(`  ${f.why}`);
}

console.log(
  `\n${checked} pages checked at 393px against WCAG 2.1 AA, ${found.length} problem${
    found.length === 1 ? '' : 's'
  }`,
);

process.exit(found.length > 0 ? 1 : 0);
