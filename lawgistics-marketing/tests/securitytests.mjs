// Regression tests for the problems found in the security audit. Each one failed before it was fixed.
const BASE = 'http://localhost:3010', OWNER = 'owner-key-that-is-long-enough-123456';
let pass = 0, fail = 0;
const ok = (c, l, x = '') => { c ? pass++ : fail++; console.log((c ? '  PASS ' : '  FAIL ') + l + (c ? '' : '   <- ' + x)); };
class Actor {
  constructor() { this.cookie = ''; }
  async call(method, path, body, headers = {}) {
    const res = await fetch(BASE + path, { method, headers: { 'content-type': 'application/json', ...(this.cookie ? { cookie: this.cookie } : {}), ...headers }, body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) });
    for (const sc of res.headers.getSetCookie?.() || []) { const m = sc.match(/^lgm_session=([^;]*)/); if (m) this.cookie = m[1] ? `lgm_session=${m[1]}` : ''; }
    let data = null, text = ''; try { text = await res.text(); data = JSON.parse(text); } catch {}
    return { status: res.status, data, text, headers: res.headers };
  }
}
const owner = (method, path, body, extra = {}) => new Actor().call(method, path, body, { 'x-owner-key': OWNER, ...extra });
const fake = (port, path, body) => fetch(`http://127.0.0.1:${port}${path}`, { method: 'POST', body: body || '' });
const log = async (port) => (await fetch(`http://127.0.0.1:${port}/__log`)).json();
async function firm(name) {
  const f = await owner('POST', '/api/owner/firms', { firmName: name, adminName: 'Ada Admin' });
  const admin = new Actor(); await admin.call('POST', '/api/firm/join', { code: f.data.inviteCode });
  const add = async (n) => { const m = await admin.call('POST', '/api/firm/members', { name: n, role: 'lawyer' }); const a = new Actor(); await a.call('POST', '/api/firm/join', { code: m.data.inviteCode }); return { a, id: m.data.member.id }; };
  return { admin, add };
}
const T = (n) => ({ topic: 'a topic ' + n, brand: { kind: 'person', name: 'T' } });
const REV = { topic: 'make it bolder', brand: { kind: 'person', name: 'T' }, current: { slides: [{ statement: 'A real statement', body: 'Some body copy' }] } };

console.log('\n== stored XSS: the values that reach a class attribute are closed lists');
{
  const { admin, add } = await firm('XSS Firm');
  const { a } = await add('Lena Lawyer');
  const evil = { statement: 'x', size: '" onanimationstart=window.__pwned=1 x="', ground: '<b>', layout: 'a b', motif: '"><script>', anchor: 'sideways', align: 'evil', photoMode: 'x', photoKind: 'y' };
  let r = await a.call('POST', '/api/firm/posts', { topic: 't', slides: [evil, { statement: 'ok', size: 'lg', ground: 'dark', layout: 'statement', anchor: 'top', align: 'centre' }], caption: 'c' });
  ok(r.status === 201, 'the post is accepted (the bad values are cleaned, not a reason to refuse it)', r.status);
  const got = await a.call('GET', `/api/firm/posts/${r.data.post.id}`);
  const [s0, s1] = got.data.post.slides;
  ok(s0.size === '' && s0.ground === '' && s0.layout === '' && s0.motif === '' && s0.anchor === '' && s0.align === '' && s0.photoMode === '' && s0.photoKind === '', 'every hostile value is stored as empty', JSON.stringify(s0));
  ok(s1.size === 'lg' && s1.ground === 'dark' && s1.layout === 'statement' && s1.anchor === 'top' && s1.align === 'centre', 'and legitimate values are kept exactly', JSON.stringify(s1));
}

