import { CERTIFICATION_BOXES, type CertificationBox } from '@/content/seed/certification-boxes';

/**
 * The month, week by week.
 *
 * One file that carries the whole placement through four weeks: facts,
 * then law and timeline, then drafting, then court. Each week names the
 * certification work products it is meant to produce, by box number, so
 * the plan and the register are the same list read two ways: the plan
 * says when, the register says whether.
 *
 * The first two weeks produce the six spine boxes, so a trainee who does
 * nothing else has done the core the register requires. The last week
 * produces the advocacy piece the register also requires. See
 * computeCertificationStatus in src/lib/certification/service.ts.
 *
 * NOT YET REVIEWED BY THE FIRM. Proposed as a starting shape for the
 * November intake, not handed down by anybody who has run the programme.
 * A supervisor may vary it, and the page that shows it says so.
 */

export interface ProgrammeWeek {
  number: 1 | 2 | 3 | 4;
  title: string;
  /** One line under the title. */
  theme: string;
  /** Certification box numbers this week is meant to produce. */
  boxes: number[];
  /** What the trainee does, in order. */
  trainee: string[];
  /** What the coach and supervising lawyers do. */
  coach: string[];
}

export const PROGRAMME_WEEKS: ProgrammeWeek[] = [
  {
    number: 1,
    title: 'The file and the facts',
    theme: 'Day one is the diagnostic quiz and a file of your own. The rest of the week is finding out what actually happened.',
    boxes: [1, 2, 3],
    trainee: [
      'Sit the diagnostic quiz, then meet the people you will work with and be given a file.',
      'Sit in on the client interview, or work from the instructions, and write a same-day attendance note.',
      'Build the evidence plan: every fact that has to be proved, mapped to a witness or a document, and what is still missing.',
      'Interview one witness, or read their statement, and write a note on what they prove and how far they can be relied on.',
    ],
    coach: [
      'Sessions on how a matter arrives, what a good attendance note looks like, and why "what are we missing" is the first question.',
      'Post the attendance note and the evidence plan on the work board with a due date, and mark them.',
    ],
  },
  {
    number: 2,
    title: 'The law and the timeline',
    theme: 'What the claim or defence has to show, the authorities for and against, and every date that matters.',
    boxes: [4, 5, 6],
    trainee: [
      'Write the research and case theory memo: each element, the authorities for and against, limitation, burden, and one honest recommendation.',
      'Build the master chronology of facts, every entry sourced and marked disputed or undisputed.',
      'Build the procedural chronology and case management plan: what has to be filed, by when, in which court. The court map and the "Finding the right court" module are for this.',
    ],
    coach: [
      'Sessions on how you actually research, how to build a chronology, and reading a cause list.',
      'By Friday every trainee has the whole spine. Anyone who leaves here has done the core.',
    ],
  },
  {
    number: 3,
    title: 'Drafting',
    theme: 'Four pieces of drafting on the same file, each handed in, marked, and done again.',
    boxes: [7, 8, 9, 10],
    trainee: [
      'Draft a pleading on the file: the statement of claim, or the defence.',
      'Draft a request for further particulars, or a discovery request.',
      'Draft an interlocutory application with its affidavit in support.',
      'Draft a witness statement for examination-in-chief.',
    ],
    coach: [
      'Post each piece on the work board with a due date. Mark it Good or Needs another go, with a paragraph. Resubmission is the point of the week.',
      'Sessions on reading your own drafting as its reader, and what a judge does with a pleading.',
    ],
  },
  {
    number: 4,
    title: 'Court',
    theme: 'The bundle, the submissions, a morning in court, and a moot on your own file.',
    boxes: [11, 12, 14],
    trainee: [
      'Prepare the bundle of documents with its index.',
      'Write the submissions, then a skeleton argument or oral submission note.',
      'Spend a morning in court, then argue your file’s interlocutory application in a moot against another trainee, with a lawyer sitting as the judge.',
      'Friday: your supervisor records the certification entries and you see where you stand.',
    ],
    coach: [
      'Sit as the judge in the moot, and give each trainee half an hour on the month’s work.',
      'Record the certification entries under Admin, Certification.',
    ],
  },
];

/** Which week a working day of the placement falls in, 1 to 4. */
export function weekOfDay(day: number): 1 | 2 | 3 | 4 {
  return Math.min(4, Math.max(1, Math.ceil(day / 5))) as 1 | 2 | 3 | 4;
}

/** The certification work products a week is meant to produce. */
export function boxesForWeek(week: ProgrammeWeek): CertificationBox[] {
  return week.boxes
    .map((n) => CERTIFICATION_BOXES.find((b) => b.number === n))
    .filter((b): b is CertificationBox => Boolean(b));
}
