import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import { parseFirmBody, readingMinutes } from '../src/lib/firm/content';

/**
 * The firm's own induction.
 *
 * Two things are being protected here. The first is that the firm's words are
 * text and never markup, because whoever writes the policy is trusted to write
 * a policy and not to put a script on a page every member of staff is required
 * to open. The second is the separation: firm content must not leak into the
 * verification queue or the training loop, because the whole claim being made
 * to a firm is that their policy is theirs and our law is ours.
 */

const ROOT = path.join(__dirname, '..');
const MIGRATION = fs.readFileSync(
  path.join(ROOT, 'supabase/migrations/0007_firm_modules.sql'),
  'utf8',
);

/**
 * The schema with the prose taken out.
 *
 * The comments in 0007 name the things it deliberately does not do, so a test
 * that scans the raw file finds "verification_status" in a sentence explaining
 * why there is no verification_status. Asserting about the schema means reading
 * the schema.
 */
const SCHEMA_ONLY = MIGRATION.replace(/--.*$/gm, '');

test('the three writing conventions do what somebody would expect', () => {
  const blocks = parseFirmBody(
    [
      '## Before you use any AI tool',
      '',
      'No client material goes into a public tool.',
      'Not a name, not a document, not a summary.',
      '',
      '- Ask the partner on the file',
      '- Record the time',
      '',
      'That is the whole rule.',
    ].join('\n'),
  );

  assert.deepEqual(blocks, [
    { kind: 'heading', text: 'Before you use any AI tool' },
    {
      kind: 'paragraph',
      // Hard-wrapped lines are joined. Text pasted out of a Word document
      // arrives wrapped, and one word per line would be unreadable.
      text: 'No client material goes into a public tool. Not a name, not a document, not a summary.',
    },
    { kind: 'list', items: ['Ask the partner on the file', 'Record the time'] },
    { kind: 'paragraph', text: 'That is the whole rule.' },
  ]);
});

test('markup in the firm’s text stays text', () => {
  // The parser must not strip this and must not interpret it. It comes out as
  // the characters that went in, and the renderer puts it in as a React child,
  // which escapes it. A parser that quietly removed the tag would be hiding the
  // problem rather than solving it.
  const source = '<script>alert(1)</script> and <b>bold</b>';
  const blocks = parseFirmBody(source);

  assert.deepEqual(blocks, [{ kind: 'paragraph', text: source }]);
});

test('an empty or blank body produces nothing rather than an empty block', () => {
  assert.deepEqual(parseFirmBody(''), []);
  assert.deepEqual(parseFirmBody('\n\n   \n'), []);
  assert.deepEqual(parseFirmBody('## '), [], 'a heading marker with no heading is not a heading');
  assert.deepEqual(parseFirmBody('- '), [], 'nor is an empty bullet a bullet');
});

test('reading time is honest and never zero', () => {
  assert.equal(readingMinutes(''), 1);
  assert.equal(readingMinutes('one two three'), 1);
  assert.equal(readingMinutes('word '.repeat(400)), 2);
});

test('firm content is never verified by us and never entered into training', () => {
  // The claim made to a firm is that their policy is theirs. If any of these
  // appeared, we would be reviewing a firm's own words, or serving them as
  // though they were law we stand behind.
  for (const forbidden of ['verification_status', 'review_flagged', 'reviewed_by', 'human_verified']) {
    assert.ok(
      !SCHEMA_ONLY.includes(forbidden),
      `0007 mentions ${forbidden}: firm content does not go through our review workflow`,
    );
  }

  const service = fs.readFileSync(path.join(ROOT, 'src/lib/firm/service.ts'), 'utf8');
  for (const trainingTable of [
    'v_question_delivery',
    'user_question_attempts',
    'review_schedule',
    'training_sessions',
    'user_concept_mastery',
  ]) {
    assert.ok(
      !service.includes(trainingTable),
      `the firm service touches ${trainingTable}: an induction is a record, not a skill`,
    );
  }
});

test('a firm module reaches everyone unless the firm narrows it', () => {
  // Australian-trained interns sitting in a Malaysian firm are the point of
  // this product. A country column defaulting to anything but "everyone" would
  // hide the firm's AI policy from exactly those people.
  const columns = /create table if not exists public\.firm_modules \(([\s\S]*?)\n\);/.exec(
    SCHEMA_ONLY,
  );
  assert.ok(columns, 'firm_modules should be declared in 0007');

  const countryLine = columns[1]
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('country'));

  assert.ok(countryLine, 'firm_modules should have a country column');
  assert.ok(
    !/not null/i.test(countryLine) && !/default/i.test(countryLine),
    'country must be nullable with no default, because null means everyone',
  );
});

test('an acknowledgement cannot be edited, withdrawn or backdated through any policy', () => {
  // The date is the entire evidentiary value of the record. These are also
  // checked against a real Postgres in supabase/tests, which is where they
  // actually bite; this one fails in a second rather than needing a database.
  const ackPolicies = [...SCHEMA_ONLY.matchAll(/create policy (\w+) on public\.firm_module_acknowledgements\s+for (\w+)/g)];

  assert.ok(ackPolicies.length > 0, 'the acknowledgement table should have policies');
  assert.deepEqual(
    ackPolicies.map((m) => m[2].toLowerCase()).sort(),
    ['insert', 'select'],
    'insert and select only: nobody edits or removes an acknowledgement, administrators included',
  );

  assert.ok(
    /new\.acknowledged_at\s*:=\s*now\(\)/.test(SCHEMA_ONLY),
    'the timestamp must be stamped by the database, not accepted from the request',
  );
  assert.ok(
    /on delete restrict/.test(SCHEMA_ONLY),
    'an acknowledged version must not be deletable, or the record disappears with it',
  );
});
