import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { modulesFor, moduleBySlug, type SeedModule } from '@/content/seed/modules';
import type { Country } from '@/lib/types';

/**
 * Module progress, derived from attempts.
 *
 * Nothing is written here. A module is complete when every published question
 * in it has been answered correctly at least once, and the completion date is
 * the date that last became true. That means the record cannot be clicked
 * through, it counts training already done, and there is no completions table
 * to drift out of step with the attempts it is supposed to describe.
 *
 * The cost is a query per view rather than a stored flag. For a list of two
 * modules that is the right trade.
 */

export interface ModuleProgress {
  module: SeedModule;
  total: number;
  correctOnce: number;
  answered: number;
  complete: boolean;
  /** ISO date the module was completed, or null. */
  completedAt: string | null;
}

async function questionIdsByModule(
  country: Country,
  modules: SeedModule[],
): Promise<Map<string, string[]>> {
  const db = createServiceClient();
  const domains = [...new Set(modules.flatMap((m) => m.domains))];
  if (domains.length === 0) return new Map();

  // Only published questions count. A module whose questions are still drafts
  // is not one a learner can complete, and saying otherwise would let someone
  // finish an induction by answering three of sixteen.
  const { data } = await db
    .from('v_question_delivery')
    .select('question_id, domain_slug')
    .eq('country', country)
    .in('domain_slug', domains);

  const byDomain = new Map<string, string[]>();
  for (const row of data ?? []) {
    const list = byDomain.get(row.domain_slug as string) ?? [];
    list.push(row.question_id as string);
    byDomain.set(row.domain_slug as string, list);
  }

  const byModule = new Map<string, string[]>();
  for (const definition of modules) {
    byModule.set(definition.slug, definition.domains.flatMap((d) => byDomain.get(d) ?? []));
  }
  return byModule;
}

export async function getModuleProgress(
  userId: string,
  country: Country,
): Promise<ModuleProgress[]> {
  const db = createServiceClient();
  const modules = modulesFor(country);
  const byModule = await questionIdsByModule(country, modules);

  const everyId = [...new Set([...byModule.values()].flat())];
  if (everyId.length === 0) {
    return modules.map((module) => ({
      module,
      total: 0,
      correctOnce: 0,
      answered: 0,
      complete: false,
      completedAt: null,
    }));
  }

  const { data: attempts } = await db
    .from('user_question_attempts')
    .select('question_id, is_correct, answered_at')
    .eq('user_id', userId)
    .in('question_id', everyId);

  // The first time each question was answered correctly. A later wrong answer
  // does not undo an induction, the same way sitting an exam again does not
  // withdraw the first pass; the mastery score is what tracks current strength.
  const firstCorrect = new Map<string, string>();
  const everAnswered = new Set<string>();

  for (const attempt of attempts ?? []) {
    const id = attempt.question_id as string;
    everAnswered.add(id);
    if (!attempt.is_correct) continue;

    const at = attempt.answered_at as string;
    const existing = firstCorrect.get(id);
    if (!existing || at < existing) firstCorrect.set(id, at);
  }

  return modules.map((definition) => {
    const ids = byModule.get(definition.slug) ?? [];
    const done = ids.filter((id) => firstCorrect.has(id));
    const complete = ids.length > 0 && done.length === ids.length;

    return {
      module: definition,
      total: ids.length,
      correctOnce: done.length,
      answered: ids.filter((id) => everAnswered.has(id)).length,
      complete,
      // The moment the last remaining question was first answered correctly.
      completedAt: complete
        ? done.map((id) => firstCorrect.get(id)!).sort().at(-1)!
        : null,
    };
  });
}

export async function getModule(
  userId: string,
  country: Country,
  slug: string,
): Promise<ModuleProgress | null> {
  const definition = moduleBySlug(slug);
  if (!definition || definition.country !== country) return null;

  const all = await getModuleProgress(userId, country);
  return all.find((p) => p.module.slug === slug) ?? null;
}

/** Required modules the learner has not finished, for the dashboard prompt. */
export async function outstandingRequired(
  userId: string,
  country: Country,
): Promise<ModuleProgress[]> {
  const progress = await getModuleProgress(userId, country);
  return progress.filter((p) => p.module.required && !p.complete && p.total > 0);
}
