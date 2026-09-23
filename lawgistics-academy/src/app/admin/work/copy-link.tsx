'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

/**
 * The address of the post, for sending on WhatsApp or by email. Somebody who
 * opens it signs in first (the login page brings them back here), then sees
 * the post and the button to put their name on it.
 */
export function CopyLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt('Copy this link', url);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      {copied ? 'Copied' : 'Copy link to send'}
    </Button>
  );
}
