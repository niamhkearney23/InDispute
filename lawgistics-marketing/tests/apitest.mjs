import { createHmac } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire('/home/user/InDispute/lawgistics-marketing/');
const { Client } = require('pg');

const BASE = 'http://localhost:3010';
const OWNER = 'owner-key-that-is-long-enough-123456';
const SECRET = 'session-secret-that-is-comfortably-over-32-chars';
let pass = 0, fail = 0;
const ok = (cond, label, extra = '') => { cond ? pass++ : fail++; console.log((cond ? '  PASS ' : '  FAIL ') + label + (cond ? '' : '   <- ' + extra)); };

class Actor {
  constructor(name) { this.name = name; this.cookie = ''; }
  async call(method, path, body, headers = {}) {
    const res = await fetch(BASE + path, {
      method, redirect: 'manual',
      headers: { 'content-type': 'application/json', ...(this.cookie ? { cookie: this.cookie } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const sc of res.headers.getSetCookie?.() || []) {
      const m = sc.match(/^lgm_session=([^;]*)/);
      if (m) this.cookie = m[1] ? `lgm_session=${m[1]}` : '';
    }
    let data = null; try { data = await res.json(); } catch {}
    return { status: res.status, data, res };
  }
}
const owner = (method, path, body, key = OWNER) => new Actor('owner').call(method, path, body, { 'x-owner-key': key });
const pg = new Client({ connectionString: 'postgresql://postgres@127.0.0.1:5544/postgres' });
await pg.connect();
const fakeMode = m => fetch('http://127.0.0.1:5599/__mode', { method: 'POST', body: m });

console.log('\n== owner door');
let r = await owner('POST', '/api/owner/firms', { firmName: 'X', adminName: 'Y' }, '');
ok(r.status === 401, 'no key is refused', r.status);
r = await owner('POST', '/api/owner/firms', { firmName: 'X', adminName: 'Y' }, 'wrong');
ok(r.status === 401, 'wrong key is refused', r.status);
r = await owner('POST', '/api/owner/firms', { firmName: '', adminName: 'Y' });
ok(r.status === 400, 'firm without a name is refused', r.status);
r = await new Actor('o').call('POST', '/api/owner/firms', { firmName: 'Forged', adminName: 'Y' }, { 'x-owner-key': OWNER, origin: 'https://evil.example' });
ok(r.status === 403, 'a request from another website is refused even with the key', r.status);

r = await owner('POST', '/api/owner/firms', { firmName: 'Alpha & Co', adminName: 'Anna Admin' });
ok(r.status === 201 && /^[0-9A-Z]{4}(-[0-9A-Z]{4}){4}$/.test(r.data.inviteCode || ''), 'owner creates firm A and gets an invite', JSON.stringify(r.data));
const A = { firmId: r.data.firm.id, adminInvite: r.data.inviteCode };
ok(r.data.joinUrl.includes('#' + A.adminInvite), 'join link carries the code in the fragment, not the query');
const hashRow = await pg.query('select invite_hash from members where id=$1', [r.data.admin.id]);
ok(hashRow.rows[0].invite_hash && !hashRow.rows[0].invite_hash.includes(A.adminInvite.replace(/-/g,'')), 'only a hash of the invite is stored');

console.log('\n== joining');
const adminA = new Actor('adminA');
r = await adminA.call('POST', '/api/firm/join', { code: 'AAAA-BBBB-CCCC-DDDD-EEEE' });
ok(r.status === 401, 'a made-up code is refused', r.status);
r = await adminA.call('POST', '/api/firm/join', { code: 'short' });
ok(r.status === 401, 'a too-short code is refused', r.status);
r = await adminA.call('POST', '/api/firm/join', { code: A.adminInvite.toLowerCase() });
ok(r.status === 200 && r.data.role === 'admin' && adminA.cookie, 'the real code works (lower case is forgiven) and sets a session', JSON.stringify(r.data));
r = await new Actor('replay').call('POST', '/api/firm/join', { code: A.adminInvite });
ok(r.status === 401, 'the same code cannot be used twice', r.status);
r = await adminA.call('GET', '/api/firm/me');
ok(r.data.member?.role === 'admin' && r.data.firm?.name === 'Alpha & Co', 'me returns the admin and the firm');
ok(!JSON.stringify(r.data).includes('invite'), 'me never mentions invites or hashes');

console.log('\n== sessions cannot be forged');
const bare = new Actor('bare');
r = await bare.call('GET', '/api/firm/me');
ok(r.data.configured === true && r.data.member === null, 'no cookie means not signed in');
const real = adminA.cookie.replace('lgm_session=', '');
const [v, body, sig] = real.split('.');
const tampered = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, 'base64url')), m: '00000000-0000-0000-0000-000000000000' })).toString('base64url');
bare.cookie = `lgm_session=${v}.${tampered}.${sig}`;
r = await bare.call('GET', '/api/firm/me');
ok(r.data.member === null, 'a cookie with an altered payload is rejected');
const pl = JSON.parse(Buffer.from(body, 'base64url'));
const expiredBody = Buffer.from(JSON.stringify({ ...pl, e: Math.floor(Date.now()/1000) - 10 })).toString('base64url');
const expiredSig = createHmac('sha256', SECRET).update(`v1.${expiredBody}`).digest('base64url');
bare.cookie = `lgm_session=v1.${expiredBody}.${expiredSig}`;
r = await bare.call('GET', '/api/firm/me');
ok(r.data.member === null, 'a correctly signed but expired cookie is rejected');
const wrongSig = createHmac('sha256', 'a-different-secret-entirely-1234567890ab').update(`v1.${body}`).digest('base64url');
bare.cookie = `lgm_session=v1.${body}.${wrongSig}`;
r = await bare.call('GET', '/api/firm/me');
ok(r.data.member === null, 'a cookie signed with the wrong secret is rejected');
bare.cookie = 'lgm_session=garbage';
r = await bare.call('GET', '/api/firm/me');
ok(r.status === 200 && r.data.member === null, 'garbage in the cookie is just "not signed in", not an error');

