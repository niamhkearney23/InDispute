'use client';

import { useSyncExternalStore } from 'react';

const noSubscription = () => () => {};

/**
 * False while the page has been drawn but its code is not running yet, true
 * after. A button that only works once the code runs can be shown disabled
 * until then, so a tap in the first moment after a page opens is not lost
 * without a sign (one cause of "sometimes the click doesn't work").
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}
