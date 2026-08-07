import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import {
  asCountry,
  COUNTRIES,
  COUNTRY_LABELS,
  DEFAULT_JURISDICTION,
  JURISDICTION_COUNTRY,
  JURISDICTION_LABELS,
  JURISDICTIONS_BY_COUNTRY,
  type Country,
} from '../src/lib/types';
import { QUESTIONS, FACTS, validateSeed } from '../src/content/seed';
import { COURT_HIERARCHIES, tiersOf } from '../src/content/seed/court-hierarchies';
import { selectDailyQuestions, selectDiagnosticQuestions } from '../src/lib/learning/selection';

/**
 * The country boundary.
 *
 * Australian and Malaysian civil procedure are different bodies of law. A
 * Malaysian learner shown the Victorian Magistrates' Court limit has not been
 * shown something merely irrelevant; they have been taught something false
 * about their own courts, by an app that looks authoritative. So this is not a
 * filtering preference to be checked by eye. It is asserted here, at the level
 * of the selection query, the content, and the labels.
 */

const ROOT = path.join(__dirname, '..');

test('every jurisdiction belongs to exactly one country, and every country has a default', () => {
  for (const jurisdiction of Object.keys(JURISDICTION_COUNTRY) as Array<
    keyof typeof JURISDICTION_COUNTRY
  >) {
    const country = JURISDICTION_COUNTRY[jurisdiction];
    assert.ok(COUNTRIES.includes(country), `${jurisdiction} maps to unknown country ${country}`);
    assert.ok(JURISDICTION_LABELS[jurisdiction], `${jurisdiction} has no label`);
  }

  for (const country of COUNTRIES) {
    assert.ok(COUNTRY_LABELS[country], `${country} has no label`);
    assert.ok(JURISDICTIONS_BY_COUNTRY[country].length > 0, `${country} has no jurisdictions`);

    const fallback = DEFAULT_JURISDICTION[country];
    assert.equal(
      JURISDICTION_COUNTRY[fallback],
      country,
      `the default jurisdiction for ${country} belongs to another country`,
    );
  }

  // The two lists partition the whole set: nothing is in both, nothing is left out.
  const grouped = COUNTRIES.flatMap((c) => JURISDICTIONS_BY_COUNTRY[c]);
  assert.equal(new Set(grouped).size, grouped.length, 'a jurisdiction appears under two countries');
  assert.equal(grouped.length, Object.keys(JURISDICTION_COUNTRY).length);
});

test('an unknown or absent country falls back to Australia rather than throwing', () => {
  assert.equal(asCountry('MY'), 'MY');
  assert.equal(asCountry('AU'), 'AU');
  assert.equal(asCountry(null), 'AU');
  assert.equal(asCountry(undefined), 'AU');
  assert.equal(asCountry('constructor'), 'AU');
  assert.equal(asCountry('SG'), 'AU');
});

test('both banks are large enough to build a session from', () => {
  assert.deepEqual(validateSeed(), []);

  for (const country of COUNTRIES) {
    const inCountry = QUESTIONS.filter((q) => JURISDICTION_COUNTRY[q.jurisdiction] === country);
    assert.ok(
      inCountry.length >= 30,
      `only ${inCountry.length} ${country} questions; a 30 question diagnostic cannot be built`,
    );
  }
});

test('a seed file never mixes countries except the one that is meant to', () => {
  // The files are split by country by convention, and convention is not a
  // guarantee: a question filed under Australia but tagged MY_GENERAL would be
  // served to Australian learners with Malaysian law in it.
  //
  // `hierarchy.ts` is the deliberate exception. It holds the drawn court
  // questions for both countries, because the diagram is one mechanism and
  // splitting it would mean two files that have to be kept in step.
  const SEED_DIR = path.join(ROOT, 'src/content/seed/questions');
  const MIXED_ON_PURPOSE = new Set(['hierarchy.ts']);

  const expected: Record<string, Country> = { 'malaysia.ts': 'MY' };

  for (const file of fs.readdirSync(SEED_DIR)) {
    if (!file.endsWith('.ts') || MIXED_ON_PURPOSE.has(file)) continue;

    const source = fs.readFileSync(path.join(SEED_DIR, file), 'utf8');
    const slugs = [...source.matchAll(/slug: '([^']+)'/g)].map((m) => m[1]);
    assert.ok(slugs.length > 0, `${file} has no questions`);

    const wanted = expected[file] ?? 'AU';

    for (const slug of slugs) {
      const question = QUESTIONS.find((q) => q.slug === slug);
      assert.ok(question, `${slug} is in ${file} but not in QUESTIONS`);
      assert.equal(
        JURISDICTION_COUNTRY[question.jurisdiction],
        wanted,
        `${slug} is in ${file} but tagged ${question.jurisdiction}`,
      );
    }
  }
});

