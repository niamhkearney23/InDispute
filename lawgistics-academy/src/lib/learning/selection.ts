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
import type { Country, SelectionReason } from '@/lib/types';

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

/**
 * The question bank, for one country.
 *
 * The filter is applied in the query rather than after it. A Malaysian learner
 * must never hold an Australian question in memory, let alone see one: the two
 * are different bodies of law, and a rule from the wrong one is not merely
 * irrelevant, it is wrong.
 */
async function loadBank(db: SupabaseClient, country: Country): Promise<BankQuestion[]> {
  const [{ data: rows, error }, { data: links, error: linkError }] = await Promise.all([
    db
      .from('v_question_delivery')
      .select('question_id, question_version_id, difficulty, domain_id, domain_slug')
      .eq('country', country),
    db.from('question_concepts').select('question_id, concept_id'),
  ]);

  // The detail goes to the log; what is thrown is a plain sentence, because
  // a thrown message can travel all the way to the button that was pressed.
  if (error || linkError) {
    console.error('[selection] the question bank could not be read', error ?? linkError);
    throw new Error('The questions could not be loaded just now.');
  }

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
  /** Questions last answered wrong, outside the cooldown, the longest-waiting first. */
  missedQuestionIds: string[];
}

const ATTEMPT_PAGE = 1000;
const ATTEMPT_PAGES = 50;

/**
 * Questions this learner's latest answer to was wrong, and which they have
 * not been asked inside the cooldown, oldest miss first.
 *
 * Read page by page, as `answerMarks` is: a busy learner passes the thousand
 * rows a request returns, and a cut-off history would hide a later right
 * answer or an early wrong one. Rows come oldest first, so the last one kept
 * for a question is its latest. Answering that same question right takes it
 * out; nothing else does.
 */
export async function missedQuestions(
  db: SupabaseClient,
  userId: string,
  cooldownSince: string,
): Promise<string[]> {
  const latest = new Map<string, { correct: boolean; at: string }>();
  for (let page = 0; page < ATTEMPT_PAGES; page++) {
    const { data, error } = await db
      .from('user_question_attempts')
      .select('question_id, is_correct, answered_at')
      .eq('user_id', userId)
      .order('answered_at', { ascending: true })
      .order('id', { ascending: true })
      .range(page * ATTEMPT_PAGE, page * ATTEMPT_PAGE + ATTEMPT_PAGE - 1);
    if (error) return [];
    for (const row of (data ?? []) as Array<{ question_id: string; is_correct: boolean; answered_at: string }>) {
      latest.delete(row.question_id);
      latest.set(row.question_id, { correct: row.is_correct === true, at: row.answered_at });
    }
    if ((data ?? []).length < ATTEMPT_PAGE) break;
  }
  const cutoff = new Date(cooldownSince).getTime();
  // Re-inserting on every row keeps the map in order of each question's
  // latest answer, so the longest-waiting miss comes first.
  return [...latest.entries()]
    .filter(([, a]) => !a.correct && typeof a.at === 'string' && new Date(a.at).getTime() < cutoff)
    .map(([id]) => id);
}

