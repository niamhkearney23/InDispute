const BASE = 'http://localhost:3010';
let pass = 0, fail = 0;
const ok = (c, l, x = '') => { c ? pass++ : fail++; console.log((c ? '  PASS ' : '  FAIL ') + l + (c ? '' : '   <- ' + x)); };
const call = async (method, path, body, headers = {}) => {
  const res = await fetch(BASE + path, { method, headers: { 'content-type': 'application/json', ...headers }, body: body && JSON.stringify(body) });
  let data = null; try { data = await res.json(); } catch {}
  return { status: res.status, data, res };
};
const mode = process.argv[2];

if (mode === 'off') {
  console.log('\n== firm layer OFF (no DATABASE_URL), nothing else changed');
  let r = await call('GET', '/api/firm/me');
  ok(r.status === 200 && r.data.configured === false && /DATABASE_URL/.test(r.data.reason), 'me says the layer is off, and why', JSON.stringify(r.data));
  r = await call('POST', '/api/firm/join', { code: 'AAAA-BBBB-CCCC-DDDD-EEEE' });
  ok(r.status === 503, 'join is unavailable, not an error page', r.status);
  r = await call('POST', '/api/owner/firms', { firmName: 'x', adminName: 'y' }, { 'x-owner-key': 'owner-key-that-is-long-enough-123456' });
  ok(r.status === 503, 'creating a firm is unavailable', r.status);
  r = await call('GET', '/api/firm/posts');
  ok(r.status === 503, 'posts are unavailable', r.status);
  r = await call('POST', '/api/draft', { topic: 'a solo topic', brand: { kind: 'person', name: 'Solo' } });
  ok(r.status === 200 && r.data.draft, 'the SOLO studio still drafts exactly as before', JSON.stringify(r.data));
  r = await call('GET', '/api/setup');
  ok(r.data.firm?.configured === false, 'setup reports the firm layer as off', JSON.stringify(r.data.firm));
  ok(!JSON.stringify(r.data).includes('session-secret'), 'setup never leaks a secret');
}

if (mode === 'gate') {
  console.log('\n== access codes AND accounts together');
  const OWNER = 'owner-key-that-is-long-enough-123456';
  let r = await call('POST', '/api/draft', { topic: 't', brand: { kind: 'person' } });
  ok(r.status === 401 && r.data.needsCode, 'a stranger with no code and no account is refused', r.status);
  r = await call('POST', '/api/draft', { topic: 't', brand: { kind: 'person' } }, { 'x-access-code': 'solo-code-1' });
  ok(r.status === 200, 'a solo user with a code gets in', r.status);
  r = await call('POST', '/api/firm/join', { code: 'AAAA-BBBB-CCCC-DDDD-EEEE' });
  ok(r.status === 401, 'the join door itself stays reachable without a code (it has its own lock)', r.status);
  r = await call('POST', '/api/owner/firms', { firmName: 'Gate Firm', adminName: 'Gail' }, { 'x-owner-key': OWNER });
  const j = await call('POST', '/api/firm/join', { code: r.data.inviteCode });
  const cookie = (j.res.headers.getSetCookie()[0] || '').split(';')[0];
  ok(j.status === 200 && cookie, 'a firm admin joins');
  r = await call('POST', '/api/draft', { topic: 't', brand: { kind: 'person' } }, { cookie });
  ok(r.status === 200, 'a signed in firm member drafts with NO access code (their account is their key)', JSON.stringify(r.data));
  r = await call('POST', '/api/draft', { topic: 't', brand: { kind: 'person' } }, { cookie: 'lgm_session=v1.forged.forged' });
  ok(r.status === 401, 'a forged session cookie is not a key', r.status);
  r = await call('GET', '/api/setup');
  ok(r.data.accessRequired === true && r.data.firm?.configured === true, 'setup reports both the gate and the firm layer');
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