console.log('\n== brand: admin sets it, input is cleaned');
r = await adminA.call('PUT', '/api/firm/brand', {
  brand: { cream: '#F2EFE9', navy: 'red; background:url(x)', accent: '#6B2450', serif: 'Comic Sans', sans: 'Inter', style: '<script>', disclaimer: 'General information.', evil: 'x' },
  requireApproval: true, monthlyQuota: 2,
});
ok(r.status === 200, 'admin saves the brand', JSON.stringify(r.data));
ok(r.data.brand.navy === undefined && r.data.brand.cream === '#f2efe9', 'a non-hex colour is dropped, a valid one kept');
ok(r.data.brand.serif === 'default' && r.data.brand.style === 'editorial', 'an unknown font and an injected style fall back to safe defaults');
ok(r.data.brand.evil === undefined, 'unknown keys are dropped');

console.log('\n== people');
r = await adminA.call('POST', '/api/firm/members', { name: 'Lena Lawyer', role: 'lawyer' });
ok(r.status === 201 && r.data.inviteCode, 'admin adds a lawyer and gets an invite');
const lena = new Actor('lena'); const lenaId = r.data.member.id;
r = await lena.call('POST', '/api/firm/join', { code: r.data.inviteCode });
ok(r.status === 200 && r.data.role === 'lawyer', 'the lawyer joins');
r = await adminA.call('POST', '/api/firm/members', { name: 'Ben Lawyer', role: 'lawyer' });
const ben = new Actor('ben'); const benId = r.data.member.id;
await ben.call('POST', '/api/firm/join', { code: r.data.inviteCode });

