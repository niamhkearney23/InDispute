import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/service';
import { QUESTIONS_PER_MINUTE_GOAL, DIAGNOSTIC_QUESTION_COUNT } from '@/lib/learning/config';
import { selectDailyQuestions, selectDiagnosticQuestions } from '@/lib/learning/selection';
import { applyAttempt, initialMasteryState } from '@/lib/learning/mastery';
import {
  describeNextReview,
  initialReviewState,
  scheduleNextReview,
} from '@/lib/learning/review-scheduler';
import {
  advanceStreak,
  localDateString,
  xpForAnswer,
  xpForSessionCompletion,
  type PendingXpEvent,
} from '@/lib/learning/progression';
import { coachOnAnswer } from '@/lib/ai/legal-coach';
import { GOAL_TO_DOMAIN_SLUGS } from '@/lib/types';
import type {
  AnswerFeedback,
  ConfidenceLevel,
  DeliveredQuestion,
  QuestionOption,
  SessionKind,
} from '@/lib/types';

/**
 * The training loop, server-side.
 *
 * Grading happens here and only here. The browser is never told the answer key
 * before it submits, and it is never trusted about whether it was right.
 */

export interface SessionPlan {
  sessionId: string;
  kind: SessionKind;
  questions: DeliveredQuestion[];
  /** Index of the first question still to answer. Equals the length when done. */
  resumeIndex: number;
}

function questionCountForGoal(minutes: number): number {
  return QUESTIONS_PER_MINUTE_GOAL[minutes] ?? QUESTIONS_PER_MINUTE_GOAL[10];
}

/**
 * Where a resumed session should pick up.
 *
 * Pure, because the interesting case is awkward to reach through the database:
 * a question retired or unpublished mid-session drops out of the delivery view,
 * so the surviving list is shorter than the list of slots. Counting answered
 * slots would then point past the learner's actual position and strand them on
 * a question they have already answered.
 */
export function resumeIndexFor(
  deliveredVersionIds: string[],
  answeredVersionIds: Set<string>,
): number {
  const firstUnanswered = deliveredVersionIds.findIndex((id) => !answeredVersionIds.has(id));
  return firstUnanswered === -1 ? deliveredVersionIds.length : firstUnanswered;
}

/* -------------------------------------------------------------------------- */
/* Starting a session                                                         */
/* -------------------------------------------------------------------------- */

export async function startSession(
  userId: string,
  kind: SessionKind,
): Promise<{ sessionId: string } | { error: string }> {
  const db = createServiceClient();

  const { data: profile } = await db
    .from('profiles')
    .select('daily_goal_minutes, improvement_goals')
    .eq('id', userId)
    .single();

  const goalMinutes = profile?.daily_goal_minutes ?? 10;
  const preferredDomainSlugs = (profile?.improvement_goals ?? []).flatMap(
    (goal: string) => GOAL_TO_DOMAIN_SLUGS[goal] ?? [],
  );

  const count =
    kind === 'diagnostic' ? DIAGNOSTIC_QUESTION_COUNT : questionCountForGoal(goalMinutes);

  const selected =
    kind === 'diagnostic'
      ? await selectDiagnosticQuestions(db, count)
      : await selectDailyQuestions(db, userId, count, { preferredDomainSlugs });

  if (selected.length === 0) {
    return {
      error:
        'There are no published questions yet. An administrator needs to publish content before training can start.',
    };
  }

  const { data: session, error } = await db
    .from('training_sessions')
    .insert({
      user_id: userId,
      kind,
      planned_question_count: selected.length,
      target_minutes: kind === 'diagnostic' ? null : goalMinutes,
    })
    .select('id')
    .single();

  if (error || !session) {
    return { error: error?.message ?? 'Could not start a session.' };
  }

  const rows = selected.map((q, index) => ({
    session_id: session.id,
    question_id: q.questionId,
    question_version_id: q.questionVersionId,
    position: index,
    reason: q.reason,
  }));

  const { error: insertError } = await db.from('training_session_questions').insert(rows);
  if (insertError) {
    await db.from('training_sessions').delete().eq('id', session.id);
    return { error: insertError.message };
  }

  return { sessionId: session.id as string };
}

