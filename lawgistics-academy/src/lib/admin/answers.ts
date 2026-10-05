import 'server-only';
import { createServiceClient } from '@/lib/supabase/service';
import { getModuleProgress, type ModuleProgress } from '@/lib/modules/service';
import type { Country } from '@/lib/types';
import { supervisedIds } from './supervision';

/**
 * How each learner is getting on with the questions, for staff. Service-role
 * reads, so every caller has passed requireCoach and says whether the
 * reader is an administrator: a coach sees the people the firm supervises,
 * an administrator everybody who is not staff. Read only; nothing here
 * changes a record.
 */

/** How far back the list's figures look. */
export const RECENT_DAYS = 30;

export interface LearnerRow {
  id: string;
  name: string;
  email: string | null;
  trainee: boolean;
  /** Answers in the last RECENT_DAYS days. */
  answered: number;
  /** Of those, how many were right. */
  right: number;
  /** When they last answered anything, if within RECENT_DAYS days. */
  lastAnswered: string | null;
  /** The concept they are weakest on, from two or more answers. */
  weakest: string | null;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  email: string | null;
  country: string | null;
  track: string | null;
  is_admin: boolean | null;
  is_coach: boolean | null;
}

const nameOf = (p: Pick<ProfileRow, 'display_name' | 'email'>) =>
  p.display_name?.trim() || p.email || 'Someone';

/**
 * The learners this reader may see, with the last RECENT_DAYS days of their
 * answers summarised. Staff accounts are left out: they are not learners.
 */
export async function learnerList(isAdmin: boolean): Promise<LearnerRow[]> {
  const db = createServiceClient();
  let query = db
    .from('profiles')
    .select('id, display_name, email, country, track, is_admin, is_coach')
    .order('display_name');
  if (!isAdmin) {
    const ids = [...(await supervisedIds())];
    if (ids.length === 0) return [];
    query = query.in('id', ids);
  }
  const { data } = await query.limit(500);
  const people = ((data ?? []) as ProfileRow[]).filter((p) => !p.is_admin && !p.is_coach);
  if (people.length === 0) return [];
  const ids = people.map((p) => p.id);

  const since = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: attempts }, { data: mastery }] = await Promise.all([
    db
      .from('user_question_attempts')
      .select('user_id, is_correct, answered_at')
      .in('user_id', ids)
      .gte('answered_at', since),
    db
      .from('user_concept_mastery')
      .select('user_id, mastery, attempts, concepts(name)')
      .in('user_id', ids)
      .gte('attempts', 2),
  ]);

  const stats = new Map<string, { answered: number; right: number; last: string | null }>();
  for (const a of (attempts ?? []) as Array<{ user_id: string; is_correct: boolean; answered_at: string }>) {
    const s = stats.get(a.user_id) ?? { answered: 0, right: 0, last: null };
    s.answered += 1;
    if (a.is_correct) s.right += 1;
    if (!s.last || a.answered_at > s.last) s.last = a.answered_at;
    stats.set(a.user_id, s);
  }
  const weakest = new Map<string, { name: string; mastery: number }>();
  for (const m of (mastery ?? []) as unknown as Array<{
    user_id: string;
    mastery: number;
    concepts: { name: string } | null;
  }>) {
    if (!m.concepts) continue;
    const held = weakest.get(m.user_id);
    if (!held || Number(m.mastery) < held.mastery) {
      weakest.set(m.user_id, { name: m.concepts.name, mastery: Number(m.mastery) });
    }
  }

  return people.map((p) => {
    const s = stats.get(p.id);
    return {
      id: p.id,
      name: nameOf(p),
      email: p.email,
      trainee: p.track === 'litigation_trainee',
      answered: s?.answered ?? 0,
      right: s?.right ?? 0,
      lastAnswered: s?.last ?? null,
      weakest: weakest.get(p.id)?.name ?? null,
    };
  });
}

export interface WrongAnswer {
  answeredAt: string;
  stem: string;
  chose: string;
  right: string;
}

export interface WeakConcept {
  name: string;
  mastery: number;
  attempts: number;
  correct: number;
}

export interface LearnerDetail {
  id: string;
  name: string;
  email: string | null;
  trainee: boolean;
  totalAnswered: number;
  totalRight: number;
  modules: ModuleProgress[];
  weak: WeakConcept[];
  wrong: WrongAnswer[];
}

/**
 * One learner's picture: every answer counted, the modules, the concepts
 * they are weakest on, and their most recent wrong answers with what they
 * chose and what was right. Null if they do not exist or are staff.
 */
export async function learnerDetail(userId: string): Promise<LearnerDetail | null> {
  const db = createServiceClient();
  const { data: p } = await db
    .from('profiles')
    .select('id, display_name, email, country, track, is_admin, is_coach')
    .eq('id', userId)
    .maybeSingle();
  const profile = p as ProfileRow | null;
  if (!profile || profile.is_admin || profile.is_coach) return null;

  const [total, right, mastery, wrongRows, modules] = await Promise.all([
    db.from('user_question_attempts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    db
      .from('user_question_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_correct', true),
    db
      .from('user_concept_mastery')
      .select('mastery, attempts, correct, concepts(name)')
      .eq('user_id', userId)
      .gte('attempts', 2)
      .order('mastery', { ascending: true })
      .limit(6),
    db
      .from('user_question_attempts')
      .select('answered_at, selected_option_ids, question_versions(stem, options, correct_option_ids)')
      .eq('user_id', userId)
      .eq('is_correct', false)
      .order('answered_at', { ascending: false })
      .limit(25),
    getModuleProgress(userId, (profile.country === 'MY' ? 'MY' : 'AU') as Country),
  ]);

  const textOf = (options: Array<{ id: string; text: string }>, ids: string[]) =>
    ids.map((id) => options.find((o) => o.id === id)?.text ?? id.toUpperCase()).join('; ');

  return {
    id: profile.id,
    name: nameOf(profile),
    email: profile.email,
    trainee: profile.track === 'litigation_trainee',
    totalAnswered: total.count ?? 0,
    totalRight: right.count ?? 0,
    modules: modules.filter((m) => m.total > 0),
    weak: ((mastery.data ?? []) as unknown as Array<{
      mastery: number;
      attempts: number;
      correct: number;
      concepts: { name: string } | null;
    }>)
      .filter((m) => m.concepts)
      .map((m) => ({
        name: m.concepts!.name,
        mastery: Math.round(Number(m.mastery)),
        attempts: m.attempts,
        correct: m.correct,
      })),
    wrong: ((wrongRows.data ?? []) as unknown as Array<{
      answered_at: string;
      selected_option_ids: string[];
      question_versions: {
        stem: string;
        options: Array<{ id: string; text: string }>;
        correct_option_ids: string[];
      } | null;
    }>)
      .filter((w) => w.question_versions)
      .map((w) => ({
        answeredAt: w.answered_at,
        stem: w.question_versions!.stem,
        chose: textOf(w.question_versions!.options ?? [], w.selected_option_ids ?? []),
        right: textOf(w.question_versions!.options ?? [], w.question_versions!.correct_option_ids ?? []),
      })),
  };
}
