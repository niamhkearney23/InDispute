'use client';

import Link from '@/components/app-link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui';

export interface AdminNavItem {
  href: string;
  label: string;
  /** Other address prefixes that belong to this page, such as a question's editor. */
  also?: string[];
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

/** How closely an address belongs to an item: the length of the prefix it matches, or -1. */
function matchLength(pathname: string, item: AdminNavItem): number {
  // /admin is the questions page and also the prefix of every other admin
  // address, so it alone matches exactly.
  if (item.href === '/admin') {
    if (pathname === '/admin') return 6;
  } else if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
    return item.href.length;
  }
  for (const p of item.also ?? []) {
    if (pathname === p || pathname.startsWith(`${p}/`)) return p.length;
  }
  return -1;
}

/**
 * The admin menu in two short rows: a handful of groups, then only the pages
 * of the group you are in. Seventeen links in one row was a wall nobody knew
 * where to start on; a group is something a person can recognise, and the
 * page inside it is one more click.
 */
export function AdminNav({ groups }: { groups: AdminNavGroup[] }) {
  const pathname = usePathname();
  let best = { group: 0, item: '', length: -1 };
  groups.forEach((g, gi) =>
    g.items.forEach((item) => {
      const length = matchLength(pathname, item);
      if (length > best.length) best = { group: gi, item: item.href, length };
    }),
  );
  const current = best.length >= 0 ? groups[best.group] : null;

  const link = (active: boolean) =>
    cn(
      'relative rounded-[5px] px-2.5 py-2 whitespace-nowrap transition-colors hover:bg-paper',
      active
        ? 'font-medium text-ink after:absolute after:inset-x-2.5 after:bottom-1 after:h-0.5 after:rounded-full after:bg-accent'
        : 'text-slate hover:text-ink',
    );

  return (
    <div className="space-y-1">
      <nav aria-label="Admin sections" className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm">
        {groups.map((g) => (
          <Link
            key={g.label}
            href={g.items[0].href}
            aria-current={g === current ? 'true' : undefined}
            className={link(g === current)}
          >
            {g.label}
          </Link>
        ))}
        <Link href="/dashboard" className={link(false)}>
          Back to app
        </Link>
      </nav>
      {current && current.items.length > 1 ? (
        <nav
          aria-label={`${current.label} pages`}
          className="flex flex-wrap items-center gap-x-1 gap-y-0.5 border-t border-rule pt-1 text-sm"
        >
          {current.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.href === best.item ? 'page' : undefined}
              className={link(item.href === best.item)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
