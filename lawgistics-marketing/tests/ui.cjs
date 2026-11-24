const { chromium } = require('playwright');
const BASE = 'http://localhost:3010', OWNER = 'owner-key-that-is-long-enough-123456';
let pass = 0, fail = 0;
const ok = (c, l, x = '') => { c ? pass++ : fail++; console.log((c ? '  PASS ' : '  FAIL ') + l + (c ? '' : '   <- ' + x)); };
const post = async (p, b, ck) => { const r = await fetch(BASE + p, { method: 'POST', headers: { 'content-type': 'application/json', 'x-owner-key': OWNER, ...(ck ? { cookie: ck } : {}) }, body: JSON.stringify(b) }); return { d: await r.json(), ck: (r.headers.getSetCookie() || []).map(s => s.match(/^lgm_session=([^;]*)/)).filter(Boolean).map(m => m[1])[0] }; };
const mailLog = async () => (await fetch('http://127.0.0.1:5598/__log')).json();
(async () => {
  const shot = process.argv[2];
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
  // 1. the gate, as a stranger
  let ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  let page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(BASE + '/'); await page.waitForTimeout(2000);
  const gate = await page.evaluate(() => { const a = document.querySelector('#gateAsk a'); return { text: document.getElementById('gateAsk')?.innerText, href: a?.href, target: a?.target, rel: a?.rel, visible: !!document.querySelector('.gate:not([hidden]), #gate:not([hidden])') }; });
  ok(gate.href === 'https://cal.example.com/book?x=1' && gate.target === '_blank' && /noopener/.test(gate.rel), 'the access gate\'s "Ask for one" goes to the real booking link, in a new tab, safely', JSON.stringify(gate));
  await page.screenshot({ path: shot + '-gate.png' });
  await ctx.close();

  // 2. an admin adds people on the People tab
  const f = await post('/api/owner/firms', { firmName: 'UI Firm', adminName: 'Ada Admin' });
  const a = await post('/api/firm/join', { code: f.d.inviteCode });
  ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  await ctx.addCookies([{ name: 'lgm_session', value: a.ck, url: BASE }]);
  page = await ctx.newPage(); page.on('pageerror', e => errs.push(e.message));
  await page.goto(BASE + '/team'); await page.waitForTimeout(1500);
  await page.click('button:has-text("People")');
  await page.waitForSelector('#newName');
  const hint = await page.innerText('label[for="newEmail"]');
  ok(/the invite is sent to it/.test(hint), 'with email on, the field says the invite is sent to it', hint);
  await fetch('http://127.0.0.1:5598/__reset', { method: 'POST' }); await fetch('http://127.0.0.1:5598/__mode', { method: 'POST', body: 'ok' });
  await page.fill('#newName', 'Lena Lawyer'); await page.fill('#newEmail', 'lena@uifirm.example');
  await page.click('button:has-text("Create invite")');
  await page.waitForSelector('.tm-invite', { timeout: 10000 });
  const card = await page.innerText('.tm-invite');
  ok(/Emailed to lena@uifirm\.example/.test(card) && !(await page.$('.tm-warn')), 'the invite card says it was emailed, with the address and no warning', card.slice(0, 160));
  const m = await mailLog();
  ok(m.length === 1 && JSON.parse(m[0].body).to[0] === 'lena@uifirm.example', 'exactly one email went out, to that address', m.length);
  const code = await page.inputValue('.tm-code');
  ok(JSON.parse(m[0].body).text.includes(code), 'and it carries the same code the screen shows');
  const list = await page.innerText('.tm-list');
  ok(/lena@uifirm\.example/.test(list) && /Has not joined yet/.test(list), 'the people list shows the address and that they have not joined');
  await page.screenshot({ path: shot + '-people-ok.png', fullPage: true });

  // 3. the email service fails: the invite must still be there, with a warning
  await fetch('http://127.0.0.1:5598/__mode', { method: 'POST', body: 'fail500' });
  await page.fill('#newName', 'Ben Lawyer'); await page.fill('#newEmail', 'ben@uifirm.example');
  await page.click('button:has-text("Create invite")');
  await page.waitForFunction(() => /Ben Lawyer/.test(document.querySelector('.tm-invite')?.innerText || ''), null, { timeout: 10000 }).catch(() => {});
  const card2 = await page.innerText('.tm-invite');
  const warn = await page.$('.tm-warn');
  ok(!!warn && /Could not email it/.test(await warn.innerText()) && (await page.inputValue('.tm-code')).length > 10, 'when the email fails the card shows a warning AND the code to send by hand', card2.slice(0, 200));
  await page.screenshot({ path: shot + '-people-fail.png', fullPage: true });

  // 4. a bad address is refused on screen, not silently dropped
  await page.fill('#newName', 'Bad Address'); await page.fill('#newEmail', 'nonsense');
  await page.click('button:has-text("Create invite")');
  await page.waitForTimeout(1200);
  const bad = await page.innerText('.askstatus.bad').catch(() => '');
  ok(/email/i.test(bad), 'an invalid address shows an error beside the form', bad);
  ok(errs.length === 0, 'no JavaScript errors', errs.join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error('CRASH', e.message.split('\n')[0]); process.exit(2); });
