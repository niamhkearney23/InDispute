'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Wordmark, cn } from '@/components/ui';
import { darkDuring, type FirstStep } from '@/lib/learning/first-steps';

/**
 * The academy while somebody is on their first steps (first-steps.ts): no
 * menu, nothing to wander off to, only the name at the top and the account
 * menu (Account settings and Sign out). The greeting, Today's one card and
 * the start of the diagnostic are on the dark surface the sign-in pages
 * use; the questions themselves and the account pages are on paper.
 *
 * Decided here, in the browser, from the address: a layout is not drawn
 * again when somebody moves between its pages, so a choice made on the
 * server would stay dark on the questions.
 */
export function FirstVisitShell({
  step,
  menu,
  children,
}: {
  step: FirstStep;
  menu: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const dark = darkDuring(step, pathname);
  return (
    <div className={dark ? 'auth-surface' : 'theme-paper flex min-h-dvh flex-col'}>
      <header className="flex items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 sm:px-8">
        <span className="py-2">
          <Wordmark light={dark} compact />
        </span>
        {menu}
      </header>
      <main
        className={cn(
          'flex w-full flex-1 flex-col px-4 pb-16 sm:px-8',
          dark ? 'justify-center py-8' : 'mx-auto max-w-3xl py-6',
        )}
      >
        {children}
      </main>
    </div>
  );
}