console.log('\n== the allowance cannot be skipped');
{
  const { admin, add } = await firm('Quota Firm');
  await admin.call('PUT', '/api/firm/brand', { brand: {}, requireApproval: false, monthlyQuota: 1 });
  const { a } = await add('Lena Lawyer');
  let r = await a.call('POST', '/api/draft', T(1));
  ok(r.status === 200, 'the first new post is allowed', r.status);
  r = await a.call('POST', '/api/draft', T(2));
  ok(r.status === 429 && r.data.quotaReached, 'the second new post is refused (quota 1)', r.status);
  r = await a.call('POST', '/api/draft', { ...T(3), current: { slides: [] } });
  ok(r.status === 429, 'an EMPTY "current" is a new post in disguise, and is refused too', r.status);
  r = await a.call('POST', '/api/draft', { ...T(4), current: { slides: [{}] } });
  ok(r.status === 429, 'so is a "current" whose slides hold no text', r.status);
  r = await a.call('POST', '/api/draft', REV);
  ok(r.status === 200, 'a genuine revision of real text is still allowed', r.status);
  let last = r;
  for (let i = 0; i < 19; i++) last = await a.call('POST', '/api/draft', REV);
  ok(last.status === 200, '20 revisions in a month are allowed', last.status);
  r = await a.call('POST', '/api/draft', REV);
  ok(r.status === 429 && /revisions/.test(r.data.error), 'the 21st is refused, and the message says revisions', JSON.stringify(r.data));
  r = await a.call('GET', '/api/firm/me');
  ok(r.data.usage.used === 1, 'revisions do not eat into the allowance of new posts (still 1 used)', r.data.usage.used);
}
{
  const { admin, add } = await firm('Refine Firm');
  await admin.call('PUT', '/api/firm/brand', { brand: {}, requireApproval: false, monthlyQuota: 1 });
  const { a } = await add('Lena Lawyer');
  const body = { field: 'statement', text: 'A plain sentence.', instruction: 'shorter' };
  let r, okCount = 0;
  for (let i = 0; i < 20; i++) { r = await a.call('POST', '/api/refine', body); if (r.status === 200) okCount++; }
  ok(okCount === 20, '20 rewrites in a month are allowed', okCount);
  r = await a.call('POST', '/api/refine', body);
  ok(r.status === 429, 'the 21st rewrite is refused (rewrites are paid calls too)', r.status);
  r = await new Actor().call('POST', '/api/refine', { ...body, text: 'x'.repeat(9000) });
  ok(r.status === 400, 'a 9000 character "text" is refused before any model is called', r.status);
}

console.log('\n== sessions end when they should');
{
  const { admin, add } = await firm('Session Firm');
  const { a: bob, id } = await add('Bob Lawyer');
  let r = await bob.call('GET', '/api/firm/me');
  ok(r.data.member && r.data.member.name === 'Bob Lawyer', 'Bob is signed in');
  const old = bob.cookie;
  r = await admin.call('PATCH', `/api/firm/members/${id}`, { reissueInvite: true });
  ok(r.status === 200 && r.data.inviteCode, 'the admin issues Bob a new invite (the lost phone path)');
  r = await new Actor().call('GET', '/api/firm/me', undefined, { cookie: old });
  ok(r.status === 200 && r.data.member === null, 'Bob\'s OLD session no longer works', JSON.stringify(r.data));
  const me = await admin.call('GET', '/api/firm/me');
  const adminId = me.data.member.id;
  r = await admin.call('PATCH', `/api/firm/members/${adminId}`, { reissueInvite: true });
  r = await admin.call('GET', '/api/firm/me');
  ok(r.data.member && r.data.member.id === adminId, 'but an admin issuing THEMSELVES an invite stays signed in on the device they are using', JSON.stringify(r.data));
}

console.log('\n== hostile input is an error, not a crash');
{
  let r = await new Actor().call('GET', '/api/firm/me', undefined, { cookie: 'lgm_session=%E0%A4%A' });
  ok(r.status === 200 && r.data.member === null, 'a malformed cookie is just "not signed in"', r.status);
  r = await new Actor().call('GET', '/api/firm/posts', undefined, { cookie: 'lgm_session=%E0%A4%A' });
  ok(r.status === 401, 'and a protected route answers 401, not 500', r.status);
  const { admin } = await firm('Rev Firm');
  r = await admin.call('POST', '/api/firm/posts/00000000-0000-4000-8000-000000000000/review', { decision: 'approve', rev: 1e300 });
  ok(r.status === 400, 'an absurd revision number is refused with 400', r.status);
  const deep = '{"topic":"t","brand":{"kind":"person"},"current":{"slides":[{"statement":"x","deep":' + '['.repeat(20000) + ']'.repeat(20000) + '}]}}';
  r = await new Actor().call('POST', '/api/draft', deep);
  ok(r.status >= 400 && r.status < 500, 'a 20,000 deep nested "current" is refused with a 4xx', r.status);
  r = await new Actor().call('GET', '/api/firm/me');
  ok(r.status === 200, 'and the server is still up afterwards');
}