/** Reuses today's unfinished session rather than stacking up abandoned ones. */
export async function resumeOrStartSession(
  userId: string,
  kind: SessionKind,
): Promise<{ sessionId: string } | { error: string }> {
  const db = createServiceClient();

  const { data: existing } = await db
    .from('training_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('kind', kind)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return { sessionId: existing.id as string };
  return startSession(userId, kind);
}

/* -------------------------------------------------------------------------- */
/* Reading a session                                                          */
/* -------------------------------------------------------------------------- */

export async function getSessionPlan(
  userId: string,
  sessionId: string,
): Promise<SessionPlan | null> {
  const db = createServiceClient();

  const { data: session } = await db
    .from('training_sessions')
    .select('id, kind, user_id, status')
    .eq('id', sessionId)
    .maybeSingle();

  // Ownership is enforced here because the service client bypasses RLS.
  if (!session || session.user_id !== userId) return null;

  const { data: rows } = await db
    .from('training_session_questions')
    .select('question_id, question_version_id, position, answered_at')
    .eq('session_id', sessionId)
    .order('position', { ascending: true });

  if (!rows || rows.length === 0) return null;

  const { data: delivery } = await db
    .from('v_question_delivery')
    .select('*')
    .in(
      'question_version_id',
      rows.map((r) => r.question_version_id),
    );

  const byVersion = new Map((delivery ?? []).map((d) => [d.question_version_id, d]));

  // A question retired or unpublished mid-session drops out of the delivery
  // view. Track which of the questions that survived have been answered, rather
  // than counting slots — otherwise the resume index points at the wrong
  // question and the learner gets stuck on one they have already answered.
  const answeredVersionIds = new Set(
    rows.filter((r) => r.answered_at).map((r) => r.question_version_id as string),
  );

  const questions: DeliveredQuestion[] = rows.flatMap((row) => {
    const d = byVersion.get(row.question_version_id);
    if (!d) return [];
    return [
      {
        questionId: row.question_id as string,
        questionVersionId: row.question_version_id as string,
        position: row.position as number,
        questionType: d.question_type,
        scenario: d.scenario,
        stem: d.stem,
        options: (d.options ?? []) as QuestionOption[],
        difficulty: d.difficulty,
        jurisdiction: d.jurisdiction,
        court: d.court,
        domainName: d.domain_name,
        domainSlug: d.domain_slug,
      },
    ];
  });

  return {
    sessionId,
    kind: session.kind as SessionKind,
    questions,
    resumeIndex: resumeIndexFor(
      questions.map((q) => q.questionVersionId),
      answeredVersionIds,
    ),
  };
}

/* -------------------------------------------------------------------------- */
/* Grading an answer                                                          */
/* -------------------------------------------------------------------------- */

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((value) => setB.has(value));
}

async function awardXp(
  db: SupabaseClient,
  userId: string,
  events: PendingXpEvent[],
  context: { sessionId?: string | null; attemptId?: string | null },
): Promise<number> {
  if (events.length === 0) return 0;

  await db.from('xp_events').insert(
    events.map((event) => ({
      user_id: userId,
      session_id: context.sessionId ?? null,
      attempt_id: context.attemptId ?? null,
      kind: event.kind,
      amount: event.amount,
      meta: event.meta ?? {},
    })),
  );

  return events.reduce((total, event) => total + event.amount, 0);
}

