import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { MODULES } from '../src/content/seed/modules';
import { ALL_LESSONS, WORKED_LESSONS, lessonForModule } from '../src/content/seed/lessons';
import { CONCEPTS, DOMAINS, QUESTIONS } from '../src/content/seed';
import { NOT_KNOWLEDGE_DOMAINS } from '../src/content/seed/taxonomy';
import { lessonForViewer } from '../src/lib/content/gate';

/** The chronology: the four-part template (by hand, the tool, what it missed, what the lawyer adds). */

const read = (f: string) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const AC = QUESTIONS.filter((q) => q.domain === 'checking-ai-work');
const lesson = WORKED_LESSONS.find((l) => l.moduleSlug === 'ai-chronology-my')!;

test('the module, its area, its lesson and its questions are all there', () => {
  const mod = MODULES.find((m) => m.slug === 'ai-chronology-my');
  assert.ok(mod && mod.country === 'MY' && mod.required === false);
  assert.deepEqual(mod!.domains, ['checking-ai-work']);
  assert.ok(DOMAINS.some((d) => d.slug === 'checking-ai-work'));
  assert.ok(NOT_KNOWLEDGE_DOMAINS.includes('checking-ai-work'), 'the diagnostic leaves it out');
  assert.equal(AC.length, 13);
  for (const q of AC) for (const c of q.concepts) assert.ok(CONCEPTS.some((x) => x.slug === c), `${q.slug}: ${c}`);
  assert.equal(lessonForModule('ai-chronology-my')?.slug, lesson.slug);
  assert.ok(ALL_LESSONS.includes(lesson), 'a lawyer can find it to sign off');
});

test('a draft: no learner sees the lesson until a lawyer has signed it off', () => {
  const unsigned = lessonForViewer('ai-chronology-my', () => false, false);
  assert.equal(unsigned.lesson, null);
  assert.equal(unsigned.waiting, true);
  assert.equal(lessonForViewer('ai-chronology-my', (s) => s === lesson.slug, false).lesson?.checked, true);
});

test('the four parts are there in order, on invented facts, with no labels and no law', () => {
  assert.ok(lesson.scene && /invented/.test(lesson.scene.who));
  assert.ok(lesson.steps.length >= 4 && lesson.steps.length <= 6);
  const headings = lesson.steps.map((s) => s.heading);
  const at = (h: string) => headings.indexOf(h);
  assert.ok(at('Do the first ten by hand') >= 0);
  assert.ok(at('Do the first ten by hand') < at('What the tool gives you'));
  assert.ok(at('What the tool gives you') < at('What it missed'));
  assert.ok(at('What it missed') < at('What you add'));
  for (const s of lesson.steps) {
    assert.ok(s.heading.length <= 40 && s.body.length >= 80 && s.body.length <= 520, s.heading);
    if (s.guess) assert.ok(s.guess.options.some((o) => o.id === s.guess!.answer));
  }
  const all = [JSON.stringify(lesson), ...AC.map((q) => JSON.stringify(q)), read('src/content/seed/questions/ai-chronology-my.ts')].join('\n');
  assert.doesNotMatch(all, /\b(IQ|EQ|SQ|AQ)\b/);
  assert.doesNotMatch(all, /80\s*(per cent|%)/i);
  assert.doesNotMatch(all, /\b(section|order|rule)\s+\d|\bAct\s+\d{4}|\[\d{4}\]/i, 'it states no law');
  assert.ok(!all.includes(String.fromCharCode(0x2014)));
  for (const q of AC) assert.ok(!/verified|confirmed by|checked by a/i.test(q.explanation), q.slug);
});

test('every question has one right answer, and it is the longest option no more often than chance', () => {
  let longest = 0;
  for (const q of AC) {
    assert.equal(q.correct.length, 1);
    assert.ok(q.options.some((o) => o.id === q.correct[0]));
    const max = Math.max(...q.options.map((o) => o.text.length));
    if (q.options.find((o) => o.id === q.correct[0])!.text.length === max) longest++;
  }
  assert.ok(longest <= Math.ceil(AC.length / 4), `${longest} of ${AC.length} have the longest right answer`);
});
