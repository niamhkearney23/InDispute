import { chromium } from 'playwright-core';
import { readdirSync } from 'fs';
import { join } from 'path';

const dir = new URL('./out/', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
for (const f of readdirSync(dir).filter(f => f.endsWith('.html')).sort()) {
  await page.goto('file://' + join(dir, f));
  await page.evaluate(() => document.fonts.ready);
  const png = join(dir, f.replace('.html', '.png'));
  await page.screenshot({ path: png });
  console.log(png.split('/').pop());
}
await browser.close();
