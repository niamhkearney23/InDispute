'use client';

import { Button } from '@/components/ui';

/** Opens the browser's print dialog, for printing the certificate as it looks on the page. */
export function PrintButton() {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()}>
      Print
    </Button>
  );
}