export async function submitAnswer(args: {
  userId: string;
  sessionId: string;
  questionVersionId: string;
  selectedOptionIds: string[];
  confidence: ConfidenceLevel | null;
  responseMs: number | null;
}): Promise<AnswerFeedback | { error: string }> {
  const db = createServiceClient();
  const now = new Date();

  const { data: session } = await db
    .from('training_sessions')
    .select('id, user_id, kind, status, total_answered, correct_count')
    .eq('id', args.sessionId)
    .maybeSingle();

  if (!session || session.user_id !== args.userId) {
    return { error: 'Session not found.' };
  }
  if (session.status !== 'in_progress') {
    return { error: 'This session has already been completed.' };
  }

  const { data: slot } = await db
    .from('training_session_questions')
    .select('id, question_id, question_version_id, answered_at')
    .eq('session_id', args.sessionId)
    .eq('question_version_id', args.questionVersionId)
    .maybeSingle();

  if (!slot) return { error: 'That question is not part of this session.' };
  if (slot.answered_at) return { error: 'You have already answered this question.' };

  // Claim the slot before doing anything else. This is a compare-and-set: if a
  // second submission for the same question is already in flight it will match
  // no rows here and stop, rather than recording a duplicate attempt and
  // double-counting the session totals.
  const { data: claimed } = await db
    .from('training_session_questions')
    .update({ answered_at: now.toISOString() })
    .eq('id', slot.id)
    .is('answered_at', null)
    .select('id');

  if (!claimed || claimed.length === 0) {
    return { error: 'You have already answered this question.' };
  }

  const { data: version } = await db
    .from('question_versions')
    .select(
      'id, question_id, question_type, stem, scenario, options, correct_option_ids, explanation, why_it_matters, common_misconception, memory_trick, difficulty, jurisdiction, court, source_reference, source_url',
    )
    .eq('id', args.questionVersionId)
    .single();

  if (!version) {
    // Release the claim, or this question becomes permanently unanswerable.
    await db
      .from('training_session_questions')
      .update({ answered_at: null })
      .eq('id', slot.id);
    return { error: 'Question could not be loaded.' };
  }

  const correctOptionIds = (version.correct_option_ids ?? []) as string[];
  const isCorrect = sameSet(args.selectedOptionIds, correctOptionIds);

  /* --- record the attempt (append-only) --- */
  const answerXpEvents = xpForAnswer(isCorrect, version.difficulty);
  const answerXp = answerXpEvents.reduce((total, e) => total + e.amount, 0);

  const { data: attempt, error: attemptError } = await db
    .from('user_question_attempts')
    .insert({
      user_id: args.userId,
      question_id: version.question_id,
      question_version_id: version.id,
      session_id: args.sessionId,
      selected_option_ids: args.selectedOptionIds,
      is_correct: isCorrect,
      confidence: args.confidence,
      response_ms: args.responseMs,
      xp_awarded: answerXp,
    })
    .select('id')
    .single();

  if (attemptError || !attempt) {
    // Release the claim so the learner can try again.
    await db
      .from('training_session_questions')
      .update({ answered_at: null })
      .eq('id', slot.id);
    return { error: attemptError?.message ?? 'Could not record your answer.' };
  }

  await db
    .from('training_sessions')
    .update({
      total_answered: session.total_answered + 1,
      correct_count: session.correct_count + (isCorrect ? 1 : 0),
    })
    .eq('id', args.sessionId);

  /* --- update the knowledge graph --- */
  const [{ data: conceptLinks }, { data: skillLinks }] = await Promise.all([
    db
      .from('question_concepts')
      .select('concept_id, weight, concepts(name)')
      .eq('question_id', version.question_id),
    db.from('question_skills').select('skill_id, weight').eq('question_id', version.question_id),
  ]);

  let soonestReviewAt: Date | null = null;

  for (const link of conceptLinks ?? []) {
    const conceptId = link.concept_id as string;

    const { data: existing } = await db
      .from('user_concept_mastery')
      .select('*')
      .eq('user_id', args.userId)
      .eq('concept_id', conceptId)
      .maybeSingle();

    const priorState = existing
      ? {
          mastery: Number(existing.mastery),
          attempts: existing.attempts as number,
          correct: existing.correct as number,
          consecutiveCorrect: existing.consecutive_correct as number,
          consecutiveIncorrect: existing.consecutive_incorrect as number,
          confidentAndWrong: existing.confident_and_wrong as number,
        }
      : initialMasteryState();

    const nextState = applyAttempt(priorState, {
      isCorrect,
      confidence: args.confidence,
      difficulty: version.difficulty,
      weight: Number(link.weight ?? 1),
    });

    const priorAvg = (existing?.avg_response_ms as number | null) ?? null;
    const avgResponseMs =
      args.responseMs === null
        ? priorAvg
        : Math.round(
            priorAvg === null
              ? args.responseMs
              : (priorAvg * priorState.attempts + args.responseMs) / nextState.attempts,
          );

    await db.from('user_concept_mastery').upsert(
      {
        user_id: args.userId,
        concept_id: conceptId,
        mastery: nextState.mastery,
        attempts: nextState.attempts,
        correct: nextState.correct,
        consecutive_correct: nextState.consecutiveCorrect,
        consecutive_incorrect: nextState.consecutiveIncorrect,
        confident_and_wrong: nextState.confidentAndWrong,
        avg_response_ms: avgResponseMs,
        last_seen_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: 'user_id,concept_id' },
    );

    /* --- and reschedule it --- */
    const { data: schedule } = await db
      .from('review_schedule')
      .select('*')
      .eq('user_id', args.userId)
      .eq('concept_id', conceptId)
      .maybeSingle();

    const priorReview = schedule
      ? {
          intervalDays: Number(schedule.interval_days),
          ease: Number(schedule.ease),
          reviewCount: schedule.review_count as number,
          lapses: schedule.lapses as number,
          nextReviewAt: new Date(schedule.next_review_at as string),
        }
      : initialReviewState(now);

    const nextReview = scheduleNextReview(
      priorReview,
      { isCorrect, confidence: args.confidence, mastery: nextState.mastery },
      now,
    );

    await db.from('review_schedule').upsert(
      {
        user_id: args.userId,
        concept_id: conceptId,
        next_review_at: nextReview.nextReviewAt.toISOString(),
        interval_days: nextReview.intervalDays,
        ease: nextReview.ease,
        review_count: nextReview.reviewCount,
        lapses: nextReview.lapses,
        last_result: isCorrect,
        last_reviewed_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: 'user_id,concept_id' },
    );

    // Report the soonest return date across the question's concepts.
    if (soonestReviewAt === null || nextReview.nextReviewAt < soonestReviewAt) {
      soonestReviewAt = nextReview.nextReviewAt;
    }
  }

  for (const link of skillLinks ?? []) {
    const skillId = link.skill_id as string;

    const { data: existing } = await db
      .from('user_skill_mastery')
      .select('*')
      .eq('user_id', args.userId)
      .eq('skill_id', skillId)
      .maybeSingle();

    const priorState = existing
      ? {
          mastery: Number(existing.mastery),
          attempts: existing.attempts as number,
          correct: existing.correct as number,
          consecutiveCorrect: 0,
          consecutiveIncorrect: 0,
          confidentAndWrong: 0,
        }
      : initialMasteryState();

    const nextState = applyAttempt(priorState, {
      isCorrect,
      confidence: args.confidence,
      difficulty: version.difficulty,
      weight: Number(link.weight ?? 1),
    });

    await db.from('user_skill_mastery').upsert(
      {
        user_id: args.userId,
        skill_id: skillId,
        mastery: nextState.mastery,
        attempts: nextState.attempts,
        correct: nextState.correct,
        last_seen_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: 'user_id,skill_id' },
    );
  }

  const xpAwarded = await awardXp(db, args.userId, answerXpEvents, {
    sessionId: args.sessionId,
    attemptId: attempt.id as string,
  });

  /* --- optional AI layer, strictly after everything that matters --- */
  const coachNote = await coachOnAnswer({
    stem: version.stem,
    scenario: version.scenario,
    options: (version.options ?? []) as QuestionOption[],
    selectedOptionIds: args.selectedOptionIds,
    correctOptionIds,
    isCorrect,
    explanation: version.explanation,
    commonMisconception: version.common_misconception,
    jurisdiction: version.jurisdiction,
    conceptNames: (conceptLinks ?? []).flatMap((l) => {
      const concept = l.concepts as unknown as { name: string } | { name: string }[] | null;
      if (!concept) return [];
      return Array.isArray(concept) ? concept.map((c) => c.name) : [concept.name];
    }),
  });

  return {
    isCorrect,
    correctOptionIds,
    selectedOptionIds: args.selectedOptionIds,
    explanation: version.explanation,
    whyItMatters: version.why_it_matters,
    commonMisconception: version.common_misconception,
    memoryTrick: version.memory_trick,
    jurisdiction: version.jurisdiction,
    court: version.court,
    sourceReference: version.source_reference,
    sourceUrl: version.source_url,
    xpAwarded,
    nextReviewLabel: soonestReviewAt ? describeNextReview(soonestReviewAt, now) : null,
    coachNote,
  };
}

