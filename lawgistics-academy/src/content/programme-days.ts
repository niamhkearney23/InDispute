import { weekOfDay } from '@/content/programme-plan';

/**
 * The month, day by day.
 *
 * Twenty working days, each with a morning, an afternoon, the coach's
 * video for that morning, and what is due by the end of it. The "due"
 * entries name certification boxes, so the day plan, the week plan and
 * the register agree: a test checks that every box a week promises is due
 * on one of that week's days, and on no other.
 *
 * Homework is not repeated here: the homework file already has one task
 * per day, and the day page pulls it in by number.
 *
 * NOT YET REVIEWED BY THE FIRM. A proposed timetable for the October
 * intake. A supervisor may vary it, and the page says so.
 */

export interface ProgrammeDay {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  /** The coach's short video for that morning. */
  video: string;
  /** Certification boxes due by the end of the day, if any. */
  due: number[];
}

export const PROGRAMME_DAYS: ProgrammeDay[] = [
  // Week one: the file and the facts
  {
    day: 1,
    title: 'Arrive',
    morning: 'Welcome, who is who, and the training file handed over. A tour of how a file moves through the firm.',
    afternoon: 'Sit the diagnostic quiz. Then read the file front to back, once, without taking notes.',
    video: 'How a matter arrives, and what the first hour is for.',
    due: [],
  },
  {
    day: 2,
    title: 'The client',
    morning: 'The client interview. A lawyer plays the client from the file; you ask the questions.',
    afternoon: 'Write the same-day attendance note: what you were told, by topic, and what you still need to ask.',
    video: 'What a good attendance note looks like, and the three things a bad one leaves out.',
    due: [1],
  },
  {
    day: 3,
    title: 'What has to be proved',
    morning: 'From your note, list every fact the case turns on. Not the law yet: the facts.',
    afternoon: 'Start the evidence plan: for each fact, who or what proves it, and what is missing.',
    video: 'Why "what are we missing" is the first question.',
    due: [],
  },
  {
    day: 4,
    title: 'The documents',
    morning: 'Go through every document in the file. List them, date them, and note what each one proves and what it does not.',
    afternoon: 'Finish the evidence plan and hand it in.',
    video: 'Reading a document as evidence rather than as information.',
    due: [2],
  },
  {
    day: 5,
    title: 'The witness',
    morning: 'Interview the witness. A lawyer plays them from the witness brief in the file.',
    afternoon: 'Write the witness note and reliability assessment, then half an hour with your supervisor on the week.',
    video: 'Debrief: week one. What everybody missed.',
    due: [3],
  },

  // Week two: the law and the timeline
  {
    day: 6,
    title: 'The elements',
    morning: 'Session on how you actually research: from a framework, to the statute, to what later courts did.',
    afternoon: 'Start the research memo: the elements of the claim and the defence, with their statutory basis.',
    video: 'How you actually research, in the order that works.',
    due: [],
  },
  {
    day: 7,
    title: 'For and against',
    morning: 'Find the authorities for each element, and the one against you.',
    afternoon: 'Write up limitation, burden and standard, and the range of outcomes.',
    video: 'The authority against you, and why you cite it first.',
    due: [],
  },
  {
    day: 8,
    title: 'The memo',
    morning: 'Finish the research and case theory memo, with one honest recommendation, and hand it in.',
    afternoon: 'Start the master chronology: every fact, dated, sourced to a document or a witness.',
    video: 'How to build a chronology that a judge would read.',
    due: [4],
  },
  {
    day: 9,
    title: 'Every date',
    morning: 'Finish the chronology. Mark each entry undisputed, disputed or to be investigated. Hand it in.',
    afternoon: 'Start the procedural chronology and case management plan: which court, what is filed, by when. Use the court map.',
    video: 'Reading a cause list, and what "mention" means.',
    due: [5],
  },
  {
    day: 10,
    title: 'The plan',
    morning: 'Finish the case management plan and hand it in. The spine is complete.',
    afternoon: 'Half an hour with your supervisor on the two weeks. What the file looks like now that you know it.',
    video: 'Debrief: week two. The spine, and why it is the core.',
    due: [6],
  },

  // Week three: drafting
  {
    day: 11,
    title: 'A morning in court',
    morning: 'Court. Sit at the back with the cause list and follow one matter from call to adjournment.',
    afternoon: 'Start the pleading on your file: the statement of claim, or the defence and counterclaim.',
    video: 'What a judge actually does with a pleading.',
    due: [],
  },
  {
    day: 12,
    title: 'The pleading',
    morning: 'Finish the pleading and hand it in.',
    afternoon: 'Read the marking on last week’s work. Redo anything marked "Needs another go".',
    video: 'Reading your own drafting as its reader.',
    due: [7],
  },
  {
    day: 13,
    title: 'Particulars and discovery',
    morning: 'Draft the request for further and better particulars, or the discovery request.',
    afternoon: 'Hand it in. Then start the interlocutory application.',
    video: 'Asking for exactly what you need, and nothing you do not.',
    due: [8],
  },
  {
    day: 14,
    title: 'The application',
    morning: 'Draft the notice of application and the affidavit in support.',
    afternoon: 'Hand it in. Exhibits annexed and referred to in the body.',
    video: 'An affidavit is evidence. Write it like one.',
    due: [9],
  },
  {
    day: 15,
    title: 'The witness statement',
    morning: 'Draft the witness statement for examination-in-chief, sequenced to your chronology.',
    afternoon: 'Hand it in. Half an hour with your supervisor on the week’s drafting.',
    video: 'Debrief: week three. The sentence every first draft has.',
    due: [10],
  },

  // Week four: court
  {
    day: 16,
    title: 'The bundle',
    morning: 'Assemble the bundle of documents: paginated, indexed, and every gap in the chain noted.',
    afternoon: 'Hand it in. Start the written submissions.',
    video: 'The bundle the judge actually reads.',
    due: [11],
  },
  {
    day: 17,
    title: 'The submissions',
    morning: 'Write the submissions: frame the issues, apply the law to the proved facts.',
    afternoon: 'Meet the other side’s strongest point head on. Finish the draft.',
    video: 'Meeting the other side’s best point, and why you never leave it out.',
    due: [],
  },
  {
    day: 18,
    title: 'The skeleton',
    morning: 'Finish the written submissions and hand them in.',
    afternoon: 'Reduce them to a skeleton argument and an oral note. Three minutes on your feet.',
    video: 'Say it in three minutes.',
    due: [12, 14],
  },
  {
    day: 19,
    title: 'The moot',
    morning: 'Prepare. Your skeleton, your bundle, and the other side’s file.',
    afternoon: 'The moot. You argue your file’s application against another trainee, with a lawyer as the judge.',
    video: 'Debrief: the moot, from the bench.',
    due: [],
  },
  {
    day: 20,
    title: 'Where you stand',
    morning: 'Last redrafts of anything still marked "Needs another go".',
    afternoon: 'Your supervisor records the certification entries and spends half an hour with you on the month.',
    video: 'The month, and what to do next.',
    due: [],
  },
];

export function programmeDay(day: number): ProgrammeDay | null {
  return PROGRAMME_DAYS.find((d) => d.day === day) ?? null;
}

export function daysOfWeek(week: number): ProgrammeDay[] {
  return PROGRAMME_DAYS.filter((d) => weekOfDay(d.day) === week);
}
