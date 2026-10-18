import { sentTime, type MorningNote } from '@/lib/notes/rules';

/**
 * The coach's few lines at the top of Today (0050), in their own words and
 * under their own name, like a note left on a junior's desk.
 */
export function MorningNoteCard({ note, timezone }: { note: MorningNote; timezone: string }) {
  const name = note.authorName ?? 'Your coach';
  return (
    <section aria-label="A note from your coach" className="panel rounded-xl border border-rule bg-paper-raised p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ice font-serif text-lg text-paper"
        >
          {name.trim().charAt(0).toUpperCase() || 'C'}
        </span>
        <div className="min-w-0">
          <p className="font-semibold">{name}</p>
          <p className="text-xs text-muted">Your coach · sent {sentTime(note.createdAt, timezone)}</p>
        </div>
      </div>
      <blockquote className="mt-4 font-serif text-lg leading-relaxed whitespace-pre-line italic">
        {note.body}
      </blockquote>
    </section>
  );
}
