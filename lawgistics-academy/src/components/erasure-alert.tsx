import 'server-only';

import Link from 'next/link';
import { Notice } from '@/components/ui';
import { readAdminErasureNotices } from '@/lib/account/erasure-monitor-store';
import type { AdminErasureNotice } from '@/lib/account/erasure-monitoring';

const UNREADABLE: AdminErasureNotice = {
  level: 'unknown',
  title: 'The state of account deletions could not be read just now.',
  details: [],
  action: 'Reload the page, or open Admin, Deletions. If this stays, check Supabase is working.',
  linkToDeletions: true,
};

/**
 * On every admin page, for administrators: unfinished deletions, worded by
 * how serious they are, and a nightly check that is not running (0049).
 * The wording is `adminErasureNotices`; this only reads and draws it. When
 * something could not be read it says so, never nothing.
 */
export async function ErasureAlert() {
  let notices: AdminErasureNotice[];
  try {
    notices = await readAdminErasureNotices({ cronSecret: process.env.CRON_SECRET });
  } catch (error) {
    // readAdminErasureNotices does not throw; this is the floor beneath it.
    console.error('the deletion status could not be read:', error);
    notices = [UNREADABLE];
  }
  if (notices.length === 0) return null;
  return (
    <div className="mb-6 space-y-3">
      {notices.map((n) => (
        <Notice key={n.title} tone={n.level === 'escalate' ? 'error' : 'warn'}>
          <p>
            <strong>{n.title}</strong>
            {n.details.length > 0 ? ` ${n.details.join(' ')}` : null}
          </p>
          <p className="mt-1">{n.action}</p>
          {n.linkToDeletions ? (
            <p className="mt-1">
              <Link
                href="/admin/deletions"
                className="inline-flex min-h-11 items-center font-medium underline underline-offset-2"
              >
                Open Admin, Deletions
              </Link>
            </p>
          ) : null}
        </Notice>
      ))}
    </div>
  );
}
