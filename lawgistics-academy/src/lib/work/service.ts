import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isTrustedWorkLink, submissionState } from './links';
import type { SubmissionState, Verdict } from './links';
import type { Country } from '@/lib/types';

/**
 * The work board: what a coach has posted, whose name is on it, and what
 * was handed in.
 *
 * Two kinds of reader, and they use different clients on purpose.
 *
 * An intern reads through the RLS-bound client. Who may see a post is
 * decided once, by `work_visible` in the database, and not re-implemented
 * here; an intern's own claims and submissions come back and nobody else's,
 * because that is what the policies say. Nothing on the learner side ever
 * touches the service client except to sign a URL, and only after the row
 * has been read through the caller's own client.
 *
 * A coach reads through the service client, after `requireCoach`, as the
 * sessions page does: they see drafts, every name and every submission, and
 * the names come from profiles, which an intern's client cannot read.
 */

export type WorkKind = 'task' | 'material';

export interface WorkPost {
  id: string;
  kind: WorkKind;
  title: string;
  instructions: string;
  /** What the coach called the file, or null when there is no file. */
  fileName: string | null;
  linkUrl: string | null;
  /** Whether the coach recorded a memo. The path itself stays on the server. */
  hasMemo: boolean;
  /** How many people may take it. Null is no limit. */
  maxClaims: number | null;
  /** The coach's own estimate of how long it takes, in minutes. */
  expectedMinutes: number | null;
  traineesOnly: boolean;
  country: Country | null;
  dueOn: string | null;
  sessionId: string | null;
  homeworkDay: number | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export interface WorkSubmission {
  id: string;
  postId: string;
  userId: string;
  fileName: string;
  note: string;
  submittedAt: string;
  verdict: Verdict | null;
  feedback: string;
  markedAt: string | null;
}

export interface WorkMessage {
  id: string;
  postId: string;
  threadUserId: string;
  senderId: string;
  body: string;
  sentAt: string;
}

/** A post as an intern sees it: the post, their standing, how many names. */
export interface WorkBoardItem {
  post: WorkPost;
  claimed: boolean;
  /** Names on it, counted. Full when it reaches the post's limit. */
  claims: number;
  latest: WorkSubmission | null;
  state: SubmissionState;
  /** The last word in this person's thread was somebody else's. */
  replyWaiting: boolean;
}

/** Whether a task has all the names it can take. */
export function isFull(post: WorkPost, claims: number): boolean {
  return post.maxClaims !== null && claims >= post.maxClaims;
}

interface PostRow {
  id: string;
  kind: string;
  title: string;
  instructions: string | null;
  file_path: string | null;
  file_name: string | null;
  link_url: string | null;
  memo_path: string | null;
  max_claims: number | null;
  expected_minutes: number | null;
  trainees_only: boolean;
  country: string | null;
  due_on: string | null;
  session_id: string | null;
  homework_day: number | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
}

interface SubmissionRow {
  id: string;
  post_id: string;
  user_id: string;
  file_name: string | null;
  note: string | null;
  submitted_at: string;
  verdict: string | null;
  feedback: string | null;
  marked_at: string | null;
}

interface MessageRow {
  id: string;
  post_id: string;
  thread_user_id: string;
  sender_id: string;
  body: string;
  sent_at: string;
}

const POST_SELECT =
  'id, kind, title, instructions, file_path, file_name, link_url, memo_path, max_claims, ' +
  'expected_minutes, trainees_only, country, due_on, session_id, homework_day, published, ' +
  'published_at, created_at';

const MESSAGE_SELECT = 'id, post_id, thread_user_id, sender_id, body, sent_at';

const SUBMISSION_SELECT =
  'id, post_id, user_id, file_name, note, submitted_at, verdict, feedback, marked_at';

function toPost(row: PostRow): WorkPost {
  return {
    id: row.id,
    kind: row.kind === 'material' ? 'material' : 'task',
    title: row.title,
    instructions: row.instructions ?? '',
    fileName: row.file_path ? row.file_name || 'Attached file' : null,
    // The database constraint should make this impossible; this is the
    // second lock on the same door, as with session links.
    linkUrl: row.link_url && isTrustedWorkLink(row.link_url) ? row.link_url : null,
    hasMemo: Boolean(row.memo_path),
    maxClaims: row.max_claims ?? null,
    expectedMinutes: row.expected_minutes ?? null,
    traineesOnly: row.trainees_only,
    country: (row.country as Country | null) ?? null,
    dueOn: row.due_on,
    sessionId: row.session_id,
    homeworkDay: row.homework_day,
    published: row.published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

function toSubmission(row: SubmissionRow): WorkSubmission {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    fileName: row.file_name || 'Handed in',
    note: row.note ?? '',
    submittedAt: row.submitted_at,
    verdict: row.verdict === 'good' || row.verdict === 'again' ? row.verdict : null,
    feedback: row.feedback ?? '',
    markedAt: row.marked_at,
  };
}

function toMessage(row: MessageRow): WorkMessage {
  return {
    id: row.id,
    postId: row.post_id,
    threadUserId: row.thread_user_id,
    senderId: row.sender_id,
    body: row.body,
    sentAt: row.sent_at,
  };
}

/** The threads whose last word was not the thread owner's, keyed by post. */
function replyWaitingByPost(messages: WorkMessage[], ownerId: string): Set<string> {
  const last = new Map<string, WorkMessage>();
  for (const m of messages) {
    if (m.threadUserId !== ownerId) continue;
    const held = last.get(m.postId);
    if (!held || m.sentAt > held.sentAt) last.set(m.postId, m);
  }
  return new Set([...last.values()].filter((m) => m.senderId !== ownerId).map((m) => m.postId));
}

function latestPerPost(rows: WorkSubmission[]): Map<string, WorkSubmission> {
  const latest = new Map<string, WorkSubmission>();
  for (const s of rows) {
    const held = latest.get(s.postId);
    if (!held || s.submittedAt > held.submittedAt) latest.set(s.postId, s);
  }
  return latest;
}

/* -------------------------------------------------------------------------- */
/* The intern's side                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Everything this person may see, with where they stand on each.
 *
 * Unpublished posts come back only where this person already has their name
 * on them, which is the read policy's doing, not this function's.
 */
export async function workBoardFor(userId: string): Promise<WorkBoardItem[]> {
  const db = await createSupabaseServerClient();

  const [posts, claims, submissions, counts, messages] = await Promise.all([
    db.from('work_posts').select(POST_SELECT).order('created_at', { ascending: false }),
    db.from('work_claims').select('post_id').eq('user_id', userId),
    db.from('work_submissions').select(SUBMISSION_SELECT).eq('user_id', userId),
    db.from('work_claim_counts').select('post_id, claims'),
    db.from('work_messages').select(MESSAGE_SELECT).eq('thread_user_id', userId),
  ]);
  const replies = replyWaitingByPost(
    ((messages.data ?? []) as unknown as MessageRow[]).map(toMessage),
    userId,
  );

  const mine = new Set(((claims.data ?? []) as Array<{ post_id: string }>).map((c) => c.post_id));
  const latest = latestPerPost(
    ((submissions.data ?? []) as unknown as SubmissionRow[]).map(toSubmission),
  );
  const claimCounts = new Map(
    ((counts.data ?? []) as Array<{ post_id: string; claims: number }>).map((c) => [
      c.post_id,
      c.claims,
    ]),
  );

  return ((posts.data ?? []) as unknown as PostRow[]).map(toPost).map((post) => {
    const current = latest.get(post.id) ?? null;
    return {
      post,
      claimed: mine.has(post.id),
      claims: claimCounts.get(post.id) ?? 0,
      latest: current,
      state: submissionState(current),
      replyWaiting: replies.has(post.id),
    };
  });
}

/** One post, with every submission this person has made on it, newest first. */
export async function workPostFor(
  postId: string,
  userId: string,
): Promise<(WorkBoardItem & { submissions: WorkSubmission[]; messages: WorkMessage[] }) | null> {
  const db = await createSupabaseServerClient();

  const [post, claim, submissions, count, messages] = await Promise.all([
    db.from('work_posts').select(POST_SELECT).eq('id', postId).maybeSingle(),
    db
      .from('work_claims')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle(),
    db
      .from('work_submissions')
      .select(SUBMISSION_SELECT)
      .eq('post_id', postId)
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false }),
    db.from('work_claim_counts').select('claims').eq('post_id', postId).maybeSingle(),
    db
      .from('work_messages')
      .select(MESSAGE_SELECT)
      .eq('post_id', postId)
      .eq('thread_user_id', userId)
      .order('sent_at', { ascending: true }),
  ]);

