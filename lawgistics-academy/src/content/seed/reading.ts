/**
 * The programme's book, read a little each working day (the owner, November
 * 2026: day 1 of the academy they read Pleadings Without Tears, and
 * everyone reads it), week by week to match what is taught (READING_WEEKS).
 *
 * A reading list, not the book: which chapter and which pages, by working
 * day, keyed like the homework (1 to 20). Learners read from their own copy
 * or the firm's. No copy of the book is stored, linked or shown here; it is
 * a published book in copyright.
 *
 * Page numbers are the eighth edition's (Oxford University Press, reprinted
 * 2012), from its contents page. Chapter names are given too, so somebody
 * with another edition can follow by chapter.
 *
 * None of this states what the law is, so, like the homework, it is not
 * legal content and needs no sign-off. The one note about the law says only
 * that the book is written for another jurisdiction.
 */

export interface ProgrammeBook {
  title: string;
  author: string;
  edition: string;
  /** Shown with the list: what to bear in mind while reading. */
  note: string;
}

export const PROGRAMME_BOOK: ProgrammeBook = {
  title: 'Pleadings Without Tears',
  author: 'William Rose',
  edition: 'eighth edition',
  note:
    'It is written for England and Wales. Read it for how to draft: clear, short, in order. Where it describes court rules, the Malaysian rules can differ, so check those with your supervisor.',
};

export interface ReadingDay {
  /** The working day of the placement, 1 to 20, as for homework. */
  day: number;
  /** Chapter number and name, as the contents page gives them. */
  what: string;
  /** Pages in the eighth edition. */
  pages: string;
}

/**
 * What each week of reading is about (the owner, November 2026: "this week
 * we are just seeing what pleadings are, next week drafting pleadings and
 * drafting affidavits"). So the book is not read straight through: week two
 * takes the claim, the defence and the chapter on witness statements and
 * affidavits, and the rest follows in weeks three and four.
 */
export const READING_WEEKS: Record<number, string> = {
  1: 'What pleadings are',
  2: 'Drafting pleadings and affidavits',
  3: 'Defences, replies and further information',
  4: 'Other claims, orders, skeleton arguments and opinions',
};

export const READING_DAYS: ReadingDay[] = [
  // Week 1: what pleadings are. Light on purpose: the principles, then a first look at a claim.
  { day: 1, what: 'Foreword, prefaces and Introduction', pages: 'vii to 4' },
  { day: 2, what: 'Chapter 1, Pillars of Understanding (general principles)', pages: '5 to 8' },
  { day: 3, what: 'Chapter 1, to the end', pages: '9 to 12' },
  { day: 4, what: 'Chapter 2, Getting the Show on the Road (the claim): a first look', pages: '13 to 22' },
  { day: 5, what: 'Chapter 2, continued', pages: '23 to 32' },
  // Week 2: drafting pleadings and affidavits.
  { day: 6, what: 'Chapter 2, continued: drafting the claim', pages: '33 to 48' },
  { day: 7, what: 'Chapter 2, to the end', pages: '49 to 64' },
  { day: 8, what: 'Chapter 3, Making a Fight of It (the defence and counterclaim)', pages: '65 to 90' },
  { day: 9, what: 'Chapter 10, To Tell You the Truth (witness statements, and the odd affidavit)', pages: '243 to 262' },
  { day: 10, what: 'Chapter 10, to the end', pages: '263 to 280' },
  // Week 3: defences, replies and further information.
  { day: 11, what: 'Chapter 3, to the end', pages: '91 to 116' },
  { day: 12, what: 'Chapter 4, The Right to Reply (the reply)', pages: '117 to 140' },
  { day: 13, what: 'Chapter 4 to the end, Chapter 5, Don’t Answer Back (rejoinder), and the start of Chapter 6, Pray, Tell Me (the request for further information)', pages: '141 to 164' },
  { day: 14, what: 'Chapter 6, to the end', pages: '165 to 194' },
  { day: 15, what: 'Chapter 7, Just to Let You Know (the answer to a request for further information), and Chapter 8, Come and Join In (additional claims)', pages: '195 to 224' },
  // Week 4: other claims, orders, skeleton arguments and opinions.
  { day: 16, what: 'Chapter 9, Pieces of Eight (the Part 8 procedure)', pages: '225 to 242' },
  { day: 17, what: 'Chapter 11, Just a Minute (minutes and agreed orders)', pages: '281 to 300' },
  { day: 18, what: 'Chapter 11 to the end, and the start of Chapter 12, Bones of Contention (the skeleton argument)', pages: '301 to 320' },
  { day: 19, what: 'Chapter 12, to the end', pages: '321 to 346' },
  { day: 20, what: 'Chapter 13, A Matter of Opinions (opinion writing), and the Epilogue', pages: '347 to the end' },
];

export function readingForDay(day: number): ReadingDay | undefined {
  return READING_DAYS.find((r) => r.day === day);
}

/**
 * The reading as it is set: one reading a week, not a few pages a day (the
 * owner, November 2026: "just say welcome to week 1, this week's reading,
 * then have that book ... but don't say it daily"). Each week names its own
 * book, so a later week can set a different one; today all four are the
 * programme's book. The pages are the days' pages above, joined.
 */
export interface ReadingWeek {
  week: 1 | 2 | 3 | 4;
  /** What the week is about (READING_WEEKS). */
  theme: string;
  book: ProgrammeBook;
  /** The chapters, as the contents page names them. */
  what: string;
  /** Pages in the eighth edition. */
  pages: string;
}

export const READING_BY_WEEK: ReadingWeek[] = [
  {
    week: 1,
    theme: READING_WEEKS[1],
    book: PROGRAMME_BOOK,
    what: 'The Foreword, prefaces and Introduction; Chapter 1, Pillars of Understanding; and the first half of Chapter 2, Getting the Show on the Road (the claim)',
    pages: 'vii to 32',
  },
  {
    week: 2,
    theme: READING_WEEKS[2],
    book: PROGRAMME_BOOK,
    what: 'Chapter 2 to the end (drafting the claim); Chapter 3, Making a Fight of It (the defence and counterclaim), to page 90; and Chapter 10, To Tell You the Truth (witness statements and affidavits)',
    pages: '33 to 90, and 243 to 280',
  },
  {
    week: 3,
    theme: READING_WEEKS[3],
    book: PROGRAMME_BOOK,
    what: 'Chapter 3 to the end; Chapters 4 to 7 (the reply, the rejoinder, requests for further information and the answer to one); and Chapter 8, Come and Join In (additional claims)',
    pages: '91 to 224',
  },
  {
    week: 4,
    theme: READING_WEEKS[4],
    book: PROGRAMME_BOOK,
    what: 'Chapter 9, Pieces of Eight (the Part 8 procedure); Chapter 11, Just a Minute (minutes and agreed orders); Chapter 12, Bones of Contention (the skeleton argument); Chapter 13, A Matter of Opinions; and the Epilogue',
    pages: '225 to 242, and 281 to the end',
  },
];

/** The week a working day falls in, 1 to 4. */
export function readingWeekOf(day: number): 1 | 2 | 3 | 4 {
  return Math.min(4, Math.max(1, Math.ceil(day / 5))) as 1 | 2 | 3 | 4;
}

export function readingForWeek(week: number): ReadingWeek | undefined {
  return READING_BY_WEEK.find((w) => w.week === week);
}

/** The first working day of a week, when Today says "Welcome to week N". */
export function startsAWeek(day: number): boolean {
  return day >= 1 && day <= 20 && (day - 1) % 5 === 0;
}
