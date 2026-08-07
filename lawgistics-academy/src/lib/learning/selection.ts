import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  DIAGNOSTIC_QUESTION_COUNT,
  MASTERY,
  MIX_FALLBACK_ORDER,
  REPEAT_COOLDOWN_HOURS,
  TRAINING_MIX,
  type MixBucket,
} from './config';
import type { SelectionReason } from '@/lib/types';

/**
 * Session composition.
 *
 * Reads the learner's mastery and review schedule, buckets the published
 * question bank against them, and fills a session to the mix defined in
 * `config.ts`. Anything it cannot fill from one bucket spills into the next,
 * so a learner always gets a full session even on day one when nothing is due
 * and nothing is weak yet.
 *
 * The whole bank is loaded per session. That is the right trade at MVP scale
 * (hundreds of questions); past a few thousand this becomes a SQL-side query.
 */

const BUCKET_TO_REASON: Record<MixBucket, SelectionReason> = {
  weakness: 'weakness',
  due_review: 'due_review',
  new_material: 'new_material',
  reinforcement: 'reinforcement',
};

interface BankQuestion {
  questionId: string;
  questionVersionId: string;
  difficulty: number;
  domainId: string;
  domainSlug: string;
  conceptIds: string[];
}

export interface SelectedQuestion {
  questionId: string;
  questionVersionId: string;
  reason: SelectionReason;
}

async function loadBank(db: SupabaseClient): Promise<BankQuestion[]> {
  const [{ data: rows, error }, { data: links, error: linkError }] = await Promise.all([
    db
      .from('v_question_delivery')
      .select('question_id, question_version_id, difficulty, domain_id, domain_slug'),
    db.from('question_concepts').select('question_id, concept_id'),
  ]);

  if (error) throw new Error(`Failed to load question bank: ${error.message}`);
  if (linkError) throw new Error(`Failed to load concept links: ${linkError.message}`);

  const conceptsByQuestion = new Map<string, string[]>();
  for (const link of links ?? []) {
    const list = conceptsByQuestion.get(link.question_id) ?? [];
    list.push(link.concept_id);
    conceptsByQuestion.set(link.question_id, list);
  }

  return (rows ?? []).map((row) => ({
    questionId: row.question_id,
    questionVersionId: row.question_version_id,
    difficulty: row.difficulty,
    domainId: row.domain_id,
    domainSlug: row.domain_slug,
    conceptIds: conceptsByQuestion.get(row.question_id) ?? [],
  }));
}

interface LearnerState {
  masteryByConcept: Map<string, { mastery: number; attempts: number }>;
  dueConceptIds: Set<string>;
  recentQuestionIds: Set<string>;
  seenQuestionIds: Set<string>;
}

