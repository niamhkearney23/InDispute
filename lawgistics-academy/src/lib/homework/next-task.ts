/**
 * "Your next task": one action at the top of Today (the owner, November
 * 2026: "one prominent action. It should explain what to do, when it is due
 * and where to find feedback. Returned work should have a clear route back
 * into practice").
 *
 * The loop it serves: the coach sets work, the learner hands it in, the
 * coach marks it, the learner has another go, and Progress counts what was
 * marked Good. So work sent back comes before anything new, and every task
 * says where its feedback will be. Pure, so the order can be tested.
 */

export interface NextTaskInput {
  today: string;
  beforeYouBegin: { label: string; meta: string; href: string } | null;
  needsDiagnostic: boolean;
  /** A trainee's round open right now. */
  openRound: { number: number; closesLabel: string; left: number } | null;
  /** The next round today, when none is open. */
  nextRound: { number: number; opensLabel: string } | null;
  /** A practice file with its clock running. */
  openMatter: { id: string; title: string } | null;
  /** A practice file the coach sent back for another go. */
  returnedMatter: { id: string; title: string } | null;
  /** Work they put their name on. */
  work: Array<{
    id: string;
    title: string;
    dueOn: string | null;
    state: string;
    replyWaiting?: boolean;
    markedAt?: string | null;
  }>;
  homework: { day: number; title: string; done: boolean } | null;
  goal: { questions: number; answered: number } | null;
  trainingOpen: boolean;
}

export interface NextTask {
  key: string;
  /** What to do, as an instruction. */
  title: string;
  /** Why, in a sentence. */
  detail: string;
  /** When it is due, or null when it has no date. */
  due: string | null;
  /** Where the feedback is, or will be. */
  feedback: string;
  href: string;
  action: string;
  /** Sent back or overdue: shown with more weight. */
  urgent: boolean;
}

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

function dueWords(dueOn: string | null, today: string): { text: string | null; late: boolean } {
  if (!dueOn) return { text: null, late: false };
  if (dueOn === today) return { text: 'Today', late: false };
  if (dueOn < today) return { text: `Was due ${shortDate(dueOn)}`, late: true };
  return { text: shortDate(dueOn), late: false };
}

