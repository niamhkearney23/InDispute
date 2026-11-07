import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { firmPeople } from '@/lib/reports/data';
import { roundsHistory } from '@/lib/training/rounds-service';
import { scheduleForPerson } from '@/lib/training/cohorts';
import { homeworkDay } from '@/lib/homework/rules';
import { homeworkLines } from '@/lib/homework/today-list';
import { longDate, daysUntil } from '@/lib/onboarding/rules';
import { sharedAttempts } from '@/lib/studio/service';
import { studioExercise } from '@/content/studio/exercises';
import { recentNotes } from '@/lib/notes/service';
import { intakeOverview } from '@/lib/intake/service';
import { intakeSchedule, boxTitle, sessionPrefill, workPrefill } from '@/lib/intake/plan';
import { PROGRAMME } from '@/content/programme';
import { allWorkPosts } from '@/lib/work/service';
import { onboardingRoster, traineesAwaitingConfirmation } from '@/lib/onboarding/service';
import { waitingForAccess } from '@/lib/access/service';
import { getReviewItems, summarise } from '@/lib/review/service';
import { currentSignOffs } from '@/lib/lessons/signoff';
import { currentReferenceSignOffs } from '@/lib/content/signoff';
import { ALL_LESSONS } from '@/content/seed/lessons';
import { REFERENCE_ITEMS } from '@/lib/content/wording';
import { allMattersForStaff } from '@/lib/matters/service';
import { JURISDICTION_COUNTRY } from '@/lib/types';
import {
  attentionReasons,
  attentionWeight,
  awaitingReply,
  repeatedMistakes,
  unmarked,
  type ContentCounts,
  type TraineeSignals,
} from './today';

/**
 * The reads behind Admin Today. Every function uses the service client and
 * assumes the page has already run `requireCoach` and decided, from the
 * roles, which sections this person sees (`sectionsFor`). Each returns null
 * when it could not read, so the page says "could not be read" rather than
 * "nothing waiting": an empty queue that is really a failed read is the one
 * mistake this screen must not make.
 */

const KL = 'Asia/Kuala_Lumpur';

function nameOf(p: { display_name?: string | null; email?: string | null } | undefined): string {
  return p?.display_name?.trim() || p?.email || 'Unnamed';
}

/* -------------------------------------------------------------------------- */
/* Work awaiting feedback                                                     */
/* -------------------------------------------------------------------------- */

export interface QueueItem {
  kind: 'work' | 'reply' | 'matter' | 'studio';
  title: string;
  person: string;
  /** When it started waiting. */
  since: string;
  href: string;
}

