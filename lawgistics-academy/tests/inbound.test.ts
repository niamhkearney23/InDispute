import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import {
  bareAddress,
  cleanSubject,
  driveLinkIn,
  parseDraft,
  plainDraft,
  readPostmark,
  usableAttachment,
} from '../src/lib/work/inbound';

const ROOT = path.join(import.meta.dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const ROUTE = strip(read('src/app/api/inbound/work/route.ts'));
const SERVICE = strip(read('src/lib/work/inbound-service.ts'));

const sample = {
  FromFull: { Email: 'Priya.Nair@ThomasPhilip.example', Name: 'Priya Nair' },
  Subject: 'Fwd: Re: Draft the chronology',
  TextBody: 'Please draft a chronology by 10 October.\n\nFolder: https://drive.google.com/drive/folders/abc\n\nThanks, Priya',
  StrippedTextReply: '',
  MessageID: 'abc-123',
  Headers: [{ Name: 'Received-SPF', Value: 'Pass (sender SPF authorized)' }],
  Attachments: [
    { Name: 'evil.exe', ContentType: 'application/octet-stream', Content: 'AAAA', ContentLength: 3 },
    { Name: 'brief.pdf', ContentType: 'application/pdf', Content: 'JVBERi0=', ContentLength: 5 },
  ],
};

test('the endpoint is off unless a long token is set, and compares it in constant time', () => {
  assert.match(ROUTE, /expected\.length < 24/);
  assert.match(ROUTE, /status: 404/);
  assert.match(ROUTE, /timingSafeEqual\(a, b\)/);
  assert.doesNotMatch(ROUTE, /presented === expected|expected === presented/);
});

test('a stranger and a lawyer get the same answer, so the address reveals nobody', () => {
  // One success response after the email is read, whatever happened to it.
  const after = ROUTE.slice(ROUTE.indexOf('await draftFromEmail(email)'));
  assert.equal((after.match(/NextResponse\.json/g) ?? []).length, 1);
});

test('only a coach or administrator, by their own address, can make a draft', () => {
  assert.match(SERVICE, /\.ilike\('email', email\.fromEmail\)/);
  assert.match(SERVICE, /if \(!staff \|\| !\(staff\.is_admin \|\| staff\.is_coach\)\) return \{ status: 'ignored' \}/);
});

test('an email never publishes anything: every post it makes is a draft', () => {
  assert.match(SERVICE, /published: false,/);
  assert.doesNotMatch(SERVICE, /published: true/);
  assert.match(SERVICE, /source: 'email'/);
});

test('the email is read safely', () => {
  const email = readPostmark(sample);
  assert.ok(email);
  assert.equal(email.fromEmail, 'priya.nair@thomasphilip.example');
  assert.equal(email.spfPass, true);
  assert.equal(readPostmark({ From: 'nobody' }), null, 'no address, no email');
  assert.equal(readPostmark('junk'), null);
  assert.equal(bareAddress('Priya <P@X.example>'), 'p@x.example');
  assert.equal(cleanSubject('Fwd: Re: RE: Draft the chronology'), 'Draft the chronology');
});

test('only a PDF, Word file or image within the limit is attached, and only a Drive link is kept', () => {
  const email = readPostmark(sample)!;
  assert.equal(usableAttachment(email.attachments, 1000)?.name, 'brief.pdf');
  assert.equal(usableAttachment(email.attachments, 4), null, 'too large');
  assert.equal(driveLinkIn(email.text), 'https://drive.google.com/drive/folders/abc');
  assert.equal(driveLinkIn('see https://evil.example/x'), null);
});

test('the AI’s tidy-up is used only when it is sound, otherwise the email itself is the draft', () => {
  const email = readPostmark(sample)!;
  const fallback = plainDraft(email);
  assert.equal(fallback.title, 'Draft the chronology');
  const good = parseDraft(
    '{"title":"Chronology","instructions":"Draft it.","dueOn":"2026-10-10","expectedMinutes":90,"maxClaims":2}',
    fallback,
  );
  assert.deepEqual(good, { title: 'Chronology', instructions: 'Draft it.', dueOn: '2026-10-10', expectedMinutes: 90, maxClaims: 2 });
  assert.equal(parseDraft('Sorry, I cannot help with that.', fallback), null);
  assert.equal(parseDraft('{"title":"","instructions":"x"}', fallback), null);
  const odd = parseDraft('{"title":"T","instructions":"I","dueOn":"next week","expectedMinutes":-5}', fallback);
  assert.equal(odd?.dueOn, null);
  assert.equal(odd?.expectedMinutes, null);
});
