/**
 * The programme's book, read a little each working day (the owner, November
 * 2026: day 1 of the academy they read Pleadings Without Tears, and
 * everyone reads it).
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

export const READING_DAYS: ReadingDay[] = [
  { day: 1, what: 'Foreword, prefaces, Introduction and Chapter 1, Pillars of Understanding', pages: 'vii to 12' },
  { day: 2, what: 'Chapter 2, Getting the Show on the Road (the claim)', pages: '13 to 31' },
  { day: 3, what: 'Chapter 2, continued', pages: '32 to 48' },
  { day: 4, what: 'Chapter 2, to the end', pages: '49 to 64' },
  { day: 5, what: 'Chapter 3, Making a Fight of It (the defence and counterclaim)', pages: '65 to 82' },
  { day: 6, what: 'Chapter 3, continued', pages: '83 to 99' },
  { day: 7, what: 'Chapter 3, to the end', pages: '100 to 116' },
  { day: 8, what: 'Chapter 4, The Right to Reply (the reply)', pages: '117 to 131' },
  { day: 9, what: 'Chapter 4 to the end, and Chapter 5, Don’t Answer Back (rejoinder)', pages: '132 to 148' },
  { day: 10, what: 'Chapter 6, Pray, Tell Me (the request for further information)', pages: '149 to 171' },
  { day: 11, what: 'Chapter 6, to the end', pages: '172 to 194' },
  { day: 12, what: 'Chapter 7, Just to Let You Know (the answer to a request for further information)', pages: '195 to 212' },
  { day: 13, what: 'Chapter 8, Come and Join In (additional claims), and the start of Chapter 9, Pieces of Eight', pages: '213 to 232' },
  { day: 14, what: 'Chapter 9 to the end, and the start of Chapter 10, To Tell You the Truth (witness statements)', pages: '233 to 256' },
  { day: 15, what: 'Chapter 10, to the end', pages: '257 to 280' },
  { day: 16, what: 'Chapter 11, Just a Minute (minutes and agreed orders)', pages: '281 to 296' },
  { day: 17, what: 'Chapter 11, to the end', pages: '297 to 312' },
  { day: 18, what: 'Chapter 12, Bones of Contention (the skeleton argument)', pages: '313 to 330' },
  { day: 19, what: 'Chapter 12, to the end', pages: '331 to 346' },
  { day: 20, what: 'Chapter 13, A Matter of Opinions (opinion writing), and the Epilogue', pages: '347 to the end' },
];

export function readingForDay(day: number): ReadingDay | undefined {
  return READING_DAYS.find((r) => r.day === day);
}
