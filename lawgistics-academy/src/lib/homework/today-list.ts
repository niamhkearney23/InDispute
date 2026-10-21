/**
 * "Set for today": one checklist at the top of Today, so the page reads as the
 * homework a coach set rather than a dashboard to work out (the owner, October
 * 2026: "make it more like a coach, and this is the homework").
 *
 * Built only from what Today already knows: the day's training, the day's
 * programme homework, work this person has taken on, the coach's session for
 * this morning and the next required module. It decides nothing and records
 * nothing; every line links to the place where the real thing is done. Pure,
 * so the order and the ticks can be tested without a database.
 */

export interface TodayItem {
  key: string;
  label: string;
  meta: string;
  href: string;
  /** True done, false still to do, null when there is nothing to tick (a video). */
  done: boolean | null;
  /** Something due today, or asked for again. */
  urgent?: boolean;
  /** The training line can be started from the list itself, with this label. */
  start?: string;
}

export interface TodayInput {
  today: string;
  /** What the firm needs done before anything else: the joining list, or its reading. */
  beforeYouBegin: { label: string; meta: string; href: string } | null;
  needsDiagnostic: boolean;
  /** How long the diagnostic is, to say so on its line. */
  diagnosticQuestions?: number;
  /** Questions are published for this person's country. */
  trainingOpen: boolean;
  /** A confirmed trainee's rounds this morning, or null for everybody else. */
  rounds: Array<{ number: number; state: string; answered: number; opensLabel: string; closesLabel: string }> | null;
  roundSize: number;
  /** Everybody else's daily goal. */
  goal: { questions: number; answered: number };
  homework: { day: number; title: string; done: boolean } | null;
  /**
   * Somebody with a start date on a day with no task of its own (before the
   * start, a weekend or holiday, or after the last day): one line saying so,
   * so the homework page is never out of reach.
   */
  homeworkNote: { meta: string } | null;
  /** Earlier working days not yet ticked off. */
  missedHomework: number;
  work: Array<{ id: string; title: string; dueOn: string | null; state: string; replyWaiting?: boolean }>;
  /** Work open to put your name on. */
  workOpen: number;
  /** A practice file not yet tried, when none is open. */
  nextMatter: { id: string; title: string } | null;
  /** Where the training line goes when it has no start button. */
  trainingHref: string;
  session: { title: string } | null;
  /** A practice file this person has open, with its clock running. */
  matter: { id: string; title: string } | null;
  nextModule: { slug: string; name: string; correctOnce: number; total: number } | null;
}

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

function trainingItem(input: TodayInput): TodayItem | null {
  if (!input.trainingOpen || input.needsDiagnostic) return null;
  if (input.rounds) {
    const counted = input.rounds.filter((r) => r.state !== 'not_applicable');
    if (counted.length === 0) {
      // Said, rather than an empty list: rounds closed before they could
      // count (confirmed today, or questions published today).
      return {
        key: 'training',
        label: "This morning's rounds",
        meta: 'Not counted today: they start counting from your next round',
        href: input.trainingHref,
        done: null,
      };
    }
    const open = counted.find((r) => r.state === 'open');
    if (open) {
      const left = Math.max(0, input.roundSize - open.answered);
      return {
        key: 'training',
        label: `Round ${open.number} questions`,
        meta: `${left} left · closes ${open.closesLabel}`,
        href: '#training',
        done: false,
        urgent: true,
        start: open.answered > 0 ? `Carry on` : `Start`,
      };
    }
    const next = counted.find((r) => r.state === 'upcoming');
    const done = counted.filter((r) => r.state === 'done').length;
    if (next) {
      return {
        key: 'training',
        label: `Round ${next.number} questions`,
        meta: `Opens at ${next.opensLabel} · ${done} of ${counted.length} done so far`,
        href: input.trainingHref,
        done: false,
      };
    }
    return {
      key: 'training',
      label: "This morning's rounds",
      meta: `${done} of ${counted.length} done`,
      href: input.trainingHref,
      done: done === counted.length,
    };
  }
  const { questions, answered } = input.goal;
  return {
    key: 'training',
    label: "Today's questions",
    meta: answered >= questions ? `${answered} answered` : `${answered} of ${questions} answered`,
    href: '#training',
    done: answered >= questions,
    start: answered >= questions ? 'More' : answered > 0 ? 'Carry on' : 'Start',
  };
}

