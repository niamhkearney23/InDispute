import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { attemptStage, stringList } from './rules';
import type { AttemptStage } from './rules';
import type { Country } from '@/lib/types';

/**
 * Matters, from both sides.
 *
 * A learner reads through their own RLS-bound client: which matters they can
 * see, their own attempts, and the lawyer's approach only through the
 * database function that hands it over once they have handed in. Nothing on
 * the learner's side reads the lawyer's approach any other way.
 *
 * Staff read through the service client, after the page has checked the
 * role, because they need the lawyer's approach, drafts, and everybody's
 * attempts with names.
 */

export interface Matter {
  id: string;
  slug: string;
  number: number;
  title: string;
  country: Country;
  area: string;
  brief: string;
  timeLimitMinutes: number;
  procedurePrompt: string;
  draftPrompt: string;
  speakPrompt: string;
  published: boolean;
}

export interface MatterForStaff extends Matter {
  modelAnswer: string;
  sources: string;
  verifiedBy: string | null;
  verifiedByName: string | null;
  verifiedAt: string | null;
  createdBy: string | null;
  reviewFlagged: boolean;
  reviewNote: string;
  updatedAt: string;
}

export interface Attempt {
  id: string;
  matterId: string;
  userId: string;
  startedAt: string;
  deadlineAt: string;
  snapshot: {
    number: number;
    title: string;
    area: string;
    brief: string;
    timeLimitMinutes: number;
    procedurePrompt: string;
    draftPrompt: string;
    speakPrompt: string;
  };
  procedureAnswer: string;
  draftAnswer: string;
  hasRecording: boolean;
  recordingSeconds: number | null;
  followUpQuestions: string[];
  followUpAnswers: string[];
  followUpsByAi: boolean | null;
  submittedAt: string | null;
  submittedLate: boolean | null;
  verdict: 'good' | 'again' | null;
  feedback: string;
  markedAt: string | null;
  stage: AttemptStage;
}

const MATTER_SELECT =
  'id, slug, number, title, country, area, brief, time_limit_minutes, procedure_prompt, ' +
  'draft_prompt, speak_prompt, published';

const ATTEMPT_SELECT =
  'id, matter_id, user_id, started_at, deadline_at, snapshot, procedure_answer, draft_answer, ' +
  'recording_path, recording_seconds, followup_questions, followup_answers, followups_by_ai, ' +
  'submitted_at, submitted_late, verdict, feedback, marked_at';

interface MatterRow {
  id: string;
  slug: string;
  number: number;
  title: string;
  country: string;
  area: string | null;
  brief: string;
  time_limit_minutes: number;
  procedure_prompt: string;
  draft_prompt: string;
  speak_prompt: string;
  published: boolean;
}

interface AttemptRow {
  id: string;
  matter_id: string;
  user_id: string;
  started_at: string;
  deadline_at: string;
  snapshot: Record<string, unknown> | null;
  procedure_answer: string | null;
  draft_answer: string | null;
  recording_path: string | null;
  recording_seconds: number | null;
  followup_questions: unknown;
  followup_answers: unknown;
  followups_by_ai: boolean | null;
  submitted_at: string | null;
  submitted_late: boolean | null;
  verdict: string | null;
  feedback: string | null;
  marked_at: string | null;
}