async function loadLearnerState(
  db: SupabaseClient,
  userId: string,
): Promise<LearnerState> {
  const cooldownSince = new Date(
    Date.now() - REPEAT_COOLDOWN_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const [mastery, due, recent, seen, missed] = await Promise.all([
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
    missedQuestions(db, userId, cooldownSince),
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
    missedQuestionIds: missed,
  };
}

/** Lowest concept mastery on the question, a chain is as weak as its link. */
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
  options: { preferredDomainSlugs?: string[]; country: Country },
): Promise<SelectedQuestion[]> {
  const [bank, state] = await Promise.all([
    loadBank(db, options.country),
    loadLearnerState(db, userId),
  ]);
  if (bank.length === 0) return [];

  const preferred = new Set(options.preferredDomainSlugs ?? []);
  const buckets = bucketQuestions(bank, state);

  // Nudge, not force, the learner's stated interests to the front.
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

  // A question got wrong comes back, first, until that same question is
  // answered right. Mastery alone did not do this: one right answer on a
  // concept could lift it out of "weak" while the question itself, still
  // wrong, never returned. Only questions in this country's bank, so the
  // country filter holds. Up to half the session, so new material still
  // arrives for somebody with a long list; the rest come back in the spill
  // below, before anything else, and in later sessions. Recorded as
  // weakness, the nearest reason the database has.
  const bankById = new Map(bank.map((q) => [q.questionId, q]));
  const missed = state.missedQuestionIds
    .map((id) => bankById.get(id))
    .filter((q): q is BankQuestion => q !== undefined);
  const takeMissed = (wanted: number) => {
    for (const q of missed) {
      if (chosen.length >= count || wanted <= 0) return;
      if (usedIds.has(q.questionId)) continue;
      usedIds.add(q.questionId);
      chosen.push({ questionId: q.questionId, questionVersionId: q.questionVersionId, reason: 'weakness' });
      wanted -= 1;
    }
  };
  takeMissed(Math.ceil(count / 2));

  // The mix shares out what is left, so new material keeps its share.
  const rest = count - chosen.length;
  for (const bucket of MIX_FALLBACK_ORDER) {
    take(bucket, Math.round(TRAINING_MIX[bucket] * rest), false);
  }

  // Spill: whatever the mix could not fill, take from the other buckets in
  // priority order rather than shipping a short session.
  takeMissed(count - chosen.length);
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
 * The diagnostic measures breadth and depth: every area, and in each area a
 * spread from its easiest question to its hardest. It used to take the
 * easiest first in every area, so with thirty questions across eight areas
 * it seldom reached anything hard, and somebody who had never studied
 * Malaysian law came out Advanced (the owner, November 2026: "the questions
 * in the diagnostic are way too easy").
 */
export async function selectDiagnosticQuestions(
  db: SupabaseClient,
  country: Country,
  count: number = DIAGNOSTIC_QUESTION_COUNT,
): Promise<SelectedQuestion[]> {
  const bank = await loadBank(db, country);
  return diagnosticPaper(bank, count).map((q) => ({
    questionId: q.questionId,
    questionVersionId: q.questionVersionId,
    reason: 'diagnostic_spread' as const,
  }));
}

/**
 * The paper itself, pure so it can be tested. Each area gets an even share
 * of the questions (round-robin, as many as it has), and an area's share is
 * spread across its difficulties: with four questions from an area of ten,
 * it takes ones near the easy end, the middle and the hard end, never the
 * four easiest. The paper then runs from easy to hard, so it opens gently
 * and ends on the questions that tell someone who knows a lot from
 * someone who does not. A shuffle breaks ties, so two people do not sit an
 * identical paper.
 */
export function diagnosticPaper<Q extends { domainSlug: string; difficulty: number }>(
  bank: Q[],
  count: number,
  random: () => number = Math.random,
): Q[] {
  const shuffled = <T,>(items: T[]): T[] => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const byDomain = new Map<string, Q[]>();
  for (const q of bank) {
    const list = byDomain.get(q.domainSlug) ?? [];
    list.push(q);
    byDomain.set(q.domainSlug, list);
  }
  for (const [slug, list] of byDomain) {
    byDomain.set(slug, shuffled(list).sort((a, b) => a.difficulty - b.difficulty));
  }

  // How many from each area: round-robin until the paper is full or every
  // area has given all it has.
  const domains = [...byDomain.keys()].sort();
  const share = new Map(domains.map((d) => [d, 0]));
  let given = 0;
  let room = true;
  while (given < count && room) {
    room = false;
    for (const d of domains) {
      if (given >= count) break;
      if (share.get(d)! < byDomain.get(d)!.length) {
        share.set(d, share.get(d)! + 1);
        given += 1;
        room = true;
      }
    }
  }

  // Each area's share, spread evenly along its easy-to-hard list: the
  // middle of each of `k` equal slices, so one question is the middle one,
  // two are the first and second halves' middles, and so on.
  const chosen: Q[] = [];
  for (const d of domains) {
    const list = byDomain.get(d)!;
    const k = share.get(d)!;
    const taken = new Set<number>();
    for (let i = 0; i < k; i += 1) {
      let at = Math.min(list.length - 1, Math.floor(((i + 0.5) * list.length) / k));
      while (taken.has(at)) at = (at + 1) % list.length;
      taken.add(at);
      chosen.push(list[at]);
    }
  }

  return shuffled(chosen).sort((a, b) => a.difficulty - b.difficulty);
}

/**
 * Questions for a named module.
 *
 * Unlike a daily session this is not a mix. A module has a finishing line, so
 * it serves what is still standing between the learner and it: questions never
 * answered correctly, easiest first. Once they are all done, it serves the
 * module again for practice rather than refusing, because revisiting a
 * completed induction is a reasonable thing to want to do.
 */
export async function selectModuleQuestions(
  db: SupabaseClient,
  userId: string,
  country: Country,
  domainSlugs: string[],
  count: number,
): Promise<SelectedQuestion[]> {
  const bank = (await loadBank(db, country)).filter((q) => domainSlugs.includes(q.domainSlug));
  if (bank.length === 0) return [];

  const questionIds = bank.map((q) => q.questionId);
  const { data: attempts } = await db
    .from('user_question_attempts')
    .select('question_id, is_correct')
    .eq('user_id', userId)
    .in('question_id', questionIds);

  const answeredCorrectly = new Set(
    (attempts ?? []).filter((a) => a.is_correct).map((a) => a.question_id as string),
  );

  const outstanding = bank.filter((q) => !answeredCorrectly.has(q.questionId));
  const pool = outstanding.length > 0 ? outstanding : bank;

  shuffle(pool);
  pool.sort((a, b) => a.difficulty - b.difficulty);

  return pool.slice(0, count).map((q) => ({
    questionId: q.questionId,
    questionVersionId: q.questionVersionId,
    reason: 'new_material' as SelectionReason,
  }));
}
