'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from '@/components/app-link';
import { cn } from '@/components/ui';

/**
 * The account menu behind the person's picture: their name, Progress (the
 * owner, November 2026: "you click your name and it comes under
 * progress"), Account settings, the quick tour, and Sign out. On the first
 * steps only Account settings and Sign out. A disclosure (a button that shows
 * a short list of links), not an application menu: it opens on Enter or a
 * tap, Tab moves through it, Escape closes it and puts focus back on the
 * button, and so does a tap outside or moving to another page.
 */
export function AccountMenu({
  avatar,
  name,
  tourHref,
  minimal = false,
}: {
  avatar: ReactNode;
  name: string | null;
  /** Where the quick tour opens. */
  tourHref: string;
  /** On the first steps (first-steps.ts): only Account settings and Sign out. */
  minimal?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const pathname = usePathname();

  // Moving to another page closes it (adjusted while rendering, React's
  // pattern for state that follows a prop, rather than in an effect).
  const [shownOn, setShownOn] = useState(pathname);
  if (shownOn !== pathname) {
    setShownOn(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    }
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !button.current?.contains(target)) setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const item =
    'flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm text-ink hover:bg-paper-sunk focus-visible:bg-paper-sunk';

  return (
    <div className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label="Your account"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors hover:bg-paper-sunk',
          open && 'bg-paper-sunk',
        )}
      >
        {avatar}
      </button>
      {open ? (
        <div
          ref={panel}
          id={id}
          className="absolute right-0 z-40 mt-1.5 w-60 rounded-lg border border-rule bg-paper-raised p-1.5 shadow-raised"
        >
          {name ? (
            <p className="truncate border-b border-rule px-3 pt-2 pb-2.5 text-sm font-semibold text-ink">{name}</p>
          ) : null}
          <ul className="py-1">
            {minimal ? null : (
              <li>
                <Link href="/skills" className={item}>
                  Progress
                </Link>
              </li>
            )}
            <li>
              <Link href="/account" className={item}>
                Account settings
              </Link>
            </li>
            {minimal ? null : (
              <li>
                <Link href={tourHref} className={item}>
                  Help: quick tour
                </Link>
              </li>
            )}
          </ul>
          <form action="/auth/sign-out" method="post" className="border-t border-rule pt-1">
            <button type="submit" className={cn(item, 'text-slate')}>
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
