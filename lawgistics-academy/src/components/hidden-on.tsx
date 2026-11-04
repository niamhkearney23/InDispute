'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Leaves its children out on one address. The admin warnings sit at the top
 * of every admin page; Admin Today shows the same things as its own
 * Operations section, so on that page they would say everything twice.
 */
export function HiddenOn({ path, children }: { path: string; children: ReactNode }) {
  return usePathname() === path ? null : <>{children}</>;
}