/** The one thing to do next, or null when everything for today is done. */
export function nextTask(input: NextTaskInput): NextTask | null {
  // What the firm needs before anything else.
  if (input.beforeYouBegin) {
    return {
      key: 'before',
      // Said as something to do: "Finish your joining list", "Read ...".
      title: input.beforeYouBegin.label === 'Your joining list' ? 'Finish your joining list' : input.beforeYouBegin.label,
      detail: `${input.beforeYouBegin.meta}. The firm asks for this before anything else.`,
      due: 'Before you start',
      feedback: 'Somebody at the firm confirms each item; you will see it ticked on the list.',
      href: input.beforeYouBegin.href,
      action: 'Open the list',
      urgent: true,
    };
  }

  // A round is open for its hour only.
  if (input.openRound) {
    return {
      key: 'round',
      title: `Answer round ${input.openRound.number}`,
      detail: `${input.openRound.left} ${input.openRound.left === 1 ? 'question' : 'questions'} left. A round is open for its hour and cannot be made up after.`,
      due: `Closes at ${input.openRound.closesLabel}`,
      feedback: 'Each answer is marked as you go, with the reason.',
      href: '#training',
      action: 'Start the round',
      urgent: true,
    };
  }

  if (input.openMatter) {
    return {
      key: 'matter-open',
      title: `Finish ${input.openMatter.title}`,
      detail: 'You have this practice file open and its clock is running.',
      due: 'Before the clock runs out',
      feedback: 'Your coach marks it on the file’s page, with a comment.',
      href: `/matters/${input.openMatter.id}`,
      action: 'Carry on',
      urgent: true,
    };
  }

  // Work sent back: the route back into practice, before anything new.
  const again = input.work
    .filter((w) => w.state === 'again')
    .sort((a, b) => (a.dueOn ?? '9999').localeCompare(b.dueOn ?? '9999'));
  if (again[0]) {
    const w = again[0];
    const due = dueWords(w.dueOn, input.today);
    return {
      key: `again-${w.id}`,
      title: `Have another go at ${w.title}`,
      detail: 'Your coach asked for another go. Read what they said, change what they pointed to, and hand in the new version.',
      due: due.text ?? 'As soon as you can',
      feedback: 'Your coach’s comments are on the work page, under what you handed in.',
      href: `/work/${w.id}#feedback`,
      action: 'Read the feedback',
      urgent: true,
    };
  }
  if (input.returnedMatter) {
    return {
      key: `matter-again-${input.returnedMatter.id}`,
      title: `Try ${input.returnedMatter.title} again`,
      detail: 'Your coach asked for another go at this practice file. Read their comment, then start a fresh attempt.',
      due: 'As soon as you can',
      feedback: 'Your coach’s comment is on the file’s page.',
      href: `/matters/${input.returnedMatter.id}#feedback`,
      action: 'Read the feedback',
      urgent: true,
    };
  }

  const replied = input.work.find((w) => w.replyWaiting);
  if (replied) {
    return {
      key: `reply-${replied.id}`,
      title: `Read your coach’s reply about ${replied.title}`,
      detail: 'Your coach answered your message.',
      due: null,
      feedback: 'The conversation is on the work page.',
      href: `/work/${replied.id}#messages`,
      action: 'Read it',
      urgent: false,
    };
  }

  if (input.needsDiagnostic) {
    return {
      key: 'diagnostic',
      title: 'Take the diagnostic',
      detail: 'A short set of questions with no pass mark. It decides what your daily training covers.',
      due: null,
      feedback: 'Each answer is explained as you go, and your areas appear on Progress.',
      href: '/diagnostic',
      action: 'Start',
      urgent: false,
    };
  }

  // Work they took on and have not handed in: the latest due first, overdue at the top.
  const toHandIn = input.work
    .filter((w) => w.state === 'none')
    .sort((a, b) => (a.dueOn ?? '9999').localeCompare(b.dueOn ?? '9999'));
  if (toHandIn[0]) {
    const w = toHandIn[0];
    const due = dueWords(w.dueOn, input.today);
    return {
      key: `hand-in-${w.id}`,
      title: `Hand in ${w.title}`,
      detail: 'You put your name on this. Upload your work on its page when it is ready.',
      due: due.text,
      feedback: 'Your coach marks it Good or asks for another go, with a comment, on the same page.',
      href: `/work/${w.id}`,
      action: 'Open the work',
      urgent: due.late,
    };
  }

  if (input.homework && !input.homework.done) {
    return {
      key: 'homework',
      title: `Do day ${input.homework.day}’s homework: ${input.homework.title}`,
      detail: 'Set by the programme for today. Tick it off when it is done.',
      due: 'Today',
      feedback: 'Ticked days count on your Progress page.',
      href: '/homework',
      action: 'Open the homework',
      urgent: false,
    };
  }

  if (input.trainingOpen && input.goal && input.goal.answered < input.goal.questions) {
    const left = input.goal.questions - input.goal.answered;
    return {
      key: 'goal',
      title: "Answer today's questions",
      detail: `${left} ${left === 1 ? 'question' : 'questions'} to reach your daily goal.`,
      due: 'Today',
      feedback: 'Each answer is marked as you go, with the reason.',
      href: '#training',
      action: input.goal.answered > 0 ? 'Carry on' : 'Start',
      urgent: false,
    };
  }

  if (input.nextRound) {
    return {
      key: 'round-next',
      title: `Round ${input.nextRound.number} opens at ${input.nextRound.opensLabel}`,
      detail: 'Nothing else is due before then. Come back when it opens.',
      due: `Opens at ${input.nextRound.opensLabel}`,
      feedback: 'Each answer is marked as you go, with the reason.',
      href: '/programme',
      action: 'See your mornings',
      urgent: false,
    };
  }

  return null;
}

/**
 * The newest work marked Good in the last few days, for the line under the
 * card: the end of the loop, where Progress records the evidence.
 */
export function recentlyMarkedGood(
  work: NextTaskInput['work'],
  now: Date,
  days = 3,
): { id: string; title: string } | null {
  const since = now.getTime() - days * 86_400_000;
  const good = work
    .filter((w) => w.state === 'good' && w.markedAt && Date.parse(w.markedAt) >= since)
    .sort((a, b) => (b.markedAt ?? '').localeCompare(a.markedAt ?? ''));
  return good[0] ? { id: good[0].id, title: good[0].title } : null;
}
