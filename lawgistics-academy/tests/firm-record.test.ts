import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * The game layer stays on the learner's side of the product.
 *
 * There are two audiences here and they want opposite things. A paralegal
 * training on this should get XP, a streak and a level called Adjournment
 * Survivor, because that is what makes somebody come back on a Tuesday. A
 * supervising partner reading whether that paralegal is ready to be put in
 * front of a client wants dates, modules covered, and who decided what.
 *
 * Those two things must not meet. A record a firm relies on stops reading like
 * a record the moment it says the candidate is a Costs Order Dodger, and the
 * joke stops being funny the moment it is evidence.
 *
 * It is already true, and it is true by nobody having thought to break it,
 * which is not the same as being safe. One import in a supervisor view would
 * undo it quietly and no other test would notice.
 */

const ROOT = path.join(import.meta.dirname, '..');

/** Views a firm reads about a person, rather than a person reads about themselves. */
const FIRM_FACING = ['src/app/admin/onboarding', 'src/app/admin/firm'];

/** The game. Levels, the XP that drives them, and the names they carry. */
const GAME = [
  'levelForXp',
  'TOP_LEVEL_NAME',
  'learning/progression',
  'learning/config',
  'totalXp',
  'weeklyXp',
  'xpForAnswer',
  'xpForSessionCompletion',
];

function walk(dir: string): string[] {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(rel);
    return /\.tsx?$/.test(entry.name) ? [rel] : [];
  });
}

test('no firm-facing view touches XP or levels', () => {
  const offenders: string[] = [];

  for (const dir of FIRM_FACING) {
    for (const file of walk(dir)) {
      const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
      for (const symbol of GAME) {
        if (source.includes(symbol)) offenders.push(`${file} mentions ${symbol}`);
      }
    }
  }

  assert.deepEqual(
    offenders,
    [],
    'a supervisor reading a record should not be told the person is a Bundle Carrier',
  );
});

test('the walker actually found the firm-facing views', () => {
  // Without this the test above passes triumphantly over an empty list, which
  // is how a guard quietly stops guarding after somebody moves a folder.
  const files = FIRM_FACING.flatMap(walk);
  assert.ok(
    files.length >= 10,
    `expected the firm-facing views to be found, saw ${files.length}`,
  );
});

test('the learner still gets the game', () => {
  // The other half of the same rule. If levels vanish from the learner's own
  // pages the split has been "fixed" by deleting the thing worth keeping.
  const dashboard = fs.readFileSync(
    path.join(ROOT, 'src/app/(app)/dashboard/page.tsx'),
    'utf8',
  );
  assert.match(dashboard, /level\.name/, 'the dashboard should still show the level name');
});
