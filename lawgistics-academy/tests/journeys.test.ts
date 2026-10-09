import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import { siteOrigin } from '../src/lib/site-origin';
import { DIAGNOSTIC_QUESTION_COUNT, diagnosticMinutes } from '../src/lib/learning/config';

/**
 * The ways in and out of the learner pages: where somebody is sent when
 * something is missing, and that the address they are sent to does not send
 * them straight back.
 */

const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'src/app/(app)');

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

/** Source with block and line comments removed. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function sourcesUnder(dir: string): Array<{ rel: string; source: string }> {
  const out: Array<{ rel: string; source: string }> = [];
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry.name)) {
        out.push({ rel: path.relative(ROOT, full), source: code(fs.readFileSync(full, 'utf8')) });
      }
    }
  };
  walk(dir);
  return out;
}

/** The pages the middleware sends a signed-in person away from, read from it. */
function signedOutOnly(): string[] {
  const source = read('src/middleware.ts');
  const match = source.match(/const SIGNED_OUT_ONLY = \[([^\]]*)\]/);
  assert.ok(match, 'the middleware no longer names SIGNED_OUT_ONLY; update this test with it');
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

test('the middleware bounces signed-in people only from the list this test reads', () => {
  const source = code(read('src/middleware.ts'));
  assert.match(source, /if \(user && SIGNED_OUT_ONLY\.includes\(pathname\)\)/);
  assert.ok(signedOutOnly().includes('/login'));
});

