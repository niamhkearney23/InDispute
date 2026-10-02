'use client';

import { Button } from '@/components/ui';

/** Opens the browser's print dialog, where "Save as PDF" makes the file. */
export function PrintButton() {
  return (
    <Button type="button" variant="accent" onClick={() => window.print()}>
      Download as PDF
    </Button>
  );
}
