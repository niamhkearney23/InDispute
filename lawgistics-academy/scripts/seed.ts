/**
 * Loads the content into a Supabase project from the command line.
 *
 * The same job as the first-run setup page at /setup, for people who would
 * rather use a terminal. Both call the same implementation.
 *
 *   npm run seed
 *   npm run seed -- --drafts-only
 *
 * IMPORTANT — read before going live:
 * Every question and fact ships with verification_status = 'requires_review'.
 * The content is drafted to be accurate, but it has not been signed off by an
 * Australian legal practitioner, and no automated process can do that. Work
 * through the queue at /admin/review before real learners use this.
 *
 * By default the content is published so a fresh install has a working training
 * loop. Pass --drafts-only to hold everything back until you have signed it off.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { seedContent } from '../src/lib/setup/seed-content';

config({ path: '.env.local' });
config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Copy .env.example to .env.local and fill it in, or run `npm run doctor`.',
  );
  process.exit(1);
}

const draftsOnly = process.argv.includes('--drafts-only');

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log('Loading content…\n');

  const summary = await seedContent(db, { publish: !draftsOnly });

  console.log(
    `Taxonomy: ${summary.domains} domains, ${summary.concepts} concepts, ${summary.skills} skills.`,
  );
  console.log(
    `Questions: ${summary.questionsCreated} created, ${summary.questionsReversioned} re-versioned, ${summary.questionsUnchanged} unchanged.`,
  );
  console.log(`Daily facts: ${summary.facts}.`);

  console.log(
    `\nDone.\n\n` +
      (draftsOnly
        ? '  Content was loaded as drafts. Verify and publish it at /admin/review —\n' +
          '  until you do, training sessions will be empty.\n'
        : `  ${summary.awaitingVerification} published question(s) still await human verification.\n` +
          '  Sign them off at /admin/review before real learners use this.\n'),
  );
}

main().catch((error) => {
  console.error('\nSeed failed:', error.message ?? error);
  process.exit(1);
});
