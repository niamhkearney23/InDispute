const { chromium } = require('playwright');
const BASE = 'http://localhost:3010', OWNER = 'owner-key-that-is-long-enough-123456';
let pass = 0, fail = 0;
const ok = (c, l, x = '') => { c ? pass++ : fail++; console.log((c ? '  PASS ' : '  FAIL ') + l + (c ? '' : '   <- ' + x)); };
async function api(method, path, body, cookie) {
  const res = await fetch(BASE + path, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}), 'x-owner-key': OWNER }, body: body === undefined ? undefined : JSON.stringify(body) });
  const ck = (res.headers.getSetCookie?.() || []).map(s => s.match(/^lgm_session=([^;]*)/)).filter(Boolean).map(m => m[1])[0];
  let data = null; try { data = await res.json(); } catch {}
  return { status: res.status, data, cookie: ck };
}
(async () => {
  const f = await api('POST', '/api/owner/firms', { firmName: 'Photo Firm', adminName: 'Ada Admin' });
  const admin = await api('POST', '/api/firm/join', { code: f.data.inviteCode });
  const adminCk = 'lgm_session=' + admin.cookie;
  const m = await api('POST', '/api/firm/members', { name: 'Lena Lawyer', role: 'lawyer' }, adminCk);
  const lena = await api('POST', '/api/firm/join', { code: m.data.inviteCode });
  const lenaCk = 'lgm_session=' + lena.cookie;

  const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addCookies([{ name: 'lgm_session', value: lena.cookie, url: BASE }]);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  let pollGets = 0, pollCount = false; const seen = []; page.on('request', r => { if (pollCount) seen.push(r.method() + ' ' + r.url().replace(BASE, ''));  if (pollCount && r.method() === 'GET' && /\/api\/firm\/posts\/[0-9a-f-]{36}$/.test(r.url())) pollGets++; });
  const T0 = Date.now(); page.on('framenavigated', f => { if (f === page.mainFrame()) console.log('  [nav +' + ((Date.now() - T0) / 1000).toFixed(0) + 's] ' + f.url()); }); page.on('crash', () => console.log('  [PAGE CRASHED]')); page.on('console', m => { if (m.type() === 'error') console.log('  [console.error] ' + m.text().slice(0, 150)); });
  const mark = (l) => console.log('  [+' + ((Date.now() - T0) / 1000).toFixed(0) + 's] ' + l);
  await page.addInitScript(() => {
    const orig = window.setInterval; window.__ticks = []; 
    window.setInterval = function (fn, ms, ...rest) {
      if (ms === 15000) { const wrapped = async function () { window.__ticks.push('start@' + Date.now()); try { const r = await fn(); window.__ticks.push('ok'); return r; } catch (e) { window.__ticks.push('threw:' + e.message); } }; return orig.call(window, wrapped, ms, ...rest); }
      return orig.call(window, fn, ms, ...rest);
    };
  });
  await page.goto(BASE + '/'); await page.waitForTimeout(1200);

  const zlib = require('zlib'), crypto = require('crypto');
  const crcT = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const png = (W, H) => { const raw = Buffer.alloc((W * 3 + 1) * H); crypto.randomFillSync(raw); for (let y = 0; y < H; y++) raw[y * (W * 3 + 1)] = 0;
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 0 })), chunk('IEND', Buffer.alloc(0))]); };
  const buf = png(1200, 1500);
  console.log('  (test photo: 1200x1500 noise, ' + (buf.length / 1e6).toFixed(1) + ' MB as a file)');

  await page.fill('#askInput', 'Why limitation periods matter to a junior lawyer');
  await page.click('#btnAsk');
  await page.waitForSelector('#btnLooksGood', { state: 'visible', timeout: 30000 });
  ok(true, 'drafted a post as a lawyer in a firm');
  await page.evaluate(() => { const d = document.getElementById('editDrawer'); if (d) d.open = true; });
  await page.waitForSelector('[data-photo-upload]', { state: 'attached', timeout: 10000 });
  // five photos on five slides: the realistic way a post ends up too heavy
  await page.click('#btnChange');
  await page.evaluate(() => { document.getElementById('editDrawer').open = true; });
  while ((await page.$$('#strip .stripitem')).length < 5) { await page.click('#btnAddSlide'); await page.waitForTimeout(300); }
  for (let i = 0; i < 5; i++) {
    await page.evaluate((n) => { const items = document.querySelectorAll('#strip .stripitem'); if (items[n]) items[n].click(); }, i);
    await page.waitForTimeout(500);
    await page.evaluate(() => { const d = document.getElementById('editDrawer'); if (d) d.open = true; });
    await page.waitForSelector('[data-photo-upload]', { state: 'attached', timeout: 10000 });
    await page.setInputFiles('[data-photo-upload]', { name: 'big' + i + '.png', mimeType: 'image/png', buffer: buf });
    await page.waitForFunction((n) => { const s = JSON.parse(localStorage.getItem('lgm_state_v1') || '{}'); return (s.slides || [])[n] && s.slides[n].photo; }, i, { timeout: 30000 }).catch(() => {});
  }
  const stored = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('lgm_state_v1') || '{}'); return (s.slides || []).map(x => x.photo ? x.photo.length : 0); });
  const photoLen = stored.reduce((a, b) => a + b, 0);
  console.log('  (photos kept on this device: ' + stored.filter(Boolean).length + ' of them, ' + (photoLen / 1e6).toFixed(2) + ' million characters together)');
  ok(stored.filter(Boolean).length >= 4, 'several photos are on the post', JSON.stringify(stored));
  ok(photoLen > 3_500_000, 'together they are OVER the 3.5 MB post limit, so this really is the failing case', photoLen);

  mark('photos done, submitting');
  await page.click('#btnLooksGood');
  await page.waitForFunction(() => /Sent for/i.test(document.querySelector('#approvalBox')?.innerText || '') || /Waiting for your reviewer/i.test(document.body.innerText), null, { timeout: 40000 }).catch(() => {});
  const txt = await page.innerText('body');
  ok(/Waiting for your reviewer/.test(txt) && !/too big|too large|could not|Photo is/i.test(txt.slice(0, 400)), 'the big photo SUBMITS, and the lawyer is told it is with the reviewer', txt.slice(0, 200).replace(/\n/g, ' '));
  const posts = await api('GET', '/api/firm/posts?scope=firm', undefined, adminCk);
  const post = (posts.data.posts || [])[0];
  ok(!!post && post.status === 'submitted', 'the server holds it as submitted', JSON.stringify(posts.data).slice(0, 150));
  const full = await api('GET', `/api/firm/posts/${post.id}`, undefined, adminCk);
  const serverLens = (full.data.post.slides || []).map(s => s.photo ? s.photo.length : 0);
  const sMax = serverLens.reduce((a, b) => a + b, 0);
  ok(sMax > 0 && sMax < photoLen && sMax < 3_300_000, `the server copy is a lighter version, under the limit (${(sMax / 1e6).toFixed(2)} million vs ${(photoLen / 1e6).toFixed(2)} on the device)`, sMax);
  ok((full.data.post.slides || []).some(s => s.photoId), 'and it carries the same photo id the device has');

  // admin approves; the lawyer's page picks it up by itself and unlocks saving
  console.log('  (timer ticks in 2s: ' + await page.evaluate(() => new Promise(r => { let n = 0; const t = setInterval(() => n++, 100); setTimeout(() => { clearInterval(t); r(n + ' vs visibility=' + document.visibilityState); }, 2000); })) + ')');
  mark('approving'); pollCount = true;
  const ap = await api('POST', `/api/firm/posts/${post.id}/review`, { decision: 'approve', rev: post.rev }, adminCk);
  ok(ap.status === 200, 'the admin approves it', ap.status);
  for (let k = 0; k < 12; k++) {
    const info = await page.evaluate(() => ({ n: (window.__pollLog || []).length, last: (window.__pollLog || []).slice(-1)[0], box: document.querySelector('#approvalBox')?.innerText?.slice(0, 30), now: Date.now() }));
    mark('wait ' + k + ' pollLog=' + info.n + ' last=' + JSON.stringify(info.last && { s: info.last.step, id: !!info.last.id, st: info.last.status, ageS: ((info.now - info.last.t) / 1000).toFixed(0) }) + ' box=' + JSON.stringify(info.box));
    if (/Approved/.test(info.box || '')) break;
    await page.waitForTimeout(5000);
  }

  pollCount = false; console.log('  (poll ticks: ' + JSON.stringify(await page.evaluate(() => [window.__inits, window.__pollLog, location.href])) + ')'); console.log('  (all requests in the window: ' + JSON.stringify(seen) + ')'); console.log('  (the page asked the server about its post ' + pollGets + ' time(s) while waiting)');
  const box = await page.innerText('#approvalBox');
  const exportVisible = await page.isVisible('#exportArea');
  ok(/Approved/.test(box) && exportVisible, 'the approval arrives on the lawyer\'s screen and saving unlocks', box);

  if (process.env.STOP_AFTER_POLL) { await browser.close(); console.log(`\n${pass} passed, ${fail} failed`); process.exit(0); }
  // THE POINT: open it again the way a lawyer does (My posts), and the lighter server copy must not look like an edit
  await page.goto(BASE + '/?post=' + post.id);
  await page.waitForFunction(() => document.body.classList.contains('firmmode') && /Approved/.test(document.querySelector('#approvalBox')?.innerText || ''), null, { timeout: 20000 }).catch(() => {});
  const reopened = await page.evaluate(() => ({ box: document.querySelector('#approvalBox')?.innerText || '', exp: !document.getElementById('exportArea').hidden }));
  ok(/Approved/.test(reopened.box) && reopened.exp, 'reopened from My posts it is STILL approved (the lighter server copy did not disturb the fingerprint)', JSON.stringify(reopened));
  const slidesBack = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('lgm_state_v1')).slides.map(x => x.photo ? x.photo.length : 0); } catch (e) { return null; } });
  console.log('  (photos on screen after reopening: ' + JSON.stringify(slidesBack) + ')');

  // Unchanged: going back and pressing the button again must NOT send it for approval a second time
  const peek = async () => (await api('GET', `/api/firm/posts/${post.id}`, undefined, adminCk)).data.post;
  const before = await peek();
  await page.evaluate(() => document.querySelector('.step.active [data-go="review"]')?.click());
  await page.waitForTimeout(500);
  await page.click('#btnLooksGood'); await page.waitForTimeout(2500);
  const same = await peek();
  ok(same.status === 'approved' && same.rev === before.rev, 'pressing the button on an unchanged post does not touch the approval (still approved, same revision)', JSON.stringify({ s: same.status, r: same.rev }));

  // Replaced photo: that is a real change, so the old approval no longer applies
  await page.evaluate(() => document.querySelector('.step.active [data-go="review"]')?.click());
  await page.waitForTimeout(500);
  await page.evaluate(() => { document.getElementById('changePanel').hidden = false; document.getElementById('editDrawer').open = true; });
  await page.evaluate(() => document.querySelectorAll('#strip .stripitem')[0].click());
  await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector('[data-act="removePhoto"]')?.click());
  await page.waitForSelector('[data-photo-upload]', { state: 'attached', timeout: 10000 });
  await page.setInputFiles('[data-photo-upload]', { name: 'replacement.png', mimeType: 'image/png', buffer: png(300, 300) });
  await page.waitForTimeout(1500);
  await page.click('#btnLooksGood'); await page.waitForTimeout(3000);
  const changed = await peek();
  ok(changed.status === 'submitted' && changed.rev === before.rev + 1, 'a REPLACED photo sends it back for approval (new revision, no longer approved)', JSON.stringify({ s: changed.status, r: changed.rev, was: before.rev }));
  const lockedBox = await page.innerText('#approvalBox');
  const lockedExp = await page.isVisible('#exportArea');
  ok(!lockedExp && /Waiting for your reviewer/.test(lockedBox), 'and the lawyer cannot save it until it is approved again', lockedBox);
  await page.screenshot({ path: process.argv[2] || 'photo.png' });
  ok(errs.length === 0, 'no JavaScript errors in the page', errs.join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
