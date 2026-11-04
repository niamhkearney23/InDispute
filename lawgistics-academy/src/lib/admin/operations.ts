import 'server-only';

import { cache } from 'react';
import { createServiceClient } from '@/lib/supabase/service';
import { EXPECTED_SCHEMA_VERSION } from '@/lib/schema-version';
import { readAdminErasureNotices } from '@/lib/account/erasure-monitor-store';
import type { AdminErasureNotice } from '@/lib/account/erasure-monitoring';
import { regionProblem } from '@/lib/region';

/**
 * What is wrong with the running of the academy, for an administrator: the
 * database behind the code, the server in the wrong region, and deletions
 * that have not finished or a nightly check that is not running. Read once
 * per page view (React's cache) and shared by the banners on every admin page
 * and the Operations section of Admin Today.
 */

export interface SchemaState {
  current: string | null;
  expected: string;
  behind: boolean;
}

export const schemaState = cache(async (): Promise<SchemaState> => {
  const { data, error } = await createServiceClient().rpc('schema_version');
  const current = typeof data === 'string' ? data : null;
  return {
    current,
    expected: EXPECTED_SCHEMA_VERSION,
    behind: Boolean(error) || !current || current < EXPECTED_SCHEMA_VERSION,
  };
});

const UNREADABLE: AdminErasureNotice = {
  level: 'unknown',
  title: 'The state of account deletions could not be read just now.',
  details: [],
  action: 'Reload the page, or open Admin, Deletions. If this stays, check Supabase is working.',
  linkToDeletions: true,
};

export const erasureNotices = cache(async (): Promise<AdminErasureNotice[]> => {
  try {
    return await readAdminErasureNotices({ cronSecret: process.env.CRON_SECRET });
  } catch (error) {
    // readAdminErasureNotices does not throw; this is the floor beneath it.
    console.error('the deletion status could not be read:', error);
    return [UNREADABLE];
  }
});

export interface OperationalProblem {
  key: string;
  title: string;
  detail: string;
  href: string | null;
  serious: boolean;
}

/** Every problem, as one list, for Admin Today. Empty when all is well. */
export async function operationalProblems(): Promise<OperationalProblem[]> {
  const [schema, erasures] = await Promise.all([schemaState(), erasureNotices()]);
  const problems: OperationalProblem[] = [];
  if (schema.behind) {
    problems.push({
      key: 'schema',
      title: 'The database needs updating',
      detail: `The website expects version ${schema.expected}${
        schema.current ? ` and the database is at ${schema.current}` : ''
      }. Paste supabase/UPDATE.sql into the Supabase SQL Editor and press Run.`,
      href: null,
      serious: true,
    });
  }
  const region = regionProblem();
  if (region) {
    problems.push({ key: 'region', title: 'Server region', detail: region, href: null, serious: false });
  }
  for (const n of erasures) {
    problems.push({
      key: `erasure-${n.title}`,
      title: n.title,
      detail: [...n.details, n.action].join(' '),
      href: n.linkToDeletions ? '/admin/deletions' : null,
      serious: n.level === 'escalate' || n.level === 'unknown',
    });
  }
  return problems;
}
