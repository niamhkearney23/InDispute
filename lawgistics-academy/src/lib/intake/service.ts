import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { allSessions, type CoachSession } from '@/lib/lessons/sessions';
import { allWorkPosts, type WorkPostSummary } from '@/lib/work/service';
import { boxOfTitle } from '@/lib/intake/plan';

/**
 * Everything the intake page reads, in one place.
 *
 * Service-role reads, so every caller must have passed requireCoach first:
 * the page does, and nothing else imports this. Read-only; the only write
 * the page offers is setIntakeDates, which is its own action with its own
 * guard.
 */

export interface IntakeTrainee {
  id: string;
  name: string;
  email: string | null;
  confirmed: boolean;
  startsOn: string | null;
  endsOn: string | null;
  homeworkDone: number;
  handedIn: number;
  good: number;
  waiting: number;
}

export interface IntakeOverview {
  trainees: IntakeTrainee[];
  publishedMalaysianQuestions: number;
  /** Published sessions for Malaysia or everyone, by the date they air. */
  sessionsByDate: Map<string, CoachSession[]>;
  /** Work posts recognised as a certification piece, by box number. */
  workByBox: Map<number, WorkPostSummary>;
}

export async function intakeOverview(): Promise<IntakeOverview> {
  const db = createServiceClient();

  const [people, homework, submissions, questions, sessions, posts] = await Promise.all([
    db
      .from('profiles')
      .select('id, display_name, email, starts_on, ends_on, trainee_approved_at')
      .eq('track', 'litigation_trainee')
      .order('display_name'),
    db.from('homework_declarations').select('user_id'),
    db.from('work_submissions').select('post_id, user_id, submitted_at, verdict'),
    db
      .from('v_question_delivery')
      .select('question_id', { count: 'exact', head: true })
      .eq('country', 'MY'),
    allSessions(),
    allWorkPosts(),
  ]);

  const homeworkCount = new Map<string, number>();
  for (const row of (homework.data ?? []) as Array<{ user_id: string }>) {
    homeworkCount.set(row.user_id, (homeworkCount.get(row.user_id) ?? 0) + 1);
  }

  // The latest submission per person per post is the one that counts:
  // a piece handed in twice and marked Good the second time is good.
  const latest = new Map<string, { user_id: string; verdict: string | null; submitted_at: string }>();
  for (const s of (submissions.data ?? []) as Array<{
    post_id: string;
    user_id: string;
    submitted_at: string;
    verdict: string | null;
  }>) {
    const key = `${s.post_id}/${s.user_id}`;
    const held = latest.get(key);
    if (!held || s.submitted_at > held.submitted_at) latest.set(key, s);
  }
  const tally = new Map<string, { handedIn: number; good: number; waiting: number }>();
  for (const s of latest.values()) {
    const t = tally.get(s.user_id) ?? { handedIn: 0, good: 0, waiting: 0 };
    t.handedIn += 1;
    if (s.verdict === 'good') t.good += 1;
    if (!s.verdict) t.waiting += 1;
    tally.set(s.user_id, t);
  }

  const trainees = ((people.data ?? []) as Array<{
    id: string;
    display_name: string | null;
    email: string | null;
    starts_on: string | null;
    ends_on: string | null;
    trainee_approved_at: string | null;
  }>).map((p) => ({
    id: p.id,
    name: p.display_name?.trim() || p.email || 'Unnamed',
    email: p.email,
    confirmed: Boolean(p.trainee_approved_at),
    startsOn: p.starts_on,
    endsOn: p.ends_on,
    homeworkDone: homeworkCount.get(p.id) ?? 0,
    handedIn: tally.get(p.id)?.handedIn ?? 0,
    good: tally.get(p.id)?.good ?? 0,
    waiting: tally.get(p.id)?.waiting ?? 0,
  }));

  const sessionsByDate = new Map<string, CoachSession[]>();
  for (const s of sessions) {
    if (!s.published || !s.airsOn) continue;
    if (s.country && s.country !== 'MY') continue;
    const list = sessionsByDate.get(s.airsOn) ?? [];
    list.push(s);
    sessionsByDate.set(s.airsOn, list);
  }

  const workByBox = new Map<number, WorkPostSummary>();
  for (const summary of posts) {
    const n = boxOfTitle(summary.post.title);
    if (n === null) continue;
    // Prefer a published post over a draft for the same box.
    const held = workByBox.get(n);
    if (!held || (!held.post.published && summary.post.published)) workByBox.set(n, summary);
  }

  return {
    trainees,
    publishedMalaysianQuestions: questions.count ?? 0,
    sessionsByDate,
    workByBox,
  };
}