  if (!post.data) return null;

  const all = ((submissions.data ?? []) as unknown as SubmissionRow[]).map(toSubmission);
  const current = all[0] ?? null;
  const thread = ((messages.data ?? []) as unknown as MessageRow[]).map(toMessage);

  return {
    post: toPost(post.data as unknown as PostRow),
    claimed: Boolean(claim.data),
    claims: (count.data as { claims: number } | null)?.claims ?? 0,
    latest: current,
    state: submissionState(current),
    replyWaiting: replyWaitingByPost(thread, userId).has(postId),
    submissions: all,
    messages: thread,
  };
}

/**
 * What hangs under a session, or under a homework day: the coach's reading
 * and any task that goes with it. Published only, even for a coach, because
 * this is drawn on the learner's page.
 */
export async function postsForSession(sessionId: string): Promise<WorkPost[]> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from('work_posts')
    .select(POST_SELECT)
    .eq('session_id', sessionId)
    .eq('published', true)
    .order('created_at', { ascending: true });
  return ((data ?? []) as unknown as PostRow[]).map(toPost);
}

/** The same, for every session at once, keyed by session. */
export async function postsForSessions(): Promise<Map<string, WorkPost[]>> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from('work_posts')
    .select(POST_SELECT)
    .eq('published', true)
    .order('created_at', { ascending: true });

  const bySession = new Map<string, WorkPost[]>();
  for (const post of ((data ?? []) as unknown as PostRow[]).map(toPost)) {
    if (post.sessionId === null) continue;
    bySession.set(post.sessionId, [...(bySession.get(post.sessionId) ?? []), post]);
  }
  return bySession;
}