/* -------------------------------------------------------------------------- */
/* Completing a session                                                       */
/* -------------------------------------------------------------------------- */

export interface SessionSummary {
  sessionId: string;
  kind: SessionKind;
  totalAnswered: number;
  correctCount: number;
  xpAwarded: number;
  currentStreak: number;
  streakIncreased: boolean;
}

export async function completeSession(
  userId: string,
  sessionId: string,
): Promise<SessionSummary | { error: string }> {
  const db = createServiceClient();
  const now = new Date();

  const { data: session } = await db
    .from('training_sessions')
    .select('id, user_id, kind, status, total_answered, correct_count, xp_awarded')
    .eq('id', sessionId)
    .maybeSingle();

  if (!session || session.user_id !== userId) return { error: 'Session not found.' };

  // Idempotent: finishing twice must not award XP twice or bump the streak.
  if (session.status === 'completed') {
    const { data: streak } = await db
      .from('user_streaks')
      .select('current_streak')
      .eq('user_id', userId)
      .maybeSingle();

    return {
      sessionId,
      kind: session.kind as SessionKind,
      totalAnswered: session.total_answered,
      correctCount: session.correct_count,
      xpAwarded: session.xp_awarded,
      currentStreak: (streak?.current_streak as number) ?? 0,
      streakIncreased: false,
    };
  }

  const { data: profile } = await db
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .single();

  const today = localDateString(profile?.timezone ?? 'Australia/Melbourne', now);

  const { data: streakRow } = await db
    .from('user_streaks')
    .select('current_streak, longest_streak, last_trained_on')
    .eq('user_id', userId)
    .maybeSingle();

  const { next: nextStreak, increased } = advanceStreak(
    {
      currentStreak: (streakRow?.current_streak as number) ?? 0,
      longestStreak: (streakRow?.longest_streak as number) ?? 0,
      lastTrainedOn: (streakRow?.last_trained_on as string | null) ?? null,
    },
    today,
  );

  await db.from('user_streaks').upsert(
    {
      user_id: userId,
      current_streak: nextStreak.currentStreak,
      longest_streak: nextStreak.longestStreak,
      last_trained_on: nextStreak.lastTrainedOn,
      updated_at: now.toISOString(),
    },
    { onConflict: 'user_id' },
  );

  const events = xpForSessionCompletion({
    kind: session.kind as SessionKind,
    totalAnswered: session.total_answered,
    correctCount: session.correct_count,
    newStreak: nextStreak.currentStreak,
    streakIncreased: increased,
  });

  await awardXp(db, userId, events, { sessionId });

  // Per-answer XP is already in the ledger; roll the whole session total onto
  // the session row so the summary screen is a single read.
  const { data: ledger } = await db
    .from('xp_events')
    .select('amount')
    .eq('session_id', sessionId);

  const sessionXp = (ledger ?? []).reduce(
    (total, row) => total + (row.amount as number),
    0,
  );

  await db
    .from('training_sessions')
    .update({
      status: 'completed',
      completed_at: now.toISOString(),
      xp_awarded: sessionXp,
    })
    .eq('id', sessionId);

  if (session.kind === 'diagnostic') {
    await recordDiagnosticResult(db, userId, sessionId, now);
  }

  return {
    sessionId,
    kind: session.kind as SessionKind,
    totalAnswered: session.total_answered,
    correctCount: session.correct_count,
    xpAwarded: sessionXp,
    currentStreak: nextStreak.currentStreak,
    streakIncreased: increased,
  };
}

