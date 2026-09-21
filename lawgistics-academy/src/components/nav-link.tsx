'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui';

/**
 * A header link that knows when it is the page you are on.
 *
 * The mark is a short burgundy bar under the word rather than a change of
 * background, so it survives the nav wrapping onto two lines on a narrow
 * phone without floating somewhere between them.
 */
export function NavLink({
  href,
  exact = false,
  className,
  children,
}: {
  href: string;
  /** Match only this path, not everything beneath it. */
  exact?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative rounded-[5px] px-2 py-2 whitespace-nowrap transition-colors sm:px-2.5',
        active
          ? 'font-medium text-ink after:absolute after:inset-x-2 after:bottom-1 after:h-0.5 after:rounded-full after:bg-burgundy sm:after:inset-x-2.5'
          : 'text-slate hover:text-ink',
        className,
      )}
    >
      {children}
    </Link>
  );
}
