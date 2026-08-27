/**
 * Makes an existing user a coach.
 *
 * A coach is the lawyer who supervises the juniors. They sign content off in
 * the review queue and they record the supervisor decisions about their own
 * people. They cannot write content, invite anybody, or change the firm's
 * setup, which is the whole reason this exists rather than handing them
 * `is_admin` and hoping.
 *
 * They have to sign up themselves first, with their own email. Do not create an
 * account for somebody and pass them a password: every sign-off records who
 * decided, and that record is worth nothing if the account was not theirs.
 *
 * Coach cannot be self-assigned. A database trigger blocks any non-administrator
 * from changing either privilege flag, and Row Level Security gives the browser
 * no route to it, so this runs with the service role key by somebody with access
 * to the deployment environment.
 *
 * Run with:  npx tsx scripts/make-coach.ts them@theirfirm.com
 * Undo with: npx tsx scripts/make-coach.ts them@theirfirm.com --remove
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
config({ path: '.env' });

const email = process.argv[2];
const remove = process.argv.includes('--remove');

if (!email || email.startsWith('--')) {
  console.error('Usage: npx tsx scripts/make-coach.ts <email> [--remove]');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data, error } = await db
    .from('profiles')
    .update({ is_coach: !remove })
    .eq('email', email)
    .select('id, email, is_admin');

  if (error) throw error;

  if (!data || data.length === 0) {
    console.error(
      `No profile found for ${email}. They must sign up first, then run this again.`,
    );
    process.exit(1);
  }

  if (remove) {
    console.log(`${email} is no longer a coach.`);
    return;
  }

  console.log(`${email} is now a coach.`);
  console.log('');
  console.log('They can sign in and open /admin/review to sign content off, and');
  console.log('/admin/onboarding to see their people. They cannot write content.');

  if (data[0].is_admin) {
    console.log('');
    console.log('Note: this account is also an administrator, so it already had');
    console.log('every coach right. Nothing about what they can reach has changed.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
