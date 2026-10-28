import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  STUDIO_BUCKET,
  STUDIO_PLAYBACK_SECONDS,
  type AttemptStatus,
  type RecordingKind,
  type StudioConsent,
  type StudioFeedback,
  type TranscriptSegment,
} from './rules';

/**
 * Reading the Studio (0053). A learner's own attempts, consent and reviews
 * are read through their own session, so the database's rules apply as well
 * as the app's; the service client is used only to sign a playback link for
 * a path that read returned, and for staff pages after their guard.
 */

export interface StudioAttempt {
  id: string;
  userId: string;
  exerciseKey: string;
  exerciseHash: string;
  startedAt: string;
  kind: RecordingKind | null;
  path: string | null;
  mime: string | null;
  seconds: number | null;
  status: AttemptStatus;
  aiProcessing: boolean;
  sharedWithTrainer: boolean;
  transcript: string | null;
  segments: TranscriptSegment[] | null;
  feedback: StudioFeedback | null;
  failure: string | null;
  processingStartedAt: string | null;
  feedbackAt: string | null;
  deletedAt: string | null;
  timings: Record<string, number> | null;
}

export interface StudioReview {
  id: string;
  reviewerName: string;
  feedback: string;
  scoreOverrides: Record<string, number | 'not_assessed'>;
  commentDecisions: Record<string, 'approved' | 'rejected'>;
  followUp: string | null;
  createdAt: string;
}

export const ATTEMPT_COLUMNS =
  'id, user_id, exercise_key, exercise_hash, started_at, recording_kind, recording_path, recording_mime, recording_seconds, status, ai_processing, shared_with_trainer, transcript, transcript_segments, feedback, failure, processing_started_at, feedback_at, deleted_at, timings';

export function toAttempt(row: Record<string, unknown>): StudioAttempt {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    exerciseKey: row.exercise_key as string,
    exerciseHash: row.exercise_hash as string,
    startedAt: row.started_at as string,
    kind: (row.recording_kind as RecordingKind | null) ?? null,
    path: (row.recording_path as string | null) ?? null,
    mime: (row.recording_mime as string | null) ?? null,
    seconds: (row.recording_seconds as number | null) ?? null,
    status: row.status as AttemptStatus,
    aiProcessing: Boolean(row.ai_processing),
    sharedWithTrainer: Boolean(row.shared_with_trainer),
    transcript: (row.transcript as string | null) ?? null,
    segments: (row.transcript_segments as TranscriptSegment[] | null) ?? null,
    feedback: (row.feedback as StudioFeedback | null) ?? null,
    failure: (row.failure as string | null) ?? null,
    processingStartedAt: (row.processing_started_at as string | null) ?? null,
    feedbackAt: (row.feedback_at as string | null) ?? null,
    deletedAt: (row.deleted_at as string | null) ?? null,
    timings: (row.timings as Record<string, number> | null) ?? null,
  };
}

/** The latest consent decision this person made, or null. */
export async function latestConsent(userId: string): Promise<StudioConsent | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('studio_consents')
    .select('notice_version, recording, ai_processing, trainer_sharing, decided_at')
    .eq('user_id', userId)
    .order('decided_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    noticeVersion: data.notice_version as string,
    recording: Boolean(data.recording),
    aiProcessing: Boolean(data.ai_processing),
    trainerSharing: Boolean(data.trainer_sharing),
    decidedAt: data.decided_at as string,
  };
}

/** This person's attempts, newest first. Null when they could not be read. */
export async function attemptsFor(userId: string): Promise<StudioAttempt[] | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('studio_attempts')
    .select(ATTEMPT_COLUMNS)
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(200);
  if (error || !data) return null;
  return (data as Record<string, unknown>[]).map(toAttempt);
}

/** One of this person's own attempts, or null. */
export async function ownAttempt(userId: string, attemptId: string): Promise<StudioAttempt | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('studio_attempts')
    .select(ATTEMPT_COLUMNS)
    .eq('id', attemptId)
    .eq('user_id', userId)
    .maybeSingle();
  return data ? toAttempt(data as Record<string, unknown>) : null;
}

/** A short-lived link to play a recording, for a path already read under the caller's own rules. */
export async function playbackUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await createServiceClient()
    .storage.from(STUDIO_BUCKET)
    .createSignedUrl(path, STUDIO_PLAYBACK_SECONDS);
  return data?.signedUrl ?? null;
}

