/**
 * Admin Today: the first screen of Admin, saying what needs somebody's
 * attention today (the owner, November 2026: "make daily supervision
 * easier"). The rules here are pure, so who sees what, in which order, and
 * why a trainee is listed can be tested without a database. Reading the
 * data is `today-service.ts`; drawing it is `src/app/admin/today`.
 *
 * Nothing on the screen decides anything. Every line says why it is there
 * and links to the page where the real thing is done, which asks its own
 * guard again.
 */

export type SectionKey = 'work' | 'trainees' | 'teaching' | 'people' | 'content' | 'operations';

export interface StaffRoles {
  /** An administrator: writes and publishes content, runs operations. */
  admin: boolean;
  /** A coach: the lawyer who marks, supervises and signs content off. */
  coach: boolean;
  /** A firm administrator: the firm's people, intake and setup. */
  firmAdmin: boolean;
}

/**
 * The sections a person sees, in the order they matter to them. A coach
 * lands on marking, trainees and teaching; a firm administrator on people
 * and the intake; an administrator who is not also a coach on content and
 * operations. Somebody with two roles sees both sets, their supervising
 * role's order first. Operational problems are an administrator's, because
 * only they can act on them; the page moves them to the top when there is one.
 */
export function sectionsFor(roles: StaffRoles): SectionKey[] {
  const order: SectionKey[] = [];
  const add = (...keys: SectionKey[]) => {
    for (const k of keys) if (!order.includes(k)) order.push(k);
  };
  if (roles.coach) add('work', 'trainees', 'teaching', 'content', 'people');
  if (roles.firmAdmin) add('people', 'teaching', 'trainees', 'work');
  if (roles.admin) add('content', 'operations', 'people', 'work', 'trainees', 'teaching');
  return order;
}

/** Which parts of the marking queue this person may act on. */
export function markingKindsFor(roles: StaffRoles): Array<'work' | 'reply' | 'matter' | 'studio'> {
  // Work and its threads are any staff member's (markSubmission asks
  // checkCoach, which a firm administrator passes). Matters and Studio
  // recordings are a lawyer's judgement (checkReviewer).
  const reviewer = roles.admin || roles.coach;
  return reviewer ? ['work', 'reply', 'matter', 'studio'] : ['work', 'reply'];
}

/* -------------------------------------------------------------------------- */
/* The marking queue                                                          */
/* -------------------------------------------------------------------------- */

export interface Submission {
  postId: string;
  userId: string;
  submittedAt: string;
  verdict: string | null;
}

/**
 * Hand-ins waiting for a mark: each person's latest on each post, when it
 * has no verdict. Somebody who handed in twice while waiting is one piece of
 * marking, waiting since their latest, as Admin, Work counts it.
 */
export function unmarked(submissions: Submission[]): Submission[] {
  const latest = new Map<string, Submission>();
  for (const s of submissions) {
    const key = `${s.postId}/${s.userId}`;
    const held = latest.get(key);
    if (!held || s.submittedAt > held.submittedAt) latest.set(key, s);
  }
  return [...latest.values()].filter((s) => !s.verdict);
}

export interface ThreadMessage {
  postId: string;
  threadUserId: string;
  senderId: string;
  sentAt: string;
}

/** Threads whose last word is the intern's own: a coach owes a reply. */
export function awaitingReply(messages: ThreadMessage[]): ThreadMessage[] {
  const last = new Map<string, ThreadMessage>();
  for (const m of messages) {
    const key = `${m.postId}/${m.threadUserId}`;
    const held = last.get(key);
    if (!held || m.sentAt > held.sentAt) last.set(key, m);
  }
  return [...last.values()].filter((m) => m.senderId === m.threadUserId);
}

