'use client';

import Link from '@/components/app-link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui';
import { BookIcon, ChatIcon, SunIcon } from '@/components/icons';

/**
 * The academy's menu on a phone: three places, each an icon with its name
 * under it, fixed to the foot of the screen where a thumb is. On a wider
 * screen the header carries the same three, so this is hidden there.
 * Progress and Account are behind the person's picture in the header (the
 * owner, November 2026: "there's too much things happening"). It links
 * only to pages every learner can already open; it decides nothing about
 * who sees what.
 */
const ITEMS = [
  { href: '/dashboard', label: 'Today', Icon: SunIcon },
  { href: '/modules', label: 'Learn', Icon: BookIcon },
  // The work board: what the coach sets, and what they say about it.
  { href: '/work', label: 'Coach', Icon: ChatIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper-raised pb-[env(safe-area-inset-bottom)] sm:hidden print:hidden"
    >
      <ul className="mx-auto flex max-w-sm justify-between px-2">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 pt-2 pb-1.5 text-[0.6875rem]',
                  active ? 'font-semibold text-ink' : 'text-muted hover:text-ink',
                )}
              >
                <Icon className="size-[22px]" />
                {label}
                <span aria-hidden className={cn('size-1 rounded-full', active ? 'bg-periwinkle' : 'bg-transparent')} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
