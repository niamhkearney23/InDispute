import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const read = (f: string) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('the site can be put on a home screen: manifest, icons, public to a signed-out browser', () => {
  const manifest = read('src/app/manifest.ts');
  assert.match(manifest, /display: 'standalone'/);
  assert.match(manifest, /start_url: '\/dashboard'/);
  assert.match(manifest, /\/pwa-icon\/192/);
  assert.match(manifest, /\/pwa-icon\/512/);
  const layout = read('src/app/layout.tsx');
  assert.match(layout, /appleWebApp: \{ capable: true/);
  assert.match(layout, /apple: '\/pwa-icon\/180'/);
  const middleware = read('src/middleware.ts');
  assert.match(middleware, /manifest\.webmanifest\$\|pwa-icon\//, 'the browser asks for these before anybody signs in');
  assert.match(read('src/app/pwa-icon/[size]/route.tsx'), /SIZES = new Set\(\[180, 192, 512\]\)/);
});