/** "today", "yesterday", "3 days": how long something has waited. */
export function waited(since: string, now: Date = new Date()): string {
  const days = Math.floor((now.getTime() - Date.parse(since)) / 86_400_000);
  if (!Number.isFinite(days) || days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days`;
}

/* -------------------------------------------------------------------------- */
/* Trainees needing attention                                                 */
/* -------------------------------------------------------------------------- */

export interface TraineeSignals {
  /** Rounds missed in the last seven days. */
  missedRounds: number;
  /** Work they put their name on, past its due date, not handed in or sent back. */
  overdueWork: string[];
  /** Earlier working days whose homework is not ticked off. */
  missedHomework: number;
  /** Questions they got wrong more than once in the last fourteen days. */
  repeatedMistakes: number;
}

/** Thresholds, in one place. A single slip is not a pattern. */
export const ATTENTION = {
  missedRounds: 2,
  missedHomework: 2,
  repeatedMistakes: 3,
} as const;

/**
 * Why a trainee is on the list, in words a coach can act on, or nothing.
 * Overdue work counts from the first piece; the others from a threshold,
 * because one missed round or one wrong answer twice is a day, not a pattern.
 */
export function attentionReasons(s: TraineeSignals): string[] {
  const reasons: string[] = [];
  if (s.missedRounds >= ATTENTION.missedRounds) {
    reasons.push(`Missed ${s.missedRounds} rounds in the last week`);
  }
  if (s.overdueWork.length === 1) {
    reasons.push(`Overdue: ${s.overdueWork[0]}`);
  } else if (s.overdueWork.length > 1) {
    reasons.push(`${s.overdueWork.length} pieces of work overdue`);
  }
  if (s.missedHomework >= ATTENTION.missedHomework) {
    reasons.push(`${s.missedHomework} days of homework not ticked off`);
  }
  if (s.repeatedMistakes >= ATTENTION.repeatedMistakes) {
    reasons.push(`Got ${s.repeatedMistakes} questions wrong more than once in the last fortnight`);
  }
  return reasons;
}

/** Most in need first: overdue work and missed rounds weigh most. */
export function attentionWeight(s: TraineeSignals): number {
  return (
    s.overdueWork.length * 3 +
    (s.missedRounds >= ATTENTION.missedRounds ? s.missedRounds * 2 : 0) +
    (s.missedHomework >= ATTENTION.missedHomework ? s.missedHomework : 0) +
    (s.repeatedMistakes >= ATTENTION.repeatedMistakes ? 1 : 0)
  );
}

/**
 * Questions answered wrong at least twice, per person. Input is wrong
 * answers only; a question right in between still counts, because getting it
 * wrong twice in a fortnight is the pattern worth a word.
 */
export function repeatedMistakes(wrong: Array<{ userId: string; questionId: string }>): Map<string, number> {
  const perQuestion = new Map<string, number>();
  for (const w of wrong) {
    const key = `${w.userId}/${w.questionId}`;
    perQuestion.set(key, (perQuestion.get(key) ?? 0) + 1);
  }
  const perPerson = new Map<string, number>();
  for (const [key, n] of perQuestion) {
    if (n < 2) continue;
    const userId = key.slice(0, key.indexOf('/'));
    perPerson.set(userId, (perPerson.get(userId) ?? 0) + 1);
  }
  return perPerson;
}

/* -------------------------------------------------------------------------- */
/* Content awaiting review                                                    */
/* -------------------------------------------------------------------------- */

export interface ContentCounts {
  /** Published while not signed off. Should be none since 0044; said if not. */
  liveUnverified: number;
  /** Sign-off ran out, so it went back off learners. */
  lapsed: number;
  flagged: number;
  questionsWaiting: number;
  factsWaiting: number;
  /** Malaysian questions learners can be given now. Rounds wait on this. */
  publishedMalaysianQuestions: number;
  /** Signed off and current, not published yet: an administrator's to publish. */
  readyToPublish: number;
  studioExercisesWaiting: number;
  studioExercisesTotal: number;
  courtMapWaiting: boolean;
  lessonsWaiting: number;
  essaysWaiting: number;
  maximsWaiting: boolean;
  mattersWaiting: number;
}

export interface ContentRow {
  key: string;
  label: string;
  why: string;
  href: string;
  action: string;
  urgent: boolean;
}

/**
 * The review work, most pressing first: anything wrong in front of learners,
 * then what is holding up teaching this week (rounds need published
 * questions; the Studio and the court map show nothing until signed), then
 * what is ready to publish, then the rest of the queue. There is no stored
 * link from a programme day to a question or lesson, so "holding up
 * teaching" is judged by what each part of the academy needs to run.
 */
export function contentRows(c: ContentCounts, roles: StaffRoles): ContentRow[] {
  const rows: ContentRow[] = [];
  const n = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

  if (c.liveUnverified > 0) {
    rows.push({
      key: 'live-unverified',
      label: n(c.liveUnverified, 'item is live without a sign-off', 'items are live without a sign-off'),
      why: 'Learners can see these now. Check them first.',
      href: '/admin/review',
      action: 'Review content',
      urgent: true,
    });
  }
  if (c.lapsed > 0) {
    rows.push({
      key: 'lapsed',
      label: n(c.lapsed, 'sign-off has run out', 'sign-offs have run out'),
      why: 'Taken back off learners until somebody checks them again.',
      href: '/admin/review',
      action: 'Review content',
      urgent: true,
    });
  }
  if (c.publishedMalaysianQuestions === 0 && c.questionsWaiting > 0) {
    rows.push({
      key: 'questions-blocking',
      label: 'No Malaysian questions are published yet',
      why: `Daily training and the trainees' rounds wait on this. ${n(c.questionsWaiting, 'question is', 'questions are')} waiting for a sign-off.`,
      href: '/admin/review',
      action: 'Review content',
      urgent: true,
    });
  }
  if (c.studioExercisesTotal > 0 && c.studioExercisesWaiting === c.studioExercisesTotal) {
    rows.push({
      key: 'studio',
      label: 'No Studio exercise is signed off',
      why: 'Learners see no exercises in the Advocacy Studio until one is.',
      href: '/admin/reference',
      action: 'Review content',
      urgent: false,
    });
  }
  if (c.courtMapWaiting) {
    rows.push({
      key: 'court-map',
      label: 'The Malaysian court map is not signed off',
      why: 'Learners have no Courts page, and court questions use a plain list.',
      href: '/admin/reference',
      action: 'Review content',
      urgent: false,
    });
  }
  if (roles.admin && c.readyToPublish > 0) {
    rows.push({
      key: 'publish',
      label: n(c.readyToPublish, 'item is signed off and not published', 'items are signed off and not published'),
      why: 'Signing off does not publish. Publish them when you are ready.',
      href: '/admin/review',
      action: 'Publish',
      urgent: false,
    });
  }
  if (c.flagged > 0) {
    rows.push({
      key: 'flagged',
      label: n(c.flagged, 'item is flagged as wrong', 'items are flagged as wrong'),
      why: roles.admin ? 'A reviewer left a note. Rewrite it, then it goes back for a sign-off.' : 'Waiting for an administrator to rewrite.',
      href: '/admin/review',
      action: 'Review content',
      urgent: false,
    });
  }
  const queue: Array<[number, string, string, string, string]> = [
    [c.questionsWaiting, 'question', 'questions', '/admin/review', 'Training uses a question only once a lawyer signs it off.'],
    [c.factsWaiting, 'daily brief fact', 'daily brief facts', '/admin/review', 'One published fact is shown each day.'],
    [c.lessonsWaiting, 'lesson', 'lessons', '/admin/lessons', 'A module shows its lesson only once it is signed off.'],
    [c.mattersWaiting, 'matter', 'matters', '/admin/matters', 'Somebody other than its writer signs a matter off.'],
    [
      c.studioExercisesTotal > c.studioExercisesWaiting ? c.studioExercisesWaiting : 0,
      'Studio exercise',
      'Studio exercises',
      '/admin/reference',
      'Learners see only the signed-off ones.',
    ],
    [c.essaysWaiting, 'essay topic', 'essay topics', '/admin/reference', 'Shown to learners once signed off.'],
    [c.maximsWaiting ? 1 : 0, 'set of sign-in page rules', 'sets of sign-in page rules', '/admin/reference', 'Shown on the sign-in pages once signed off.'],
  ];
  for (const [count, one, many, href, why] of queue) {
    if (count <= 0) continue;
    if (one === 'question' && rows.some((r) => r.key === 'questions-blocking')) continue;
    rows.push({
      key: `queue-${one}`,
      label: `${n(count, one, many)} waiting for a sign-off`,
      why,
      href,
      action: 'Review content',
      urgent: false,
    });
  }
  return rows;
}