/** The checklist, in the order a coach would want it done. */
export function todaysHomework(input: TodayInput): TodayItem[] {
  const items: TodayItem[] = [];

  if (input.beforeYouBegin) {
    items.push({ key: 'before', ...input.beforeYouBegin, done: false, urgent: true });
  }

  if (input.needsDiagnostic) {
    items.push({
      key: 'diagnostic',
      label: 'Take the diagnostic',
      meta: input.diagnosticQuestions
        ? `About ${input.diagnosticQuestions} questions, no pass mark. It sets what your training covers`
        : 'It sets what your daily training covers',
      href: '/diagnostic',
      done: false,
    });
  }

  const training = trainingItem(input);
  if (training) items.push(training);

  if (input.homework) {
    items.push({
      key: 'homework',
      label: input.homework.title,
      meta: `Day ${input.homework.day} homework`,
      href: '/homework',
      done: input.homework.done,
    });
  }

  if (input.homeworkNote) {
    items.push({ key: 'homework', label: 'Homework', meta: input.homeworkNote.meta, href: '/homework', done: null });
  }
  if (input.missedHomework > 0) {
    items.push({
      key: 'homework-catch-up',
      label: 'Catch up on homework',
      meta: `${input.missedHomework} earlier ${input.missedHomework === 1 ? 'day is' : 'days are'} not ticked off`,
      href: '/homework',
      done: false,
    });
  }

  if (input.session) {
    items.push({
      key: 'session',
      label: input.session.title,
      meta: 'Watch: from your coach this morning',
      href: '#session',
      done: null,
    });
  }

  // Work they took on that is not marked Good, at most three: what still
  // needs them first (sent back, then soonest due), what is handed in after,
  // so a piece sent back for another go is never pushed off by finished work.
  const rank = (w: TodayInput['work'][number]) =>
    w.state === 'waiting' ? 2 : w.state === 'again' ? 0 : 1;
  const work = input.work
    .filter((w) => w.state !== 'good')
    .sort((a, b) => rank(a) - rank(b) || (a.dueOn ?? '9999').localeCompare(b.dueOn ?? '9999'))
    .slice(0, 3);
  for (const w of work) {
    const waiting = w.state === 'waiting';
    const again = w.state === 'again';
    const dueToday = w.dueOn === input.today;
    const overdue = Boolean(w.dueOn && w.dueOn < input.today);
    items.push({
      key: `work-${w.id}`,
      label: w.title,
      meta: w.replyWaiting
        ? 'Your coach has replied'
        : waiting
        ? 'Handed in · waiting for your coach'
        : again
          ? 'Your coach asked for another go'
          : dueToday
            ? 'Hand in today'
            : overdue
              ? `Was due ${shortDate(w.dueOn!)}`
              : w.dueOn
                ? `Due ${shortDate(w.dueOn)}`
                : 'No due date',
      href: `/work/${w.id}`,
      done: waiting,
      urgent: Boolean(w.replyWaiting) || (!waiting && (again || dueToday || overdue)),
    });
  }

  if (input.workOpen > 0) {
    items.push({
      key: 'work-open',
      label: input.workOpen === 1 ? 'A piece of work you can take' : `${input.workOpen} pieces of work you can take`,
      meta: 'From your coach · put your name on one',
      href: '/work',
      done: null,
    });
  }

  if (input.matter) {
    items.push({
      key: 'matter',
      label: input.matter.title,
      meta: 'Practice file · you have it open and the clock is running',
      href: `/matters/${input.matter.id}`,
      done: false,
      urgent: true,
    });
  }

  if (!input.matter && input.nextMatter) {
    items.push({
      key: 'matter-next',
      label: input.nextMatter.title,
      meta: 'Practice file · when you have time, against the clock',
      href: `/matters/${input.nextMatter.id}`,
      done: null,
    });
  }

  if (input.nextModule && input.nextModule.correctOnce < input.nextModule.total) {
    items.push({
      key: 'module',
      label: input.nextModule.name,
      meta: `${input.nextModule.correctOnce} of ${input.nextModule.total} questions right so far`,
      href: `/modules/${input.nextModule.slug}`,
      done: false,
    });
  }

  return items;
}

/** "2 of 4 done", counting only lines that can be ticked. */
export function doneCount(items: TodayItem[]): { done: number; of: number } {
  const tickable = items.filter((i) => i.done !== null);
  return { done: tickable.filter((i) => i.done).length, of: tickable.length };
}
