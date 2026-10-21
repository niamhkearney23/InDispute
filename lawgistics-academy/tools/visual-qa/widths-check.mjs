/**
 * Phone widths, checked properly: 320 (the smallest still sold), 375, 390
 * and 430, for the pages named in QA_PAGES (paths, comma separated). For
 * each page and width it signs in through the real form, then checks the
 * page twice, with every <details> section closed and again with all of
 * them open, because what is folded away still has to fit when opened:
 *
 *   - no horizontal scrolling, and nothing wider than the screen
 *   - every link, button and summary at least 44px tall (WCAG 2.5.5's
 *     target size), since these are pages people use with a thumb
 *   - an axe-core audit against WCAG 2.1 AA, with no violations allowed
 *
 * and saves a full-page screenshot of each. Run against the stand-in, like
 * device-check.mjs:
 *
 *   QA_PAGES=/skills,/dashboard node tools/visual-qa/widths-check.mjs
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const BASE = process.env.QA_BASE ?? 'http://127.0.0.1:3000';
const OUT = process.env.QA_OUT ?? '/tmp/lawgistics-widths';
const AS = process.env.QA_AS ?? 'demo@lawgistics.test';
const PAGES = (process.env.QA_PAGES ?? '/skills').split(',').map((p) => p.trim()).filter(Boolean);
const WIDTHS = [320, 375, 390, 430];
const EXE = process.env.PW_CHROMIUM ?? '/opt/pw-browsers/chromium';
fs.mkdirSync(OUT, { recursive: true });

const PROBE = () => {
  const width = document.documentElement.clientWidth;
  const wide = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const style = getComputedStyle(el);
    if (style.position === 'fixed' || style.visibility === 'hidden') continue;
    if (r.right > width + 1 || r.left < -1) {
      // Inside a scrolling box is fine: that is what the box is for.
      let p = el.parentElement;
      let scrolls = false;
      while (p && p !== document.body) {
        const s = getComputedStyle(p);
        if (/(auto|scroll)/.test(s.overflowX) || s.overflow === 'hidden' || s.overflowX === 'hidden' || s.overflowX === 'clip') {
          scrolls = true;
          break;
        }
        p = p.parentElement;
      }
      if (!scrolls) wide.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} ${Math.round(r.right)}px`);
    }
  }
  const small = [];
  for (const el of document.querySelectorAll('a[href], button, summary, input, select, textarea')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (getComputedStyle(el).visibility === 'hidden') continue;
    // A link inside a sentence is exempt from the target size rule.
    const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline';
    if (!inline && r.height < 44) small.push(`${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 30)}" ${Math.round(r.height)}px`);
  }
  // On a phone the bottom menu carries these four; the header must not
  // show them as well (a display utility once overrode their `hidden`).
  const header = document.querySelector('header.sticky');
  const doubled = header
    ? [...header.querySelectorAll('nav a[href]')]
        .filter((a) => ['/dashboard', '/modules', '/work', '/skills'].includes(a.getAttribute('href')))
        .filter((a) => a.getBoundingClientRect().width > 0 && getComputedStyle(a).display !== 'none')
        .map((a) => a.textContent.trim())
    : [];
  return {
    doubled,
    horizontalScroll: document.documentElement.scrollWidth > width + 1,
    wide: wide.slice(0, 8),
    small: small.slice(0, 12),
  };
};

const browser = await chromium.launch({ executablePath: EXE });
const problems = [];
let checks = 0;

for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.route('**/*', (route) => {
    const url = route.request().url();
    return url.startsWith(BASE) || url.startsWith('http://127.0.0.1:54321') || url.startsWith('data:') || url.startsWith('blob:')
      ? route.continue()
      : route.abort();
  });
  await page.goto(`${BASE}/login`, { waitUntil: 'load' });
  await page.fill('#email', AS);
  await page.fill('#password', 'password123');
  await Promise.all([page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 20000 }), page.click('button[type=submit]')]);

  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'load' });
    await page.waitForLoadState('domcontentloaded');
    const landed = new URL(page.url()).pathname;
    if (landed !== path) {
      problems.push(`${width}px ${path}: redirected to ${landed}, nothing checked`);
      continue;
    }
    for (const state of ['closed', 'open']) {
      if (state === 'open') {
        await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
        await page.waitForTimeout(150);
      }
      checks += 1;
      const probe = await page.evaluate(PROBE);
      await page.addScriptTag({ content: AXE });
      const axe = await page.evaluate(async () => {
        const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
        return result.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} ${v.nodes[0]?.target?.join(' ')}`);
      });
      const name = `${width}--${path.replace(/\//g, '_') || 'root'}--${state}`;
      await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
      const found = [
        probe.horizontalScroll ? 'scrolls sideways' : null,
        ...probe.doubled.map((d) => `menu item "${d}" in the header as well as the bottom menu`),
        ...probe.wide.map((w) => `wider than the screen: ${w}`),
        ...probe.small.map((s) => `tap target under 44px: ${s}`),
        ...axe.map((a) => `axe ${a}`),
      ].filter(Boolean);
      for (const f of found) problems.push(`${width}px ${path} (${state}): ${f}`);
    }
  }
  await context.close();
}
await browser.close();

console.log(`Checked ${checks} page states (${PAGES.length} pages × ${WIDTHS.length} widths × closed and open).`);
if (problems.length === 0) console.log('No problems found.');
else {
  for (const p of problems) console.log(p);
  process.exitCode = 1;
}
