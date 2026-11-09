import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { MODULES } from '../src/content/seed/modules';
import { ALL_LESSONS, LESSONS, WORKED_LESSONS, lessonForModule } from '../src/content/seed/lessons';
import { QUESTIONS, DOMAINS, CONCEPTS } from '../src/content/seed';
import { NOT_KNOWLEDGE_DOMAINS } from '../src/content/seed/taxonomy';
import { lessonForViewer } from '../src/lib/content/gate';

/** The Four Intelligences module, module 1 (the owner, November 2026). */

const read = (f: string) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const UI = QUESTIONS.filter((q) => q.domain === 'urgent-applications');
const lesson = WORKED_LESSONS.find((l) => l.moduleSlug === 'urgent-injunction-my')!;

test('the module, its area, its lesson and its questions are all there', () => {
  const mod = MODULES.find((m) => m.slug === 'urgent-injunction-my');
  assert.ok(mod && mod.country === 'MY' && mod.required === false);
  assert.deepEqual(mod!.domains, ['urgent-applications']);
  assert.ok(DOMAINS.some((d) => d.slug === 'urgent-applications'));
  assert.ok(NOT_KNOWLEDGE_DOMAINS.includes('urgent-applications'), 'the diagnostic leaves it out');
  assert.equal(UI.length, 14);
  for (const q of UI) for (const c of q.concepts) assert.ok(CONCEPTS.some((x) => x.slug === c), `${q.slug}: ${c}`);
  assert.equal(lessonForModule('urgent-injunction-my')?.slug, lesson.slug);
  assert.ok(ALL_LESSONS.includes(lesson), 'a lawyer can find it to sign off');
  assert.ok(!LESSONS.includes(lesson));
});

test('the law is a draft: no learner sees the lesson until a lawyer has signed it off', () => {
  const unsigned = lessonForViewer('urgent-injunction-my', () => false, false);
  assert.equal(unsigned.lesson, null);
  assert.equal(unsigned.waiting, true);
  assert.equal(lessonForViewer('urgent-injunction-my', () => false, true).lesson?.checked, false);
  assert.equal(lessonForViewer('urgent-injunction-my', (s) => s === lesson.slug, false).lesson?.checked, true);
});

test('one story of six screens, and the owner’s build rules', () => {
  assert.ok(lesson.scene);
  assert.equal(lesson.steps.length, 6);
  const all = [
    JSON.stringify(lesson),
    JSON.stringify(MODULES.find((m) => m.slug === 'urgent-injunction-my')),
    ...UI.map((q) => JSON.stringify(q)),
    read('src/content/seed/questions/urgent-injunction-my.ts'),
  ].join('\n');
  assert.doesNotMatch(all, /\b(IQ|EQ|SQ|AQ)\b/, 'never lead with the labels');
  assert.doesNotMatch(all, /80\s*(per cent|%)/i, 'not the 80 per cent claim');
  assert.doesNotMatch(all, /measured intelligence/i);
  assert.ok(!all.includes(String.fromCharCode(0x2014)));
});

test('the unchecked specifics are not stated anywhere', () => {
  const all = JSON.stringify(lesson) + UI.map((q) => JSON.stringify(q)).join('');
  assert.doesNotMatch(all, /21[- ]day|twenty-one day/i, 'the lapse period is the lawyer’s to check');
  assert.doesNotMatch(all, /1\(2A\)|rule 1\(2/i, 'no sub-rule is cited');
  for (const q of UI) assert.ok(!/verified|confirmed by|checked by a/i.test(q.explanation), q.slug);
});

test('every question has one right answer, and it is the longest option no more often than chance', () => {
  let longest = 0;
  for (const q of UI) {
    assert.equal(q.correct.length, 1);
    assert.ok(q.options.some((o) => o.id === q.correct[0]));
    const max = Math.max(...q.options.map((o) => o.text.length));
    if (q.options.find((o) => o.id === q.correct[0])!.text.length === max) longest++;
  }
  assert.ok(longest <= Math.ceil(UI.length / 4) + 2, `${longest} of ${UI.length} have the longest right answer`);
});
