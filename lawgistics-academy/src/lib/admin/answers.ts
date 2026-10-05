import 'server-only';
import { createServiceClient } from '@/lib/supabase/service';
import { getModuleProgress, type ModuleProgress } from '@/lib/modules/service';
import type { Country } from '@/lib/types';
import { staffMayRead, supervisedIds } from './supervision';
import { readCartoon, type CartoonStyle } from '@/lib/avatar/cartoon';

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
  trainee: boolean;
  /** The cartoon they built of themselves, if any. */
  cartoon: CartoonStyle | null;
  /** Answers in the last RECENT_DAYS days. */
  answered: number;
  /** Of those, how many were right. */
  right: number;
  /** When they last answered anything, if within RECENT_DAYS days. */
  lastAnswered: string | null;
  /** The concept they are weakest on, from two or more answers. */
  weakest: string | null;
}

/** The most people one page lists. */
export const LIST_LIMIT = 500;

export interface LearnerList {
  rows: LearnerRow[];
  /** More people than LIST_LIMIT: the page says it shows the first ones. */
  more: boolean;
  /** The figures could not be read: the page says so instead of showing zeros. */
  failed: boolean;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  email: string | null;
  country: string | null;
  track: string | null;
  is_admin: boolean | null;
  is_coach: boolean | null;
  avatar_style: unknown;
}

const nameOf = (p: Pick<ProfileRow, 'display_name' | 'email'>) =>
  p.display_name?.trim() || p.email || 'Someone';

/**
 * The learners this reader may see, with the last RECENT_DAYS days of their
 * answers summarised. Staff accounts are left out: they are not learners.
 * The counting happens in the database (learner_answer_summary, 0034): a
 * request returns at most a thousand rows, so counting raw answers here
 * quietly undercounted anyone with a busy month.
 */
export async function learnerList(isAdmin: boolean): Promise<LearnerList> {
  const db = createServiceClient();
  let query = db
    .from('profiles')
    .select('id, display_name, email, country, track, is_admin, is_coach, avatar_style')
    .eq('is_admin', false)
    .eq('is_coach', false)
    .order('display_name')
    .order('id');
  if (!isAdmin) {
    const ids = [...(await supervisedIds())];
    if (ids.length === 0) return { rows: [], more: false, failed: false };
    query = query.in('id', ids);
  }
  const { data, error } = await query.limit(LIST_LIMIT + 1);
  if (error) return { rows: [], more: false, failed: true };
  const all = (data ?? []) as ProfileRow[];
  const people = all.slice(0, LIST_LIMIT).filter((p) => !p.is_admin && !p.is_coach);
  if (people.length === 0) return { rows: [], more: false, failed: false };

  const since = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: summary, error: summaryError } = await db.rpc('learner_answer_summary', {
    ids: people.map((p) => p.id),
    since,
  });
  const byId = new Map(
    ((summary ?? []) as Array<{
      user_id: string;
      answered: number;
      right_answers: number;
      last_answered: string | null;
      weakest: string | null;
    }>).map((s) => [s.user_id, s]),
  );

  return {
    more: all.length > LIST_LIMIT,
    failed: Boolean(summaryError),
    rows: people.map((p) => {
      const s = byId.get(p.id);
      return {
        id: p.id,
        name: nameOf(p),
        trainee: p.track === 'litigation_trainee',
        cartoon: readCartoon(p.avatar_style),
        answered: s?.answered ?? 0,
        right: s?.right_answers ?? 0,
        lastAnswered: s?.last_answered ?? null,
        weakest: s?.weakest ?? null,
      };
    }),
  };
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
  trainee: boolean;
  cartoon: CartoonStyle | null;
  totalAnswered: number;
  totalRight: number;
  modules: ModuleProgress[];
  weak: WeakConcept[];
  wrong: WrongAnswer[];
}

/**
 * One learner's picture: every answer counted, the modules, the concepts
 * they are weakest on, and their most recent wrong answers with what they
 * chose and what was right. Null if they do not exist, are staff, or are
 * not somebody this reader may see: checked here as well as on the page,
 * so a new caller cannot forget it.
 */
export async function learnerDetail(userId: string, isAdmin: boolean): Promise<LearnerDetail | null> {
  if (!(await staffMayRead(userId, isAdmin))) return null;
  const db = createServiceClient();
  const { data: p } = await db
    .from('profiles')
    .select('id, display_name, email, country, track, is_admin, is_coach, avatar_style')
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
    trainee: profile.track === 'litigation_trainee',
    cartoon: readCartoon(profile.avatar_style),
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
