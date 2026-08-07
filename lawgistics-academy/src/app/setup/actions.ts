'use server';

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
 *   1. you must be signed in — so there is a named account to grant them to;
 *   2. there must be no administrator yet — once one exists this is closed
 *      permanently, and the only way to make another is the command line;
 *   3. if SETUP_TOKEN is set, it must match — optional, for a deployment that
 *      is publicly reachable before you have had a chance to claim it.
 *
 * The window this leaves open is between deploying and signing up for the first
 * time. On a public URL, set SETUP_TOKEN and close it.
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
  if (requiredToken && String(formData.get('token') ?? '') !== requiredToken) {
    return { ok: false, error: 'That setup token is not right.' };
  }

  const db = createServiceClient();

  let loaded = status.publishedQuestions;
  try {
    const summary = await seedContent(db, { publish: formData.get('publish') !== 'no' });
    loaded = summary.questionsCreated + summary.questionsUnchanged + summary.questionsReversioned;
  } catch (error) {
    return {
      ok: false,
      error: `Could not load the content: ${error instanceof Error ? error.message : 'unknown error'}`,
    };
  }

  const { error: adminError } = await db
    .from('profiles')
    .update({ is_admin: true })
    .eq('id', user.id);

  if (adminError) {
    return { ok: false, error: `Content loaded, but granting admin failed: ${adminError.message}` };
  }

  revalidatePath('/', 'layout');

  return {
    ok: true,
    message: `Loaded ${loaded} questions and made ${user.email} an administrator.`,
  };
}
