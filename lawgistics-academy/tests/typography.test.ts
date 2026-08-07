import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/**
 * No em dashes, anywhere.
 *
 * A house style rule is worth nothing if it only holds until the next edit, and
 * this one is invisible in review because the character looks almost exactly
 * like a hyphen. So it is asserted rather than remembered.
 *
 * Two files are excluded because `next dev` rewrites them on every run, so any
 * correction made here is undone the next time the dev server starts.
 */

const ROOT = path.join(__dirname, '..');
const REWRITTEN_BY_NEXT = new Set(['AGENTS.md', 'CLAUDE.md']);

function trackedFiles(): string[] {
  return execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .filter((file) => !REWRITTEN_BY_NEXT.has(file));
}

test('no file contains an em dash', () => {
  const offenders: string[] = [];

  for (const file of trackedFiles()) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full) || fs.statSync(full).isDirectory()) continue;

    const text = fs.readFileSync(full, 'utf8');
    text.split('\n').forEach((line, index) => {
      if (line.includes('—')) offenders.push(`${file}:${index + 1}  ${line.trim()}`);
    });
  }

  assert.deepEqual(offenders, [], 'use a comma, colon, semicolon or full stop instead');
});

test('no file contains an en dash used as punctuation', () => {
  // An en dash is legitimate in a numeric range (21-30 days). Anywhere else it
  // is an em dash in disguise, which is what this rule is actually about.
  const offenders: string[] = [];

  for (const file of trackedFiles()) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full) || fs.statSync(full).isDirectory()) continue;

    const text = fs.readFileSync(full, 'utf8');
    text.split('\n').forEach((line, index) => {
      // Flag only a spaced en dash, which is never a range.
      if (/\s–\s/.test(line)) offenders.push(`${file}:${index + 1}  ${line.trim()}`);
    });
  }

  assert.deepEqual(offenders, []);
});

test('the test itself would catch a violation', () => {
  // Guards against the file walker silently finding nothing.
  const files = trackedFiles();
  assert.ok(files.length > 50, `only ${files.length} files scanned`);
  assert.ok(files.some((f) => f.endsWith('.tsx')), 'no component files scanned');
  assert.ok(files.some((f) => f.endsWith('.sql')), 'no migrations scanned');
  assert.ok('a—b'.includes('—'), 'the detection itself is broken');
});
