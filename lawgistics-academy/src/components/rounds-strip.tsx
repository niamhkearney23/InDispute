import { cn } from '@/components/ui';
import { roundLabel, type Round } from '@/lib/training/rounds';

const WORD: Record<Round['state'], string> = {
  done: 'Done',
  missed: 'Missed',
  open: 'Open now',
  upcoming: 'Not yet',
};

/**
 * This morning's four rounds, side by side: when each opens and where it
 * stands. On the accent surface, so it is drawn in the paper colour.
 */
export function RoundsStrip({ rounds }: { rounds: Round[] }) {
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="This morning's rounds">
      {rounds.map((r) => (
        <li
          key={r.number}
          className={cn(
            'rounded-lg px-2 py-2 text-center ring-1',
            r.state === 'done' && 'bg-verdict-correct/25 ring-verdict-correct/50',
            r.state === 'missed' && 'bg-black/20 ring-white/10 opacity-70',
            r.state === 'open' && 'bg-paper/20 ring-paper/60',
            r.state === 'upcoming' && 'bg-black/10 ring-white/10',
          )}
        >
          <p className="font-serif text-lg leading-none tabular-nums">{roundLabel(r)}</p>
          <p className="mt-1 text-[0.6875rem] font-semibold tracking-wide text-paper/80 uppercase">
            {WORD[r.state]}
          </p>
        </li>
      ))}
    </ol>
  );
}
