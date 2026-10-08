import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import { bareAddress, cleanSubject, driveLinkIn, plainDraft, readPostmark } from '../src/lib/work/inbound';

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
  Headers: [
    { Name: 'Received-SPF', Value: 'Pass (sender SPF authorized)' },
    {
      Name: 'Authentication-Results',
      Value: 'mx.inbound.example; dkim=pass header.d=thomasphilip.example; dmarc=pass header.from=thomasphilip.example',
    },
  ],
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
  // The From domain must vouch for the address before it is looked up.
  assert.match(SERVICE, /if \(!email\.verifiedBy\) return \{ status: 'ignored' \}/);
  assert.doesNotMatch(SERVICE, /spf/i, 'SPF on its own no longer lets an email in');
  assert.match(SERVICE, /inbound_auth: email\.verifiedBy/);
  assert.match(SERVICE, /\.ilike\('email', exact\)/);
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
  assert.equal(email.verifiedBy, 'dmarc');
  assert.equal(readPostmark({ From: 'nobody' }), null, 'no address, no email');
  assert.equal(readPostmark('junk'), null);
  assert.equal(bareAddress('Priya <P@X.example>'), 'p@x.example');
  assert.equal(cleanSubject('Fwd: Re: RE: Draft the chronology'), 'Draft the chronology');
});

test('nothing from an email is stored as a file or sent to the AI before a lawyer has looked', () => {
  // A file on the board carries the poster's declaration that it identifies
  // no client; nobody has made one for an attachment, so none is kept. And an
  // email that may name a client is not passed to a third party unread.
  assert.doesNotMatch(SERVICE, /\.storage\b/);
  assert.doesNotMatch(SERVICE, /file_path/);
  assert.doesNotMatch(SERVICE, /getProvider|\.complete\(/);
  assert.match(SERVICE, /Attachments are not taken from email/);
  const email = readPostmark(sample)!;
  assert.deepEqual(email.attachments.map((a) => a.name), ['evil.exe', 'brief.pdf']);
  assert.equal(driveLinkIn(email.text), 'https://drive.google.com/drive/folders/abc');
  assert.equal(driveLinkIn('see https://evil.example/x'), null);
});

test('the draft is the email as typed', () => {
  const email = readPostmark(sample)!;
  const draft = plainDraft(email);
  assert.equal(draft.title, 'Draft the chronology');
  assert.equal(draft.instructions, email.text);
  assert.equal(draft.dueOn, null);
});
