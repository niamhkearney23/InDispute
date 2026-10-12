import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { EXPECTED_SCHEMA_VERSION } from '@/lib/schema-version';
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
  const { data, error } = await createServiceClient().rpc('schema_version');
  const current = typeof data === 'string' ? data : null;
  if (!error && current && current >= EXPECTED_SCHEMA_VERSION) return null;

  return (
    <div className="mb-6">
      <Notice tone="warn">
        <strong>The database needs updating.</strong> The website expects database version{' '}
        {EXPECTED_SCHEMA_VERSION}
        {current ? `, and this database is at ${current}` : ''}. Paste the latest{' '}
        <code>supabase/UPDATE.sql</code> into the Supabase SQL Editor and press Run. It is safe
        to run more than once.
      </Notice>
    </div>
  );
}
