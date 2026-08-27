import Link from 'next/link';
import { Card, Pill } from '@/components/ui';
import type { CoachSession } from '@/lib/lessons/sessions';

/**
 * This morning's session, on the dashboard.
 *
 * The training runs seven to eight. Somebody opening the app at ten past seven
 * should see what their coach has put up for that morning before anything else,
 * because that is the thing with a time on it. The questions will still be there
 * at nine.
 *
 * Framed rather than linked out. Sending somebody to YouTube at seven in the
 * morning ends with them watching something else at ten past.
 *
 * The url is checked before this is called. Nothing here trusts it.
 */
export function SessionCard({
  session,
  more,
}: {
  session: CoachSession;
  /** How many others are up, so the link says whether it is worth pressing. */
  more: number;
}) {
  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Pill tone="accent">This morning</Pill>
        {session.publishedByName ? (
          <span className="text-xs text-muted">from {session.publishedByName}</span>
        ) : null}
      </div>

      <h2 className="text-xl sm:text-2xl">{session.title}</h2>
      {session.summary ? (
        <p className="mt-1.5 max-w-2xl text-sm text-slate">{session.summary}</p>
      ) : null}

      <div className="mt-4 aspect-video w-full overflow-hidden rounded-md border border-rule bg-paper-sunk">
        <iframe
          src={session.url}
          title={session.title}
          allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="size-full"
        />
      </div>

      {more > 0 ? (
        <p className="mt-3 text-sm">
          <Link href="/sessions" className="text-burgundy underline underline-offset-2">
            {more} earlier session{more === 1 ? '' : 's'}
          </Link>
        </p>
      ) : null}
    </Card>
  );
}
