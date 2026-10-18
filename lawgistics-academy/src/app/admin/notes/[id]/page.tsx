import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireCoach } from '@/lib/admin/guard';
import { noteById } from '@/lib/notes/service';
import { Notice } from '@/components/ui';
import { saveMorningNote } from '../actions';
import { NoteForm } from '../note-form';

export const metadata: Metadata = { title: 'Correct a note' };
export const dynamic = 'force-dynamic';

export default async function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await requireCoach();
  const { id } = await params;
  const note = /^[0-9a-f-]{36}$/i.test(id) ? await noteById(id) : null;
  if (!note) notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">Morning notes</p>
        <h1 className="text-3xl">Correct a note</h1>
      </div>
      {note.authorId !== userId ? (
        <Notice tone="warn">Only the coach who wrote a note can change it. Write your own instead.</Notice>
      ) : (
        <NoteForm
          action={saveMorningNote}
          submitLabel="Save changes"
          initial={{
            id: note.id,
            body: note.body,
            forDate: note.forDate,
            country: note.country ?? 'ALL',
            traineesOnly: note.traineesOnly,
          }}
        />
      )}
    </div>
  );
}
