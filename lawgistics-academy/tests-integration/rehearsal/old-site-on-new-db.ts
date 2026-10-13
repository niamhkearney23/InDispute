/**
 * The live website (the base commit, built by hand at OLD_APP_URL) against
 * the updated database, for the window between running UPDATE.sql and the
 * new website going live. Prints what each kind of person sees; not part of
 * the test suite, because what it checks is a one-off window.
 */
import { chromium, type Page } from 'playwright';
import { PASSWORD, person } from '../helpers';

const APP = process.env.OLD_APP_URL ?? 'http://127.0.0.1:3125';

async function visit(page: Page, path: string) {
  const res = await page.goto(`${APP}${path}`, { waitUntil: 'networkidle' });
  const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const broken = /something went wrong|application error|unexpected error|500/i.test(text.slice(0, 600));
  return `${path} -> ${new URL(page.url()).pathname} [${res?.status()}]${broken ? ' ERROR PAGE' : ''} :: ${text.slice(0, 160)}`;
}

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  for (const [role, paths] of [
    ['learner', ['/dashboard', '/modules', '/skills', '/courts', '/account', '/tutor']],
    ['admin', ['/admin', '/admin/review', '/admin/trainees', '/admin/certification', '/admin/people', '/admin/reports']],
  ] as const) {
    const p = await person(role, 'MY');
    const page = await (await browser.newContext()).newPage();
    await page.goto(`${APP}/login`, { waitUntil: 'networkidle' });
    await page.fill('#email', p.email);
    await page.fill('#password', PASSWORD);
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 20000 }), page.click('button[type=submit]')]);
    console.log(`== ${role}`);
    for (const path of paths) console.log(await visit(page, path));
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
