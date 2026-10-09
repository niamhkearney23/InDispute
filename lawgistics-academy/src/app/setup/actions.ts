'use server';

import { createHash, timingSafeEqual } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { seedContent } from '@/lib/setup/seed-content';
import { getSetupStatus } from '@/lib/setup/status';

/**
 * First-run setup.
 *
 * This is the one action in the app that grants administrator rights, so the
 * conditions are deliberately narrow:
 *
 *   1. you must be signed in, so there is a named account to grant them to;
 *   2. there must be no administrator yet; once one exists this is closed
 *      permanently, and the only way to make another is the command line;
 *   3. SETUP_TOKEN must be set, and must match. Without it, whoever signed
 *      in first on a new deployment became its administrator, so setup now
 *      refuses to run at all until the token is set.
 *
 * The check that no administrator exists and the grant are one database call
 * (claim_first_admin, 0040), under a lock, so two people pressing the button
 * at the same moment cannot both come away an administrator.
 */

export type SetupResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function completeSetup(formData: FormData): Promise<SetupResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: 'Create an account first, then come back to this page.' };
  }

  const status = await getSetupStatus();

  if (!status.schemaReady) {
    return {
      ok: false,
      error:
        status.schemaError ??
        'The database tables do not exist yet. Run the files in supabase/migrations in the Supabase SQL editor first.',
    };
  }

  if (status.adminExists) {
    return {
      ok: false,
      error:
        'This installation already has an administrator, so setup is closed. To add another, run: npx tsx scripts/make-admin.ts <email>',
    };
  }

  const requiredToken = process.env.SETUP_TOKEN;
  if (!requiredToken) {
    return {
      ok: false,
      error:
        'Setup is locked until a setup token is set. In Vercel, open the project, then Settings, then Environment Variables, add SETUP_TOKEN with a long random value, redeploy, and come back here with it.',
    };
  }
  // Compared as hashes in constant time, so the response time says nothing
  // about how much of a guess was right.
  const digest = (v: string) => createHash('sha256').update(v).digest();
  if (!timingSafeEqual(digest(String(formData.get('token') ?? '')), digest(requiredToken))) {
    return { ok: false, error: 'That setup token is not right.' };
  }

  const db = createServiceClient();

  // Administrator rights first, in one call that refuses if anybody already
  // has them. Loading the content comes after, so somebody who loses the race
  // does no work on a database that is no longer theirs to set up.
  const { data: granted, error: adminError } = await db.rpc('claim_first_admin', {
    uid: user.id,
  });
  if (adminError) {
    return {
      ok: false,
      error: `Granting administrator rights failed: ${adminError.message}. If it says the function does not exist, run supabase/UPDATE.sql in the Supabase SQL editor first.`,
    };
  }
  if (granted !== true) {
    return {
      ok: false,
      error:
        'This installation already has an administrator, so setup is closed. To add another, run: npx tsx scripts/make-admin.ts <email>',
    };
  }

  let loaded = status.publishedQuestions;
  try {
    const summary = await seedContent(db, { publish: formData.get('publish') !== 'no' });
    loaded = summary.questionsCreated + summary.questionsUnchanged + summary.questionsReversioned;
  } catch (error) {
    revalidatePath('/', 'layout');
    return {
      ok: false,
      error: `You are now the administrator, but the content could not be loaded: ${error instanceof Error ? error.message : 'unknown error'}. Load it from the Admin page with "Load the missing content".`,
    };
  }

  revalidatePath('/', 'layout');

  return {
    ok: true,
    message: `Loaded ${loaded} questions and made ${user.email} an administrator.`,
  };
}
