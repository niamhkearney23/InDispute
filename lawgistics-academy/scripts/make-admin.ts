/**
 * Grants admin rights to an existing user.
 *
 * Admin cannot be self-assigned: a database trigger blocks any non-admin from
 * changing their own `is_admin` flag, and Row Level Security gives the browser
 * no route to it. The first admin therefore has to be created here, with the
 * service role key, by someone with access to the deployment environment.
 *
 * Run with:  npx tsx scripts/make-admin.ts you@example.com
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
config({ path: '.env' });

const email = process.argv[2];

if (!email) {
  console.error('Usage: npx tsx scripts/make-admin.ts <email>');
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
    .update({ is_admin: true })
    .eq('email', email)
    .select('id, email');

  if (error) throw error;

  if (!data || data.length === 0) {
    console.error(
      `No profile found for ${email}. The user must sign up first, then run this again.`,
    );
    process.exit(1);
  }

  console.log(`${email} is now an administrator.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