export async function postsForHomeworkDays(): Promise<Map<number, WorkPost[]>> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from('work_posts')
    .select(POST_SELECT)
    .eq('published', true)
    .order('created_at', { ascending: true });

  const byDay = new Map<number, WorkPost[]>();
  for (const post of ((data ?? []) as unknown as PostRow[]).map(toPost)) {
    if (post.homeworkDay === null) continue;
    byDay.set(post.homeworkDay, [...(byDay.get(post.homeworkDay) ?? []), post]);
  }
  return byDay;
}

/* -------------------------------------------------------------------------- */
/* The coach's side                                                           */
/* -------------------------------------------------------------------------- */

export interface WorkPostSummary {
  post: WorkPost;
  claims: number;
  submissions: number;
  /** Handed in and nobody has looked yet. */
  waiting: number;
  /** Threads where the last word was the intern's. */
  unanswered: number;
}

/** Every post, drafts included, with how much sits under each. */
export async function allWorkPosts(): Promise<WorkPostSummary[]> {
  const db = createServiceClient();

  const [posts, claims, submissions, messages] = await Promise.all([
    db.from('work_posts').select(POST_SELECT).order('created_at', { ascending: false }),
    db.from('work_claims').select('post_id'),
    db.from('work_submissions').select('post_id, user_id, submitted_at, verdict'),
    db.from('work_messages').select(MESSAGE_SELECT),
  ]);

  // A thread is unanswered when its last message is the intern's own.
  const lastInThread = new Map<string, WorkMessage>();
  for (const m of ((messages.data ?? []) as unknown as MessageRow[]).map(toMessage)) {
    const key = `${m.postId}/${m.threadUserId}`;
    const held = lastInThread.get(key);
    if (!held || m.sentAt > held.sentAt) lastInThread.set(key, m);
  }
  const unanswered = new Map<string, number>();
  for (const m of lastInThread.values()) {
    if (m.senderId !== m.threadUserId) continue;
    unanswered.set(m.postId, (unanswered.get(m.postId) ?? 0) + 1);
  }

  const claimCount = new Map<string, number>();
  for (const c of (claims.data ?? []) as Array<{ post_id: string }>) {
    claimCount.set(c.post_id, (claimCount.get(c.post_id) ?? 0) + 1);
  }

  // Waiting is counted per person, not per upload: somebody who resubmitted
  // twice while waiting is one piece of marking, not three.
  const submissionCount = new Map<string, number>();
  const latest = new Map<string, { verdict: string | null; submitted_at: string }>();
  for (const s of (submissions.data ?? []) as Array<{
    post_id: string;
    user_id: string;
    submitted_at: string;
    verdict: string | null;
  }>) {
    submissionCount.set(s.post_id, (submissionCount.get(s.post_id) ?? 0) + 1);
    const key = `${s.post_id}/${s.user_id}`;
    const held = latest.get(key);
    if (!held || s.submitted_at > held.submitted_at) latest.set(key, s);
  }
  const waiting = new Map<string, number>();
  for (const [key, s] of latest) {
    if (s.verdict) continue;
    const postId = key.slice(0, key.indexOf('/'));
    waiting.set(postId, (waiting.get(postId) ?? 0) + 1);
  }

  return ((posts.data ?? []) as unknown as PostRow[]).map(toPost).map((post) => ({
    post,
    claims: claimCount.get(post.id) ?? 0,
    submissions: submissionCount.get(post.id) ?? 0,
    waiting: waiting.get(post.id) ?? 0,
    unanswered: unanswered.get(post.id) ?? 0,
  }));
}

export interface NamedClaim {
  userId: string;
  name: string;
  claimedAt: string;
}

export interface NamedSubmission extends WorkSubmission {
  name: string;
}

export interface NamedMessage extends WorkMessage {
  senderName: string;
  /** Written by a coach rather than by the intern whose thread it is. */
  fromCoach: boolean;
}

