import assert from 'node:assert/strict';
import test from 'node:test';
import { diagnosticPaper } from '../src/lib/learning/selection';
import { QUESTIONS } from '../src/content/seed';

/**
 * The diagnostic's paper (the owner, November 2026: "way too easy ... add a
 * few harder questions to see if they know lots"): every area, a spread of
 * difficulty within each, easy to hard.
 */

type Q = { id: string; domainSlug: string; difficulty: number };
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const area = (slug: string, difficulties: number[]): Q[] =>
  difficulties.map((difficulty, i) => ({ id: `${slug}-${i}`, domainSlug: slug, difficulty }));

test('an area’s share is spread from its easy end to its hard end, never its easiest few', () => {
  const bank = area('evidence', [1, 1, 1, 2, 2, 3, 3, 4, 5, 5]);
  const paper = diagnosticPaper(bank, 3, seeded(1));
  assert.equal(paper.length, 3);
  const levels = paper.map((q) => q.difficulty);
  assert.ok(Math.max(...levels) >= 4, `the hardest question asked was ${Math.max(...levels)}`);
  assert.ok(Math.min(...levels) <= 2, 'the paper should still open with something easy');
  assert.notDeepEqual(levels, [1, 1, 1], 'it took the three easiest');
});

test('every area is asked about, evenly, and nothing twice', () => {
  const bank = [
    ...area('a', [1, 2, 3, 4, 5, 1, 2, 3]),
    ...area('b', [1, 2, 3, 4, 5, 1, 2, 3]),
    ...area('c', [2, 3]),
  ];
  const paper = diagnosticPaper(bank, 10, seeded(7));
  assert.equal(paper.length, 10);
  assert.equal(new Set(paper.map((q) => q.id)).size, 10, 'a question was asked twice');
  const per = (slug: string) => paper.filter((q) => q.domainSlug === slug).length;
  assert.equal(per('c'), 2, 'a small area gives all it has');
  assert.equal(per('a'), 4);
  assert.equal(per('b'), 4);
});

test('the paper runs from easy to hard', () => {
  const bank = [...area('a', [5, 1, 3, 2, 4]), ...area('b', [4, 2, 5, 1, 3])];
  const levels = diagnosticPaper(bank, 6, seeded(3)).map((q) => q.difficulty);
  assert.deepEqual(levels, [...levels].sort((x, y) => x - y));
});

test('a bank smaller than the paper is asked in full, and an empty one gives nothing', () => {
  assert.equal(diagnosticPaper(area('a', [1, 2, 3]), 30).length, 3);
  assert.deepEqual(diagnosticPaper([], 30), []);
});

test('on the Malaysian bank as written, the paper reaches the hard questions', () => {
  const bank = QUESTIONS.filter((q) => String(q.jurisdiction).startsWith('MY')).map((q, i) => ({
    id: `${q.slug ?? i}`,
    domainSlug: q.domain,
    difficulty: q.difficulty,
  }));
  for (let s = 1; s <= 20; s += 1) {
    const paper = diagnosticPaper(bank, 30, seeded(s));
    const hard = paper.filter((q) => q.difficulty >= 4).length;
    assert.ok(hard >= 3, `only ${hard} questions of difficulty 4 or 5 in a 30-question paper`);
    const easiestFirst = [...new Set(paper.map((q) => q.domainSlug))].length;
    assert.equal(easiestFirst, new Set(bank.map((q) => q.domainSlug)).size, 'an area was left out');
  }
});
