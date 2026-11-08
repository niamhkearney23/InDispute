import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  MOCK_EXAM,
  drillPaper,
  examEndsAt,
  examOver,
  examTitle,
  inBand,
  parseDrill,
  readSettings,
  durationLabel,
  type ExamSettings,
} from '../src/lib/exams/rules';

/** Exams (0056; the owner, November 2026: "like how it can help for law school"). */

const read = (file: string) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const known = ['court-system', 'evidence', 'advocacy'];

test('the drill form is read strictly against fixed lists', () => {
  const ok = parseDrill({ areas: ['evidence'], difficulty: 'hard', pool: 'wrong', count: '20', minutes: '30', knownAreas: known });
  assert.deepEqual(ok, { mode: 'drill', areas: ['evidence'], difficulty: 'hard', pool: 'wrong', count: 20, minutes: 30 });
  const base = { areas: [], difficulty: 'any', pool: 'all', count: '10', minutes: '0', knownAreas: known };
  assert.ok(parseDrill(base), 'no areas means every area, and untimed is allowed');
  assert.equal(parseDrill({ ...base, count: '1000' }), null, 'a count off the list');
  assert.equal(parseDrill({ ...base, minutes: '7' }), null, 'a time off the list');
  assert.equal(parseDrill({ ...base, difficulty: 'impossible' }), null);
  assert.equal(parseDrill({ ...base, pool: 'everyone' }), null);
  assert.equal(parseDrill({ ...base, areas: ['made-up'] }), null, 'an area that does not exist');
});

test('difficulty bands cover 1 to 5 once each', () => {
  for (let d = 1; d <= 5; d++) {
    const bands = (['easy', 'medium', 'hard'] as const).filter((b) => inBand(d, b));
    assert.equal(bands.length, 1, `difficulty ${d}`);
    assert.ok(inBand(d, 'any'));
  }
});

test('a drill is the learner’s filter, never more than asked', () => {
  const bank = Array.from({ length: 30 }, (_, i) => ({
    questionId: `q${i}`,
    domainSlug: i % 2 ? 'evidence' : 'advocacy',
    difficulty: (i % 5) + 1,
  }));
  const settings: ExamSettings = { mode: 'drill', areas: ['evidence'], difficulty: 'hard', pool: 'all', count: 10, minutes: 0 };
  const none = { answered: new Set<string>(), lastWrong: new Set<string>() };
  const paper = drillPaper(bank, settings, none);
  assert.ok(paper.length <= 10);
  assert.ok(paper.every((q) => q.domainSlug === 'evidence' && q.difficulty >= 4));

  const answered = new Set(bank.slice(0, 25).map((q) => q.questionId));
  const fresh = drillPaper(bank, { ...settings, areas: [], difficulty: 'any', pool: 'unanswered' }, { answered, lastWrong: new Set() });
  assert.ok(fresh.every((q) => !answered.has(q.questionId)) && fresh.length === 5);

  const lastWrong = new Set(['q1', 'q3']);
  const wrong = drillPaper(bank, { ...settings, areas: [], difficulty: 'any', pool: 'wrong' }, { answered, lastWrong });
  assert.deepEqual(new Set(wrong.map((q) => q.questionId)), lastWrong);
});

test('the clock: untimed never ends; a timed exam ends with a short grace', () => {
  const start = '2026-11-08T10:00:00Z';
  assert.equal(examEndsAt(start, 0), null);
  assert.equal(examOver(start, null, new Date('2030-01-01T00:00:00Z')), false);
  assert.equal(examEndsAt(start, 60)?.toISOString(), '2026-11-08T11:00:00.000Z');
  assert.equal(examOver(start, 60, new Date('2026-11-08T11:00:10Z')), false, 'inside the grace');
  assert.equal(examOver(start, 60, new Date('2026-11-08T11:00:20Z')), true);
});

test('settings read back from the database, and what the history calls them', () => {
  assert.equal(readSettings(null), null);
  assert.equal(readSettings({ mode: 'other' }), null);
  assert.deepEqual(readSettings(MOCK_EXAM), MOCK_EXAM);
  const name = (s: string) => (s === 'evidence' ? 'Evidence' : s);
  assert.equal(examTitle(MOCK_EXAM, name), 'Mock exam');
  assert.equal(examTitle({ ...MOCK_EXAM, mode: 'drill', areas: ['evidence'] }, name), 'Drill: Evidence');
  assert.equal(durationLabel(65_000), '1m 05s');
  assert.equal(durationLabel(3_900_000), '1h 05m');
});

test('the server keeps the rules: training bank only, its own clock, one exam at a time', () => {
  const selection = read('src/lib/learning/selection.ts');
  const exam = selection.slice(selection.indexOf('export async function selectExamQuestions'));
  assert.match(exam, /await loadTrainingBank\(db, country\)/, 'signed off, published, never diagnostic-only');
  const service = read('src/lib/training/service.ts');
  assert.match(service, /session\.kind === 'exam' && examOver\(/, 'no answer after time is up');
  const exams = read('src/lib/exams/service.ts');
  assert.match(exams, /if \(running\) return \{ sessionId: running\.id as string \};/, 'one at a time');
  assert.match(exams, /standing \? \(\(v\.correct_option_ids/, 'answers shown only while still signed off');
  const actions = read('src/app/(app)/actions.ts');
  const begin = actions.slice(actions.indexOf('export async function beginExam'));
  assert.match(begin.slice(0, 600), /hasAccess\(user\.id\)/);
  const migration = read('supabase/migrations/0056_exams.sql');
  assert.match(migration, /add value if not exists 'exam'/);
});