/* -------------------------------------------------------------------------- */
/* Selection                                                                  */
/* -------------------------------------------------------------------------- */

interface Row {
  question_id: string;
  question_version_id: string;
  difficulty: number;
  domain_id: string;
  domain_slug: string;
  country: Country;
}

/**
 * A stand-in for PostgREST that records the filters it was given, so the test
 * can assert the country was applied in the query rather than after it. A
 * filter applied afterwards would still produce the right answer here while
 * loading the whole bank into memory on a real deployment.
 */
function fakeDb(rows: Row[]) {
  const filters: Array<[string, unknown]> = [];

  const builder = (table: string) => {
    let data: unknown[] =
      table === 'v_question_delivery' ? rows : table === 'question_concepts' ? [] : [];

    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: (column: string, value: unknown) => {
        filters.push([column, value]);
        if (table === 'v_question_delivery') {
          data = (data as Row[]).filter((r) => (r as never as Record<string, unknown>)[column] === value);
        }
        return chain;
      },
      in: () => chain,
      order: () => chain,
      limit: () => chain,
      gte: () => chain,
      lte: () => chain,
      lt: () => chain,
      gt: () => chain,
      neq: () => chain,
      not: () => chain,
      is: () => chain,
      then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
        resolve({ data, error: null }),
    };
    return chain;
  };

  return { db: { from: builder } as never, filters };
}

function row(id: string, country: Country, domain: string): Row {
  return {
    question_id: id,
    question_version_id: `${id}-v1`,
    difficulty: 1,
    domain_id: domain,
    domain_slug: domain,
    country,
  };
}

test('the diagnostic asks the database for one country, not for everything', async () => {
  const rows = [
    row('au-1', 'AU', 'court-system'),
    row('au-2', 'AU', 'evidence'),
    row('my-1', 'MY', 'court-system'),
    row('my-2', 'MY', 'evidence'),
  ];

  const { db, filters } = fakeDb(rows);
  const selected = await selectDiagnosticQuestions(db, 'MY', 10);

  assert.ok(
    filters.some(([column, value]) => column === 'country' && value === 'MY'),
    'country was not applied as a query filter; the whole bank would be loaded',
  );
  assert.deepEqual(
    selected.map((s) => s.questionId).sort(),
    ['my-1', 'my-2'],
    'an Australian question reached a Malaysian diagnostic',
  );
});

test('a daily session is built from one country only', async () => {
  const rows = [
    row('au-1', 'AU', 'court-system'),
    row('my-1', 'MY', 'court-system'),
    row('my-2', 'MY', 'evidence'),
  ];

  const { db, filters } = fakeDb(rows);
  const selected = await selectDailyQuestions(db, 'user-1', 10, { country: 'MY' });

  assert.ok(filters.some(([c, v]) => c === 'country' && v === 'MY'));
  assert.ok(
    selected.every((s) => s.questionId.startsWith('my-')),
    'an Australian question reached a Malaysian daily session',
  );
});

test('an Australian learner is unaffected by the Malaysian bank existing', async () => {
  const rows = [
    row('au-1', 'AU', 'court-system'),
    row('au-2', 'AU', 'evidence'),
    row('my-1', 'MY', 'court-system'),
  ];

  const { db } = fakeDb(rows);
  const selected = await selectDiagnosticQuestions(db, 'AU', 10);

  assert.deepEqual(selected.map((s) => s.questionId).sort(), ['au-1', 'au-2']);
});

/* -------------------------------------------------------------------------- */
/* Publication                                                                */
/* -------------------------------------------------------------------------- */

test('the seeder cannot be asked to publish the Malaysian bank', () => {
  // The flag on the setup page publishes the Australian content so a fresh
  // install works out of the box. It must not be able to reach content that no
  // Malaysian-qualified person has ever read.
  const source = fs.readFileSync(path.join(ROOT, 'src/lib/setup/seed-content.ts'), 'utf8');

  assert.match(
    source,
    /const statusFor = \(country: Country\) =>[\s\S]{0,120}?'requires_review'/,
    'the Malaysian override is gone; check seed-content.ts',
  );

  // Every write of a status must go through the override. Matching on the
  // exact insert text was not enough: adding one field to the object slipped
  // the raw status past the check, which is precisely the mistake that would
  // publish 41 unread Malaysian questions.
  const statusWrites = [...source.matchAll(/\bstatus(?::\s*([^,\n}]+))?[,\n}]/g)]
    .map((m) => (m[1] ?? 'status').trim())
    .filter((value) => value !== 'status: string' && !value.startsWith('options'));

  const raw = statusWrites.filter((value) => value === 'status');
  assert.deepEqual(
    raw,
    [],
    'a status is written without statusFor(country); the Malaysian bank could be published',
  );
});

