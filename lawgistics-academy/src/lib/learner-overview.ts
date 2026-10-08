import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { displayScore, rightShare } from '@/lib/learning/mastery';
import { levelForXp, localDateString, type LevelInfo } from '@/lib/learning/progression';
import { MASTERY } from '@/lib/learning/config';
import { asCountry, asTrack, learnerTimezone } from '@/lib/types';
import { liveStreak, localMidnight, shiftLocalDate } from '@/lib/local-day';
import { readCartoon, type CartoonStyle } from '@/lib/avatar/cartoon';
import type {
  CareerStage,
  Country,
  Jurisdiction,
  LearnerTrack,
  SkillMapEntry,
} from '@/lib/types';

/**
 * Everything the dashboard needs, read through the learner's own session so
 * Row Level Security does the access control rather than application code.
 */

export interface LearnerProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  /** The cartoon they built of themselves, if any (0033). */
  cartoon: CartoonStyle | null;
  careerStage: CareerStage | null;
  improvementGoals: string[];
  dailyGoalMinutes: number;
  country: Country;
  /** Which programme they are on. A litigation trainee is always Malaysian. */
  track: LearnerTrack;
  homeJurisdiction: Jurisdiction;
  timezone: string;
  onboardedAt: string | null;
  diagnosticCompletedAt: string | null;
  /** A placement's first and last day. Set by an administrator only. */
  startsOn: string | null;
  endsOn: string | null;
  isAdmin: boolean;
  /**
   * May sign content off and record supervisor decisions. Read this through
   * `canCoach` rather than directly: an administrator is a coach too, and every
   * caller wants "may this person coach", never "is this person only a coach".
   */
  isCoach: boolean;
  /** Runs the firm's own people and setup, never content (0037). */
  isFirmAdmin: boolean;
  /** An administrator set this person's first password; they choose their own next. */
  mustChangePassword: boolean;
  /** On the trainee programme and confirmed by somebody at the firm (0023). */
  traineeConfirmed: boolean;
  /** Asked to be left off the firm's leaderboard. */
  leaderboardOptOut: boolean;
}

export interface LearnerOverview {
  profile: LearnerProfile;
  totalXp: number;
  weeklyXp: number;
  level: LevelInfo;
  currentStreak: number;
  longestStreak: number;
  /** Training questions answered since midnight where the learner is, not where the
   *  server is. The diagnostic's answers are left out: it is not the daily goal. */
  answeredToday: number;
  /** Sessions finished today. One means the session just finished was the first. */
  sessionsToday: number;
  skillMap: SkillMapEntry[];
  skillProfile: SkillMapEntry[];
  needsReview: string[];
  recentlyMastered: string[];
  dueCount: number;
  /** Local dates (YYYY-MM-DD) in the last five weeks on which a session was finished. */
  trainedDays: string[];
  /** Training questions answered yesterday, where the learner is. */
  answeredYesterday: number;
}


