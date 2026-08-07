import 'server-only';

import { publicEnv } from '@/lib/env';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * What state is this installation in?
 *
 * Used by the first-run page and by `npm run doctor`, so a stuck setup gives
 * the same answer whether you look at it in a browser or a terminal.
 */

export interface SetupStatus {
  envConfigured: boolean;
  serviceKeyConfigured: boolean;
  /** Whether the migrations have been run. */
  schemaReady: boolean;
  schemaError: string | null;
  contentLoaded: boolean;
  publishedQuestions: number;
  publishedFacts: number;
  adminExists: boolean;
  userCount: number;
  reviewOutstanding: number;
}

export async function getSetupStatus(): Promise<SetupStatus> {
  const envConfigured = Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
  const serviceKeyConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  const blank: SetupStatus = {
    envConfigured,
    serviceKeyConfigured,
    schemaReady: false,
    schemaError: null,
    contentLoaded: false,
    publishedQuestions: 0,
    publishedFacts: 0,
    adminExists: false,
    userCount: 0,
    reviewOutstanding: 0,
  };

  if (!envConfigured || !serviceKeyConfigured) return blank;

  let db;
  try {
    db = createServiceClient();
  } catch (error) {
    return { ...blank, schemaError: error instanceof Error ? error.message : 'unknown' };
  }

  // The cheapest possible probe for "have the migrations been run": ask for a
  // table that only exists afterwards.
  const probe = await db.from('profiles').select('id', { count: 'exact', head: true });
  if (probe.error) {
    return {
      ...blank,
      schemaError: probe.error.message,
    };
  }

  const [questions, facts, admins, review] = await Promise.all([
    db
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
    db
      .from('daily_facts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('is_admin', true),
    db
      .from('question_versions')
      .select('id', { count: 'exact', head: true })
      .eq('is_current', true)
      .neq('verification_status', 'human_verified'),
  ]);

  return {
    envConfigured,
    serviceKeyConfigured,
    schemaReady: true,
    schemaError: null,
    contentLoaded: (questions.count ?? 0) > 0,
    publishedQuestions: questions.count ?? 0,
    publishedFacts: facts.count ?? 0,
    adminExists: (admins.count ?? 0) > 0,
    userCount: probe.count ?? 0,
    reviewOutstanding: review.count ?? 0,
  };
}