function toMatter(row: MatterRow): Matter {
  return {
    id: row.id,
    slug: row.slug,
    number: row.number,
    title: row.title,
    country: row.country === 'AU' ? 'AU' : 'MY',
    area: row.area ?? '',
    brief: row.brief,
    timeLimitMinutes: row.time_limit_minutes,
    procedurePrompt: row.procedure_prompt,
    draftPrompt: row.draft_prompt,
    speakPrompt: row.speak_prompt,
    published: row.published,
  };
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function toAttempt(row: AttemptRow): Attempt {
  const s = row.snapshot ?? {};
  const verdict = row.verdict === 'good' || row.verdict === 'again' ? row.verdict : null;
  return {
    id: row.id,
    matterId: row.matter_id,
    userId: row.user_id,
    startedAt: row.started_at,
    deadlineAt: row.deadline_at,
    snapshot: {
      number: typeof s.number === 'number' ? s.number : 1,
      title: text(s.title, 'Matter'),
      area: text(s.area),
      brief: text(s.brief),
      timeLimitMinutes: typeof s.time_limit_minutes === 'number' ? s.time_limit_minutes : 45,
      procedurePrompt: text(s.procedure_prompt),
      draftPrompt: text(s.draft_prompt),
      speakPrompt: text(s.speak_prompt),
    },
    procedureAnswer: row.procedure_answer ?? '',
    draftAnswer: row.draft_answer ?? '',
    hasRecording: Boolean(row.recording_path),
    recordingSeconds: row.recording_seconds,
    followUpQuestions: stringList(row.followup_questions),
    followUpAnswers: stringList(row.followup_answers),
    followUpsByAi: row.followups_by_ai,
    submittedAt: row.submitted_at,
    submittedLate: row.submitted_late,
    verdict,
    feedback: row.feedback ?? '',
    markedAt: row.marked_at,
    stage: attemptStage({ submittedAt: row.submitted_at, verdict }),
  };
}

/* -------------------------------------------------------------------------- */
/* The learner's side                                                         */
/* -------------------------------------------------------------------------- */

export interface MatterListItem {
  matter: Matter;
  /** The most recent attempt, if any. */
  latest: Attempt | null;
  /** Whether any attempt on it has been marked Good. */
  everGood: boolean;
}

/** Every matter this person can see, with where they stand on each. */
export async function mattersForLearner(userId: string): Promise<MatterListItem[]> {
  const db = await createSupabaseServerClient();
  const [matters, attempts] = await Promise.all([
    db.from('matters').select(MATTER_SELECT).eq('published', true).order('number'),
    db
      .from('matter_attempts')
      .select(ATTEMPT_SELECT)
      .eq('user_id', userId)
      .order('started_at', { ascending: false }),
  ]);
  const mine = ((attempts.data ?? []) as unknown as AttemptRow[]).map(toAttempt);
  return ((matters.data ?? []) as unknown as MatterRow[]).map((row) => {
    const matter = toMatter(row);
    const own = mine.filter((a) => a.matterId === matter.id);
    return { matter, latest: own[0] ?? null, everGood: own.some((a) => a.verdict === 'good') };
  });
}

/** One matter, if this person can see it, with their attempts newest first. */
export async function matterForLearner(
  matterId: string,
  userId: string,
): Promise<{ matter: Matter; attempts: Attempt[] } | null> {
  const db = await createSupabaseServerClient();
  const [matter, attempts] = await Promise.all([
    db.from('matters').select(MATTER_SELECT).eq('id', matterId).maybeSingle(),
    db
      .from('matter_attempts')
      .select(ATTEMPT_SELECT)
      .eq('matter_id', matterId)
      .eq('user_id', userId)
      .order('started_at', { ascending: false }),
  ]);
  if (!matter.data) return null;
  return {
    matter: toMatter(matter.data as unknown as MatterRow),
    attempts: ((attempts.data ?? []) as unknown as AttemptRow[]).map(toAttempt),
  };
}

/** One attempt, read through the caller's own client. */
export async function attemptForCaller(attemptId: string): Promise<Attempt | null> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from('matter_attempts')
    .select(ATTEMPT_SELECT)
    .eq('id', attemptId)
    .maybeSingle();
  return data ? toAttempt(data as unknown as AttemptRow) : null;
}

/** The lawyer's approach, which the database gives only after hand-in. */
export async function modelAnswerFor(
  attemptId: string,
): Promise<{ modelAnswer: string; sources: string } | null> {
  const db = await createSupabaseServerClient();
  const { data } = await db.rpc('matter_model_answer', { attempt: attemptId });
  const row = ((data ?? []) as Array<{ model_answer: string; sources: string }>)[0];
  return row ? { modelAnswer: row.model_answer, sources: row.sources ?? '' } : null;
}

/**
 * A short-lived link to a recording. By attempt, never by path: the attempt
 * is read through the caller's own client first, so a learner can only ever
 * be handed their own recording and a coach anybody's.
 */
export async function signedUrlForRecording(attemptId: string): Promise<string | null> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from('matter_attempts')
    .select('recording_path')
    .eq('id', attemptId)
    .maybeSingle();
  const path = (data as { recording_path: string | null } | null)?.recording_path;
  if (!path) return null;
  const { data: signed } = await createServiceClient()
    .storage.from('matter-recordings')
    .createSignedUrl(path, 60 * 30);
  return signed?.signedUrl ?? null;
}

/** How many different matters this person has had marked Good. */
export async function mattersMarkedGood(userId: string): Promise<number> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from('matter_attempts')
    .select('matter_id')
    .eq('user_id', userId)
    .eq('verdict', 'good');
  return new Set(((data ?? []) as Array<{ matter_id: string }>).map((r) => r.matter_id)).size;
}

