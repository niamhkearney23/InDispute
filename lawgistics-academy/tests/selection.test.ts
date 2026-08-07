import assert from 'node:assert/strict';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  selectDailyQuestions,
  selectDiagnosticQuestions,
} from '../src/lib/learning/selection';
import { TRAINING_MIX } from '../src/lib/learning/config';

/**
 * The selection engine talks to the database through a small, fixed set of
 * queries. Rather than stand up Postgres for this, we hand it a stub that
 * answers those queries from in-memory fixtures — which lets us assert on the
 * composition of a session directly.
 */

type Row = Record<string, unknown>;

function stubClient(tables: Record<string, Row[]>): SupabaseClient {
  const builder = (rows: Row[]) => {
    const chain = {
      select: () => chain,
      eq: () => chain,
      gte: () => chain,
      lte: () => chain,
      in: () => chain,
      order: () => chain,
      limit: () => chain,
      then: (resolve: (value: { data: Row[]; error: null }) => unknown) =>
        Promise.resolve({ data: rows, error: null }).then(resolve),
    };
    return chain;
  };

  return {
    from: (table: string) => builder(tables[table] ?? []),
  } as unknown as SupabaseClient;
}

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

const DOMAINS = ['court-system', 'civil-procedure', 'evidence', 'advocacy'];

/** 40 questions: 10 per domain, one concept each, concept index 0..39. */
function makeBank() {
  const delivery: Row[] = [];
  const links: Row[] = [];

  let n = 0;
  for (const domain of DOMAINS) {
    for (let i = 0; i < 10; i += 1) {
      const questionId = `q-${n}`;
      delivery.push({
        question_id: questionId,
        question_version_id: `v-${n}`,
        difficulty: (i % 5) + 1,
        domain_id: `d-${domain}`,
        domain_slug: domain,
      });
      links.push({ question_id: questionId, concept_id: `c-${n}` });
      n += 1;
    }
  }

  return { delivery, links };
}

const BANK = makeBank();

/* -------------------------------------------------------------------------- */
/* Daily selection                                                            */
/* -------------------------------------------------------------------------- */

test('a brand new learner gets a full session of new material', async () => {
  const db = stubClient({
    v_question_delivery: BANK.delivery,
    question_concepts: BANK.links,
    user_concept_mastery: [],
    review_schedule: [],
    user_question_attempts: [],
  });

  const selected = await selectDailyQuestions(db, 'user-1', 10);

  assert.equal(selected.length, 10, 'a full session is produced on day one');
  assert.equal(
    new Set(selected.map((q) => q.questionId)).size,
    10,
    'no question appears twice in one session',
  );
  assert.ok(
    selected.every((q) => q.reason === 'new_material'),
    'with no history, everything is new material',
  );
});

test('the mix is honoured once a learner has history', async () => {
  // Concepts 0-4 are weak, 10-14 are due for review, 20-24 are strong,
  // and everything else has never been seen.
  const mastery: Row[] = [];
  for (let i = 0; i < 5; i += 1) {
    mastery.push({ concept_id: `c-${i}`, mastery: 20, attempts: 6 });
  }
  for (let i = 10; i < 15; i += 1) {
    mastery.push({ concept_id: `c-${i}`, mastery: 65, attempts: 4 });
  }
  for (let i = 20; i < 25; i += 1) {
    mastery.push({ concept_id: `c-${i}`, mastery: 95, attempts: 8 });
  }

  const db = stubClient({
    v_question_delivery: BANK.delivery,
    question_concepts: BANK.links,
    user_concept_mastery: mastery,
    review_schedule: Array.from({ length: 5 }, (_, i) => ({ concept_id: `c-${i + 10}` })),
    // Seen, but long enough ago that the cooldown does not apply.
    user_question_attempts: [],
  });

  const count = 10;
  const selected = await selectDailyQuestions(db, 'user-1', count);

  assert.equal(selected.length, count);

  const byReason = selected.reduce<Record<string, number>>((acc, q) => {
    acc[q.reason] = (acc[q.reason] ?? 0) + 1;
    return acc;
  }, {});

  assert.equal(byReason.weakness, Math.round(TRAINING_MIX.weakness * count));
  assert.equal(byReason.due_review, Math.round(TRAINING_MIX.due_review * count));
  assert.equal(byReason.new_material, Math.round(TRAINING_MIX.new_material * count));
  assert.equal(byReason.reinforcement, Math.round(TRAINING_MIX.reinforcement * count));
});

