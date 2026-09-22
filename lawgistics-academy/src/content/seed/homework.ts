/**
 * Four weeks of daily homework, as data.
 *
 * One task per working day of a placement, twenty in all, keyed to the
 * working-day offset from the learner's own starts_on. See homeworkDay in
 * src/lib/homework/rules.ts for how a date becomes a day number.
 *
 * Every task here is something the person does inside the firm: find a
 * document, follow a process, write a note, ask somebody a question. None of
 * it states what the law is, in Malaysia or anywhere else. That is
 * deliberate. A homework list that taught law would be legal content and
 * would need a lawyer behind every line of it; this one needs a supervisor
 * to think it is a reasonable use of an intern's afternoon.
 *
 * NOT YET REVIEWED BY THE FIRM. Drafted as a starting set, not handed down
 * by anybody who has supervised a placement here. A firm running this should
 * read the twenty and change the ones that do not fit how they actually
 * work.
 */

export interface HomeworkTask {
  /** The working day of the placement, 1 to 20. */
  day: number;
  slug: string;
  /** Short enough to be a card heading. */
  title: string;
  /** What to do. Written to the learner. */
  task: string;
  /** One line on what it is for. Shown under the task. */
  why: string;
}

export const HOMEWORK_TASKS: HomeworkTask[] = [
  // Week one: finding your feet
  {
    day: 1,
    slug: 'find-your-way',
    title: 'Who is who',
    task: 'Write down the names and roles of five people you will work with, and one thing you would go to each of them about.',
    why: 'Knowing who to ask is most of what a first month is for.',
  },
  {
    day: 2,
    slug: 'the-file-anatomy',
    title: 'What is in a file',
    task: 'Ask your supervisor for one closed file and list, in order, every document in it. Mark the ones you could not name.',
    why: 'You cannot work on a file until you know what a complete one looks like.',
  },
  {
    day: 3,
    slug: 'diary-and-deadlines',
    title: 'How a date becomes a deadline',
    task: 'Ask how dates are recorded on a matter here, and write out in your own words what happens between a date being fixed and it appearing in somebody’s diary.',
    why: 'Nearly everything that goes wrong in litigation goes wrong here.',
  },
  {
    day: 4,
    slug: 'attendance-note',
    title: 'Your first attendance note',
    task: 'Sit in on any discussion of a matter and write an attendance note afterwards, no longer than half a page. Keep it until the last day.',
    why: 'The note is the record. Writing one badly on a quiet day is cheaper than on a loud one.',
  },
  {
    day: 5,
    slug: 'the-question-you-did-not-ask',
    title: 'The question you did not ask',
    task: 'At the end of today, write down one thing you did not understand and did not ask about. Ask it tomorrow.',
    why: 'Nobody expects you to know. They do notice who asks.',
  },
  // Week two: the machinery
  {
    day: 6,
    slug: 'precedent-bank',
    title: 'The precedent bank',
    task: 'Find where the firm keeps its precedents. Pick one document you have never seen and read it closely enough to explain what it is for.',
    why: 'A precedent you have read once is a precedent you can find under pressure.',
  },
  {
    day: 7,
    slug: 'letter-of-engagement',
    title: 'Read it as the client',
    task: 'Read the firm’s standard letter of engagement and note two things you would want explained before signing it.',
    why: 'The first document a client ever reads from us is worth understanding from their side.',
  },
  {
    day: 8,
    slug: 'costs-conversation',
    title: 'How cost is explained',
    task: 'Ask somebody how a client is told what a matter will cost, and write down the shape of that conversation.',
    why: 'Every difficult client conversation later is an easy one that was skipped early.',
  },
  {
    day: 9,
    slug: 'chronology',
    title: 'Build a chronology',
    task: 'Take one matter you have access to and build a one page chronology from the documents alone. Note every date you could not source.',
    why: 'The gaps are the point. They are where the work is.',
  },
  {
    day: 10,
    slug: 'filing-path',
    title: 'Follow one document out the door',
    task: 'Trace one document from drafting to filing: who drafts, who checks, who signs, how it reaches the court. Write the path as a list of steps.',
    why: 'You will do every one of those steps eventually.',
  },
  // Week three: the work itself
  {
    day: 11,
    slug: 'courtroom-morning',
    title: 'A morning in court',
    task: 'Spend a morning watching whatever is listed in open court, or watch a recorded hearing end to end. Write down three things the advocates did that you did not expect.',
    why: 'Reading about advocacy and watching it are not the same activity.',
  },
  {
    day: 12,
    slug: 'one-page-summary',
    title: 'Explain it to a stranger',
    task: 'Summarise a matter you have worked on in one page, for somebody who has never heard of it. Show it to somebody who knows the matter and ask what you left out.',
    why: 'If you cannot get it onto one page you do not yet understand it.',
  },
  {
    day: 13,
    slug: 'email-you-would-send',
    title: 'The update you would send',
    task: 'Draft the email you would send a client updating them on a matter. Do not send it. Ask your supervisor what they would change.',
    why: 'Client correspondence is a skill nobody teaches and everybody judges.',
  },
  {
    day: 14,
    slug: 'reading-out-loud',
    title: 'Read your own drafting aloud',
    task: 'Take something you drafted this week and read it out loud. Mark every sentence you ran out of breath in, and cut each one in half.',
    why: 'Long sentences hide the thing you were not sure about.',
  },
  {
    day: 15,
    slug: 'time-and-attention',
    title: 'Where the day went',
    task: 'Record how you actually spent today in fifteen minute blocks, then compare it against what you thought you had done.',
    why: 'Recording time honestly is a professional obligation long before it is a billing one.',
  },
  // Week four: standing back
  {
    day: 16,
    slug: 'ask-for-feedback',
    title: 'Ask for one thing to change',
    task: 'Ask one person you have worked with for one thing you should do differently. Write down what they say without defending it.',
    why: 'The answer is more useful than the discomfort of asking for it.',
  },
  {
    day: 17,
    slug: 'the-client-view',
    title: 'Read our letter as its reader',
    task: 'Take one letter the firm has sent and read it as the person who received it. Note anything you would not have understood.',
    why: 'Clarity is a service, not a style preference.',
  },
  {
    day: 18,
    slug: 'checklist-of-your-own',
    title: 'Write the checklist',
    task: 'Write your own checklist for a task you have now done more than once, detailed enough for somebody after you to follow.',
    why: 'Writing it down is how you find out which step you have been guessing at.',
  },
  {
    day: 19,
    slug: 'what-you-would-tell-yourself',
    title: 'The note for day one',
    task: 'Write the half page you wish somebody had handed you on your first morning.',
    why: 'This is the one piece of the placement the next intern gets to keep.',
  },
  {
    day: 20,
    slug: 'handover',
    title: 'Leave it findable',
    task: 'Leave every matter you touched in a state somebody else could pick up tomorrow. List what you handed over and to whom.',
    why: 'How you leave is the part people remember.',
  },
];

/**
 * How many working days of homework there are. The migration's check
 * constraint hardcodes the same number, and a test asserts they agree.
 */
export const HOMEWORK_DAYS = HOMEWORK_TASKS.length;

export function homeworkForDay(day: number): HomeworkTask | undefined {
  return HOMEWORK_TASKS.find((t) => t.day === day);
}

/** Every task up to and including a day. For the catch-up list. */
export function homeworkThroughDay(day: number): HomeworkTask[] {
  return HOMEWORK_TASKS.filter((t) => t.day <= day);
}