test('no learner page sends a signed-in person with no profile somewhere the middleware bounces', () => {
  const bounced = signedOutOnly();
  const found: string[] = [];
  for (const { rel, source } of sourcesUnder(APP)) {
    // Any redirect guarded by a missing profile or overview, however it is spelt.
    for (const m of source.matchAll(
      /if \(!(?:profile|overview)\)\s*(?:\{\s*)?redirect\(\s*['`]([^'`?]*)/g,
    )) {
      found.push(`${rel} -> ${m[1]}`);
      assert.ok(
        !bounced.includes(m[1]),
        `${rel} sends a missing profile to ${m[1]}, which the middleware sends back to /dashboard`,
      );
    }
    // And /login only ever for somebody who is not signed in. Signed in, it
    // is a loop whatever the reason.
    for (const m of source.matchAll(/^.*redirect\(\s*['`]\/login.*$/gm)) {
      assert.match(
        m[0],
        /if \(!user\) redirect\(/,
        `${rel} sends somebody to /login for a reason other than not being signed in: ${m[0].trim()}`,
      );
    }
  }
  // The scan has to be finding something, or it proves nothing.
  assert.ok(found.length >= 15, `only ${found.length} missing-profile redirects found`);
  assert.ok(found.some((f) => f.includes('dashboard') && f.endsWith('/account-problem')));
});

test('the account problem page stands outside the learner layout and cannot loop', () => {
  const page = 'src/app/account-problem/page.tsx';
  assert.ok(fs.existsSync(path.join(ROOT, page)), 'the page is missing');
  assert.ok(!signedOutOnly().includes('/account-problem'));
  const source = code(read(page));
  // Its only redirect is for somebody signed out, and it offers a way out.
  const redirects = [...source.matchAll(/redirect\(\s*'([^']*)'/g)].map((m) => m[1]);
  assert.deepEqual(redirects, ['/login']);
  assert.match(source, /if \(!user\) redirect\('\/login'\)/);
  assert.match(source, /action="\/auth\/sign-out"/);
  assert.doesNotMatch(source, /getLearnerProfile|getLearnerOverview|requireAccess/);
});

test('Today asks for the diagnostic rather than sending people to it', () => {
  const source = code(read('src/app/(app)/dashboard/page.tsx'));
  assert.doesNotMatch(source, /redirect\(\s*'\/diagnostic'/);
  assert.match(source, /href="\/diagnostic"/);
  assert.match(source, /DIAGNOSTIC_QUESTION_COUNT/);

  const diagnostic = code(read('src/app/(app)/diagnostic/page.tsx'));
  // The way back is not only for somebody retaking it.
  assert.doesNotMatch(diagnostic, /retaking \? \(\s*<ButtonLink href="\/dashboard"/);
  assert.match(diagnostic, /Back to today/);
});

test('the diagnostic time is worked out from its length', () => {
  assert.equal(diagnosticMinutes(30), 45);
  assert.equal(diagnosticMinutes(10), 15);
  assert.equal(diagnosticMinutes(1), 5);
  assert.equal(diagnosticMinutes(), diagnosticMinutes(DIAGNOSTIC_QUESTION_COUNT));
  assert.doesNotMatch(read('src/app/(app)/diagnostic/page.tsx'), /fifteen minutes/i);
});

test('the round clock keeps its space before the time', () => {
  const source = code(read('src/components/next-round-clock.tsx'));
  // A trailing plain space inside a flex row is dropped.
  assert.doesNotMatch(source, /in <\/span>/);
  assert.match(source, /\\u00a0|&nbsp;/);
});

test('sign-in links and sign-out go to the site address only when the app sees itself as localhost', () => {
  assert.equal(siteOrigin('http://localhost:3000', 'https://academy.example.com/'), 'https://academy.example.com');
  assert.equal(siteOrigin('http://localhost:3000', 'https://academy.example.com/x'), 'https://academy.example.com');
  assert.equal(siteOrigin('https://app.vercel.app', undefined), 'https://app.vercel.app');
  assert.equal(siteOrigin('https://app.vercel.app', ''), 'https://app.vercel.app');
  assert.equal(siteOrigin('https://app.vercel.app', 'not an address'), 'https://app.vercel.app');
  assert.equal(siteOrigin('https://app.vercel.app', 'javascript:alert(1)'), 'https://app.vercel.app');
  // A real public origin is kept, so a stale setting or a preview link never
  // sends somebody to another host where they are not signed in.
  assert.equal(
    siteOrigin('https://preview-abc.vercel.app', 'https://academy.example.com'),
    'https://preview-abc.vercel.app',
  );
  assert.equal(siteOrigin('http://127.0.0.1:3000', 'https://academy.example.com'), 'https://academy.example.com');

  for (const route of ['src/app/auth/callback/route.ts', 'src/app/auth/sign-out/route.ts']) {
    const source = code(read(route));
    assert.match(source, /siteOrigin\(request\.nextUrl\.origin\)/, route);
    // nextUrl.origin only ever as the fallback handed to siteOrigin.
    const bare = source.replace(/siteOrigin\(request\.nextUrl\.origin\)/g, '');
    assert.doesNotMatch(bare, /nextUrl\.origin|\{[^}]*\borigin\b[^}]*\}\s*=\s*request\.nextUrl/, route);
  }
  // The callback still only follows a next that stays on the site.
  assert.match(code(read('src/app/auth/callback/route.ts')), /safeNext\(nextParam, '\/onboarding'\)/);
});

test('the words say what happens', () => {
  const form = code(read('src/app/(app)/onboarding/onboarding-form.tsx'));
  assert.doesNotMatch(form, /Start my diagnostic/);
  assert.doesNotMatch(code(read('src/app/(app)/onboarding/page.tsx')), /'Your skill map'/);

  const skills = code(read('src/app/(app)/skills/page.tsx'));
  assert.match(skills, /profile\.diagnosticCompletedAt/);

  const dashboard = code(read('src/app/(app)/dashboard/page.tsx'));
  const line = 'your homework starts once your supervisor sets your start date';
  const at = dashboard.indexOf(line);
  assert.ok(at > 0);
  // Said only under the condition that somebody has a supervisor.
  assert.match(dashboard.slice(at - 200, at), /supervised\s*\?/);

  const auth = code(read('src/app/(auth)/auth-form.tsx'));
  assert.match(auth, /`\/login\$\{next \? `\?next=\$\{encodeURIComponent\(next\)\}` : ''\}`/);
});

test("an invited person keeps the invitation's country", () => {
  const actions = code(read('src/app/(app)/actions.ts'));
  const start = actions.indexOf('export async function saveOnboarding');
  const body = actions.slice(start, actions.indexOf('\nexport ', start + 1));
  const lookup = body.indexOf('acceptedInvitationFor(user.id)');
  const update = body.indexOf(".from('profiles')");
  assert.ok(lookup > 0 && update > lookup, 'the invitation is read before the profile is written');
  assert.match(body, /const country = invited\?\.country \?\? parsed\.data\.country/);
  assert.match(body, /const track = invited\?\.track \?\? parsed\.data\.track/);
  assert.doesNotMatch(body, /track: parsed\.data\.track/);

  const page = code(read('src/app/(app)/onboarding/page.tsx'));
  assert.match(page, /invited=\{Boolean\(invitation\)\}/);
  const form = code(read('src/app/(app)/onboarding/onboarding-form.tsx'));
  assert.match(form, /\) : invited \? \(/);
});
