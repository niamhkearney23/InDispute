import type { CSSProperties } from 'react';
import { cn } from '@/components/ui';
import { initialOf, whoIsOn } from '@/lib/work/links';
import type { PostPerson } from '@/lib/work/links';

/**
 * Who is on a piece of work: a row of first-letter bubbles and one line
 * saying it in words. First names only, from the database's own function,
 * so nobody's email reaches a page their cohort reads. The colour follows
 * the name, so the same person is the same colour on every post.
 */
const COLOURS = [
  'bg-burgundy text-paper',
  'bg-amber-600 text-white',
  'bg-teal-700 text-white',
  'bg-sky-700 text-white',
  'bg-emerald-700 text-white',
  'bg-violet-700 text-white',
  'bg-rose-700 text-white',
];

function colourFor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COLOURS[hash % COLOURS.length];
}

export function NameBubble({
  firstName,
  isMe = false,
  size = 'md',
  className,
  style,
}: {
  firstName: string;
  isMe?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      style={style}
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full font-semibold ring-2 ring-paper-raised',
        size === 'sm' ? 'size-6 text-[0.6875rem]' : 'size-8 text-sm',
        isMe ? 'bg-ink text-paper' : colourFor(firstName),
        className,
      )}
    >
      {initialOf(firstName)}
    </span>
  );
}

export function PeopleOnPost({
  people,
  size = 'md',
  max = 6,
  showLine = true,
}: {
  people: PostPerson[];
  size?: 'sm' | 'md';
  /** Bubbles shown before the rest are counted. */
  max?: number;
  showLine?: boolean;
}) {
  // The reader first, so "you" is always at the front of the row.
  const ordered = [...people.filter((p) => p.isMe), ...people.filter((p) => !p.isMe)];
  const shown = ordered.slice(0, max);
  const rest = ordered.length - shown.length;
  const line = whoIsOn(people);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {shown.length > 0 ? (
        <span className="flex -space-x-2" role="img" aria-label={line}>
          {shown.map((p, i) => (
            <NameBubble
              key={`${p.firstName}-${i}`}
              firstName={p.firstName}
              isMe={p.isMe}
              size={size}
              className="bubble-pop"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
          {rest > 0 ? (
            <span
              aria-hidden
              className={cn(
                'inline-grid place-items-center rounded-full bg-paper-sunk font-semibold text-slate ring-2 ring-paper-raised',
                size === 'sm' ? 'size-6 text-[0.625rem]' : 'size-8 text-xs',
              )}
            >
              +{rest}
            </span>
          ) : null}
        </span>
      ) : null}
      {showLine ? (
        <span className={cn('text-slate', size === 'sm' ? 'text-xs' : 'text-sm')}>{line}</span>
      ) : null}
    </div>
  );
}
