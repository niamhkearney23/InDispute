import { chromium } from 'playwright';
import fs from 'node:fs';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE = 'http://127.0.0.1:3000';
const OUT = process.env.QA_OUT ?? '/tmp/lawgistics-qa';
const SESSION_ID = '99999999-9999-9999-9999-999999999999';

fs.mkdirSync(OUT, { recursive: true });

const DEVICES = [
  {
    name: 'iphone-se',
    label: 'iPhone SE (375×667)',
    viewport: { width: 375, height: 667 },
    dpr: 2,
    mobile: true,
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
  {
    name: 'iphone-15-pro',
    label: 'iPhone 15 Pro (393×852)',
    viewport: { width: 393, height: 852 },
    dpr: 3,
    mobile: true,
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
  {
    name: 'galaxy-s24',
    label: 'Galaxy S24 (360×780)',
    viewport: { width: 360, height: 780 },
    dpr: 3,
    mobile: true,
    ua: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  },
  {
    name: 'galaxy-s24-ultra',
    label: 'Galaxy S24 Ultra (412×915)',
    viewport: { width: 412, height: 915 },
    dpr: 3,
    mobile: true,
    ua: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  },
  {
    name: 'laptop',
    label: 'Laptop (1440×900)',
    viewport: { width: 1440, height: 900 },
    dpr: 2,
    mobile: false,
    ua: undefined,
  },
];

const PAGES = [
  { name: 'landing', path: '/', auth: false },
  { name: 'login', path: '/login', auth: false },
  { name: 'onboarding', path: '/onboarding', auth: true },
  { name: 'dashboard', path: '/dashboard', auth: true },
  { name: 'skills', path: '/skills', auth: true },
  { name: 'diagnostic', path: '/diagnostic', auth: true },
  { name: 'diagnostic-results', path: '/diagnostic/results', auth: true },
  { name: 'train', path: `/train/${SESSION_ID}`, auth: true },
  { name: 'train-answered', path: `/train/${SESSION_ID}`, auth: true, answer: true },
  { name: 'summary', path: `/train/${SESSION_ID}/summary`, auth: true },
  { name: 'admin', path: '/admin', auth: true },
  { name: 'admin-facts', path: '/admin/facts', auth: true },
  { name: 'admin-question-new', path: '/admin/questions/new', auth: true },
];

/** Anything wider than the viewport means the page scrolls sideways on a phone. */
const OVERFLOW_PROBE = `(() => {
  const docWidth = document.documentElement.clientWidth;
  const scrollWidth = document.documentElement.scrollWidth;
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > docWidth + 1 || r.left < -1) {
      offenders.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 70),
        text: (el.textContent || '').trim().slice(0, 40),
        left: Math.round(r.left), right: Math.round(r.right),
      });
    }
  }
  // Tap targets that are too small to hit reliably on a phone.
  const smallTargets = [];
  for (const el of document.querySelectorAll('button, a, input, select, [role=button]')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.height < 32) {
      smallTargets.push({
        tag: el.tagName.toLowerCase(),
        h: Math.round(r.height),
        text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30),
      });
    }
  }
  // Inputs below 16px cause iOS Safari to zoom the page on focus.
  const zoomers = [];
  for (const el of document.querySelectorAll('input, select, textarea')) {
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (size < 16) zoomers.push({ tag: el.tagName.toLowerCase(), name: el.getAttribute('name'), size });
  }
  return { docWidth, scrollWidth, horizontalScroll: scrollWidth > docWidth + 1, offenders: offenders.slice(0, 6), smallTargets: smallTargets.slice(0, 6), zoomers: zoomers.slice(0, 6) };
})()`;

const browser = await chromium.launch({ executablePath: EXE });
const report = [];

for (const device of DEVICES) {
  const context = await browser.newContext({
    viewport: device.viewport,
    deviceScaleFactor: device.dpr,
    isMobile: device.mobile,
    hasTouch: device.mobile,
    userAgent: device.ua,
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 160));
  });
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR ' + e.message.slice(0, 160)));

  // Sign in through the real form so the session cookie is set the real way.
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', 'demo@lawgistics.test');
  await page.fill('#password', 'password123');
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 15000 }).catch(() => {}),
    page.click('button[type=submit]'),
  ]);
  const signedIn = !page.url().includes('/login');

  for (const target of PAGES) {
    try {
      await page.goto(BASE + target.path, { waitUntil: 'networkidle', timeout: 20000 });

      if (target.answer) {
        // Drive the runner into its answered state so the feedback panel and
        // the sticky action bar are exercised too.
        await page.click('button[aria-pressed]', { timeout: 5000 }).catch(() => {});
        await page.getByText('Somewhat sure').click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(1200);
      }

      const probe = await page.evaluate(OVERFLOW_PROBE);
      await page.screenshot({
        path: `${OUT}/${device.name}--${target.name}.png`,
        fullPage: true,
      });

      report.push({
        device: device.label,
        page: target.name,
        url: page.url().replace(BASE, ''),
        ...probe,
        consoleErrors: [...consoleErrors],
      });
      consoleErrors.length = 0;
    } catch (error) {
      report.push({
        device: device.label,
        page: target.name,
        error: error.message.split('\n')[0].slice(0, 140),
      });
    }
  }

  report.push({ device: device.label, page: '(auth)', signedIn });
  await context.close();
}

await browser.close();

fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));

/* ---- summary ---- */
const problems = report.filter(
  (r) =>
    r.error ||
    r.horizontalScroll ||
    (r.smallTargets && r.smallTargets.length) ||
    (r.zoomers && r.zoomers.length) ||
    (r.consoleErrors && r.consoleErrors.length),
);

console.log(`\nRendered ${report.filter((r) => r.docWidth).length} page/device combinations.`);
console.log(`Signed in OK on: ${report.filter((r) => r.signedIn).length}/${DEVICES.length} devices\n`);

if (problems.length === 0) {
  console.log('No layout problems found.');
} else {
  for (const p of problems) {
    console.log(`--- ${p.device} :: ${p.page}`);
    if (p.error) console.log(`    ERROR ${p.error}`);
    if (p.horizontalScroll) console.log(`    HORIZONTAL SCROLL ${p.scrollWidth} > ${p.docWidth}`);
    for (const o of p.offenders ?? []) console.log(`      overflow: <${o.tag}> "${o.text}" [${o.left}..${o.right}] ${o.cls}`);
    for (const t of p.smallTargets ?? []) console.log(`      small tap target ${t.h}px: <${t.tag}> "${t.text}"`);
    for (const z of p.zoomers ?? []) console.log(`      iOS zoom-on-focus: <${z.tag} name=${z.name}> ${z.size}px`);
    for (const e of p.consoleErrors ?? []) console.log(`      console: ${e}`);
  }
}