console.log('\n== the invite link cannot be pointed somewhere else');
{
  await fake(5598, '/__reset'); await fake(5598, '/__mode', 'ok');
  const f = await owner('POST', '/api/owner/firms', { firmName: 'Host Firm', adminName: 'Ada', adminEmail: 'ada@host.example' }, { 'x-forwarded-host': 'login-lawgistics.evil.example' });
  const m = await log(5598);
  const text = m.length ? JSON.parse(m[0].body).text : '';
  ok(f.status === 201 && m.length === 1 && !/evil\.example/.test(text), 'a forged X-Forwarded-Host does not appear in the emailed link', text.slice(0, 200));
  ok(/^https:\/\/app\.example\.com\/join#/.test(f.data.joinUrl || '') && text.includes('https://app.example.com/join#'), 'both the link on screen and the one emailed use the platform address (run with VERCEL_ENV=production)', f.data.joinUrl);
}

console.log('\n== security headers');
{
  for (const path of ['/', '/team', '/owner', '/firms', '/api/setup']) {
    const r = await new Actor().call('GET', path);
    const h = r.headers;
    ok(h.get('x-frame-options') === 'DENY' && h.get('x-content-type-options') === 'nosniff' && /frame-ancestors 'none'/.test(h.get('content-security-policy') || '') && !h.get('x-powered-by') && !!h.get('referrer-policy'), `${path}: framing blocked, no sniffing, CSP, referrer policy, no X-Powered-By`, JSON.stringify([...h.entries()].filter(([k]) => /frame|content-type-o|security|powered|referrer/.test(k))));
  }
}

console.log('\n== provider errors');
{
  await fake(5597, '/__mode', 'leak');
  let r = await new Actor().call('POST', '/api/draft', T('leak'));
  ok(r.status === 502 && !/SECRET-PROMPT-TEXT|sk-live/.test(r.text), 'an upstream error that echoes the prompt and a key is NOT passed to the browser', r.text.slice(0, 200));
  ok(/AI service could not process/.test(r.data.error), 'the person gets our own plain sentence instead', r.data.error);
  r = await new Actor().call('POST', '/api/refine', { field: 'statement', text: 'A plain sentence.', instruction: 'shorter' });
  ok(r.status === 502 && !/SECRET-PROMPT-TEXT|sk-live/.test(r.text), 'same for rewrites', r.text.slice(0, 160));
  await fake(5597, '/__mode', 'verify'); await fake(5597, '/__reset');
  r = await new Actor().call('POST', '/api/image', { prompt: 'a quiet courtroom', mode: 'photo' });
  let imgs = (await log(5597)).filter((x) => x.url.startsWith('/v1/images')).map((x) => JSON.parse(x.body).model);
  ok(r.status === 200 && JSON.stringify(imgs) === '["gpt-image-1","dall-e-3"]', 'an organisation that is not yet verified for gpt-image-1 still gets its picture from dall-e-3', JSON.stringify({ s: r.status, imgs }));
  await fake(5597, '/__mode', 'fail'); await fake(5597, '/__reset');
  r = await new Actor().call('POST', '/api/image', { prompt: 'a quiet courtroom', mode: 'photo' });
  imgs = (await log(5597)).filter((x) => x.url.startsWith('/v1/images'));
  ok(r.status === 502 && imgs.length === 1, 'when the service itself fails there is ONE image call, not a second charge on another model', JSON.stringify({ s: r.status, calls: imgs.length }));
  await fake(5597, '/__mode', 'ok');
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