r = await lena.call('PUT', '/api/firm/brand', { brand: { cream: '#000000' } });
ok(r.status === 403, 'a lawyer cannot change the firm brand', r.status);
r = await lena.call('GET', '/api/firm/members');
ok(r.status === 403, 'a lawyer cannot list the firm', r.status);
r = await lena.call('GET', '/api/firm/usage');
ok(r.status === 403, 'a lawyer cannot see firm usage', r.status);
r = await lena.call('GET', '/api/firm/posts?scope=firm');
ok(r.status === 403, 'a lawyer cannot list every post in the firm', r.status);
r = await lena.call('PUT', '/api/firm/profile', { role: 'Employment', field: 'Workplace disputes', audience: 'HR managers', voice: 'I write plainly.', admin: true, member_id: benId });
ok(r.status === 200, 'a lawyer saves their own profile');
const prof = await pg.query('select profile from members where id=$1', [benId]);
ok(!prof.rows[0].profile.role, "...and it did not touch another member's profile");
r = await lena.call('GET', '/api/firm/me');
ok(r.data.member.profile.role === 'Employment' && r.data.firm.brand.cream === '#f2efe9', 'the lawyer sees their profile and the locked firm brand');

console.log('\n== firms cannot see each other');
r = await owner('POST', '/api/owner/firms', { firmName: 'Bravo Law', adminName: 'Bea Boss' });
const adminB = new Actor('adminB'); await adminB.call('POST', '/api/firm/join', { code: r.data.inviteCode });
r = await adminB.call('PATCH', `/api/firm/members/${lenaId}`, { active: false });
ok(r.status === 404, "firm B's admin cannot switch off firm A's lawyer", r.status);
r = await adminB.call('GET', '/api/firm/members');
ok(r.data.members.length === 1 && r.data.members[0].name === 'Bea Boss', "firm B's admin sees only firm B's people");
const stillActive = await pg.query('select active from members where id=$1', [lenaId]);
ok(stillActive.rows[0].active === true, "...and firm A's lawyer is untouched");

console.log('\n== posts and approval');
const SLIDES = [
  { layout: 'title', ground: 'light', size: 'lg', statement: 'Read the clause before you sign it', sub: 'A sub line', kicker: 'NOTE', evil: '<img onerror=x>', photo: 'javascript:alert(1)' },
  { layout: 'essay', ground: 'dark', statement: 'Slide two', body: 'Some body copy', photo: 'data:image/png;base64,iVBORw0KGgo=' },
];
r = await lena.call('POST', '/api/firm/posts', { topic: 'clauses', slides: SLIDES, caption: 'Line one.\n\nLine two.' });
ok(r.status === 201 && r.data.post.status === 'draft', 'a lawyer saves a draft post');
const postId = r.data.post.id;
let stored = (await pg.query('select slides from posts where id=$1', [postId])).rows[0].slides;
ok(stored[0].evil === undefined && stored[0].photo === undefined, 'unknown keys and a javascript: "photo" are stripped on the way in');
ok(stored[1].photo?.startsWith('data:image/png;base64,'), 'a real inline image is kept');
r = await lena.call('POST', '/api/firm/posts', { topic: 't', slides: 'nope' });
ok(r.status === 400, 'malformed slides are refused', r.status);
r = await lena.call('POST', '/api/firm/posts', { topic: 't', slides: [{ statement: 'x', photo: 'data:image/png;base64,' + 'A'.repeat(1_900_000) }] });
ok(r.status === 400, 'an oversized photo is refused cleanly, not crashed on', r.status);

r = await ben.call('GET', `/api/firm/posts/${postId}`);
ok(r.status === 404, "another lawyer in the same firm cannot open Lena's post", r.status);
r = await ben.call('PUT', `/api/firm/posts/${postId}`, { slides: SLIDES, caption: 'hijack' });
ok(r.status === 404, "...or edit it", r.status);
r = await adminB.call('GET', `/api/firm/posts/${postId}`);
ok(r.status === 404, "an admin from another firm cannot open it", r.status);
r = await adminA.call('GET', `/api/firm/posts/${postId}`);
ok(r.status === 200 && r.data.post.member_name === 'Lena Lawyer', "firm A's admin can open it");
r = await adminA.call('GET', '/api/firm/posts/not-a-uuid');
ok(r.status === 404, 'a non-uuid id is a clean 404, not a database error', r.status);

