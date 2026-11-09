'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/components/ui';

type State = 'idle' | 'loading' | 'playing' | 'error';

/**
 * "Listen": reads the text beside it aloud from the address it is given
 * (/api/speak, which finds the words itself and only as this reader may see
 * them). Tap again to stop. It says so when it cannot, and never takes words
 * from the page.
 */
export function ListenButton({ src, className }: { src: string; className?: string }) {
  const [state, setState] = useState<State>('idle');
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // A different screen, or leaving: stop whatever was playing.
    return () => {
      audio.current?.pause();
      audio.current = null;
    };
  }, [src]);

  function toggle() {
    if (state === 'playing' || state === 'loading') {
      audio.current?.pause();
      setState('idle');
      return;
    }
    const player = new Audio(src);
    audio.current = player;
    setState('loading');
    player.addEventListener('playing', () => setState('playing'));
    player.addEventListener('ended', () => setState('idle'));
    player.addEventListener('error', () => setState('error'));
    player.play().catch(() => setState('error'));
  }

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={state === 'playing'}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-rule-strong px-3 text-xs font-medium text-slate transition-colors hover:border-periwinkle hover:text-ink"
      >
        <svg aria-hidden viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 8v4h3l4 3.5v-11L6 8H3z" strokeLinejoin="round" />
          {state === 'playing' ? <path d="M13.5 7.5a3.5 3.5 0 010 5M15.5 5.5a6.5 6.5 0 010 9" strokeLinecap="round" /> : null}
        </svg>
        {state === 'loading' ? 'Loading…' : state === 'playing' ? 'Stop' : 'Listen'}
      </button>
      {state === 'error' ? <span className="text-xs text-verdict-wrong">Could not be read aloud just now.</span> : null}
    </span>
  );
}