/** Coaches' reviews of an attempt, newest first, read under the caller's rules. */
export async function reviewsFor(attemptId: string, viaService = false): Promise<StudioReview[]> {
  const db = viaService ? createServiceClient() : await createSupabaseServerClient();
  const { data } = await db
    .from('studio_reviews')
    .select('id, reviewer_id, feedback, score_overrides, ai_comment_decisions, follow_up_exercise_key, created_at')
    .eq('attempt_id', attemptId)
    .order('created_at', { ascending: false });
  const rows = (data ?? []) as Record<string, unknown>[];
  if (rows.length === 0) return [];
  const { data: people } = await createServiceClient()
    .from('profiles')
    .select('id, display_name')
    .in('id', [...new Set(rows.map((r) => r.reviewer_id as string))]);
  const names = new Map((people ?? []).map((p) => [p.id as string, (p.display_name as string | null) ?? 'Your coach']));
  return rows.map((r) => ({
    id: r.id as string,
    reviewerName: names.get(r.reviewer_id as string) ?? 'Your coach',
    feedback: r.feedback as string,
    scoreOverrides: (r.score_overrides as Record<string, number | 'not_assessed'>) ?? {},
    commentDecisions: (r.ai_comment_decisions as Record<string, 'approved' | 'rejected'>) ?? {},
    followUp: (r.follow_up_exercise_key as string | null) ?? null,
    createdAt: r.created_at as string,
  }));
}

/* -------------------------------------------------------------------------- */
/* Staff: only what a learner chose to share, read after the page's guard     */
/* -------------------------------------------------------------------------- */

export interface SharedAttempt extends StudioAttempt {
  learnerName: string;
  reviewCount: number;
}

/**
 * Attempts their learners have shared with the coaches and not deleted,
 * newest first. The service client is used because a coach's own session
 * reads through the same rule (0053's read policy) only with the code typed,
 * which the page's guard has already asked for.
 */
export async function sharedAttempts(limit = 100): Promise<SharedAttempt[] | null> {
  const db = createServiceClient();
  const { data, error } = await db
    .from('studio_attempts')
    .select(ATTEMPT_COLUMNS)
    .eq('shared_with_trainer', true)
    .is('deleted_at', null)
    .neq('status', 'awaiting_upload')
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error || !data) return null;
  const attempts = (data as Record<string, unknown>[]).map(toAttempt);
  if (attempts.length === 0) return [];
  const [{ data: people }, { data: reviews }] = await Promise.all([
    db.from('profiles').select('id, display_name').in('id', [...new Set(attempts.map((a) => a.userId))]),
    db.from('studio_reviews').select('attempt_id').in('attempt_id', attempts.map((a) => a.id)),
  ]);
  const names = new Map((people ?? []).map((p) => [p.id as string, (p.display_name as string | null) ?? 'A learner']));
  const counts = new Map<string, number>();
  for (const r of reviews ?? []) counts.set(r.attempt_id as string, (counts.get(r.attempt_id as string) ?? 0) + 1);
  return attempts.map((a) => ({
    ...a,
    learnerName: names.get(a.userId) ?? 'A learner',
    reviewCount: counts.get(a.id) ?? 0,
  }));
}

/** One shared, undeleted attempt, with the learner's country, or null. */
export async function sharedAttempt(
  attemptId: string,
): Promise<(SharedAttempt & { learnerCountry: string | null }) | null> {
  const db = createServiceClient();
  const { data } = await db
    .from('studio_attempts')
    .select(ATTEMPT_COLUMNS)
    .eq('id', attemptId)
    .eq('shared_with_trainer', true)
    .is('deleted_at', null)
    .maybeSingle();
  if (!data) return null;
  const attempt = toAttempt(data as Record<string, unknown>);
  const { data: person } = await db
    .from('profiles')
    .select('display_name, country')
    .eq('id', attempt.userId)
    .maybeSingle();
  return {
    ...attempt,
    learnerName: (person?.display_name as string | null) ?? 'A learner',
    learnerCountry: (person?.country as string | null) ?? null,
    reviewCount: 0,
  };
}

/**
 * Records that a member of staff opened or reviewed a learner's recording.
 * The learner is told each opening is recorded, so a page that cannot record
 * it does not show the recording: false means show nothing.
 */
export async function logStudioAccess(
  attemptId: string,
  staffId: string,
  action: 'opened' | 'reviewed',
): Promise<boolean> {
  const { error } = await createServiceClient()
    .from('studio_access_log')
    .insert({ attempt_id: attemptId, staff_id: staffId, action });
  if (error) console.error('[studio] access could not be logged', error);
  return !error;
}