/** One post with every name on it and everything handed in, for marking. */
export async function workPostForCoach(postId: string): Promise<{
  post: WorkPost;
  claims: NamedClaim[];
  submissions: NamedSubmission[];
  /** Every thread on the post, keyed by the intern whose thread it is. */
  threads: Map<string, NamedMessage[]>;
  /** Names for everybody who appears anywhere above. */
  names: Map<string, string>;
} | null> {
  const db = createServiceClient();

  const [post, claims, submissions, messages] = await Promise.all([
    db.from('work_posts').select(POST_SELECT).eq('id', postId).maybeSingle(),
    db
      .from('work_claims')
      .select('user_id, claimed_at')
      .eq('post_id', postId)
      .order('claimed_at', { ascending: true }),
    db
      .from('work_submissions')
      .select(SUBMISSION_SELECT)
      .eq('post_id', postId)
      .order('submitted_at', { ascending: false }),
    db
      .from('work_messages')
      .select(MESSAGE_SELECT)
      .eq('post_id', postId)
      .order('sent_at', { ascending: true }),
  ]);

  if (!post.data) return null;

  const claimRows = (claims.data ?? []) as Array<{ user_id: string; claimed_at: string }>;
  const submissionRows = ((submissions.data ?? []) as unknown as SubmissionRow[]).map(
    toSubmission,
  );
  const messageRows = ((messages.data ?? []) as unknown as MessageRow[]).map(toMessage);

  const ids = [
    ...new Set([
      ...claimRows.map((c) => c.user_id),
      ...submissionRows.map((s) => s.userId),
      ...messageRows.map((m) => m.threadUserId),
      ...messageRows.map((m) => m.senderId),
    ]),
  ];
  const names = new Map<string, string>();
  if (ids.length > 0) {
    const { data } = await db.from('profiles').select('id, display_name, email').in('id', ids);
    for (const p of (data ?? []) as Array<{
      id: string;
      display_name: string | null;
      email: string | null;
    }>) {
      // The coach sees the email where there is no name: they need to know
      // who this is, and this page is theirs alone.
      names.set(p.id, p.display_name || p.email || 'Somebody');
    }
  }

  const threads = new Map<string, NamedMessage[]>();
  for (const m of messageRows) {
    const named: NamedMessage = {
      ...m,
      senderName: names.get(m.senderId) ?? 'Somebody',
      fromCoach: m.senderId !== m.threadUserId,
    };
    threads.set(m.threadUserId, [...(threads.get(m.threadUserId) ?? []), named]);
  }

  return {
    post: toPost(post.data as unknown as PostRow),
    claims: claimRows.map((c) => ({
      userId: c.user_id,
      name: names.get(c.user_id) ?? 'Somebody',
      claimedAt: c.claimed_at,
    })),
    submissions: submissionRows.map((s) => ({ ...s, name: names.get(s.userId) ?? 'Somebody' })),
    threads,
    names,
  };
}

/* -------------------------------------------------------------------------- */
/* Files                                                                      */
/* -------------------------------------------------------------------------- */

/** An hour: a memo may be played long after the page loaded, and a copied
 *  link still dies the same day. */
const SIGNED_URL_SECONDS = 3600;

async function sign(path: string): Promise<string | null> {
  const { data } = await createServiceClient()
    .storage.from('work')
    .createSignedUrl(path, SIGNED_URL_SECONDS);
  return data?.signedUrl ?? null;
}

/**
 * A short-lived address for a post's file.
 *
 * The row is read through the caller's own client first, so whether they
 * may have this file is the same question as whether they may see the post,
 * answered by the same policy. Only then is the path handed to the service
 * client to sign. A function that took a path would take any path.
 */
export async function signedUrlForPost(postId: string): Promise<string | null> {
  const db = await createSupabaseServerClient();
  const { data } = await db.from('work_posts').select('file_path').eq('id', postId).maybeSingle();
  const path = (data as { file_path: string | null } | null)?.file_path;
  return path ? sign(path) : null;
}

/** As above, for the coach's recording on a post. */
export async function signedUrlForMemo(postId: string): Promise<string | null> {
  const db = await createSupabaseServerClient();
  const { data } = await db.from('work_posts').select('memo_path').eq('id', postId).maybeSingle();
  const path = (data as { memo_path: string | null } | null)?.memo_path;
  return path ? sign(path) : null;
}

/** As above, for something handed in: the intern's own, or any for a coach. */
export async function signedUrlForSubmission(submissionId: string): Promise<string | null> {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from('work_submissions')
    .select('file_path')
    .eq('id', submissionId)
    .maybeSingle();
  const path = (data as { file_path: string | null } | null)?.file_path;
  return path ? sign(path) : null;
}