/* -------------------------------------------------------------------------- */
/* The staff side: call only after requireCoach or requireAdmin                */
/* -------------------------------------------------------------------------- */

const STAFF_SELECT =
  `${MATTER_SELECT}, model_answer, sources, verified_by, verified_at, created_by, ` +
  'review_flagged, review_note, updated_at';

interface StaffRow extends MatterRow {
  model_answer: string;
  sources: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_by: string | null;
  review_flagged: boolean;
  review_note: string | null;
  updated_at: string;
}

/** Names for staff pages, by id: the display name, or the email if none. */
async function namesFor(ids: Array<string | null>): Promise<Map<string, string>> {
  const wanted = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (wanted.length === 0) return new Map();
  const { data } = await createServiceClient()
    .from('profiles')
    .select('id, display_name, email')
    .in('id', wanted);
  return new Map(
    ((data ?? []) as Array<{ id: string; display_name: string | null; email: string }>).map(
      (p) => [p.id, p.display_name || p.email],
    ),
  );
}

function toStaffMatter(row: StaffRow, names: Map<string, string>): MatterForStaff {
  return {
    ...toMatter(row),
    modelAnswer: row.model_answer,
    sources: row.sources ?? '',
    verifiedBy: row.verified_by,
    verifiedByName: row.verified_by ? (names.get(row.verified_by) ?? null) : null,
    verifiedAt: row.verified_at,
    createdBy: row.created_by,
    reviewFlagged: row.review_flagged,
    reviewNote: row.review_note ?? '',
    updatedAt: row.updated_at,
  };
}

export interface StaffMatterSummary {
  matter: MatterForStaff;
  attempts: number;
  waiting: number;
}

export async function allMattersForStaff(): Promise<StaffMatterSummary[]> {
  const db = createServiceClient();
  const [matters, attempts] = await Promise.all([
    db.from('matters').select(STAFF_SELECT).order('country').order('number'),
    db.from('matter_attempts').select('matter_id, submitted_at, verdict'),
  ]);
  const rows = (attempts.data ?? []) as Array<{
    matter_id: string;
    submitted_at: string | null;
    verdict: string | null;
  }>;
  const staffRows = (matters.data ?? []) as unknown as StaffRow[];
  const names = await namesFor(staffRows.map((r) => r.verified_by));
  return staffRows.map((row) => ({
    matter: toStaffMatter(row, names),
    attempts: rows.filter((a) => a.matter_id === row.id).length,
    waiting: rows.filter((a) => a.matter_id === row.id && a.submitted_at && !a.verdict).length,
  }));
}

export interface NamedAttempt extends Attempt {
  name: string;
}

export async function matterForStaff(
  matterId: string,
): Promise<{ matter: MatterForStaff; attempts: NamedAttempt[] } | null> {
  const db = createServiceClient();
  const [matter, attempts] = await Promise.all([
    db.from('matters').select(STAFF_SELECT).eq('id', matterId).maybeSingle(),
    db
      .from('matter_attempts')
      .select(ATTEMPT_SELECT)
      .eq('matter_id', matterId)
      .order('started_at', { ascending: false }),
  ]);
  if (!matter.data) return null;
  const row = matter.data as unknown as StaffRow;
  const attemptRows = (attempts.data ?? []) as unknown as AttemptRow[];
  const names = await namesFor([row.verified_by, ...attemptRows.map((a) => a.user_id)]);
  return {
    matter: toStaffMatter(row, names),
    attempts: attemptRows.map((a) => ({ ...toAttempt(a), name: names.get(a.user_id) ?? 'Somebody' })),
  };
}

/**
 * Store the follow-up questions on an attempt. The questions are the
 * server's, so a learner's client cannot write them; this is called only by
 * the action, after it has read the attempt through the learner's own client
 * and found it theirs and open. The filters repeat that here, so this can
 * never write to somebody else's attempt or one already handed in.
 */
export async function storeFollowUps(
  attemptId: string,
  userId: string,
  questions: string[],
  byAi: boolean,
): Promise<boolean> {
  const { data, error } = await createServiceClient()
    .from('matter_attempts')
    .update({
      followup_questions: questions,
      followups_by_ai: byAi,
      followups_asked_at: new Date().toISOString(),
    })
    .eq('id', attemptId)
    .eq('user_id', userId)
    .is('submitted_at', null)
    .select('id');
  return !error && (data ?? []).length === 1;
}
