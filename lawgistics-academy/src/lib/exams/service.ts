import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/service';
import { selectExamQuestions } from '@/lib/learning/selection';
import { completeSession } from '@/lib/training/service';
import { stillSignedOff } from '@/lib/review/expiry';
import { deliveryOrder } from '@/lib/learning/option-order';
import { asCountry, type QuestionOption } from '@/lib/types';
import { examEndsAt, examOver, readSettings, type ExamSettings } from './rules';

/**
 * Exams (0056): the reads and writes. Everything here uses the service
 * client, so every function takes the signed-in person's id from the caller
 * and reads or writes only that person's sessions.
 */

const PAGE = 1000;
const MAX_PAGES = 20;

/** What the person has answered before, for a drill of unanswered or wrongly answered questions. */
async function answerHistory(
  db: SupabaseClient,
  userId: string,
): Promise<{ answered: Set<string>; lastWrong: Set<string> }> {
  const latest = new Map<string, boolean>();
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data, error } = await db
      .from('user_question_attempts')
      .select('question_id, is_correct, answered_at')
      .eq('user_id', userId)
      .order('answered_at', { ascending: true })
      .order('id', { ascending: true })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (error) break;
    for (const row of data ?? []) latest.set(row.question_id as string, row.is_correct === true);
    if ((data ?? []).length < PAGE) break;
  }
  return {
    answered: new Set(latest.keys()),
    lastWrong: new Set([...latest].filter(([, right]) => !right).map(([id]) => id)),
  };
}

/**
 * Finishes any exam of this person's whose time ran out with the page
 * closed, so it is marked and shows in their history rather than sitting
 * open for ever. Safe to call on every visit: finishing is idempotent.
 */
async function finishExpired(db: SupabaseClient, userId: string, now: Date): Promise<void> {
  const { data } = await db
    .from('training_sessions')
    .select('id, started_at, target_minutes')
    .eq('user_id', userId)
    .eq('kind', 'exam')
    .eq('status', 'in_progress');
  for (const row of data ?? []) {
    if (examOver(row.started_at as string, row.target_minutes as number | null, now)) {
      await completeSession(userId, row.id as string);
    }
  }
}

/**
 * Starts an exam, or hands back the one already running: one at a time, so a
 * second tab cannot quietly begin a second clock.
 */
