/**
 * Tells you what is wrong with your setup, in order, with the fix.
 *
 *   npm run doctor
 *
 * Every check knows how to explain itself. The point is that "it doesn't work"
 * should never be the end of the conversation.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
config({ path: '.env' });

const tick = (ok: boolean) => (ok ? '  ok  ' : ' FAIL ');

let failed = false;

function report(ok: boolean, label: string, fix?: string) {
  console.log(`[${tick(ok)}] ${label}`);
  if (!ok) {
    failed = true;
    if (fix) console.log(`         ↳ ${fix.replace(/\n/g, '\n           ')}`);
  }
}

async function main() {
  console.log('\nLawgistics Academy — setup check\n');

  /* --- environment ------------------------------------------------------- */
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  report(
    Boolean(url),
    'NEXT_PUBLIC_SUPABASE_URL is set',
    'Copy .env.example to .env.local and paste your project URL from\n' +
      'Supabase → Project Settings → API.',
  );
  report(
    Boolean(anon),
    'NEXT_PUBLIC_SUPABASE_ANON_KEY is set',
    'Same page — the anon / publishable key.',
  );
  report(
    Boolean(service),
    'SUPABASE_SERVICE_ROLE_KEY is set',
    'Same page — the service_role / secret key. It must NOT have a NEXT_PUBLIC_\n' +
      'prefix, and must never be committed.',
  );

  if (service && service.startsWith('eyJ') && anon === service) {
    report(false, 'the anon and service keys are different', 'You have pasted the same key twice.');
  }

  if (!url || !service) {
    console.log('\nCannot check the database without those. Fix the above first.\n');
    process.exit(1);
  }

  /* --- connectivity ------------------------------------------------------ */
  const db = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const probe = await db.from('profiles').select('id', { count: 'exact', head: true });

  if (probe.error) {
    const missingTable = /relation .* does not exist|schema cache/i.test(probe.error.message);
    report(
      false,
      'the database tables exist',
      missingTable
        ? 'Open the Supabase SQL editor and run the three files in supabase/migrations,\n' +
          'in order: 0001_init.sql, 0002_daily_facts.sql, 0003_review_workflow.sql.'
        : `Supabase said: ${probe.error.message}\n` +
          'If that is an auth error, the service role key is wrong. If it is a network\n' +
          'error, check the project URL.',
    );
    console.log('');
    process.exit(1);
  }

  report(true, 'connected to Supabase and the tables exist');

  /* --- migrations -------------------------------------------------------- */
  const review = await db.from('daily_facts').select('review_flagged').limit(1);
  report(
    !review.error,
    'all three migrations have been run',
    'The review workflow columns are missing — run supabase/migrations/0003_review_workflow.sql.',
  );

  /* --- content ----------------------------------------------------------- */
  const [{ count: published }, { count: facts }, { count: admins }, { count: unverified }] =
    await Promise.all([
      db.from('questions').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      db.from('daily_facts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      db.from('profiles').select('id', { count: 'exact', head: true }).eq('is_admin', true),
      db
        .from('question_versions')
        .select('id', { count: 'exact', head: true })
        .eq('is_current', true)
        .neq('verification_status', 'human_verified'),
    ]);

  report(
    (published ?? 0) > 0,
    `content is loaded (${published ?? 0} published questions, ${facts ?? 0} daily facts)`,
    'Run `npm run seed`, or open /setup in the browser and press the button.',
  );

  report(
    (admins ?? 0) > 0,
    'an administrator exists',
    'Sign up in the app first, then either open /setup, or run:\n' +
      '  npx tsx scripts/make-admin.ts you@example.com',
  );

  /* --- summary ----------------------------------------------------------- */
  console.log('');
  if (failed) {
    console.log('Something needs attention — see the ↳ notes above.\n');
    process.exit(1);
  }

  console.log('Everything checks out. `npm run dev` and sign in.\n');

  if ((unverified ?? 0) > 0) {
    console.log(
      `Note: ${unverified} question(s) are published but have not been verified by a\n` +
        'person. Work through /admin/review before real learners use this.\n',
    );
  }
}

main().catch((error) => {
  console.error('\nThe check itself failed:', error.message ?? error, '\n');
  process.exit(1);
});
