import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { ERASED_NAME } from './erasure-rules';
import { JOB_SELECT, toJob, type ErasureJob } from './erasure';
import { readRecentRuns, type RecordedRun } from './erasure-monitor-store';

/**
 * What Admin, Deletions reads (0045). Service role, so every page that calls
 * these has asked `requireAdmin` first. Nothing here writes.
 */

/** How long a finished, reviewed deletion stays on the list. */
const RECENT_DAYS = 90;

export interface DeletionSummary {
  job: ErasureJob;
  /** Who asked: "The person themselves", an administrator's name, or null when unknown. */
  requestedBy: string | null;
  reviewClosedAt: string | null;
  /** Certification records still waiting for a decision. */
  undecided: number;
}

interface JobWithReview {
  user_id: string;
  review_closed_at: string | null;
  review_closed_by: string | null;
  former_display_name: string | null;
}

async function namesFor(ids: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return names;
  const { data } = await createServiceClient()
    .from('profiles')
    .select('id, display_name, email')
    .in('id', unique);
  for (const p of (data ?? []) as Array<{ id: string; display_name: string | null; email: string | null }>) {
    names.set(p.id, p.display_name || p.email || 'Somebody');
  }
  return names;
}

function requester(job: ErasureJob, names: Map<string, string>): string | null {
  if (!job.requestedBy) return null;
  if (job.requestedBy === job.userId) return 'The person themselves';
  return names.get(job.requestedBy) ?? 'An administrator';
}

/**
 * Every unfinished deletion, every one whose review is still open, and the
 * rest from the last ninety days. `error` is true when the list could not
 * be read, so the page says so rather than showing an empty list.
 */
export async function listDeletions(): Promise<{ rows: DeletionSummary[]; error: boolean }> {
  const db = createServiceClient();
  const since = new Date(Date.now() - RECENT_DAYS * 86_400_000).toISOString();
  const { data, error } = await db
    .from('account_erasures')
    .select(`${JOB_SELECT}, review_closed_at`)
    .or(`completed_at.is.null,review_closed_at.is.null,requested_at.gte.${since}`)
    .order('requested_at', { ascending: false })
    .limit(200);
  if (error) {
    console.error('reading deletions failed:', error.message);
    return { rows: [], error: true };
  }
  const rows = (data ?? []) as unknown as Array<Parameters<typeof toJob>[0] & { review_closed_at: string | null }>;
  const jobs = rows.map((row) => ({ job: toJob(row), reviewClosedAt: row.review_closed_at }));

  const ids = jobs.map((j) => j.job.userId);
  const undecided = new Map<string, number>();
  if (ids.length > 0) {
    const { data: items, error: itemsError } = await db
      .from('erasure_review_items')
      .select('user_id')
      .is('decision', null)
      .in('user_id', ids);
    if (itemsError) return { rows: [], error: true };
    for (const item of (items ?? []) as Array<{ user_id: string }>) {
      undecided.set(item.user_id, (undecided.get(item.user_id) ?? 0) + 1);
    }
  }
  const names = await namesFor(jobs.map((j) => j.job.requestedBy ?? ''));

  return {
    rows: jobs.map(({ job, reviewClosedAt }) => ({
      job,
      requestedBy: requester(job, names),
      reviewClosedAt,
      undecided: undecided.get(job.userId) ?? 0,
    })),
    error: false,
  };
}

export interface ReviewItem {
  id: string;
  kind: 'trainee' | 'entry';
  traineeId: string | null;
  entryId: string | null;
  /** What the record says now, for the administrator deciding. */
  summary: string;
  decision: 'redact' | 'retain' | null;
  reason: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
}

export interface IdentifyingRecord {
  kind: string;
  recordId: string;
  postId: string | null;
  excerpt: string;
  at: string | null;
  canRedact: boolean;
}

export interface DeletionDetail {
  job: ErasureJob;
  requestedBy: string | null;
  /** The name they had, kept only while the review is open. */
  formerName: string | null;
  reviewClosedAt: string | null;
  reviewClosedBy: string | null;
  items: ReviewItem[];
  records: IdentifyingRecord[];
  /** The records could not be listed. */
  recordsError: boolean;
}

