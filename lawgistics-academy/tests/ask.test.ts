import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { cleanQuestion, pickPassages, tokens, type Passage } from '../src/lib/ask/rules';

const read = (f: string) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const bank: Passage[] = [
  { moduleSlug: 'courts-my', lessonTitle: 'The courts', step: 0, heading: 'High Court and Sessions Court', text: 'The High Court hears serious civil and criminal cases. The Sessions Court hears less serious ones.' },
  { moduleSlug: 'courts-my', lessonTitle: 'The courts', step: 1, heading: 'Appeals', text: 'An appeal goes to the Court of Appeal.' },
  { moduleSlug: 'evidence-my', lessonTitle: 'Evidence', step: 0, heading: 'Hearsay', text: 'Hearsay is a statement made outside court, offered to prove what it says.' },
];

test('a question finds the lesson steps that match, best first', () => {
  const found = pickPassages('What is the difference between a High Court and a Sessions Court?', bank);
  assert.equal(found[0].heading, 'High Court and Sessions Court');
  assert.deepEqual(tokens('Courts appeals'), ['court', 'appeal']);
});

test('nothing matching means nothing found, so no AI is asked', () => {
  assert.deepEqual(pickPassages('How do I bake sourdough bread?', bank), []);
  assert.deepEqual(pickPassages('the and for', bank), []);
});

test('questions are read strictly', () => {
  assert.equal(cleanQuestion('  What   is hearsay? '), 'What is hearsay?');
  assert.equal(cleanQuestion('hi'), null);
  assert.equal(cleanQuestion('x'.repeat(301)), null);
  assert.equal(cleanQuestion(42), null);
});

test('the server keeps the rules: signed-off lessons only, a daily cap, the guard, no question kept', () => {
  const service = read('src/lib/ask/service.ts');
  assert.match(service, /lessonFor\(m\.slug, false\)/, 'never a draft, even for staff');
  assert.match(service, /!lesson\.checked/);
  assert.match(service, /statesUncheckedLaw\(reply, checked, question\)/);
  assert.match(service, /used === null \|\| used >= DAILY_ASKS/, 'a count that cannot be read is the limit');
  assert.doesNotMatch(service, /insert\(\{[^}]*question/, 'what was asked is never stored');
  const route = read('src/app/api/ask/route.ts');
  assert.match(route, /getCurrentUser/);
  assert.match(route, /hasAccess\(user\.id\)/);
  const migration = read('supabase/migrations/0058_ask_usage.sql');
  assert.doesNotMatch(migration, /create policy/i);
  assert.doesNotMatch(migration, /question\s+text/i);
});
