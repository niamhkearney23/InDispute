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
  // Signed in as the learner who has not been through onboarding; the default
  // fixture has, so this page would redirect and the check would quietly
  // report on the dashboard instead.
  { name: 'onboarding', path: '/onboarding', auth: true, as: 'new@lawgistics.test' },
  { name: 'dashboard', path: '/dashboard', auth: true },
  { name: 'skills', path: '/skills', auth: true },
  { name: 'modules', path: '/modules', auth: true },
  { name: 'module', path: '/modules/ai-ethics-au', auth: true },
  { name: 'firm-module', path: '/modules/firm/ai-policy', auth: true },
  { name: 'diagnostic', path: '/diagnostic', auth: true },
  { name: 'diagnostic-results', path: '/diagnostic/results', auth: true },
  { name: 'train', path: `/train/${SESSION_ID}`, auth: true },
  { name: 'train-answered', path: `/train/${SESSION_ID}`, auth: true, answer: true },
  { name: 'summary', path: `/train/${SESSION_ID}/summary`, auth: true },
  { name: 'admin', path: '/admin', auth: true },
  { name: 'admin-facts', path: '/admin/facts', auth: true },
  { name: 'admin-question-new', path: '/admin/questions/new', auth: true },
  { name: 'admin-firm', path: '/admin/firm', auth: true },
  {
    name: 'admin-firm-edit',
    path: '/admin/firm/77777777-7777-7777-7777-777777777777',
    auth: true,
  },
  {
    name: 'admin-firm-record',
    path: '/admin/firm/77777777-7777-7777-7777-777777777777/record',
    auth: true,
  },
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
  // Tap targets that are too small to hit reliably on a phone. A checkbox or
  // radio wrapped in a label is hit by tapping the label, so measure that
  // instead: reporting the 20px box when the real target is a 40px row is a
  // false positive, and false positives are how a check stops being read.
  const smallTargets = [];
  for (const el of document.querySelectorAll('button, a, input, select, [role=button]')) {
    const ticky = el.tagName === 'INPUT' && /^(checkbox|radio)$/i.test(el.type);
    const target = ticky ? (el.closest('label') ?? el) : el;
    const r = target.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.height < 32) {
      smallTargets.push({
        tag: el.tagName.toLowerCase(),
        h: Math.round(r.height),
        text: (target.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30),
      });
    }
  }
  // Text fields below 16px cause iOS Safari to zoom the page on focus. It does
  // not do this for checkboxes or radios, which have no text to magnify.
  const zoomers = [];
  for (const el of document.querySelectorAll('input, select, textarea')) {
    if (el.tagName === 'INPUT' && /^(checkbox|radio|range|color|hidden)$/i.test(el.type)) continue;
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
    // Two kinds of page need their own browser context: one that must be
    // viewed signed out, and one that must be viewed as a different account.
    // Both were previously visited on the shared signed-in page, so the
    // landing page, the login page and onboarding all redirected to the
    // dashboard and were reported as though they had rendered.
    //
    // Signing out and back in on the shared page is not the fix: it leaves a
    // client-side redirect in flight that interrupts the next navigation, and
    // then every navigation after it.
    const needsOwnContext = target.as || target.auth === false;
    let scopedContext = null;
    let view = page;

    try {
      if (needsOwnContext) {
        scopedContext = await browser.newContext({
          viewport: device.viewport,
          deviceScaleFactor: device.dpr,
          isMobile: device.mobile,
          hasTouch: device.mobile,
          userAgent: device.ua,
        });
        view = await scopedContext.newPage();
        view.on('console', (m) => {
          if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 160));
        });
        view.on('pageerror', (e) => consoleErrors.push('PAGEERROR ' + e.message.slice(0, 160)));

        if (target.as) {
          await view.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
          await view.fill('#email', target.as);
          await view.fill('#password', 'password123');
          await Promise.all([
            view.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 15000 }).catch(() => {}),
            view.click('button[type=submit]'),
          ]);
        }
      }

      await view.goto(BASE + target.path, { waitUntil: 'networkidle', timeout: 20000 });

      // A page that redirects elsewhere was never rendered, and reporting "no
      // problems" for it is worse than reporting nothing: it reads as coverage.
      const landed = new URL(view.url()).pathname;
      const redirected = target.path !== landed && !target.path.startsWith(landed);

      if (target.answer) {
        // Drive the runner into its answered state so the feedback panel and
        // the sticky action bar are exercised too.
        await view.click('button[aria-pressed]', { timeout: 5000 }).catch(() => {});
        await view.getByText('Somewhat sure').click({ timeout: 5000 }).catch(() => {});
        await view.waitForTimeout(1200);
      }

      const probe = await view.evaluate(OVERFLOW_PROBE);
      await view.screenshot({
        path: `${OUT}/${device.name}--${target.name}.png`,
        fullPage: true,
      });

      report.push({
        device: device.label,
        page: target.name,
        url: view.url().replace(BASE, ''),
        redirectedTo: redirected ? landed : null,
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
    } finally {
      if (scopedContext) await scopedContext.close();
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
    r.redirectedTo ||
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
    if (p.redirectedTo) console.log(`    NOT RENDERED: redirected to ${p.redirectedTo}`);
    if (p.horizontalScroll) console.log(`    HORIZONTAL SCROLL ${p.scrollWidth} > ${p.docWidth}`);
    for (const o of p.offenders ?? []) console.log(`      overflow: <${o.tag}> "${o.text}" [${o.left}..${o.right}] ${o.cls}`);
    for (const t of p.smallTargets ?? []) console.log(`      small tap target ${t.h}px: <${t.tag}> "${t.text}"`);
    for (const z of p.zoomers ?? []) console.log(`      iOS zoom-on-focus: <${z.tag} name=${z.name}> ${z.size}px`);
    for (const e of p.consoleErrors ?? []) console.log(`      console: ${e}`);
  }
}