/** Everything waiting for a coach, oldest first. */
export async function markingQueue(kinds: QueueItem['kind'][]): Promise<QueueItem[] | null> {
  const db = createServiceClient();
  const wantMatters = kinds.includes('matter');
  const wantStudio = kinds.includes('studio');
  try {
    const [subs, msgs, posts, attempts, matters, studio] = await Promise.all([
      db.from('work_submissions').select('post_id, user_id, submitted_at, verdict'),
      db.from('work_messages').select('post_id, thread_user_id, sender_id, sent_at'),
      db.from('work_posts').select('id, title'),
      wantMatters
        ? db
            .from('matter_attempts')
            .select('id, matter_id, user_id, submitted_at, verdict')
            .not('submitted_at', 'is', null)
            .is('verdict', null)
        : Promise.resolve({ data: [], error: null }),
      wantMatters ? db.from('matters').select('id, title') : Promise.resolve({ data: [], error: null }),
      wantStudio ? sharedAttempts(100) : Promise.resolve([]),
    ]);
    if (subs.error || msgs.error || posts.error || attempts.error || matters.error || studio === null) {
      return null;
    }

    const postTitle = new Map((posts.data ?? []).map((p) => [p.id as string, p.title as string]));
    const matterTitle = new Map((matters.data ?? []).map((m) => [m.id as string, m.title as string]));

    const waitingWork = kinds.includes('work')
      ? unmarked(
          (subs.data ?? []).map((s) => ({
            postId: s.post_id as string,
            userId: s.user_id as string,
            submittedAt: s.submitted_at as string,
            verdict: (s.verdict as string | null) ?? null,
          })),
        )
      : [];
    const replies = kinds.includes('reply')
      ? awaitingReply(
          (msgs.data ?? []).map((m) => ({
            postId: m.post_id as string,
            threadUserId: m.thread_user_id as string,
            senderId: m.sender_id as string,
            sentAt: m.sent_at as string,
          })),
        )
      : [];
    // Asked of the database above, and held to here as well: a queue entry
    // with no hand-in time is not waiting for anybody.
    const waitingMatters = ((attempts.data ?? []) as Array<{
      id: string;
      matter_id: string;
      user_id: string;
      submitted_at: string | null;
      verdict: string | null;
    }>).filter((a): a is typeof a & { submitted_at: string } => Boolean(a.submitted_at) && !a.verdict);

    const ids = [
      ...new Set([
        ...waitingWork.map((w) => w.userId),
        ...replies.map((r) => r.threadUserId),
        ...waitingMatters.map((a) => a.user_id),
      ]),
    ];
    const { data: people, error: peopleError } = ids.length
      ? await db.from('profiles').select('id, display_name, email').in('id', ids)
      : { data: [], error: null };
    if (peopleError) return null;
    const person = new Map((people ?? []).map((p) => [p.id as string, p]));

    const items: QueueItem[] = [
      ...waitingWork.map((w) => ({
        kind: 'work' as const,
        title: postTitle.get(w.postId) ?? 'A piece of work',
        person: nameOf(person.get(w.userId)),
        since: w.submittedAt,
        href: `/admin/work/${w.postId}`,
      })),
      ...replies.map((r) => ({
        kind: 'reply' as const,
        title: postTitle.get(r.postId) ?? 'A piece of work',
        person: nameOf(person.get(r.threadUserId)),
        since: r.sentAt,
        href: `/admin/work/${r.postId}`,
      })),
      ...waitingMatters.map((a) => ({
        kind: 'matter' as const,
        title: matterTitle.get(a.matter_id) ?? 'A practice file',
        person: nameOf(person.get(a.user_id)),
        since: a.submitted_at,
        href: `/admin/matters/${a.matter_id}`,
      })),
      // Listed from the summary read, which writes nothing to the access
      // log: only opening a recording is an opening.
      ...(studio ?? [])
        .filter((s) => s.reviewCount === 0)
        .map((s) => ({
          kind: 'studio' as const,
          title:
            (studioExercise(s.exerciseKey) ?? studioExercise(s.exerciseKey.replace(/^studio-/, '')))?.title ??
            'A Studio recording',
          person: s.learnerName,
          since: s.startedAt,
          href: `/admin/studio/${s.id}`,
        })),
    ];
    return items.filter((i) => Boolean(i.since)).sort((a, b) => a.since.localeCompare(b.since));
  } catch (error) {
    console.error('the marking queue could not be read:', error);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Trainees needing attention                                                 */
/* -------------------------------------------------------------------------- */

export interface TraineeAttention {
  id: string;
  name: string;
  role: string;
  reasons: string[];
  weight: number;
}

/** Wrong answers since a date, read page by page (a request returns at most a thousand rows). */
async function wrongAnswersSince(userIds: string[], since: string) {
  const db = createServiceClient();
  const out: Array<{ userId: string; questionId: string }> = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from('user_question_attempts')
      .select('user_id, question_id')
      .in('user_id', userIds)
      .eq('is_correct', false)
      .gte('answered_at', since)
      .order('answered_at')
      .range(from, from + 999);
    if (error) throw error;
    for (const r of data ?? []) out.push({ userId: r.user_id as string, questionId: r.question_id as string });
    if (!data || data.length < 1000) break;
  }
  return out;
}

/**
 * The firm's people (the ones it supervises, staff left out) with a reason
 * to look at them today: rounds missed this week, work overdue, homework not
 * ticked off, the same questions wrong again. Most in need first.
 */
export async function traineesNeedingAttention(now: Date = new Date()): Promise<TraineeAttention[] | null> {
  try {
    const people = await firmPeople();
    if (people.length === 0) return [];
    const ids = people.map((p) => p.id);
    const db = createServiceClient();
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: KL }).format(now);
    const weekAgo = new Intl.DateTimeFormat('en-CA', { timeZone: KL }).format(new Date(now.getTime() - 7 * 86_400_000));
    const fortnightAgo = new Date(now.getTime() - 14 * 86_400_000).toISOString();

    const [claims, posts, subs, declarations, wrong] = await Promise.all([
      db.from('work_claims').select('post_id, user_id').in('user_id', ids),
      db.from('work_posts').select('id, title, due_on').not('due_on', 'is', null).lt('due_on', today),
      db.from('work_submissions').select('post_id, user_id, submitted_at, verdict').in('user_id', ids),
      db.from('homework_declarations').select('user_id, day').in('user_id', ids),
      wrongAnswersSince(ids, fortnightAgo),
    ]);
    if (claims.error || posts.error || subs.error || declarations.error) return null;

    const overduePost = new Map((posts.data ?? []).map((p) => [p.id as string, p.title as string]));
    const latest = new Map<string, { at: string; verdict: string | null }>();
    for (const s of subs.data ?? []) {
      const key = `${s.post_id}/${s.user_id}`;
      const held = latest.get(key);
      if (!held || (s.submitted_at as string) > held.at) {
        latest.set(key, { at: s.submitted_at as string, verdict: (s.verdict as string | null) ?? null });
      }
    }
    const overdue = new Map<string, string[]>();
    for (const c of claims.data ?? []) {
      const title = overduePost.get(c.post_id as string);
      if (!title) continue;
      const handed = latest.get(`${c.post_id}/${c.user_id}`);
      // Not handed in, or sent back for another go: still theirs to do.
      if (handed && handed.verdict !== 'again') continue;
      const list = overdue.get(c.user_id as string) ?? [];
      list.push(title);
      overdue.set(c.user_id as string, list);
    }
    const declared = new Map<string, Set<number>>();
    for (const d of declarations.data ?? []) {
      const set = declared.get(d.user_id as string) ?? new Set<number>();
      set.add(d.day as number);
      declared.set(d.user_id as string, set);
    }
    const mistakes = repeatedMistakes(wrong);

    // Rounds and the homework calendar are per person (their cohort's
    // clock and holidays); five at a time, as the firm's reports read them.
    const perPerson = new Map<string, { missedRounds: number; missedHomework: number }>();
    const dated = people.filter((p) => p.startsOn);
    for (let i = 0; i < dated.length; i += 5) {
      await Promise.all(
        dated.slice(i, i + 5).map(async (p) => {
          const history = p.role === 'Trainee' ? await roundsHistory(p.id, now).catch(() => null) : null;
          const schedule = history?.schedule ?? (await scheduleForPerson(p.id));
          const missedRounds = (history?.days ?? [])
            .filter((d) => d.date >= weekAgo)
            .reduce((n, d) => n + d.rounds.filter((r) => r.state === 'missed').length, 0);
          const day = homeworkDay(p.startsOn, p.endsOn, schedule.timezone, now, schedule.holidays);
          const { missed } = homeworkLines({
            startsOn: p.startsOn,
            day,
            declared: declared.get(p.id) ?? new Set(),
            longDate,
          });
          perPerson.set(p.id, { missedRounds, missedHomework: missed });
        }),
      );
    }

    const listed: TraineeAttention[] = [];
    for (const p of people) {
      const signals: TraineeSignals = {
        missedRounds: perPerson.get(p.id)?.missedRounds ?? 0,
        overdueWork: overdue.get(p.id) ?? [],
        missedHomework: perPerson.get(p.id)?.missedHomework ?? 0,
        repeatedMistakes: mistakes.get(p.id) ?? 0,
      };
      const reasons = attentionReasons(signals);
      if (reasons.length === 0) continue;
      listed.push({ id: p.id, name: p.name, role: p.role, reasons, weight: attentionWeight(signals) });
    }
    return listed.sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name));
  } catch (error) {
    console.error('trainees needing attention could not be read:', error);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Today's teaching                                                           */
/* -------------------------------------------------------------------------- */

export interface TeachingLine {
  key: string;
  label: string;
  state: string;
  done: boolean;
  href: string;
  action: string;
}

export interface TeachingToday {
  /** "Day 3: Pleadings state facts, not evidence", or null outside the intake. */
  heading: string | null;
  /** When today is not an intake day: the next one, said plainly. */
  nextDay: string | null;
  lines: TeachingLine[];
  /** Intake setup that needs a firm administrator or coach. */
  setup: TeachingLine[];
}

export async function teachingToday(now: Date = new Date()): Promise<TeachingToday | null> {
  try {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: KL }).format(now);
    const [notes, overview, posts] = await Promise.all([recentNotes(30), intakeOverview(), allWorkPosts()]);
    const schedule = intakeSchedule(PROGRAMME.intakeStartsOn);
    const day = schedule.find((d) => d.date === today) ?? null;
    const next = schedule.find((d) => d.date > today) ?? null;
    const lines: TeachingLine[] = [];

    const note = notes.find((n) => n.forDate === today);
    lines.push({
      key: 'note',
      label: 'Morning note',
      state: note ? `Written by ${note.authorName ?? 'a coach'}` : 'Not written yet',
      done: Boolean(note),
      href: '/admin/notes',
      action: note ? 'See it' : 'Write it',
    });

    if (day) {
      const videos = overview.sessionsByDate.get(day.date) ?? [];
      lines.push({
        key: 'video',
        label: `Today's video: ${day.concept}`,
        state: videos.length > 0 ? 'Scheduled' : 'Not added yet',
        done: videos.length > 0,
        href: videos.length > 0 ? '/admin/sessions' : `/admin/sessions/new?${sessionPrefill(day)}`,
        action: videos.length > 0 ? 'See it' : 'Add it',
      });
      for (const n of day.due) {
        const posted = overview.workByBox.get(n);
        lines.push({
          key: `box-${n}`,
          label: `Due today: ${boxTitle(n)}`,
          state: posted?.post.published
            ? `Posted · ${posted.submissions} handed in`
            : posted
              ? 'Draft saved, not published'
              : 'Not posted yet',
          done: Boolean(posted?.post.published),
          href: posted ? `/admin/work/${posted.post.id}` : `/admin/work/new?${workPrefill(n, day.date, day.day)}`,
          action: posted?.post.published ? 'See it' : posted ? 'Publish it' : 'Post it',
        });
      }
    }
    // Other work due today that is not one of the programme's boxes.
    for (const p of posts) {
      if (!p.post.published || p.post.dueOn !== today) continue;
      if (lines.some((l) => l.href === `/admin/work/${p.post.id}`)) continue;
      lines.push({
        key: `work-${p.post.id}`,
        label: `Due today: ${p.post.title}`,
        state: `${p.claims} on it · ${p.submissions} handed in`,
        done: true,
        href: `/admin/work/${p.post.id}`,
        action: 'See it',
      });
    }
    if (next) {
      const videos = overview.sessionsByDate.get(next.date) ?? [];
      if (videos.length === 0) {
        lines.push({
          key: 'next-video',
          label: `Next: Day ${next.day} video (${next.concept})`,
          state: `Not added yet, airs ${longDate(next.date)}`,
          done: false,
          href: `/admin/sessions/new?${sessionPrefill(next)}`,
          action: 'Add it',
        });
      }
    }

    const setup: TeachingLine[] = [];
    const undated = overview.trainees.filter((t) => t.confirmed && !t.startsOn);
    if (undated.length > 0) {
      setup.push({
        key: 'undated',
        label: `${undated.length} confirmed ${undated.length === 1 ? 'trainee has' : 'trainees have'} no start date`,
        state: 'Their homework and rounds cannot start',
        done: false,
        href: '/admin/intake',
        action: 'Set dates',
      });
    }
    if (overview.publishedMalaysianQuestions === 0) {
      setup.push({
        key: 'questions',
        label: 'No Malaysian questions are published',
        state: 'Rounds do not run until there are some',
        done: false,
        href: '/admin/review',
        action: 'See the queue',
      });
    }

    return {
      heading: day ? `Day ${day.day}: ${day.title}` : null,
      nextDay: !day && next ? `No intake day today. Day ${next.day} is ${longDate(next.date)}.` : null,
      lines,
      setup,
    };
  } catch (error) {
    console.error("today's teaching could not be read:", error);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* People awaiting confirmation                                               */
/* -------------------------------------------------------------------------- */

export interface PersonLine {
  key: string;
  name: string;
  reason: string;
  href: string;
  since: string | null;
}

export async function peopleWaiting(now: Date = new Date()): Promise<PersonLine[] | null> {
  try {
    const [trainees, access, roster] = await Promise.all([
      traineesAwaitingConfirmation(),
      waitingForAccess(),
      onboardingRoster({ withStartDate: true }),
    ]);
    const lines: PersonLine[] = [];
    for (const t of trainees) {
      lines.push({
        key: `trainee-${t.id}`,
        name: t.displayName?.trim() || t.email || 'Unnamed',
        reason: 'Says they are on the trainee programme: confirm or decline',
        href: '/admin/onboarding',
        since: t.joinedAt,
      });
    }
    for (const a of access) {
      lines.push({
        key: `access-${a.userId}`,
        name: a.name,
        reason: `Entered the code "${a.label}": confirm they are with them`,
        href: '/admin/access',
        since: a.requestedAt,
      });
    }
    for (const r of roster) {
      const name = r.displayName?.trim() || r.email || 'Unnamed';
      if (r.awaitingFirmCount > 0) {
        lines.push({
          key: `joining-firm-${r.userId}`,
          name,
          reason: `${r.awaitingFirmCount} joining ${r.awaitingFirmCount === 1 ? 'step waits' : 'steps wait'} for the firm to confirm`,
          href: `/admin/onboarding/${r.userId}`,
          since: null,
        });
      } else if (
        r.startsOn &&
        !r.cleared &&
        r.outstandingCount > 0 &&
        daysUntil(r.startsOn, KL, now) <= 14
      ) {
        lines.push({
          key: `joining-${r.userId}`,
          name,
          reason: `Starts ${longDate(r.startsOn)} with ${r.outstandingCount} joining ${
            r.outstandingCount === 1 ? 'item' : 'items'
          } outstanding`,
          href: `/admin/onboarding/${r.userId}`,
          since: null,
        });
      }
    }
    return lines;
  } catch (error) {
    console.error('people awaiting confirmation could not be read:', error);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Content awaiting review                                                    */
/* -------------------------------------------------------------------------- */

export async function contentCounts(): Promise<ContentCounts | null> {
  try {
    const [items, lessons, references, matters] = await Promise.all([
      getReviewItems(),
      currentSignOffs(),
      currentReferenceSignOffs(),
      allMattersForStaff(),
    ]);
    const stats = summarise(items);
    const waiting = (i: (typeof items)[number]) => i.verificationStatus !== 'human_verified' || i.lapsed;
    const studio = REFERENCE_ITEMS.filter((r) => r.kind === 'studio');
    const courtMap = REFERENCE_ITEMS.find((r) => r.kind === 'courts' && r.country === 'MY');
    const maxims = REFERENCE_ITEMS.filter((r) => r.kind === 'maxims');
    return {
      liveUnverified: stats.liveUnverified,
      lapsed: stats.lapsed,
      flagged: stats.flagged,
      questionsWaiting: items.filter((i) => i.kind === 'question' && waiting(i) && !i.reviewFlagged).length,
      factsWaiting: items.filter((i) => i.kind === 'fact' && waiting(i) && !i.reviewFlagged).length,
      publishedMalaysianQuestions: items.filter(
        (i) =>
          i.kind === 'question' &&
          // The diagnostic's own (0055) are never given in a round.
          !i.diagnosticOnly &&
          JURISDICTION_COUNTRY[i.jurisdiction] === 'MY' &&
          i.status === 'published' &&
          !waiting(i),
      ).length,
      readyToPublish: items.filter(
        (i) => !waiting(i) && !i.reviewFlagged && i.status !== 'published' && !i.withdrawnByPerson,
      ).length,
      studioExercisesWaiting: studio.filter((r) => !references.has(r.key)).length,
      studioExercisesTotal: studio.length,
      courtMapWaiting: Boolean(courtMap && !references.has(courtMap.key)),
      lessonsWaiting: ALL_LESSONS.filter((l) => !lessons.has(l.slug)).length,
      essaysWaiting: REFERENCE_ITEMS.filter((r) => r.kind === 'essay' && !references.has(r.key)).length,
      maximsWaiting: maxims.some((r) => !references.has(r.key)),
      mattersWaiting: matters.filter((m) => !m.matter.verifiedBy && !m.matter.reviewFlagged).length,
    };
  } catch (error) {
    console.error('content awaiting review could not be read:', error);
    return null;
  }
}
