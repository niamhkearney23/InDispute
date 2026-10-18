import assert from 'node:assert/strict';
import test from 'node:test';
import { noteForToday, notesForViewer, sentTime, type MorningNote } from '../src/lib/notes/rules';

const note = (over: Partial<MorningNote>): MorningNote => ({
  id: 'n',
  body: 'Round 2 before nine.',
  forDate: '2026-10-17',
  country: null,
  traineesOnly: false,
  authorId: 'coach',
  authorName: 'Priya Nair',
  createdAt: '2026-10-17T00:10:00Z',
  updatedAt: '2026-10-17T00:10:00Z',
  ...over,
});

const intern = { country: 'MY' as const, seesTraineeNotes: false };
const trainee = { country: 'MY' as const, seesTraineeNotes: true };

test('a trainee-only note reaches only somebody who may read it', () => {
  const notes = [note({ id: 'a', traineesOnly: true })];
  assert.deepEqual(notesForViewer(notes, intern), []);
  assert.equal(notesForViewer(notes, trainee).length, 1);
});

test("a note for one country never reaches the other's learners", () => {
  const notes = [note({ id: 'my', country: 'MY' }), note({ id: 'both', country: null })];
  assert.deepEqual(notesForViewer(notes, { country: 'AU', seesTraineeNotes: true }).map((n) => n.id), ['both']);
});

test("today's note is the latest written for today, never another day's", () => {
  const notes = [
    note({ id: 'yesterday', forDate: '2026-10-16', createdAt: '2026-10-16T23:00:00Z' }),
    note({ id: 'early', createdAt: '2026-10-17T00:05:00Z' }),
    note({ id: 'late', createdAt: '2026-10-17T00:40:00Z' }),
    note({ id: 'friday', forDate: '2026-10-18', createdAt: '2026-10-17T01:00:00Z' }),
  ];
  assert.equal(noteForToday(notes, intern, '2026-10-17')?.id, 'late');
  assert.equal(noteForToday(notes, intern, '2026-10-15'), null);
});

test('the time a note was sent reads the way people say it', () => {
  assert.equal(sentTime('2026-10-16T23:42:00Z', 'Asia/Kuala_Lumpur'), '7:42am');
});