r = await adminA.call('POST', `/api/firm/posts/${postId}/review`, { decision: 'approve', rev: 1 });
ok(r.status === 409, 'a post that has not been submitted cannot be approved', r.status);
r = await lena.call('POST', `/api/firm/posts/${postId}/submit`);
ok(r.status === 200 && r.data.post.status === 'submitted', 'the lawyer submits it for approval');
r = await ben.call('POST', `/api/firm/posts/${postId}/submit`);
ok(r.status === 409, "another lawyer cannot submit Lena's post", r.status);
r = await lena.call('POST', `/api/firm/posts/${postId}/review`, { decision: 'approve', rev: 1 });
ok(r.status === 403, 'a lawyer cannot approve their own post', r.status);
r = await adminA.call('POST', `/api/firm/posts/${postId}/review`, { decision: 'changes', rev: 1 });
ok(r.status === 400, 'asking for changes without saying what is refused', r.status);
r = await adminA.call('POST', `/api/firm/posts/${postId}/review`, { decision: 'approve' });
ok(r.status === 400, 'a decision with no revision is refused', r.status);
r = await adminB.call('POST', `/api/firm/posts/${postId}/review`, { decision: 'approve', rev: 1 });
ok(r.status === 409 || r.status === 404, "another firm's admin cannot review it", r.status);
const untouched = await pg.query('select status from posts where id=$1', [postId]);
ok(untouched.rows[0].status === 'submitted', '...and it is still waiting');

// the author edits while the reviewer is looking
r = await lena.call('PUT', `/api/firm/posts/${postId}`, { topic: 'clauses', slides: SLIDES, caption: 'EDITED while under review' });
ok(r.data.post.rev === 2 && r.data.post.status === 'draft', 'editing a submitted post pulls it back to draft and bumps the revision');
await lena.call('POST', `/api/firm/posts/${postId}/submit`);
r = await adminA.call('POST', `/api/firm/posts/${postId}/review`, { decision: 'approve', rev: 1 });
ok(r.status === 409 && r.data.stale, "approving the revision the reviewer opened, after it changed, is refused", JSON.stringify(r.data));
r = await adminA.call('POST', `/api/firm/posts/${postId}/review`, { decision: 'approve', rev: 2, note: 'Good.' });
ok(r.status === 200 && r.data.post.status === 'approved', 'approving the current revision works');
r = await adminA.call('POST', `/api/firm/posts/${postId}/review`, { decision: 'changes', rev: 2, note: 'x' });
ok(r.status === 409, 'a decision cannot be flipped after the fact', r.status);
r = await lena.call('PUT', `/api/firm/posts/${postId}`, { topic: 'clauses', slides: SLIDES, caption: 'Quietly changed after approval' });
ok(r.data.post.status === 'draft', 'editing an APPROVED post voids the approval');
const note = await pg.query('select reviewed_by, reviewer_note from posts where id=$1', [postId]);
ok(note.rows[0].reviewed_by === null && note.rows[0].reviewer_note === '', '...and clears the old reviewer and note');

await lena.call('POST', `/api/firm/posts/${postId}/submit`);
const curRev = (await adminA.call('GET', `/api/firm/posts/${postId}`)).data.post.rev;
r = await adminA.call('POST', `/api/firm/posts/${postId}/review`, { decision: 'changes', rev: curRev, note: 'Shorter hook please.' });
ok(r.status === 200 && r.data.post.status === 'changes_requested', 'requesting changes works');
r = await lena.call('GET', `/api/firm/posts/${postId}`);
ok(r.data.post.reviewer_note === 'Shorter hook please.', 'the lawyer sees the reviewer note');
r = await lena.call('GET', '/api/firm/posts');
ok(r.data.posts.length === 1 && r.data.posts[0].title === 'Read the clause before you sign it', 'the lawyer lists their own posts with a title');
r = await ben.call('GET', '/api/firm/posts');
ok(r.data.posts.length === 0, "another lawyer's list does not include Lena's post");
r = await adminA.call('GET', '/api/firm/posts?scope=firm&status=changes_requested');
ok(r.data.posts.length === 1, 'the admin can filter the firm queue by status');

console.log('\n== approval switched off');
await adminA.call('PUT', '/api/firm/brand', { brand: {}, requireApproval: false, monthlyQuota: 2 });
r = await ben.call('POST', '/api/firm/posts', { topic: 'b', slides: SLIDES, caption: 'c' });
r = await ben.call('POST', `/api/firm/posts/${r.data.post.id}/submit`);
ok(r.data.post?.status === 'approved', 'with approval off, submit approves straight away');
await adminA.call('PUT', '/api/firm/brand', { brand: {}, requireApproval: true, monthlyQuota: 2 });

