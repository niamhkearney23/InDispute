import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { feedbackEmail } from '../src/lib/email/feedback-email';
import { sendEmail } from '../src/lib/email/send';
import { deliverable, publicOrigin } from '../src/lib/email/notify';

/**
 * Emails when work is marked (the owner, November 2026). The email says
 * there is feedback and where; the comments stay in the academy.
 */

const base = {
  firstName: 'Aisyah',
  kind: 'work' as const,
  title: 'Draft the letter before action',
  verdict: 'good' as const,
  link: 'https://academy.example.com/work/p1#feedback',
  academy: 'Lawgistics Academy',
};

test('the subject says what happened, for each kind of mark', () => {
  assert.equal(feedbackEmail(base).subject, 'Your coach marked “Draft the letter before action”: Good');
  assert.equal(
    feedbackEmail({ ...base, verdict: 'again' }).subject,
    'Your coach asked for another go at “Draft the letter before action”',
  );
  assert.match(feedbackEmail({ ...base, kind: 'studio', verdict: null }).subject, /^Your coach reviewed your recording/);
  assert.match(feedbackEmail({ ...base, kind: 'matter' }).subject, /: Good$/);
});

test('sent back means another go, with the way back in', () => {
  const e = feedbackEmail({ ...base, verdict: 'again' });
  assert.match(e.text, /hand in the new version/);
  assert.ok(e.text.includes(base.link));
  assert.ok(e.html.includes('href="https://academy.example.com/work/p1#feedback"'));
});

test('the email never carries the coach’s comments, only where they are', () => {
  const e = feedbackEmail(base);
  assert.match(e.text, /comments are in the academy/);
  assert.match(e.text, /not in this email/);
  // The input has no feedback field at all, so there is nothing to leak.
  assert.ok(!('feedback' in base));
});

test('a title cannot break the header or the page', () => {
  const e = feedbackEmail({ ...base, title: 'Line one\r\nBcc: someone@example.com <script>x</script>' });
  assert.doesNotMatch(e.subject, /[\r\n]/);
  assert.doesNotMatch(e.html, /<script>/);
  assert.match(e.html, /&lt;script&gt;/);
});

test('without a link it says to sign in, and there is no long dash anywhere', () => {
  const e = feedbackEmail({ ...base, link: null, firstName: null });
  assert.match(e.text, /^Hello,/);
  assert.match(e.text, /Sign in to read them/);
  assert.doesNotMatch(e.html, /Read the feedback<\/a>/);
  for (const kind of ['work', 'matter', 'studio'] as const) {
    for (const verdict of ['good', 'again', null] as const) {
      const all = feedbackEmail({ ...base, kind, verdict });
      assert.doesNotMatch(`${all.subject}${all.text}${all.html}`, /—/);
    }
  }
});

test('nothing is sent unless both settings are there', async () => {
  let called = false;
  const fetchImpl = (async () => {
    called = true;
    return new Response('{}', { status: 200 });
  }) as typeof fetch;
  assert.deepEqual(await sendEmail('a@b.com', feedbackEmail(base), { env: { resendApiKey: undefined, from: 'x@y.com' }, fetchImpl }), { sent: false, reason: 'off' });
  assert.deepEqual(await sendEmail('a@b.com', feedbackEmail(base), { env: { resendApiKey: 're_x', from: undefined }, fetchImpl }), { sent: false, reason: 'off' });
  assert.equal(called, false);
});

test('a refused or failed send is reported, never thrown, and the key goes only in the header', async () => {
  let seen: { url: string; init: RequestInit } | null = null;
  const ok = (async (url: string, init: RequestInit) => {
    seen = { url, init };
    return new Response('{}', { status: 200 });
  }) as unknown as typeof fetch;
  const env = { resendApiKey: 're_secret', from: 'Academy <academy@example.com>' };
  assert.deepEqual(await sendEmail('a@b.com', feedbackEmail(base), { env, fetchImpl: ok }), { sent: true });
  assert.equal(seen!.url, 'https://api.resend.com/emails');
  assert.equal((seen!.init.headers as Record<string, string>).Authorization, 'Bearer re_secret');
  assert.doesNotMatch(String(seen!.init.body), /re_secret/);
  const refused = (async () => new Response('no', { status: 422 })) as unknown as typeof fetch;
  assert.deepEqual(await sendEmail('a@b.com', feedbackEmail(base), { env, fetchImpl: refused }), { sent: false, reason: 'refused' });
  const broken = (async () => {
    throw new Error('network');
  }) as unknown as typeof fetch;
  assert.deepEqual(await sendEmail('a@b.com', feedbackEmail(base), { env, fetchImpl: broken }), { sent: false, reason: 'failed' });
});

test('a deleted account, or a made-up address, gets nothing', () => {
  assert.equal(deliverable('aisyah@firm.com', null), true);
  assert.equal(deliverable('aisyah@firm.com', '2026-11-01T00:00:00Z'), false);
  assert.equal(deliverable('erased-123@invalid.invalid', null), false);
  assert.equal(deliverable('not an address', null), false);
  assert.equal(deliverable(null, null), false);
});

test('links point at the public site, never a local address', () => {
  assert.equal(publicOrigin({ NEXT_PUBLIC_SITE_URL: 'https://academy.example.com/x' }), 'https://academy.example.com');
  assert.equal(publicOrigin({ VERCEL_PROJECT_PRODUCTION_URL: 'litigation-training.vercel.app' }), 'https://litigation-training.vercel.app');
  assert.equal(publicOrigin({ NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' }), null);
  assert.equal(publicOrigin({}), null);
});

const read = (file: string) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('each marking action emails only after its own write has succeeded', () => {
  for (const [file, fn, saved] of [
    ['src/app/admin/work/actions.ts', 'markSubmission', "if (error || !data) return { error: 'That could not be saved.' };"],
    ['src/app/admin/matters/actions.ts', 'markMatterAttempt', "if (error || !data) return { error: 'Only an attempt that has been handed in can be marked.' };"],
    ['src/app/admin/studio/actions.ts', 'reviewStudioAttempt', "await logStudioAccess(attempt.id, reviewerId, 'reviewed');"],
  ] as const) {
    const source = read(file);
    const body = source.slice(source.indexOf(`export async function ${fn}`));
    const end = body.indexOf('\nexport ', 1);
    const fnBody = end === -1 ? body : body.slice(0, end);
    const at = fnBody.indexOf(saved);
    const sends = fnBody.indexOf('emailFeedbackLater(');
    assert.ok(at > 0, `${fn}: the save check moved`);
    assert.ok(sends > at, `${fn} must email only after the mark is saved`);
  }
});
