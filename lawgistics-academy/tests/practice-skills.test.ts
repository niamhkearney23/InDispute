import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { DOMAINS, PRACTICE_SKILL_DOMAINS, QUESTIONS, validateSeed } from '../src/content/seed';
import { PRACTICE_SKILLS_MY_QUESTIONS as PS } from '../src/content/seed/questions/practice-skills-my';
import { MODULES } from '../src/content/seed/modules';

/**
 * Practice skills (the owner, November 2026: ten skills "the new generation
 * of lawyers" can build, and "also want questions on this").
 */

const read = (file: string) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('the ten skills each have questions: seven areas of their own, three in existing areas', () => {
  const counts = new Map<string, number>();
  for (const q of PS) counts.set(q.domain, (counts.get(q.domain) ?? 0) + 1);
  for (const slug of PRACTICE_SKILL_DOMAINS) {
    assert.ok((counts.get(slug) ?? 0) >= 5, `${slug} has only ${counts.get(slug) ?? 0}`);
    assert.ok(DOMAINS.some((d) => d.slug === slug), `${slug} is not an area`);
  }
  // Precise drafting, legal research and technology fluency (Ethics and AI).
  for (const slug of ['drafting', 'legal-research', 'ethics-and-ai']) {
    assert.ok((counts.get(slug) ?? 0) >= 3, `${slug} has only ${counts.get(slug) ?? 0}`);
  }
  assert.deepEqual(validateSeed(), []);
});

test('they are Malaysian situational-judgement drafts, unsigned, and never the diagnostic’s own', () => {
  for (const q of PS) {
    assert.equal(q.jurisdiction, 'MY_GENERAL', q.slug);
    assert.ok(!q.diagnosticOnly, `${q.slug} would be asked only in the diagnostic`);
    assert.deepEqual(q.skills, [], `${q.slug}: a chosen option cannot show a skill`);
    assert.equal(q.correct.length, 1, q.slug);
    assert.ok(q.slug.startsWith('ps-my-'), q.slug);
  }
  const header = read('src/content/seed/questions/practice-skills-my.ts');
  assert.match(header, /DRAFTED BY AN AI\. NOT CHECKED BY A LAWYER/);
  assert.match(header, /does not show how well they speak, write, negotiate or cope/);
  // Every tentative one is explained in the header.
  assert.ok(PS.filter((q) => q.tentative).length >= 3);
  assert.match(header, /TENTATIVE:/);
});

test('the right answer is not given away by being the longest option', () => {
  // The bank's right answer used to be the longest three times in four.
  const longest = PS.filter((q) => {
    const lens = q.options.map((o) => o.text.length);
    const right = q.options.find((o) => o.id === q.correct[0])!;
    return right.text.length === Math.max(...lens);
  }).length;
  assert.ok(longest / PS.length <= 0.4, `the right answer is the longest in ${longest} of ${PS.length}`);
  for (const q of PS) {
    const lens = q.options.map((o) => o.text.length).sort((a, b) => b - a);
    const right = q.options.find((o) => o.id === q.correct[0])!;
    if (right.text.length === lens[0]) {
      assert.ok(right.text.length - lens[1] <= 12, `${q.slug}: the right answer is much longer than the next`);
    }
  }
});

test('nothing in them says it has been verified, or states a figure as law', () => {
  for (const q of PS) {
    assert.ok(!/verified|confirmed by|checked by a/i.test(q.explanation), `${q.slug} implies it has been verified`);
  }
  assert.ok(!read('src/content/seed/questions/practice-skills-my.ts').includes(String.fromCharCode(0x2014)));
});

test('the practice skills have a module, and the diagnostic leaves them out', () => {
  const module = MODULES.find((m) => m.slug === 'practice-skills-my');
  assert.ok(module);
  assert.deepEqual([...module!.domains].sort(), [...PRACTICE_SKILL_DOMAINS].sort());
  assert.equal(module!.required, false, 'optional, like the rest of Learn');
  const selection = read('src/lib/learning/selection.ts');
  assert.match(selection, /const whole = \(await loadBank\(db, country\)\)\.filter\(/);
  assert.ok(QUESTIONS.some((q) => q.domain === 'client-care'));
});
