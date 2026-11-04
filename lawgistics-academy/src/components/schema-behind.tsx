import 'server-only';

import { schemaState } from '@/lib/admin/operations';
import { Notice } from '@/components/ui';

/**
 * Says so when the database is older than the code.
 *
 * A merge updates the website for every firm by itself; a database change
 * waits until somebody pastes UPDATE.sql. Until then a page that needs the
 * new tables fails in a way nobody can read, so the administrator is told
 * plainly, on every admin page, what to do about it.
 */
export async function SchemaBehind() {
  const { current, expected, behind } = await schemaState();
  if (!behind) return null;

  return (
    <div className="mb-6">
      <Notice tone="warn">
        <strong>The database needs updating.</strong> The website expects database version{' '}
        {expected}
        {current ? `, and this database is at ${current}` : ''}. Paste the latest{' '}
        <code>supabase/UPDATE.sql</code> into the Supabase SQL Editor and press Run. It is safe
        to run more than once.
      </Notice>
    </div>
  );
}
