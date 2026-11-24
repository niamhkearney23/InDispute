// Browser checks for the usability, accessibility and metadata fixes.
const { chromium } = require('playwright');
const BASE = 'http://localhost:3010';
let pass = 0, fail = 0;
const ok = (c, l, x = '') => { c ? pass++ : fail++; console.log((c ? '  PASS ' : '  FAIL ') + l + (c ? '' : '   <- ' + x)); };
const go = async (pg, path) => { for (let i = 0; i < 3; i++) { try { return await pg.goto(BASE + path, { waitUntil: 'load' }); } catch (e) { await pg.waitForTimeout(500); } } return pg.goto(BASE + path); };
(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
  const shot = process.argv[2] || 'ux';

  console.log('\n== pages, previews and search');
  {
    const ctx = await browser.newContext(); const page = await ctx.newPage();
    for (const p of ['/', '/firms', '/join', '/team', '/owner']) {
      await go(page, p); await page.waitForTimeout(600);
      const info = await page.evaluate(() => ({
        mains: document.querySelectorAll('main').length,
        robots: document.querySelector('meta[name="robots"]')?.content || '',
        ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
        ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
        tw: document.querySelector('meta[name="twitter:card"]')?.content || '',
        title: document.title,
      }));
      const gated = ['/join', '/team', '/owner'].includes(p);
      ok(info.mains === 1, `${p}: exactly one main landmark`, info.mains);
      ok(gated ? /noindex/.test(info.robots) : !/noindex/.test(info.robots), `${p}: ${gated ? 'kept out of search' : 'open to search'}`, info.robots);
      if (!gated) ok(!!info.ogTitle && !!info.ogImage && info.tw === 'summary_large_image', `${p}: has a link preview (title, image, large card)`, JSON.stringify(info));
    }
    const titles = [];
    for (const p of ['/join', '/team', '/owner']) { const html = await (await fetch(BASE + p)).text(); titles.push((html.match(/<title>([^<]*)<\/title>/) || [])[1]); }
    ok(new Set(titles).size === 3 && titles.every((t) => !/^Lawgistics Marketing$/.test(t)), 'join, team and owner each have their own title', JSON.stringify(titles));
    const robots = await (await fetch(BASE + '/robots.txt')).text();
    ok(/Disallow: \/team/.test(robots) && /Disallow: \/owner/.test(robots) && /Sitemap:/.test(robots), 'robots.txt hides team, owner, join and the API, and points at the sitemap', robots.slice(0, 160));
    const sm = await (await fetch(BASE + '/sitemap.xml')).text();
    ok(/\/firms</.test(sm) && !/\/team</.test(sm), 'sitemap lists the public pages only');
    const og = await fetch(BASE + '/opengraph-image');
    ok(og.status === 200 && /image\/png/.test(og.headers.get('content-type') || ''), 'the preview image renders', og.status);
    const nf = await ctx.newPage(); const r = await go(nf, '/no-such-page');
    ok(r.status() === 404 && /That page does not exist/.test(await nf.innerText('body')), 'a missing page shows a plain branded 404, not the framework default');
    await ctx.close();
  }

  console.log('\n== the studio on a phone (360px)');
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  const dialogs = []; let dialogAnswer = false;
  page.on('dialog', async (d) => { dialogs.push(d.message()); dialogAnswer ? await d.accept() : await d.dismiss(); });
  await go(page, '/'); await page.waitForSelector('.step.active', { timeout: 15000 });
  const active = () => page.evaluate(() => document.querySelector('.step.active')?.dataset.step);
  ok((await active()) === 'you', 'a first visit starts on "who are you"');

  // the name is required
  await page.evaluate(() => document.querySelector('.step.active [data-go]:not([data-go="you"])')?.click());
  await page.waitForTimeout(400);
  const toast = await page.evaluate(() => ({ t: document.getElementById('toast').textContent, role: document.getElementById('toast').getAttribute('role') }));
  ok((await active()) === 'you' && /name/i.test(toast.t), 'Next is blocked without a name, and says why', JSON.stringify(toast));
  ok(toast.role === 'status', 'the message is announced to screen readers (role=status)');
  await page.fill('#brandName', 'Jane Citizen');
  for (let i = 0; i < 6 && (await active()) !== 'ask'; i++) {
    await page.evaluate(() => { const b = [...document.querySelectorAll('.step.active [data-go]')]; b[b.length - 1]?.click(); });
    await page.waitForTimeout(300);
  }
  ok((await active()) === 'ask', 'with a name, the setup steps go through to the topic screen', await active());
  const lede = await page.innerText('.step.active .stephead p');
  ok(/overseas/.test(lede) && /client/i.test(lede), 'the topic screen says where the text goes and to leave out client details', lede);

  // the demo is fictional
  await page.click('#btnSeeExample'); await page.waitForTimeout(600);
  const ex = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('lgm_state_v1')).slides) + JSON.parse(localStorage.getItem('lgm_state_v1')).caption);
  ok(!/Brauer|Coburn|Strandline|FCA|Jackson|Daily Court/.test(ex) && /first meeting/i.test(ex), 'the example post names no real case, court or person');
  ok(!/—/.test(ex), 'and has no em dashes');
  dialogAnswer = true;
  await page.evaluate(() => document.querySelector('#btnNewPost')?.click()); await page.waitForTimeout(600);
  dialogAnswer = false;

  // draft, history, focus
  await page.fill('#askInput', 'Why limitation periods matter');
  await page.click('#btnAsk');
  await page.waitForFunction(() => document.querySelector('.step.active')?.dataset.step === 'review', null, { timeout: 30000 });
  ok(true, 'a draft is written and the review step opens');
  const focus = await page.evaluate(() => document.activeElement?.tagName);
  ok(focus === 'H2', 'focus moves to the new step\'s heading, so a keyboard user is not stranded', focus);
  const hist = await page.evaluate(() => history.length);
  ok(hist >= 3, 'each step is a history entry', hist);
  await page.goBack(); await page.waitForTimeout(500);
  ok(page.url().startsWith(BASE) && (await active()) === 'ask', 'the back button goes to the previous step instead of leaving the app', page.url() + ' ' + await active());
  await page.goForward(); await page.waitForTimeout(500);
  ok((await active()) === 'review', 'and forward comes back to the draft');

  // labels and pressed states in the editor
  await page.click('#btnChange');
  await page.evaluate(() => { document.getElementById('editDrawer').open = true; });
  await page.waitForTimeout(500);
  const names = await page.evaluate(() => [...document.querySelectorAll('#editorPanel input:not([type=hidden]), #editorPanel textarea, #editorPanel select, #captionText')].map((el) => ({ id: el.id, name: (el.labels && el.labels.length ? el.labels[0].textContent : '') || el.getAttribute('aria-label') || '' })));
  ok(names.length >= 6 && names.every((n) => n.name.trim().length > 0), `every field in the editor has an accessible name (${names.length} checked)`, JSON.stringify(names.filter((n) => !n.name.trim())));
  const pressed = await page.evaluate(() => { const b = [...document.querySelectorAll('.segmented button, #styles button')].filter((x) => !x.hasAttribute('data-go')); return { n: b.length, withAttr: b.filter((x) => x.hasAttribute('aria-pressed')).length, on: b.filter((x) => x.getAttribute('aria-pressed') === 'true').length }; });
  ok(pressed.n > 5 && pressed.n === pressed.withAttr && pressed.on > 0, 'toggle buttons say which one is on (aria-pressed)', JSON.stringify(pressed));
  const groups = await page.evaluate(() => [...document.querySelectorAll('#editorPanel .segmented')].every((g) => g.getAttribute('role') === 'group' && g.getAttribute('aria-labelledby')));
  ok(groups, 'groups of buttons are named by the label above them');
  const strip = await page.evaluate(() => document.querySelector('#strip .stripitem')?.getAttribute('aria-label'));
  ok(/^Slide 1: .{3,}/.test(strip || ''), 'slide thumbnails are named by what is on them', strip);

  // the phone layout
  const lay = await page.evaluate(() => {
    const sc = document.documentElement.scrollWidth, vw = window.innerWidth;
    const seg = document.querySelector('#editorPanel .motifpick');
    const btns = [...seg.querySelectorAll('button')].map((b) => b.getBoundingClientRect());
    return { sc, vw, segClipped: seg.scrollHeight > seg.clientHeight + 1 || seg.scrollWidth > seg.clientWidth + 1, offscreen: btns.filter((r) => r.right > vw + 1 || r.left < -1).length, count: btns.length };
  });
  ok(lay.sc <= lay.vw + 1, 'no sideways scrolling on a 360px screen', JSON.stringify(lay));
  ok(!lay.segClipped && lay.offscreen === 0, `all ${lay.count} "drawn shape" choices are reachable (they wrap instead of being cut off)`, JSON.stringify(lay));
  await page.screenshot({ path: shot + '-phone-editor.png' });

  // HTML injection through a stored slide value
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('lgm_state_v1'));
    s.slides[0].size = 'md" onanimationstart="window.__pwned=1" style="animation-name:stepin;animation-duration:1s';
    s.slides[0].statement = 'Hello *world*';
    localStorage.setItem('lgm_state_v1', JSON.stringify(s));
  });
  await page.reload(); await page.waitForSelector('.step.active', { timeout: 15000 }); await page.waitForTimeout(2000);
  const inj = await page.evaluate(() => { const el = document.querySelector('.slide-canvas .statement'); return { attrs: el ? [...el.attributes].map((a) => a.name) : null, cls: el?.className, pwned: window.__pwned }; });
  ok(inj.attrs && inj.attrs.length === 1 && inj.attrs[0] === 'class' && /^statement (md|lg)$/.test(inj.cls) && inj.pwned === undefined, 'a hostile "size" value cannot add attributes or run script when a slide is drawn', JSON.stringify(inj));

  // starting again asks first
  await page.evaluate(() => { document.querySelector('[data-go="review"]'); });
  dialogs.length = 0; dialogAnswer = false;
  await page.evaluate(() => document.getElementById('btnNewPost').click()); await page.waitForTimeout(500);
  const stillThere = await page.evaluate(() => JSON.parse(localStorage.getItem('lgm_state_v1')).slides.length >= 1 && JSON.parse(localStorage.getItem('lgm_state_v1')).drafted);
  ok(dialogs.length === 1 && /new post/i.test(dialogs[0]) && stillThere, 'New post asks before throwing the draft away, and keeps it if you say no', JSON.stringify(dialogs));
  dialogAnswer = true;
  await page.evaluate(() => document.getElementById('btnNewPost').click()); await page.waitForTimeout(600);
  ok((await active()) === 'ask', 'and starts fresh if you say yes');
  ok(errs.length === 0, 'no JavaScript errors', errs.join(' | '));
  await ctx.close();

  console.log('\n== the sales page');
  {
    const c2 = await browser.newContext({ viewport: { width: 1100, height: 900 } }); const p2 = await c2.newPage(); const e2 = []; p2.on('pageerror', (e) => e2.push(e.message));
    await go(p2, '/firms'); await p2.waitForTimeout(800);
    const first = await p2.evaluate(() => document.querySelector('.decklabel')?.textContent);
    ok(await p2.isVisible('.deckpause'), 'the moving slide deck has a Pause control');
    await p2.click('.deckpause'); await p2.waitForTimeout(4200);
    const after = await p2.evaluate(() => document.querySelector('.decklabel')?.textContent);
    ok(first === after, 'paused, it stays on the same slide', first + ' -> ' + after);
    const txt = await p2.innerText('body');
    ok(!/These are not mockups|about three minutes|A person reads and approves every one|We keep no copy|Time runs from the decision/.test(txt), 'the overstated and wrong sentences are gone');
    ok(await p2.evaluate(() => { const s = document.querySelector('.shelf'); return s && s.tabIndex === 0 && !!s.getAttribute('aria-label'); }), 'the sideways slide shelf can be reached by keyboard');
    ok(e2.length === 0, 'no JavaScript errors', e2.join(' | '));
    await c2.close();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('CRASH', e.message.split('\n')[0]); process.exit(2); });