async function loadLearnerState(
  db: SupabaseClient,
  userId: string,
): Promise<LearnerState> {
  const cooldownSince = new Date(
    Date.now() - REPEAT_COOLDOWN_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const [mastery, due, recent, seen] = await Promise.all([
    db
      .from('user_concept_mastery')
      .select('concept_id, mastery, attempts')
      .eq('user_id', userId),
    db
      .from('review_schedule')
      .select('concept_id')
      .eq('user_id', userId)
      .lte('next_review_at', new Date().toISOString()),
    db
      .from('user_question_attempts')
      .select('question_id')
      .eq('user_id', userId)
      .gte('answered_at', cooldownSince),
    db.from('user_question_attempts').select('question_id').eq('user_id', userId),
  ]);

  return {
    masteryByConcept: new Map(
      (mastery.data ?? []).map((row) => [
        row.concept_id as string,
        { mastery: Number(row.mastery), attempts: row.attempts as number },
      ]),
    ),
    dueConceptIds: new Set((due.data ?? []).map((r) => r.concept_id as string)),
    recentQuestionIds: new Set((recent.data ?? []).map((r) => r.question_id as string)),
    seenQuestionIds: new Set((seen.data ?? []).map((r) => r.question_id as string)),
  };
}

/** Lowest concept mastery on the question — a chain is as weak as its link. */
function weakestConceptScore(q: BankQuestion, state: LearnerState): number | null {
  let lowest: number | null = null;
  for (const conceptId of q.conceptIds) {
    const entry = state.masteryByConcept.get(conceptId);
    if (!entry || entry.attempts === 0) continue;
    lowest = lowest === null ? entry.mastery : Math.min(lowest, entry.mastery);
  }
  return lowest;
}

function isUntouched(q: BankQuestion, state: LearnerState): boolean {
  if (state.seenQuestionIds.has(q.questionId)) return false;
  return q.conceptIds.every((id) => {
    const entry = state.masteryByConcept.get(id);
    return !entry || entry.attempts === 0;
  });
}

function bucketQuestions(bank: BankQuestion[], state: LearnerState) {
  const buckets: Record<MixBucket, BankQuestion[]> = {
    weakness: [],
    due_review: [],
    new_material: [],
    reinforcement: [],
  };

  for (const q of bank) {
    if (q.conceptIds.some((id) => state.dueConceptIds.has(id))) {
      buckets.due_review.push(q);
    }

    const score = weakestConceptScore(q, state);
    if (score !== null && score <= MASTERY.weaknessThreshold) {
      buckets.weakness.push(q);
    } else if (score !== null && score >= MASTERY.masteredThreshold) {
      buckets.reinforcement.push(q);
    }

    if (isUntouched(q, state)) {
      buckets.new_material.push(q);
    }
  }

  // Weakest first, so a session leads with what actually needs work.
  buckets.weakness.sort(
    (a, b) => (weakestConceptScore(a, state) ?? 0) - (weakestConceptScore(b, state) ?? 0),
  );
  buckets.new_material.sort((a, b) => a.difficulty - b.difficulty);
  shuffle(buckets.due_review);
  shuffle(buckets.reinforcement);

  return buckets;
}

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export async function selectDailyQuestions(
  db: SupabaseClient,
  userId: string,
  count: number,
  options: { preferredDomainSlugs?: string[] } = {},
): Promise<SelectedQuestion[]> {
  const [bank, state] = await Promise.all([loadBank(db), loadLearnerState(db, userId)]);
  if (bank.length === 0) return [];

  const preferred = new Set(options.preferredDomainSlugs ?? []);
  const buckets = bucketQuestions(bank, state);

  // Nudge — not force — the learner's stated interests to the front.
  if (preferred.size > 0) {
    for (const key of MIX_FALLBACK_ORDER) {
      buckets[key].sort((a, b) => {
        const aPref = preferred.has(a.domainSlug) ? 0 : 1;
        const bPref = preferred.has(b.domainSlug) ? 0 : 1;
        return aPref - bPref;
      });
    }
  }

  const chosen: SelectedQuestion[] = [];
  const usedIds = new Set<string>();

  const take = (bucket: MixBucket, wanted: number, allowRecent: boolean) => {
    for (const q of buckets[bucket]) {
      if (chosen.length >= count) return;
      if (wanted <= 0) return;
      if (usedIds.has(q.questionId)) continue;
      if (!allowRecent && state.recentQuestionIds.has(q.questionId)) continue;

      usedIds.add(q.questionId);
      chosen.push({
        questionId: q.questionId,
        questionVersionId: q.questionVersionId,
        reason: BUCKET_TO_REASON[bucket],
      });
      wanted -= 1;
    }
  };

  for (const bucket of MIX_FALLBACK_ORDER) {
    take(bucket, Math.round(TRAINING_MIX[bucket] * count), false);
  }

  // Spill: whatever the mix could not fill, take from the other buckets in
  // priority order rather than shipping a short session.
  for (const bucket of MIX_FALLBACK_ORDER) {
    take(bucket, count - chosen.length, false);
  }

  // Last resort: a small bank means repeating today's questions beats an empty
  // screen. Cooldown is a preference, not a guarantee.
  if (chosen.length < count) {
    for (const bucket of MIX_FALLBACK_ORDER) {
      take(bucket, count - chosen.length, true);
    }
    for (const q of shuffle([...bank])) {
      if (chosen.length >= count) break;
      if (usedIds.has(q.questionId)) continue;
      usedIds.add(q.questionId);
      chosen.push({
        questionId: q.questionId,
        questionVersionId: q.questionVersionId,
        reason: 'reinforcement',
      });
    }
  }

  return chosen.slice(0, count);
}

/**
 * The diagnostic is a different job: measure breadth, not fix weakness. Spread
 * evenly across domains and lean towards the easier end so a beginner still
 * produces signal rather than 30 blanks.
 */
export async function selectDiagnosticQuestions(
  db: SupabaseClient,
  count: number = DIAGNOSTIC_QUESTION_COUNT,
): Promise<SelectedQuestion[]> {
  const bank = await loadBank(db);
  if (bank.length === 0) return [];

  const byDomain = new Map<string, BankQuestion[]>();
  for (const q of bank) {
    const list = byDomain.get(q.domainSlug) ?? [];
    list.push(q);
    byDomain.set(q.domainSlug, list);
  }

  for (const list of byDomain.values()) {
    shuffle(list);
    // Easiest-first within a domain, with the shuffle breaking ties so two
    // learners don't sit an identical paper.
    list.sort((a, b) => a.difficulty - b.difficulty);
  }

  const domains = [...byDomain.keys()].sort();
  const chosen: SelectedQuestion[] = [];
  const cursors = new Map(domains.map((d) => [d, 0]));

  // Round-robin across domains until the paper is full.
  let exhausted = false;
  while (chosen.length < count && !exhausted) {
    exhausted = true;
    for (const domain of domains) {
      if (chosen.length >= count) break;
      const list = byDomain.get(domain)!;
      const cursor = cursors.get(domain)!;
      if (cursor >= list.length) continue;

      exhausted = false;
      cursors.set(domain, cursor + 1);
      const q = list[cursor];
      chosen.push({
        questionId: q.questionId,
        questionVersionId: q.questionVersionId,
        reason: 'diagnostic_spread',
      });
    }
  }

  return chosen;
}