console.log('\n== people management');
r = await adminA.call('PATCH', `/api/firm/members/${(await pg.query("select id from members where firm_id=$1 and role='admin'", [A.firmId])).rows[0].id}`, { active: false });
ok(r.status === 409, 'an admin cannot switch themselves off', r.status);
const adminRow = (await pg.query("select id from members where firm_id=$1 and role='admin'", [A.firmId])).rows[0];
r = await adminA.call('PATCH', `/api/firm/members/${adminRow.id}`, { role: 'lawyer' });
ok(r.status === 409, 'the only admin cannot be demoted (a firm cannot lock itself out)', r.status);
r = await adminA.call('PATCH', `/api/firm/members/${benId}`, { active: false });
ok(r.status === 200 && r.data.member.active === false, 'an admin switches a lawyer off');
r = await ben.call('GET', '/api/firm/me');
ok(r.data.member === null, "...and Ben's existing cookie stops working on his very next request");
r = await ben.call('POST', '/api/firm/posts', { topic: 'x', slides: SLIDES });
ok(r.status === 401, '...and he cannot write posts either', r.status);
r = await adminA.call('PATCH', `/api/firm/members/${benId}`, { reissueInvite: true });
ok(r.status === 409 && !r.data.inviteCode && /back on/.test(r.data.error), 'an invite is refused for someone who is switched off, with a clear reason', JSON.stringify(r.data));
r = await adminA.call('PATCH', `/api/firm/members/${benId}`, { active: true, reissueInvite: true });
ok(r.status === 200 && r.data.inviteCode, 'switching back on with a fresh invite works');
const ben2 = new Actor('ben2');
r = await ben2.call('POST', '/api/firm/join', { code: r.data.inviteCode });
ok(r.status === 200, 'Ben joins again with the new invite');
r = await ben.call('GET', '/api/firm/me');
ok(r.data.member === null, "...but his OLD cookie is still dead (the session generation moved on)");
r = await adminA.call('POST', '/api/firm/members', { name: 'Second Admin', role: 'admin' });
const adm2Invite = r.data.inviteCode, adm2Id = r.data.member.id;
r = await adminA.call('PATCH', `/api/firm/members/${adminRow.id}`, { role: 'lawyer' });
ok(r.status === 409, 'a second admin who has NOT accepted their invite does not count: the first cannot step down', r.status);
const adm2 = new Actor('adm2');
await adm2.call('POST', '/api/firm/join', { code: adm2Invite });
r = await adm2.call('PATCH', `/api/firm/members/${adminRow.id}`, { role: 'lawyer' });
ok(r.status === 200, 'once the second admin has signed in, the first can be demoted');
r = await adminA.call('GET', '/api/firm/members');
ok(r.status === 403, '...and loses admin powers at once');
r = await adm2.call('PATCH', `/api/firm/members/${adminRow.id}`, { role: 'admin' });
ok(r.status === 200, 'the second admin restores them');
r = await owner('POST', `/api/owner/firms/${A.firmId}/admins`, { adminName: 'Rescue Admin' });
ok(r.status === 201 && r.data.inviteCode, 'the platform owner can add a fresh admin to a firm that has lost its own');
r = await owner('POST', `/api/owner/firms/${A.firmId}/admins`, { adminName: 'Nope' }, 'wrong');
ok(r.status === 401, '...but only with the owner key', r.status);
r = await adminA.call('POST', `/api/owner/firms/${A.firmId}/admins`, { adminName: 'Nope' });
ok(r.status === 401, '...a firm admin cannot use it', r.status);