/** One deletion, its review queue and what may still identify the person. */
export async function deletionDetail(userId: string): Promise<DeletionDetail | null> {
  const db = createServiceClient();
  const { data, error } = await db
    .from('account_erasures')
    .select(`${JOB_SELECT}, review_closed_at, review_closed_by, former_display_name`)
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as Parameters<typeof toJob>[0] & JobWithReview;
  const job = toJob(row);

  const [itemsResult, recordsResult] = await Promise.all([
    db
      .from('erasure_review_items')
      .select('id, certification_trainee_id, certification_entry_id, decision, reason, decided_by, decided_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
    db.rpc('erasure_identifying_records', { uid: userId }),
  ]);

  const itemRows = (itemsResult.data ?? []) as Array<{
    id: string;
    certification_trainee_id: string | null;
    certification_entry_id: string | null;
    decision: 'redact' | 'retain' | null;
    reason: string | null;
    decided_by: string | null;
    decided_at: string | null;
  }>;

  const traineeIds = itemRows.map((i) => i.certification_trainee_id).filter((x): x is string => !!x);
  const entryIds = itemRows.map((i) => i.certification_entry_id).filter((x): x is string => !!x);
  const [trainees, entries] = await Promise.all([
    traineeIds.length
      ? db.from('certification_trainees').select('id, full_name, firm_name, notes').in('id', traineeIds)
      : Promise.resolve({ data: [] }),
    entryIds.length
      ? db
          .from('certification_entries')
          .select('id, trainee_id, box_number, case_no, court_file_ref, case_type_stage, note, grade, date_in')
          .in('id', entryIds)
      : Promise.resolve({ data: [] }),
  ]);
  const traineeById = new Map(
    ((trainees.data ?? []) as Array<{ id: string; full_name: string; firm_name: string; notes: string }>).map(
      (t) => [t.id, t],
    ),
  );
  const entryById = new Map(
    (
      (entries.data ?? []) as Array<{
        id: string;
        trainee_id: string;
        box_number: number;
        case_no: string;
        court_file_ref: string;
        case_type_stage: string;
        note: string;
        grade: string | null;
        date_in: string;
      }>
    ).map((e) => [e.id, e]),
  );

  const names = await namesFor([
    job.requestedBy ?? '',
    row.review_closed_by ?? '',
    ...itemRows.map((i) => i.decided_by ?? ''),
  ]);

  const items: ReviewItem[] = itemRows.map((item) => {
    if (item.certification_trainee_id) {
      const t = traineeById.get(item.certification_trainee_id);
      return {
        id: item.id,
        kind: 'trainee',
        traineeId: item.certification_trainee_id,
        entryId: null,
        summary: t
          ? `Register record: ${t.full_name}, ${t.firm_name}${t.notes ? `. Notes: ${t.notes}` : ''}`
          : 'Register record (no longer there)',
        decision: item.decision,
        reason: item.reason,
        decidedBy: item.decided_by ? (names.get(item.decided_by) ?? 'An administrator') : null,
        decidedAt: item.decided_at,
      };
    }
    const e = item.certification_entry_id ? entryById.get(item.certification_entry_id) : undefined;
    const parts = e
      ? [
          `Box ${e.box_number}, matter reference ${e.case_no || 'none'}`,
          e.court_file_ref ? `court reference ${e.court_file_ref}` : '',
          e.case_type_stage ? `case ${e.case_type_stage}` : '',
          e.note ? `note: ${e.note}` : '',
        ].filter(Boolean)
      : ['Register entry (no longer there)'];
    return {
      id: item.id,
      kind: 'entry',
      traineeId: e?.trainee_id ?? null,
      entryId: item.certification_entry_id,
      summary: parts.join('; '),
      decision: item.decision,
      reason: item.reason,
      decidedBy: item.decided_by ? (names.get(item.decided_by) ?? 'An administrator') : null,
      decidedAt: item.decided_at,
    };
  });

  const records = (
    (recordsResult.data ?? []) as Array<{
      kind: string;
      record_id: string;
      post_id: string | null;
      excerpt: string | null;
      happened_at: string | null;
      can_redact: boolean;
    }>
  ).map((r) => ({
    kind: r.kind,
    recordId: r.record_id,
    postId: r.post_id,
    excerpt: r.excerpt ?? '',
    at: r.happened_at,
    canRedact: r.can_redact,
  }));

  return {
    job,
    requestedBy: requester(job, names),
    formerName: row.former_display_name,
    reviewClosedAt: row.review_closed_at,
    reviewClosedBy: row.review_closed_by ? (names.get(row.review_closed_by) ?? 'An administrator') : null,
    items,
    records,
    recordsError: Boolean(recordsResult.error),
  };
}

/** What each kind of remaining record is, in words. */
export const RECORD_KIND_LABEL: Record<string, string> = {
  own_message: 'Their own work-board message, still showing',
  own_comment: 'Their own work-board comment, still showing',
  mention_message: 'A work-board message that names them',
  mention_comment: 'A work-board comment that names them',
  submission: 'Work they handed in (the file, its name and their note)',
  feedback_mention: 'A coach’s feedback that names them',
  matter_answer: 'Their written answers on a matter, and its mark',
  onboarding_note: 'A supervisor’s note on their joining decision',
  certificate: 'Their certificate of completion',
  certification_trainee: 'A certification register record (decide it below)',
  certification_entry: 'A certification register entry (decide it below)',
};

/** Where an administrator can see a remaining record in context. */
export function recordHref(record: IdentifyingRecord, userId: string): string | null {
  if (record.postId) return `/admin/work/${record.postId}`;
  if (record.kind === 'onboarding_note') return `/admin/onboarding/${userId}`;
  if (record.kind === 'matter_answer' || record.kind === 'certificate') return `/admin/trainees/${userId}`;
  if (record.kind === 'certification_trainee') return `/admin/certification/${record.recordId}`;
  return null;
}

/** The name a deleted account shows, for the page heading. */
export const DELETED_LABEL = ERASED_NAME;

/** How many of the nightly check's runs Admin, Deletions shows. */
export const RECENT_RUNS = 7;

/**
 * The nightly check's last few runs (0049), newest first. `error` is true
 * when they could not be read, so the page says so rather than "none".
 */
export async function listNightlyRuns(): Promise<{ runs: RecordedRun[]; error: boolean }> {
  try {
    return { runs: await readRecentRuns(RECENT_RUNS), error: false };
  } catch (error) {
    console.error('reading the nightly runs failed:', error);
    return { runs: [], error: true };
  }
}
