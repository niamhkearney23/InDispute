import { Pill } from '@/components/ui';
import { NameBubble } from '@/components/people-on-post';
import type { PostComment } from '@/lib/work/service';

/** A moment, on the reader's own clock. */
function when(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
}

/**
 * The comments under a post, oldest first, for everybody who can see it.
 *
 * Rendered on the server from what the database's own function returned:
 * first names, whether it is the reader's, and whether a lawyer wrote it.
 * A lawyer's comment is marked, because an answer from the person who set
 * the work is the one people are scrolling for.
 */
export function PostComments({
  comments,
  timeZone,
}: {
  comments: PostComment[];
  timeZone: string;
}) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted">
        No comments yet. Got a question, or a tip for the others? Start it off.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {comments.map((c) => (
        <li key={c.id} className="rise-in flex gap-2.5">
          <NameBubble firstName={c.firstName} isMe={c.isMe} />
          <div
            className={
              c.isStaff
                ? 'min-w-0 flex-1 rounded-lg border border-burgundy/25 bg-burgundy-wash px-3 py-2'
                : 'min-w-0 flex-1 rounded-lg border border-rule bg-paper-sunk px-3 py-2'
            }
          >
            <p className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              <span className="font-semibold text-ink">{c.isMe ? 'You' : c.firstName}</span>
              {c.isStaff ? <Pill tone="accent">Lawyer</Pill> : null}
              <span>{when(c.createdAt, timeZone)}</span>
            </p>
            <p className="text-sm break-words whitespace-pre-line">{c.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