export async function getLearnerProfile(userId: string): Promise<LearnerProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    cartoon: readCartoon(data.avatar_style),
    careerStage: data.career_stage,
    improvementGoals: data.improvement_goals ?? [],
    dailyGoalMinutes: data.daily_goal_minutes,
    country: asCountry(data.country),
    track: asTrack(data.track),
    homeJurisdiction: data.home_jurisdiction,
    timezone: learnerTimezone(data.timezone, asCountry(data.country)),
    onboardedAt: data.onboarded_at,
    diagnosticCompletedAt: data.diagnostic_completed_at,
    startsOn: data.starts_on,
    endsOn: data.ends_on,
    isAdmin: data.is_admin,
    isCoach: data.is_coach ?? false,
    isFirmAdmin: data.is_firm_admin ?? false,
    mustChangePassword: data.must_change_password ?? false,
    traineeConfirmed: Boolean(data.trainee_approved_at),
    leaderboardOptOut: Boolean(data.leaderboard_opt_out),
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
  const today = localDateString(profile.timezone);
  const dayStart = localMidnight(profile.timezone, today).toISOString();
  const yesterdayStart = localMidnight(profile.timezone, shiftLocalDate(today, -1)).toISOString();

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
    diagnostics,
    finishedRecently,
    answeredYesterdayRows,
  ] = await Promise.all([
      supabase.from('xp_events').select('amount').eq('user_id', userId),
      supabase
        .from('xp_events')
        .select('amount')
        .eq('user_id', userId)
        .gte('created_at', weekAgo),
      supabase
        .from('user_streaks')
        .select('current_streak, longest_streak, last_trained_on')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('user_concept_mastery')
        .select('mastery, attempts, correct, last_seen_at, concepts(slug, name, domain_id)')
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
        .select('session_id')
        .eq('user_id', userId)
        .gte('answered_at', dayStart),
      supabase
        .from('training_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .gte('completed_at', dayStart),
      supabase
        .from('training_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('kind', 'diagnostic'),
      // Five weeks of finished sessions, for the calendar of days trained.
      supabase
        .from('training_sessions')
        .select('completed_at')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .gte('completed_at', new Date(Date.now() - 36 * 24 * 60 * 60 * 1000).toISOString()),
      // Yesterday's answers, for "beat yesterday".
      supabase
        .from('user_question_attempts')
        .select('session_id')
        .eq('user_id', userId)
        .gte('answered_at', yesterdayStart)
        .lt('answered_at', dayStart),
    ]);

  /* Today's training is the daily goal, and the diagnostic is not part of it.
     Counted together, somebody who had just taken the diagnostic on the day
     they joined came back to the dashboard to be told they were done for
     the day, before they had trained at all. */
  const diagnosticIds = new Set((diagnostics.data ?? []).map((row) => row.id as string));
  const trainedToday = (answeredToday.data ?? []).filter(
    (row) => !row.session_id || !diagnosticIds.has(row.session_id as string),
  ).length;
  const answeredYesterday = (answeredYesterdayRows.data ?? []).filter(
    (row) => !row.session_id || !diagnosticIds.has(row.session_id as string),
  ).length;
  const trainedDays = [
    ...new Set(
      (finishedRecently.data ?? []).map((row) =>
        localDateString(profile.timezone, new Date(row.completed_at as string)),
      ),
    ),
  ].sort();

  const sum = (rows: Array<{ amount: number }> | null) =>
    (rows ?? []).reduce((total, row) => total + row.amount, 0);

  const totalXp = sum(xpAll.data);

  /* --- skill map by domain ------------------------------------------------ */
  // What a learner sees is the share of their answers that were right: all
  // right is 100%, and it only comes down when they get one wrong. The
  // engine's own strength estimate (mastery) still decides what to ask next;
  // it starts at zero and climbs slowly, which read as a low mark for right
  // answers.
  const domainTotals = new Map<string, { correct: number; attempts: number }>();

  type ConceptRef = { slug: string; name: string; domain_id: string };
  const conceptRows = (conceptMastery.data ?? []).map((row) => ({
    mastery: Number(row.mastery),
    attempts: row.attempts as number,
    correct: (row.correct as number) ?? 0,
    lastSeenAt: row.last_seen_at as string | null,
    concept: first<ConceptRef>(row.concepts),
  }));

  // Each answer once, by its question's own area (area_scores, 0036). A
  // question tagged with three concepts used to count three times when the
  // totals were added up per concept; that sum stays only as the fallback
  // for a database that has not had 0036 yet.
  const { data: byArea, error: areaError } = await createServiceClient().rpc('area_scores', {
    uid: userId,
  });
  if (!areaError && Array.isArray(byArea)) {
    for (const row of byArea as Array<{ domain_id: string; answered: number; right_answers: number }>) {
      domainTotals.set(row.domain_id, { correct: row.right_answers, attempts: row.answered });
    }
  } else {
    for (const row of conceptRows) {
      if (!row.concept || row.attempts === 0) continue;
      const entry = domainTotals.get(row.concept.domain_id) ?? { correct: 0, attempts: 0 };
      entry.correct += row.correct;
      entry.attempts += row.attempts;
      domainTotals.set(row.concept.domain_id, entry);
    }
  }

  const skillMap: SkillMapEntry[] = (domains.data ?? []).map((domain) => {
    const entry = domainTotals.get(domain.id);
    return {
      slug: domain.slug,
      name: domain.name,
      score: rightShare(entry?.correct ?? 0, entry?.attempts ?? 0),
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
    answeredToday: trainedToday,
    trainedDays,
    answeredYesterday,
    sessionsToday: sessionsToday.count ?? 0,
    weeklyXp: sum(xpWeek.data),
    level: levelForXp(totalXp),
    currentStreak: liveStreak(
      (streak.data?.current_streak as number) ?? 0,
      (streak.data?.last_trained_on as string | null) ?? null,
      today,
    ),
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

