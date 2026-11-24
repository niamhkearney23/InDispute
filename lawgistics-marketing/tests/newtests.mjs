const BASE = 'http://localhost:3010', OWNER = 'owner-key-that-is-long-enough-123456';
const mode = process.argv[2];
let pass = 0, fail = 0;
const ok = (c, l, x = '') => { c ? pass++ : fail++; console.log((c ? '  PASS ' : '  FAIL ') + l + (c ? '' : '   <- ' + x)); };
class Actor {
  constructor() { this.cookie = ''; }
  async call(method, path, body, headers = {}) {
    const res = await fetch(BASE + path, { method, headers: { 'content-type': 'application/json', ...(this.cookie ? { cookie: this.cookie } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
    for (const sc of res.headers.getSetCookie?.() || []) { const m = sc.match(/^lgm_session=([^;]*)/); if (m) this.cookie = m[1] ? `lgm_session=${m[1]}` : ''; }
    let data = null, text = ''; try { text = await res.text(); data = JSON.parse(text); } catch {}
    return { status: res.status, data, text };
  }
}
const own = (method, path, body) => new Actor().call(method, path, body, { 'x-owner-key': OWNER });
const fake = (port, path, body) => fetch(`http://127.0.0.1:${port}${path}`, { method: 'POST', body: body || '' });
const log = async (port) => (await fetch(`http://127.0.0.1:${port}/__log`)).json();
const mailLog = () => log(5598);
const newFirm = async (name, email) => {
  const r = await own('POST', '/api/owner/firms', { firmName: name, adminName: 'Adam Admin', adminEmail: email });
  const a = new Actor(); await a.call('POST', '/api/firm/join', { code: r.data.inviteCode });
  return { a, r };
};
const draft = (a) => a.call('POST', '/api/draft', { topic: 'a topic', brand: { kind: 'person', name: 'T' } });

if (mode === 'main') {
  console.log('\n== keys that work, and the model the account actually has');
  let r = await new Actor().call('GET', '/api/setup');
  ok(r.data.keyChecks.openai === 'ok' && r.data.keyChecks.anthropic === 'ok', 'setup tests both keys and both are accepted', JSON.stringify(r.data.keyChecks));
  ok(r.data.writingWith === 'openai', 'ChatGPT is the default writer', r.data.writingWith);
  ok(r.data.openaiModel === 'gpt-5', 'the newest full model on the account is chosen (not a mini)', r.data.openaiModel);
  ok(!JSON.stringify(r.data).includes('fake-openai') && !JSON.stringify(r.data).includes('fake-resend'), 'setup never contains a key');
  const { a: adm } = await newFirm('Probe Firm');
  r = await draft(adm);
  ok(r.status === 200 && r.data.provider === 'openai' && r.data.fellBack === false, 'a draft is written by ChatGPT, no fallback', JSON.stringify({ s: r.status, p: r.data.provider, f: r.data.fellBack }));
  ok(r.data.draft.slides[0].statement.includes('ChatGPT wrote'), 'and it really did go to the OpenAI endpoint');

  console.log('\n== invite emails');
  await fake(5598, '/__reset'); await fake(5598, '/__mode', 'ok');
  const f1 = await newFirm('Ridley & Hart', 'anna@ridley.example');
  let m = await mailLog();
  ok(r.status === 200 && m.length === 1, 'creating a firm with an admin email sends exactly one email', m.length);
  const sent = JSON.parse(m[0].body);
  ok(m[0].url === '/emails' && m[0].auth === 'Bearer fake-resend', 'to the email service, with the key as a bearer token');
  ok(JSON.stringify(sent.to) === '["anna@ridley.example"]' && sent.from === 'Lawgistics <invites@example.com>', 'to the one address, from the configured sender');
  ok(sent.subject.includes('Ridley & Hart'), 'with the firm in the subject');
  ok(f1.r.data.emailed === true && f1.r.data.emailedTo === 'anna@ridley.example', 'and the response says so');
  ok(sent.text.includes(`/join#${f1.r.data.inviteCode}`) && sent.text.includes(f1.r.data.inviteCode), 'the email carries the link and the code that the screen shows');
  ok(!/—/.test(sent.text + sent.html), 'no em dashes in the email');

  const adm1 = f1.a;
  await fake(5598, '/__reset');
  r = await adm1.call('POST', '/api/firm/members', { name: 'Lena Lawyer', role: 'lawyer' });
  ok(r.status === 201 && r.data.emailed === null && (await mailLog()).length === 0, 'adding someone with no email sends nothing and says so (emailed: null)');
  const bad = ['a@b', 'x@y.com\r\nBcc: z@z.com', 'two@a.com, b@c.com', '<x@y.com>', 'Name <x@y.com>', 'no-at-sign.com', 'x@y .com', 'a'.repeat(300) + '@x.com'];
  for (const e of bad) {
    r = await adm1.call('POST', '/api/firm/members', { name: 'Bad Email', email: e });
    ok(r.status === 400 && (await mailLog()).length === 0, `refused, and nothing sent: ${JSON.stringify(e).slice(0, 40)}`, r.status);
  }
  r = await adm1.call('POST', '/api/firm/members', { name: '<img src=x onerror=alert(1)> Evil', email: 'evil@x.example' });
  m = await mailLog(); const body2 = JSON.parse(m[0].body);
  ok(r.status === 201 && !body2.html.includes('<img') && body2.html.includes('&lt;img'), 'a name full of markup is escaped in the email, not injected');
  await fake(5598, '/__reset'); await fake(5598, '/__mode', 'fail500');
  r = await adm1.call('POST', '/api/firm/members', { name: 'Ben Lawyer', email: 'ben@x.example' });
  ok(r.status === 201 && r.data.inviteCode && r.data.emailed === false && /Could not email it/.test(r.data.emailNote), 'if the email service is down the invite is STILL created and shown, with a note');
  await fake(5598, '/__mode', 'reject');
  r = await adm1.call('POST', '/api/firm/members', { name: 'Cat Lawyer', email: 'cat@x.example' });
  ok(r.status === 201 && r.data.inviteCode && /refused the message/.test(r.data.emailNote), 'if it refuses the message (an unverified sender) the note says so');
  await fake(5598, '/__mode', 'ok'); await fake(5598, '/__reset');
  r = await adm1.call('GET', '/api/firm/members');
  const ben = r.data.members.find(x => x.name === 'Ben Lawyer'), lena = r.data.members.find(x => x.name === 'Lena Lawyer');
  ok(ben.email === 'ben@x.example', 'the people list shows an email');
  r = await adm1.call('PATCH', `/api/firm/members/${ben.id}`, { reissueInvite: true });
  m = await mailLog();
  ok(r.status === 200 && r.data.emailed === true && m.length === 1 && JSON.parse(m[0].body).text.includes(r.data.inviteCode), 'a re-issued invite is emailed to the person on file');
  r = await adm1.call('PATCH', `/api/firm/members/${lena.id}`, { reissueInvite: true });
  ok(r.status === 200 && r.data.emailed === undefined && (await mailLog()).length === 1, 'a re-issued invite for someone with no email is not emailed');
  r = await adm1.call('PATCH', `/api/firm/members/${lena.id}`, { email: 'not an email' });
  ok(r.status === 400, 'setting a bad email on a person is refused', r.status);
  r = await adm1.call('PATCH', `/api/firm/members/${ben.id}`, { email: '' });
  ok(r.status === 200 && r.data.member.email === null, 'an email can be cleared');
  r = await new Actor().call('PATCH', `/api/firm/members/${ben.id}`, { email: 'x@y.example' });
  ok(r.status === 401, 'and only a signed in admin can set one', r.status);

  console.log('\n== the invite email cap (30 a day per firm)');
  await fake(5598, '/__reset');
  const f2 = await newFirm('Cap Firm');
  let sentN = 0, last = null;
  for (let i = 0; i < 32; i++) {
    last = await f2.a.call('POST', '/api/firm/members', { name: `Person ${i}`, email: `p${i}@cap.example` });
    if (last.data.emailed) sentN++;
  }
  ok(sentN === 30 && (await mailLog()).length === 30, `exactly 30 are emailed, then it stops (sent ${sentN})`);
  ok(last.status === 201 && last.data.inviteCode && /limit/.test(last.data.emailNote), 'the 32nd person still gets an invite, with a note that the email limit is reached');

  console.log('\n== booking link');
  r = await new Actor().call('GET', '/api/setup');
  ok(r.data.bookingUrl === 'https://cal.example.com/book?x=1', 'setup reports the booking link');
  const page = (await new Actor().call('GET', '/firms')).text;
  ok(page.includes('href="https://cal.example.com/book?x=1"'), 'the sales page points at it');
  ok(/target="_blank"[^>]*rel="noopener noreferrer"|rel="noopener noreferrer"[^>]*target="_blank"/.test(page), 'in a new tab, safely (noopener noreferrer)');
  ok((page.match(/Book a/g) || []).length >= 3 && !page.includes('href="#book"'), 'with its buttons in place and no dead #book anchors left');
  r = await new Actor().call('GET', '/api/firm/me');
  ok(r.data.emailEnabled === undefined && r.status === 200, 'an anonymous visitor learns nothing about email from /api/firm/me');
  r = await adm1.call('GET', '/api/firm/me');
  ok(r.data.emailEnabled === true, 'an admin is told email is on');
}

if (mode === 'rejected') {
  console.log('\n== OpenAI rejects its key (the real situation found in this environment)');
  let r = await new Actor().call('GET', '/api/setup');
  ok(r.data.keyChecks.openai === 'rejected' && r.data.keyChecks.anthropic === 'ok', 'setup says OpenAI REJECTED the key and Anthropic is fine', JSON.stringify(r.data.keyChecks));
  ok(r.data.notes.some(n => /OpenAI REJECTED/.test(n) && /falling back to Claude/.test(n)), 'and tells the owner exactly what to do about it');
  ok(r.data.imagesAvailable === false, 'photos are reported as unavailable');
  const { a } = await newFirm('Fallback Firm');
  await fake(5599, '/__reset');
  r = await draft(a);
  ok(r.status === 200 && r.data.provider === 'anthropic' && r.data.fellBack === true, 'a draft FALLS BACK to Claude and says it did', JSON.stringify({ s: r.status, p: r.data.provider, f: r.data.fellBack }));
  ok(r.data.draft.slides[0].statement.includes('Claude wrote'), 'and Claude really wrote it');
  ok(!r.text.includes('ufYA') && !r.text.includes('sk-proj'), 'no fragment of the rejected key is in the response');

  r = await a.call('POST', '/api/image', { prompt: 'a quiet courtroom', mode: 'photo' });
  ok(r.status === 502 && !r.text.includes('ufYA') && !r.text.includes('sk-') && /rejected its access key/.test(r.data.error), 'a rejected key on the image route gives a plain message with no key fragment', r.text.slice(0, 120));
  const imgLog = (await log(5597)).filter(x => x.url.startsWith('/v1/images'));
  ok(imgLog.length === 1, 'and it did not retry with a second image model (one call, not two)', imgLog.length);

  const usedBefore = (await a.call('GET', '/api/firm/me')).data.usage.used;
  await fake(5599, '/__mode', 'reject');
  r = await draft(a);
  ok(r.status === 502 && !r.text.includes('ufYA') && !r.text.includes('sk-') && /rejected its access key/.test(r.data.error), 'with BOTH keys rejected it fails plainly, leaking nothing', r.text.slice(0, 160));
  r = await a.call('GET', '/api/firm/me');
  ok(usedBefore === 1 && r.data.usage.used === usedBefore, 'and a failed draft costs the lawyer none of their allowance (1 used by the successful fallback draft, still 1)', `${usedBefore} -> ${r.data.usage.used}`);

  await fake(5599, '/__mode', 'ok'); await fake(5597, '/__mode', 'fail'); await fake(5599, '/__reset');
  r = await draft(a);
  ok(r.status === 502, 'an OpenAI outage (not a rejected key) is an error, not a quiet switch of provider', r.status);
  ok((await log(5599)).filter(x => x.method === 'POST').length === 0, 'Claude was never called, so nothing is spent on a provider the owner did not choose');
}

if (mode === 'off') {
  console.log('\n== email and booking not configured');
  let r = await new Actor().call('GET', '/api/setup');
  ok(r.data.email.configured === false && r.data.bookingUrl === null, 'setup reports email off and no booking link');
  ok(r.data.notes.some(n => /BOOKING_URL is not set/.test(n)), 'and says what to set');
  const { a } = await newFirm('Quiet Firm');
  r = await a.call('POST', '/api/firm/members', { name: 'Zed', email: 'zed@x.example' });
  ok(r.status === 201 && r.data.emailed === null && r.data.inviteCode, 'adding someone still works: an invite, shown on screen, nothing emailed');
  ok((await mailLog()).length === 0, 'no request was made to any email service');
  const page = (await new Actor().call('GET', '/firms')).text;
  ok(!page.includes('Book a demo') && !page.includes('Book a firm demo') && !page.includes('href="#book"'), 'the sales page has NO booking buttons, rather than buttons that go nowhere');
  ok(page.includes('Try it yourself'), 'but still has its way in');
  ok(page.includes('Invites are sent by your admin, not emailed by us'), 'and still says invites are not emailed, because they are not');
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
