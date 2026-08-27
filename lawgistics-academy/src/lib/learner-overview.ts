import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { displayScore } from '@/lib/learning/mastery';
import { levelForXp, localDateString, type LevelInfo } from '@/lib/learning/progression';
import { MASTERY } from '@/lib/learning/config';
import { asCountry } from '@/lib/types';
import type { CareerStage, Country, Jurisdiction, SkillMapEntry } from '@/lib/types';

/**
 * Everything the dashboard needs, read through the learner's own session so
 * Row Level Security does the access control rather than application code.
 */

export interface LearnerProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  careerStage: CareerStage | null;
  improvementGoals: string[];
  dailyGoalMinutes: number;
  country: Country;
  homeJurisdiction: Jurisdiction;
  timezone: string;
  onboardedAt: string | null;
  diagnosticCompletedAt: string | null;
  isAdmin: boolean;
  /**
   * May sign content off and record supervisor decisions. Read this through
   * `canCoach` rather than directly: an administrator is a coach too, and every
   * caller wants "may this person coach", never "is this person only a coach".
   */
  isCoach: boolean;
}

export interface LearnerOverview {
  profile: LearnerProfile;
  totalXp: number;
  weeklyXp: number;
  level: LevelInfo;
  currentStreak: number;
  longestStreak: number;
  /** Questions answered since midnight where the learner is, not where the server is. */
  answeredToday: number;
  /** Sessions finished today. One means the session just finished was the first. */
  sessionsToday: number;
  skillMap: SkillMapEntry[];
  skillProfile: SkillMapEntry[];
  needsReview: string[];
  recentlyMastered: string[];
  dueCount: number;
}


/**
 * How far a timezone is from UTC at a given instant, in minutes.
 *
 * Needed because a date string is not an instant: "2026-08-25" is a different
 * moment in Kuala Lumpur than in Melbourne, and the daily goal has to reset
 * where the learner is rather than where the server is. Derived from the zone
 * itself rather than stored, so it stays right across daylight saving without
 * anybody remembering to change a number twice a year.
 */
function zoneOffsetMinutes(timezone: string, at: Date): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(at);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
    const asUtc = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour') === 24 ? 0 : get('hour'),
      get('minute'),
      get('second'),
    );
    return Math.round((asUtc - at.getTime()) / 60_000);
  } catch {
    return 0;
  }
}

export async function getLearnerProfile(userId: string): Promise<LearnerProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    careerStage: data.career_stage,
    improvementGoals: data.improvement_goals ?? [],
    dailyGoalMinutes: data.daily_goal_minutes,
    country: asCountry(data.country),
    homeJurisdiction: data.home_jurisdiction,
    timezone: data.timezone,
    onboardedAt: data.onboarded_at,
    diagnosticCompletedAt: data.diagnostic_completed_at,
    isAdmin: data.is_admin,
    isCoach: data.is_coach ?? false,
  };
}