test('the Malaysian bank says plainly that nobody qualified has read it', () => {
  const source = fs.readFileSync(
    path.join(ROOT, 'src/content/seed/questions/malaysia.ts'),
    'utf8',
  );
  assert.match(source, /no Malaysian legal\s+\*? ?qualification/);

  // And nothing in it claims otherwise.
  for (const question of QUESTIONS) {
    if (JURISDICTION_COUNTRY[question.jurisdiction] !== 'MY') continue;
    assert.ok(
      !/verified|confirmed by|checked by a/i.test(question.explanation),
      `${question.slug} implies it has been verified`,
    );
  }
});

test('the Malaysian facts, if any, are tagged Malaysian', () => {
  for (const fact of FACTS) {
    assert.ok(
      JURISDICTION_COUNTRY[fact.jurisdiction],
      `fact ${fact.slug} has a jurisdiction that belongs to no country`,
    );
  }
});

test('every server action accepts every jurisdiction that exists', () => {
  // Three actions each carried their own hand-written copy of this list, and
  // adding Malaysia left all three listing only the Australian values. An
  // administrator could then pick a Malaysian jurisdiction from a form that
  // would reject it on submit, with a validation message naming no field.
  const files = [
    'src/app/admin/actions.ts',
    'src/app/admin/facts/actions.ts',
    'src/app/(app)/actions.ts',
  ];

  for (const file of files) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.ok(
      source.includes('z.enum(JURISDICTION_VALUES)'),
      `${file} does not validate jurisdictions against the shared list`,
    );
    assert.ok(
      !/z\.enum\(\[\s*'AU_GENERAL'/.test(source),
      `${file} still has its own copy of the jurisdiction list`,
    );
  }
});

/* -------------------------------------------------------------------------- */
/* The drawn hierarchy                                                        */
/* -------------------------------------------------------------------------- */

test('every option on a hierarchy question is a court in that country diagram', () => {
  // The option id is what places a court in the picture. An id that is not in
  // the hierarchy renders as an answer missing from the diagram, which is
  // unanswerable rather than merely wrong.
  const drawn = QUESTIONS.filter((q) => q.type === 'court_hierarchy');
  assert.ok(drawn.length >= 6, `only ${drawn.length} hierarchy questions`);

  for (const question of drawn) {
    const country = JURISDICTION_COUNTRY[question.jurisdiction];
    const slugs = new Set(COURT_HIERARCHIES[country].courts.map((c) => c.slug));

    for (const option of question.options) {
      assert.ok(
        slugs.has(option.id),
        `${question.slug} offers "${option.id}", which is not a court in the ${country} hierarchy`,
      );
    }
    for (const id of question.correct) {
      assert.ok(slugs.has(id), `${question.slug} has answer "${id}" outside the hierarchy`);
    }
  }
});

test('each hierarchy is a single tree that reaches its apex', () => {
  for (const country of COUNTRIES) {
    const hierarchy = COURT_HIERARCHIES[country];
    const bySlug = new Map(hierarchy.courts.map((c) => [c.slug, c]));

    const apexes = hierarchy.courts.filter((c) => c.appealsTo === null);
    assert.equal(apexes.length, 1, `${country} has ${apexes.length} apex courts`);
    assert.equal(apexes[0].tier, 0, `the ${country} apex is not drawn at the top`);

    for (const court of hierarchy.courts) {
      if (!court.appealsTo) continue;

      const parent = bySlug.get(court.appealsTo);
      assert.ok(parent, `${court.slug} appeals to "${court.appealsTo}", which does not exist`);
      assert.ok(
        parent.tier < court.tier,
        `${court.slug} appeals to ${parent.slug}, which is drawn below it`,
      );

      // Walk to the top, so a cycle fails here rather than hanging the browser.
      let cursor = parent;
      let steps = 0;
      while (cursor.appealsTo) {
        cursor = bySlug.get(cursor.appealsTo)!;
        steps += 1;
        assert.ok(steps < 20, `appeal route from ${court.slug} does not terminate`);
      }
      assert.equal(cursor.slug, apexes[0].slug, `${court.slug} does not reach the apex`);
    }

    assert.ok(tiersOf(hierarchy).length >= 3, `the ${country} diagram has too few rows to be one`);
  }
});
