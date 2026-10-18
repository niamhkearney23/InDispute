import type { Metadata } from 'next';
import Link from 'next/link';
import { requireCoach } from '@/lib/admin/guard';
import { recentNotes } from '@/lib/notes/service';
import { getLearnerProfile } from '@/lib/learner-overview';
import { localDateString } from '@/lib/learning/progression';
import { COUNTRY_LABELS, DEFAULT_TIMEZONE } from '@/lib/types';
import { Card, EmptyState, Pill } from '@/components/ui';
import { saveMorningNote } from './actions';
import { NoteForm } from './note-form';

export const metadata: Metadata = { title: 'Morning notes' };
export const dynamic = 'force-dynamic';

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

export default async function MorningNotesPage() {
  const { userId } = await requireCoach();
  const [notes, me] = await Promise.all([recentNotes(), getLearnerProfile(userId)]);
  const today = localDateString(me?.timezone ?? DEFAULT_TIMEZONE);

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow mb-2">Morning notes</p>
        <h1 className="text-3xl">A word before they start</h1>
        <p className="mt-3 max-w-2xl text-slate">
          A few lines at the top of their Today page, in your name: what to do this morning and
          what you will look at. Write it the night before or first thing. Nobody signs these
          off, because they are yours, and they are never deleted: write another if you change
          your mind.
        </p>
      </section>

      <NoteForm
        action={saveMorningNote}
        submitLabel="Save note"
        initial={{ body: '', forDate: today, country: 'ALL', traineesOnly: false }}
      />

      <section className="space-y-3">
        <h2 className="text-xl">Recent notes</h2>
        {notes.length === 0 ? (
          <EmptyState title="No notes yet" description="Your first one will show at the top of Today on the morning you pick." />
        ) : (
          notes.map((n) => (
            <Card key={n.id}>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{longDate(n.forDate)}</span>
                {n.forDate === today ? <Pill tone="accent">Today</Pill> : null}
                <Pill>{n.country ? COUNTRY_LABELS[n.country] : 'Both countries'}</Pill>
                {n.traineesOnly ? <Pill>Trainees only</Pill> : null}
                <span className="text-muted">· {n.authorName ?? 'A coach'}</span>
              </div>
              <p className="mt-2 whitespace-pre-line">{n.body}</p>
              {n.authorId === userId ? (
                <Link
                  href={`/admin/notes/${n.id}`}
                  className="mt-2 inline-block min-h-8 text-sm text-accent underline underline-offset-4"
                >
                  Correct it
                </Link>
              ) : null}
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
