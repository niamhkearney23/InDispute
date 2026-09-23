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

function when(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

export function MessageThread({
  messages,
  empty,
}: {
  messages: ThreadMessage[];
  empty: string;
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
              ? 'ml-6 rounded-md border border-burgundy/20 bg-burgundy-wash px-3 py-2 text-sm'
              : 'mr-6 rounded-md border border-rule bg-paper-sunk px-3 py-2 text-sm'
          }
        >
          <p className="mb-0.5 text-xs text-muted">
            {m.from}, {when(m.sentAt)}
          </p>
          <p className="whitespace-pre-line">{m.body}</p>
        </li>
      ))}
    </ol>
  );
}
