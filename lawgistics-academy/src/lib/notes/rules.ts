/**
 * Which morning note a learner sees, as a pure function so it can be tested
 * without a database. The same rule as the read policy on morning_notes
 * (0050), asked again because pages read through the service client.
 */
import type { Country } from '@/lib/types';

export interface MorningNote {
  id: string;
  body: string;
  forDate: string;
  country: Country | null;
  traineesOnly: boolean;
  authorId: string;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NoteViewer {
  country: Country;
  /** A confirmed trainee, or staff: may read a trainee-only note. */
  seesTraineeNotes: boolean;
}

export const NOTE_MAX_LENGTH = 700;

/** Notes this person may read at all. */
export function notesForViewer(notes: MorningNote[], viewer: NoteViewer): MorningNote[] {
  return notes.filter(
    (n) =>
      (n.country === null || n.country === viewer.country) &&
      (!n.traineesOnly || viewer.seesTraineeNotes),
  );
}

/**
 * The note for this morning: the latest written for today. Never yesterday's
 * and never one for a later date: an old note would tell somebody to do work
 * that is finished, and a note for Friday shown on Wednesday gives away the
 * wrong morning.
 */
export function noteForToday(notes: MorningNote[], viewer: NoteViewer, today: string): MorningNote | null {
  const mine = notesForViewer(notes, viewer).filter((n) => n.forDate === today);
  mine.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  return mine[0] ?? null;
}

/** "7:42am", in the reader's timezone. */
export function sentTime(iso: string, timeZone: string): string {
  return new Date(iso)
    .toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone })
    .replace(' ', '')
    .toLowerCase();
}
