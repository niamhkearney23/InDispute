import Link from 'next/link';
import { Card, cn } from '@/components/ui';
import { LevelIcon } from '@/components/icons';
import type { LeaderboardRow } from '@/lib/leaderboard';

/**
 * The firm's week, as a table. First names and XP, nothing else: the point
 * is a friendly race, not a record, and it says so. The reader's own row is
 * marked, and shown even when they are outside the top ten, so the table
 * is never a list of other people.
 */
export function LeaderboardCard({ rows }: { rows: LeaderboardRow[] }) {
  const top = rows.filter((r) => r.position <= 10);
  const me = rows.find((r) => r.isMe);
  const meOutside = me && me.position > 10 ? me : null;

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-accent-wash text-accent">
          <LevelIcon className="size-4" />
        </span>
        <p className="eyebrow">Last seven days at the firm</p>
      </div>

      {top.length === 0 ? (
        <p className="text-sm text-slate">
          Nobody has trained in the last seven days. The first session puts a name here.
        </p>
      ) : (
        <ol className="divide-y divide-rule">
          {top.map((row) => (
            <li
              key={row.position + row.firstName}
              className={cn(
                'flex items-center gap-3 py-2 text-sm',
                row.isMe && '-mx-2 rounded-md bg-accent-wash px-2 font-medium',
              )}
            >
              <span
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-full font-serif text-sm tabular-nums',
                  row.position === 1
                    ? 'bg-warn-wash text-warn'
                    : row.position <= 3
                      ? 'bg-paper-sunk text-ink'
                      : 'text-muted',
                )}
              >
                {row.position}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {row.firstName}
                {row.isMe ? <span className="text-muted"> (you)</span> : null}
              </span>
              <span className="tabular-nums text-slate">{row.xp} XP</span>
            </li>
          ))}
          {meOutside ? (
            <li className="-mx-2 mt-1 flex items-center gap-3 rounded-md bg-accent-wash px-2 py-2 text-sm font-medium">
              <span className="grid size-7 shrink-0 place-items-center rounded-full font-serif text-sm text-muted tabular-nums">
                {meOutside.position}
              </span>
              <span className="min-w-0 flex-1 truncate">
                {meOutside.firstName}
                <span className="text-muted"> (you)</span>
              </span>
              <span className="tabular-nums text-slate">{meOutside.xp} XP</span>
            </li>
          ) : null}
        </ol>
      )}

      <p className="mt-3 text-xs text-muted">
        XP earned in the last seven days. First names only.{' '}
        <Link href="/account" className="-my-2 inline-block py-2 underline underline-offset-2">
          Take yourself off it
        </Link>
      </p>
    </Card>
  );
}
