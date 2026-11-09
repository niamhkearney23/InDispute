/**
 * The start-to-end report's reader, against real Supabase: a person's first
 * diagnostic against their latest, read in order whatever order they were
 * written in, a person with one sitting and a person with none.
 */
import './target-guard';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { person, service } from './helpers';
import { improvementRows, type Person } from '../src/lib/reports/data';
import { cohortImprovement } from '../src/lib/reports/rules';

async function sit(userId: string, at: string, correct: number, scores: Record<string, number>) {
  const db = service();
  const s = await db
    .from('training_sessions')
    .insert({ user_id: userId, kind: 'diagnostic', status: 'completed', planned_question_count: 30, completed_at: at })
    .select('id')
    .single();
  if (s.error) throw s.error;
  const r = await db.from('diagnostic_results').insert({
    user_id: userId,
    session_id: s.data.id,
    domain_scores: scores,
    total_questions: 30,
    total_correct: correct,
    completed_at: at,
  });
  if (r.error) throw r.error;
}

const asPerson = (id: string, name: string): Person => ({ id, name, email: null, role: 'Trainee', cohort: 'Test', startsOn: null, endsOn: null });

test('first against latest, whatever order they were written in; one sitting and none are not changes', async () => {
  const two = await person('learner', 'MY');
  const one = await person('learner', 'MY');
  const none = await person('learner', 'MY');
  // The later sitting is written first, on purpose.
  await sit(two.id, '2026-12-01T09:00:00Z', 21, { evidence: 75, advocacy: 50 });
  await sit(two.id, '2026-11-01T09:00:00Z', 12, { evidence: 50, advocacy: 50 });
  await sit(one.id, '2026-11-02T09:00:00Z', 30, { evidence: 100 });

  const rows = await improvementRows([asPerson(two.id, 'Two'), asPerson(one.id, 'One'), asPerson(none.id, 'None')]);
  assert.ok(rows, 'the sittings were read');
  const by = Object.fromEntries(rows!.map((r) => [r.person.name, r.improvement]));
  assert.equal(by.Two.first?.date, '2026-11-01');
  assert.equal(by.Two.latest?.date, '2026-12-01');
  assert.equal(by.Two.change, 30);
  assert.equal(by.Two.areas.find((a) => a.slug === 'evidence')?.change, 25);
  assert.equal(by.One.sittings, 1);
  assert.equal(by.One.change, null);
  assert.equal(by.None.sittings, 0);

  const cohort = cohortImprovement(rows!.map((r) => r.improvement));
  assert.equal(cohort.measured, 1);
  assert.equal(cohort.startedOnly, 1);
  assert.equal(cohort.none, 1);
  assert.equal(cohort.averageChange, 30, 'only the person with two sittings is averaged');
});