/* -------------------------------------------------------------------------- */
/* Diagnostic scoring                                                         */
/* -------------------------------------------------------------------------- */

async function recordDiagnosticResult(
  db: SupabaseClient,
  userId: string,
  sessionId: string,
  now: Date,
) {
  const { data: attempts } = await db
    .from('user_question_attempts')
    .select('question_id, is_correct')
    .eq('session_id', sessionId);

  if (!attempts || attempts.length === 0) return;

  const questionIds = attempts.map((a) => a.question_id as string);

  const [{ data: questionRows }, { data: skillLinks }, { data: skillRows }] =
    await Promise.all([
      db.from('questions').select('id, domains(slug, name)').in('id', questionIds),
      db.from('question_skills').select('question_id, skill_id').in('question_id', questionIds),
      db.from('skills').select('id, slug, name'),
    ]);

  const domainByQuestion = new Map<string, string>();
  for (const row of questionRows ?? []) {
    const domain = row.domains as unknown as { slug: string } | { slug: string }[] | null;
    const slug = Array.isArray(domain) ? domain[0]?.slug : domain?.slug;
    if (slug) domainByQuestion.set(row.id as string, slug);
  }

  const skillSlugById = new Map(
    (skillRows ?? []).map((s) => [s.id as string, s.slug as string]),
  );
  const skillsByQuestion = new Map<string, string[]>();
  for (const link of skillLinks ?? []) {
    const slug = skillSlugById.get(link.skill_id as string);
    if (!slug) continue;
    const list = skillsByQuestion.get(link.question_id as string) ?? [];
    list.push(slug);
    skillsByQuestion.set(link.question_id as string, list);
  }

  const domainTally = new Map<string, { correct: number; total: number }>();
  const skillTally = new Map<string, { correct: number; total: number }>();

  for (const attempt of attempts) {
    const questionId = attempt.question_id as string;
    const isCorrect = attempt.is_correct as boolean;

    const domainSlug = domainByQuestion.get(questionId);
    if (domainSlug) {
      const entry = domainTally.get(domainSlug) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (isCorrect) entry.correct += 1;
      domainTally.set(domainSlug, entry);
    }

    for (const skillSlug of skillsByQuestion.get(questionId) ?? []) {
      const entry = skillTally.get(skillSlug) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (isCorrect) entry.correct += 1;
      skillTally.set(skillSlug, entry);
    }
  }

  const toScores = (tally: Map<string, { correct: number; total: number }>) =>
    Object.fromEntries(
      [...tally.entries()].map(([slug, { correct, total }]) => [
        slug,
        total === 0 ? 0 : Math.round((correct / total) * 100),
      ]),
    );

  const domainScores = toScores(domainTally);
  const priorityDomains = Object.entries(domainScores)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([slug]) => slug);

  await db.from('diagnostic_results').upsert(
    {
      user_id: userId,
      session_id: sessionId,
      domain_scores: domainScores,
      skill_scores: toScores(skillTally),
      priority_domains: priorityDomains,
      total_questions: attempts.length,
      total_correct: attempts.filter((a) => a.is_correct).length,
      completed_at: now.toISOString(),
    },
    { onConflict: 'session_id' },
  );

  await db
    .from('profiles')
    .update({ diagnostic_completed_at: now.toISOString() })
    .eq('id', userId);
}