test('a shortfall in one bucket spills into the others rather than shipping a short session', async () => {
  // Everything is weak; nothing is due, new or strong.
  const mastery = BANK.links.map((link) => ({
    concept_id: link.concept_id,
    mastery: 15,
    attempts: 5,
  }));

  const db = stubClient({
    v_question_delivery: BANK.delivery,
    question_concepts: BANK.links,
    user_concept_mastery: mastery,
    review_schedule: [],
    user_question_attempts: [],
  });

  const selected = await selectDailyQuestions(db, 'user-1', 12);

  assert.equal(selected.length, 12, 'the session is still full');
  assert.ok(selected.every((q) => q.reason === 'weakness'));
});

test('recently answered questions are avoided while there is other material', async () => {
  const recent = BANK.delivery.slice(0, 30).map((row) => ({ question_id: row.question_id }));

  const db = stubClient({
    v_question_delivery: BANK.delivery,
    question_concepts: BANK.links,
    user_concept_mastery: [],
    review_schedule: [],
    user_question_attempts: recent,
  });

  const selected = await selectDailyQuestions(db, 'user-1', 10);
  const recentIds = new Set(recent.map((r) => r.question_id));

  assert.equal(selected.length, 10);
  assert.ok(
    selected.every((q) => !recentIds.has(q.questionId)),
    'today’s questions should not repeat while unseen ones remain',
  );
});

test('a bank smaller than the session still produces a session', async () => {
  const small = {
    delivery: BANK.delivery.slice(0, 4),
    links: BANK.links.slice(0, 4),
  };

  const db = stubClient({
    v_question_delivery: small.delivery,
    question_concepts: small.links,
    user_concept_mastery: [],
    review_schedule: [],
    user_question_attempts: small.delivery.map((r) => ({ question_id: r.question_id })),
  });

  const selected = await selectDailyQuestions(db, 'user-1', 10);

  assert.equal(selected.length, 4, 'it serves what exists rather than repeating within a session');
  assert.equal(new Set(selected.map((q) => q.questionId)).size, 4);
});

test('an empty question bank yields an empty session rather than throwing', async () => {
  const db = stubClient({
    v_question_delivery: [],
    question_concepts: [],
    user_concept_mastery: [],
    review_schedule: [],
    user_question_attempts: [],
  });

  assert.deepEqual(await selectDailyQuestions(db, 'user-1', 10), []);
  assert.deepEqual(await selectDiagnosticQuestions(db, 30), []);
});

test('stated interests bias selection without excluding anything', async () => {
  const db = stubClient({
    v_question_delivery: BANK.delivery,
    question_concepts: BANK.links,
    user_concept_mastery: [],
    review_schedule: [],
    user_question_attempts: [],
  });

  const selected = await selectDailyQuestions(db, 'user-1', 8, {
    preferredDomainSlugs: ['advocacy'],
  });

  const domainOf = new Map(
    BANK.delivery.map((row) => [row.question_id as string, row.domain_slug as string]),
  );
  const advocacyCount = selected.filter((q) => domainOf.get(q.questionId) === 'advocacy').length;

  assert.ok(
    advocacyCount >= 4,
    `a stated interest should be well represented, got ${advocacyCount} of ${selected.length}`,
  );
});

/* -------------------------------------------------------------------------- */
/* Diagnostic selection                                                       */
/* -------------------------------------------------------------------------- */

test('the diagnostic spreads evenly across domains', async () => {
  const db = stubClient({
    v_question_delivery: BANK.delivery,
    question_concepts: BANK.links,
  });

  const selected = await selectDiagnosticQuestions(db, 24);
  assert.equal(selected.length, 24);

  const domainOf = new Map(
    BANK.delivery.map((row) => [row.question_id as string, row.domain_slug as string]),
  );
  const counts = DOMAINS.map(
    (domain) => selected.filter((q) => domainOf.get(q.questionId) === domain).length,
  );

  assert.deepEqual(counts, [6, 6, 6, 6], 'four domains, 24 questions, six each');
  assert.ok(selected.every((q) => q.reason === 'diagnostic_spread'));
});

test('the diagnostic never repeats a question', async () => {
  const db = stubClient({
    v_question_delivery: BANK.delivery,
    question_concepts: BANK.links,
  });

  const selected = await selectDiagnosticQuestions(db, 40);
  assert.equal(new Set(selected.map((q) => q.questionId)).size, selected.length);
});

test('the diagnostic asks for more questions than exist without hanging', async () => {
  const db = stubClient({
    v_question_delivery: BANK.delivery.slice(0, 6),
    question_concepts: BANK.links.slice(0, 6),
  });

  const selected = await selectDiagnosticQuestions(db, 30);
  assert.equal(selected.length, 6);
});