export async function getLearnerOverview(userId: string): Promise<LearnerOverview | null> {
  const supabase = await createSupabaseServerClient();

  const profile = await getLearnerProfile(userId);
  if (!profile) return null;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  /* Midnight where the learner is.
   *
   * A daily goal measured against the server's midnight is wrong for everybody
   * not sitting next to the server: somebody in Kuala Lumpur would watch their
   * day reset at eight in the morning. localDateString already knows how to ask
   * what day it is somewhere, and this turns that back into an instant. */
  const startOfDay = new Date(`${localDateString(profile.timezone)}T00:00:00`);
  const offsetMinutes = zoneOffsetMinutes(profile.timezone, startOfDay);
  const dayStart = new Date(startOfDay.getTime() - offsetMinutes * 60_000).toISOString();

  const [
    xpAll,
    xpWeek,
    streak,
    conceptMastery,
    skillMastery,
    due,
    domains,
    answeredToday,
    sessionsToday,
  ] = await Promise.all([
      supabase.from('xp_events').select('amount').eq('user_id', userId),
      supabase
        .from('xp_events')
        .select('amount')
        .eq('user_id', userId)
        .gte('created_at', weekAgo),
      supabase
        .from('user_streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('user_concept_mastery')
        .select('mastery, attempts, last_seen_at, concepts(slug, name, domain_id)')
        .eq('user_id', userId),
      supabase
        .from('user_skill_mastery')
        .select('mastery, attempts, skills(slug, name)')
        .eq('user_id', userId),
      supabase
        .from('review_schedule')
        .select('concept_id, next_review_at, concepts(name)')
        .eq('user_id', userId)
        .lte('next_review_at', now)
        .order('next_review_at', { ascending: true }),
      supabase.from('domains').select('id, slug, name, sort_order').order('sort_order'),
      supabase
        .from('user_question_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('answered_at', dayStart),
      supabase
        .from('training_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .gte('completed_at', dayStart),
    ]);

  const sum = (rows: Array<{ amount: number }> | null) =>
    (rows ?? []).reduce((total, row) => total + row.amount, 0);

  const totalXp = sum(xpAll.data);

  /* --- skill map by domain ------------------------------------------------ */
  const domainTotals = new Map<string, { weighted: number; attempts: number }>();

  type ConceptRef = { slug: string; name: string; domain_id: string };
  const conceptRows = (conceptMastery.data ?? []).map((row) => ({
    mastery: Number(row.mastery),
    attempts: row.attempts as number,
    lastSeenAt: row.last_seen_at as string | null,
    concept: first<ConceptRef>(row.concepts),
  }));

  for (const row of conceptRows) {
    if (!row.concept || row.attempts === 0) continue;
    const entry = domainTotals.get(row.concept.domain_id) ?? { weighted: 0, attempts: 0 };
    // Weighted by attempts so a concept answered ten times counts for more than
    // one answered once.
    entry.weighted += row.mastery * row.attempts;
    entry.attempts += row.attempts;
    domainTotals.set(row.concept.domain_id, entry);
  }

  const skillMap: SkillMapEntry[] = (domains.data ?? []).map((domain) => {
    const entry = domainTotals.get(domain.id);
    const raw = entry && entry.attempts > 0 ? entry.weighted / entry.attempts : 0;
    return {
      slug: domain.slug,
      name: domain.name,
      score: displayScore(raw, entry?.attempts ?? 0),
      attempts: entry?.attempts ?? 0,
    };
  });

  /* --- skill profile (the cross-cutting axis) ----------------------------- */
  const skillProfile: SkillMapEntry[] = (skillMastery.data ?? [])
    .map((row) => {
      const skill = first<{ slug: string; name: string }>(row.skills);
      return {
        slug: skill?.slug ?? '',
        name: skill?.name ?? '',
        score: displayScore(Number(row.mastery), row.attempts as number),
        attempts: row.attempts as number,
      };
    })
    .filter((entry) => entry.slug && entry.attempts > 0)
    .sort((a, b) => b.score - a.score);

  /* --- review + mastered lists -------------------------------------------- */
  const needsReview = (due.data ?? [])
    .map((row) => first<{ name: string }>(row.concepts)?.name)
    .filter((name): name is string => Boolean(name))
    .slice(0, 5);

  const recentlyMastered = conceptRows
    .filter(
      (row) =>
        row.concept &&
        row.attempts >= MASTERY.minAttemptsForConfidence &&
        row.mastery >= MASTERY.masteredThreshold,
    )
    .sort((a, b) => (b.lastSeenAt ?? '').localeCompare(a.lastSeenAt ?? ''))
    .map((row) => row.concept!.name)
    .slice(0, 5);

  return {
    profile,
    totalXp,
    answeredToday: answeredToday.count ?? 0,
    sessionsToday: sessionsToday.count ?? 0,
    weeklyXp: sum(xpWeek.data),
    level: levelForXp(totalXp),
    currentStreak: (streak.data?.current_streak as number) ?? 0,
    longestStreak: (streak.data?.longest_streak as number) ?? 0,
    skillMap,
    skillProfile,
    needsReview,
    recentlyMastered,
    dueCount: due.data?.length ?? 0,
  };
}

/**
 * PostgREST returns an embedded to-one relation as an object, but the generated
 * types often widen it to an array. Normalise rather than casting at each site.
 */
function first<T>(value: unknown): T | null {
  if (!value) return null;
  return (Array.isArray(value) ? (value[0] ?? null) : value) as T | null;
}