export async function startExam(
  userId: string,
  settings: ExamSettings,
): Promise<{ sessionId: string } | { error: string }> {
  const db = createServiceClient();
  const now = new Date();
  await finishExpired(db, userId, now);

  const { data: running } = await db
    .from('training_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('kind', 'exam')
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (running) return { sessionId: running.id as string };

  const { data: profile } = await db.from('profiles').select('country').eq('id', userId).maybeSingle();
  const country = asCountry(profile?.country);
  const history = settings.mode === 'drill' && settings.pool !== 'all'
    ? await answerHistory(db, userId)
    : { answered: new Set<string>(), lastWrong: new Set<string>() };

  const selected = await selectExamQuestions(db, country, settings, history);
  if (selected.length === 0) {
    return {
      error:
        settings.mode === 'drill'
          ? 'No signed-off questions fit those choices yet. Try more areas, any difficulty or any question.'
          : 'There are no signed-off questions to set an exam from yet.',
    };
  }

  const { data: session, error } = await db
    .from('training_sessions')
    .insert({
      user_id: userId,
      kind: 'exam',
      planned_question_count: selected.length,
      target_minutes: settings.minutes > 0 ? settings.minutes : null,
      exam_settings: { ...settings, count: selected.length, asked: settings.count },
    })
    .select('id')
    .single();
  if (error || !session) {
    if (error) console.error('[exams] could not start', error);
    return { error: 'The exam could not be started. Please try again.' };
  }

  const { error: slotError } = await db.from('training_session_questions').insert(
    selected.map((q, position) => ({
      session_id: session.id,
      question_id: q.questionId,
      question_version_id: q.questionVersionId,
      position,
      reason: q.reason,
    })),
  );
  if (slotError) {
    await db.from('training_sessions').delete().eq('id', session.id);
    console.error('[exams] questions could not be saved', slotError);
    return { error: 'The exam could not be started. Please try again.' };
  }
  return { sessionId: session.id as string };
}

/** The clock for the exam page: when it ends, or null when untimed. */
export async function examClock(
  userId: string,
  sessionId: string,
): Promise<{ endsAt: string | null; over: boolean } | null> {
  const db = createServiceClient();
  const { data } = await db
    .from('training_sessions')
    .select('user_id, kind, started_at, target_minutes')
    .eq('id', sessionId)
    .maybeSingle();
  if (!data || data.user_id !== userId || data.kind !== 'exam') return null;
  const ends = examEndsAt(data.started_at as string, data.target_minutes as number | null);
  return {
    endsAt: ends ? ends.toISOString() : null,
    over: examOver(data.started_at as string, data.target_minutes as number | null, new Date()),
  };
}

export interface ExamAttempt {
  sessionId: string;
  settings: ExamSettings;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt: string | null;
  questions: number;
  answered: number;
  correct: number;
  endsAt: string | null;
}

/** This person's exams, newest first: the one running, then their history. */
export async function listExams(userId: string, limit = 30): Promise<ExamAttempt[]> {
  const db = createServiceClient();
  await finishExpired(db, userId, new Date());
  const { data } = await db
    .from('training_sessions')
    .select('id, status, started_at, completed_at, planned_question_count, total_answered, correct_count, target_minutes, exam_settings')
    .eq('user_id', userId)
    .eq('kind', 'exam')
    .order('started_at', { ascending: false })
    .limit(limit);
  return (data ?? []).flatMap((row) => {
    const settings = readSettings(row.exam_settings);
    if (!settings) return [];
    const ends = examEndsAt(row.started_at as string, row.target_minutes as number | null);
    return [
      {
        sessionId: row.id as string,
        settings,
        status: row.status as ExamAttempt['status'],
        startedAt: row.started_at as string,
        completedAt: (row.completed_at as string | null) ?? null,
        questions: row.planned_question_count as number,
        answered: row.total_answered as number,
        correct: row.correct_count as number,
        endsAt: ends ? ends.toISOString() : null,
      },
    ];
  });
}

export interface ReviewedQuestion {
  position: number;
  domainName: string | null;
  scenario: string | null;
  stem: string;
  options: QuestionOption[];
  /** Null when it was not answered before the exam ended. */
  selected: string[] | null;
  isCorrect: boolean | null;
  /**
   * The right answer and its explanation, only while a lawyer still stands
   * behind this version (0051); null when it has been taken back since.
   */
  correct: string[] | null;
  explanation: string | null;
}

/** A finished exam and its answers, for its owner only. */
export async function examReview(
  userId: string,
  sessionId: string,
): Promise<{ attempt: ExamAttempt; questions: ReviewedQuestion[] } | null> {
  const db = createServiceClient();
  const attempts = await listExams(userId, 200);
  const attempt = attempts.find((a) => a.sessionId === sessionId);
  if (!attempt || attempt.status !== 'completed') return null;

  const [{ data: slots }, { data: given }] = await Promise.all([
    db
      .from('training_session_questions')
      .select('position, question_version_id')
      .eq('session_id', sessionId)
      .order('position', { ascending: true }),
    db
      .from('user_question_attempts')
      .select('question_version_id, selected_option_ids, is_correct')
      .eq('session_id', sessionId)
      .eq('user_id', userId),
  ]);
  const versionIds = (slots ?? []).map((s) => s.question_version_id as string);
  if (versionIds.length === 0) return { attempt, questions: [] };

  const { data: versions } = await db
    .from('question_versions')
    .select(
      'id, stem, scenario, options, correct_option_ids, explanation, verification_status, review_due_on, questions(domains(name))',
    )
    .in('id', versionIds);
  const byVersion = new Map((versions ?? []).map((v) => [v.id as string, v]));
  const byAnswer = new Map((given ?? []).map((g) => [g.question_version_id as string, g]));

  const questions = (slots ?? []).flatMap((slot) => {
    const id = slot.question_version_id as string;
    const v = byVersion.get(id);
    if (!v) return [];
    const answer = byAnswer.get(id);
    const standing = stillSignedOff(v.verification_status as string, v.review_due_on as string | null);
    const question = v.questions as unknown as { domains: { name: string } | { name: string }[] | null } | null;
    const domain = question?.domains;
    return [
      {
        position: slot.position as number,
        domainName: (Array.isArray(domain) ? domain[0]?.name : domain?.name) ?? null,
        scenario: (v.scenario as string | null) ?? null,
        stem: v.stem as string,
        options: deliveryOrder((v.options ?? []) as QuestionOption[], id),
        selected: answer ? ((answer.selected_option_ids ?? []) as string[]) : null,
        isCorrect: answer ? answer.is_correct === true : null,
        correct: standing ? ((v.correct_option_ids ?? []) as string[]) : null,
        explanation: standing ? ((v.explanation as string | null) ?? null) : null,
      },
    ];
  });
  return { attempt, questions };
}
