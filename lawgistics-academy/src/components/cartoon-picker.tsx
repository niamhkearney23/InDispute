'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/components/ui';
import { CARTOON_PARTS, type CartoonPart, type CartoonStyle } from '@/lib/avatar/cartoon';
import { cartoonDataUri } from '@/lib/avatar/draw';

/**
 * The parts of a cartoon and the choices for each, with every choice for a
 * shape (hair, eyes, glasses and so on) tried on the person's own face, so
 * they pick what they can see, not a name. It saves nothing: the Account
 * page's maker and the first steps each decide when to save.
 */
export function CartoonPicker({
  value,
  onChange,
  dark = false,
  centered = false,
}: {
  value: CartoonStyle;
  onChange: (next: CartoonStyle) => void;
  /** On the dark first-visit surface. */
  dark?: boolean;
  /** The part names and choices centred, for the first steps. */
  centered?: boolean;
}) {
  const [partKey, setPartKey] = useState<CartoonPart>('hair');
  const part = CARTOON_PARTS.find((p) => p.key === partKey)!;
  const tries = useMemo(
    () =>
      part.kind === 'shape'
        ? part.choices.map((c) => cartoonDataUri({ ...value, [part.key]: c.id }))
        : [],
    [value, part],
  );

  return (
    <div>
      <div
        className={cn('flex flex-wrap gap-1.5', centered && 'justify-center')}
        role="group"
        aria-label="Which part to change"
      >
        {CARTOON_PARTS.map((p) => (
          <button
            key={p.key}
            type="button"
            aria-pressed={p.key === partKey}
            onClick={() => setPartKey(p.key)}
            className={cn(
              'min-h-11 rounded-full border px-3 py-1.5 text-sm transition-colors sm:min-h-0',
              dark
                ? p.key === partKey
                  ? 'border-paper bg-paper text-[#0c1520]'
                  : 'border-paper/20 text-paper/80 hover:border-paper/50'
                : p.key === partKey
                  ? 'border-accent bg-accent text-paper'
                  : 'border-rule bg-paper-raised hover:border-accent',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div
        className={cn(
          'mt-4 grid gap-2',
          part.kind === 'shape' ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-4 sm:grid-cols-6',
        )}
        role="group"
        aria-label={part.label}
      >
        {part.choices.map((c, i) => {
          const on = value[part.key] === c.id;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange({ ...value, [part.key]: c.id })}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg border-2 px-1 py-2 text-center transition-colors',
                dark
                  ? on
                    ? 'border-paper/80 bg-paper/[0.07]'
                    : 'border-transparent hover:border-paper/20'
                  : on
                    ? 'border-accent bg-paper-sunk'
                    : 'border-transparent hover:border-rule',
              )}
            >
              {part.kind === 'shape' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tries[i]}
                  alt=""
                  width={64}
                  height={64}
                  className={cn('size-16 rounded-full', dark && 'bg-paper/90')}
                />
              ) : (
                <span
                  aria-hidden
                  className={cn('size-10 rounded-full border', dark ? 'border-paper/25' : 'border-rule')}
                  style={{ backgroundColor: `#${c.id}` }}
                />
              )}
              <span className={cn('text-xs leading-tight', dark && 'text-paper/75')}>{c.label}</span>
            </button>
          );
        })}
      </div>

      {part.key === 'clothesColour' ? (
        <p className={cn('mt-3 text-xs', dark ? 'text-paper/50' : 'text-muted', centered && 'text-center')}>
          A hijab, turban or hat takes this colour too.
        </p>
      ) : null}
    </div>
  );
}