console.log('\n== allowance (quota = 2)');
await pg.query('delete from usage');
const draft = (actor, extra = {}) => actor.call('POST', '/api/draft', { topic: 'a topic', brand: { kind: 'person', name: 'T' }, ...extra });
r = await draft(lena);
ok(r.status === 200 && r.data.draft, 'first new post drafts', JSON.stringify(r.data));
r = await draft(lena, { current: { slides: [{ statement: 'x' }] }, topic: 'make it bolder' });
ok(r.status === 200, 'a revision does not use the allowance');
r = await draft(lena);
ok(r.status === 200, 'second new post drafts');
r = await draft(lena);
ok(r.status === 429 && r.data.quotaReached && r.data.quota === 2, 'the third is refused with a clear message', JSON.stringify(r.data));
ok(/renews on the 1st/.test(r.data.error || ''), '...that says when it renews');
r = await draft(lena, { current: { slides: [{ statement: 'x' }] }, topic: 'shorter' });
ok(r.status === 200, 'but revising still works at the limit');
r = await lena.call('GET', '/api/firm/me');
ok(r.data.usage.used === 2 && r.data.usage.quota === 2, 'me reports 2 of 2 used');

await pg.query('delete from usage');
await fakeMode('fail');
r = await draft(lena);
ok(r.status === 502, 'a model failure is reported', r.status);
const afterFail = (await pg.query("select count(*)::int n from usage")).rows[0].n;
ok(afterFail === 0, 'a failed draft gives the allowance slot back');
await fakeMode('ok');

await pg.query('delete from usage');
await adminA.call('PUT', '/api/firm/brand', { brand: {}, requireApproval: true, monthlyQuota: 3 });
const burst = await Promise.all(Array.from({ length: 8 }, () => draft(lena)));
const wins = burst.filter(x => x.status === 200).length, blocked = burst.filter(x => x.status === 429).length;
ok(wins === 3 && blocked === 5, `8 simultaneous requests against an allowance of 3: exactly 3 succeed (got ${wins}, blocked ${blocked})`);
const rowsNow = (await pg.query("select count(*)::int n from usage where member_id=$1", [lenaId])).rows[0].n;
ok(rowsNow === 3, 'and exactly 3 are recorded');

await pg.query('delete from usage');
await pg.query(`insert into usage (firm_id, member_id, kind, created_at)
  select $1, $2, 'draft', (date_trunc('month', now() at time zone 'Australia/Sydney') at time zone 'Australia/Sydney') - interval '2 hours'
  from generate_series(1,3)`, [A.firmId, lenaId]);
r = await draft(lena);
ok(r.status === 200, "last month's posts do not count against this month");
r = await adminA.call('GET', '/api/firm/usage');
const lenaUse = r.data.people.find(p => p.name === 'Lena Lawyer');
ok(lenaUse.this_month === 1 && lenaUse.last_month === 3, `usage report separates this month (1) from last (3): got ${lenaUse.this_month}/${lenaUse.last_month}`);
await adminA.call('PUT', '/api/firm/brand', { brand: {}, requireApproval: true, monthlyQuota: 0 });
await pg.query('delete from usage');
const unl = await Promise.all(Array.from({ length: 6 }, () => draft(lena)));
ok(unl.every(x => x.status === 200), 'a quota of 0 means unlimited');
ok((await pg.query("select count(*)::int n from usage")).rows[0].n === 6, '...and every draft is still counted');

console.log('\n== forged requests');
r = await lena.call('PUT', '/api/firm/profile', { role: 'x' }, { origin: 'https://evil.example' });
ok(r.status === 403, 'a profile change from another website is refused', r.status);
r = await adminA.call('PUT', '/api/firm/brand', { brand: {} }, { origin: 'https://evil.example' });
ok(r.status === 403, 'a brand change from another website is refused', r.status);
r = await adminA.call('POST', `/api/firm/posts/${postId}/review`, { decision: 'approve', rev: 1 }, { origin: 'https://evil.example' });
ok(r.status === 403, 'an approval from another website is refused', r.status);
r = await lena.call('POST', '/api/firm/join', { code: 'x'.repeat(100000) });
ok([401, 413].includes(r.status), 'an enormous body is refused, not processed', r.status);

console.log('\n== logout');
r = await lena.call('POST', '/api/firm/logout');
r = await lena.call('GET', '/api/firm/me');
ok(r.data.member === null, 'logging out clears the session');

await pg.end();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
