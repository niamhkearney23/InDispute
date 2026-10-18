'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui';
import { BookIcon, BriefcaseIcon, ChartIcon, PersonIcon, SunIcon } from '@/components/icons';

/**
 * The academy's menu on a phone: five places, each an icon with its name
 * under it, fixed to the foot of the screen where a thumb is. On a wider
 * screen the header carries the same five, so this is hidden there. It
 * links only to pages every learner can already open from the header or
 * Today; it decides nothing about who sees what.
 */
const ITEMS = [
  { href: '/dashboard', label: 'Today', Icon: SunIcon },
  { href: '/modules', label: 'Learn', Icon: BookIcon },
  { href: '/work', label: 'Work', Icon: BriefcaseIcon },
  { href: '/skills', label: 'Progress', Icon: ChartIcon },
  { href: '/account', label: 'Account', Icon: PersonIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-paper-raised/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:hidden print:hidden"
    >
      <ul className="mx-auto flex max-w-md justify-between px-2">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'mx-0.5 my-1.5 flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl border-2 py-1 text-[0.6875rem]',
                  active ? 'border-ink bg-pop font-bold text-ink' : 'border-transparent text-muted hover:text-ink',
                )}
              >
                <Icon className="size-[22px]" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
