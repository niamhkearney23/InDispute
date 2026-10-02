/**
 * A thread between an intern and their coaches, on one piece of work.
 *
 * Rendered on the server from rows the caller's own client was allowed to
 * read. The form that adds to it is a separate client component, so this
 * can sit on the coach's page and the intern's page alike.
 */
export interface ThreadMessage {
  id: string;
  body: string;
  sentAt: string;
  /** Written by the person reading the page. */
  mine: boolean;
  /** Who wrote it, as shown. */
  from: string;
}

/** A moment, on the reader's own clock. It was shown in UTC, eight hours
 *  out for Kuala Lumpur and unlabelled, so a message sent at nine in the
 *  morning read as one o'clock at night. */
function when(iso: string, timeZone: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
}

export function MessageThread({
  messages,
  empty,
  timeZone,
}: {
  messages: ThreadMessage[];
  empty: string;
  /** The reader's time zone. */
  timeZone: string;
}) {
  if (messages.length === 0) {
    return <p className="text-sm text-muted">{empty}</p>;
  }

  return (
    <ol className="space-y-2">
      {messages.map((m) => (
        <li
          key={m.id}
          className={
            m.mine
              ? 'ml-6 rounded-md border border-accent/20 bg-accent-wash px-3 py-2 text-sm'
              : 'mr-6 rounded-md border border-rule bg-paper-sunk px-3 py-2 text-sm'
          }
        >
          <p className="mb-0.5 text-xs text-muted">
            {m.from}, {when(m.sentAt, timeZone)}
          </p>
          <p className="whitespace-pre-line">{m.body}</p>
        </li>
      ))}
    </ol>
  );
}
