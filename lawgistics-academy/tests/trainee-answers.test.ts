import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT = path.resolve(__dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('a coach sees the answers only of people the firm supervises', () => {
  const service = read('src/lib/admin/answers.ts');
  // The list: a coach's is narrowed to the supervised before anything is read.
  assert.match(service, /if \(!isAdmin\) \{\s*const ids = \[\.\.\.\(await supervisedIds\(\)\)\];/);
  // One person: the page checks before it reads, and a stranger is not found.
  const page = read('src/app/admin/trainees/[id]/page.tsx');
  const check = page.indexOf('staffMayRead(id, isAdmin)');
  const readAt = page.indexOf('learnerDetail(id)');
  assert.ok(check > 0 && check < readAt, 'the supervision check comes before the read');
  assert.match(page, /if \(!\(await staffMayRead\(id, isAdmin\)\)\) notFound\(\);/);
});

test('staff are not listed as learners', () => {
  const service = read('src/lib/admin/answers.ts');
  assert.match(service, /filter\(\(p\) => !p\.is_admin && !p\.is_coach\)/);
  assert.match(service, /if \(!profile \|\| profile\.is_admin \|\| profile\.is_coach\) return null;/);
});

test('the tutor and the answers page share one rule for who is supervised', () => {
  assert.match(read('src/lib/tutor/service.ts'), /from '@\/lib\/admin\/supervision'/);
  assert.doesNotMatch(read('src/lib/tutor/service.ts'), /async function supervised\(/);
});
