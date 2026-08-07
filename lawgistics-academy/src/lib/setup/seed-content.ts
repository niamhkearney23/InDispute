import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { CONCEPTS, DOMAINS, FACTS, QUESTIONS, SKILLS, validateSeed } from '@/content/seed';
import type { SeedQuestion } from '@/content/seed/types';

/**
 * Loading the content.
 *
 * Shared by the command line (`npm run seed`) and by the first-run setup page,
 * so there is one implementation of "what does a fresh install contain" rather
 * than two that drift.
 *
 * Idempotent. Running it twice changes nothing. If a question's wording has
 * changed in the repository since the last run, a new immutable version is
 * minted and the old one kept, because historical attempts point at the version
 * the learner actually saw.
 */

export interface SeedSummary {
  domains: number;
  concepts: number;
  skills: number;
  questionsCreated: number;
  questionsReversioned: number;
  questionsUnchanged: number;
  facts: number;
  awaitingVerification: number;
}

/** Content that, if changed, requires a new immutable version. */
function contentFingerprint(q: SeedQuestion) {
  return JSON.stringify({
    type: q.type,
    scenario: q.scenario ?? null,
    stem: q.stem,
    options: q.options,
    correct: [...q.correct].sort(),
    jurisdiction: q.jurisdiction,
  });
}

function versionFingerprint(row: {
  question_type: string;
  scenario: string | null;
  stem: string;
  options: unknown;
  correct_option_ids: string[];
  jurisdiction: string;
}) {
  return JSON.stringify({
    type: row.question_type,
    scenario: row.scenario ?? null,
    stem: row.stem,
    options: row.options,
    correct: [...row.correct_option_ids].sort(),
    jurisdiction: row.jurisdiction,
  });
}

export async function seedContent(
  db: SupabaseClient,
  options: { publish?: boolean } = {},
): Promise<SeedSummary> {
  const errors = validateSeed();
  if (errors.length > 0) {
    throw new Error(`Seed content failed validation:\n- ${errors.join('\n- ')}`);
  }

  // Published by default so a fresh install has a working training loop, but
  // every item still carries requires_review until a person signs it off.
  const status = options.publish === false ? 'requires_review' : 'published';

  /* --- taxonomy ---------------------------------------------------------- */
  const { error: domainError } = await db.from('domains').upsert(
    DOMAINS.map((d, index) => ({
      slug: d.slug,
      name: d.name,
      description: d.description,
      sort_order: index,
    })),
    { onConflict: 'slug' },
  );
  if (domainError) throw domainError;

  const { data: domainRows } = await db.from('domains').select('id, slug');
  const domainIdBySlug = new Map((domainRows ?? []).map((d) => [d.slug, d.id]));

  const { error: conceptError } = await db.from('concepts').upsert(
    CONCEPTS.map((c, index) => ({
      slug: c.slug,
      domain_id: domainIdBySlug.get(c.domain),
      name: c.name,
      description: c.description,
      sort_order: index,
    })),
    { onConflict: 'slug' },
  );
  if (conceptError) throw conceptError;

  const { error: skillError } = await db.from('skills').upsert(
    SKILLS.map((s, index) => ({
      slug: s.slug,
      name: s.name,
      description: s.description,
      sort_order: index,
    })),
    { onConflict: 'slug' },
  );
  if (skillError) throw skillError;

  const { data: conceptRows } = await db.from('concepts').select('id, slug');
  const conceptIdBySlug = new Map((conceptRows ?? []).map((c) => [c.slug, c.id]));

  const { data: skillRows } = await db.from('skills').select('id, slug');
  const skillIdBySlug = new Map((skillRows ?? []).map((s) => [s.slug, s.id]));

  /* --- questions --------------------------------------------------------- */
  let created = 0;
  let reversioned = 0;
  let unchanged = 0;

  for (const q of QUESTIONS) {
    const domainId = domainIdBySlug.get(q.domain);
    if (!domainId) throw new Error(`Unknown domain ${q.domain}`);

    const { data: existing } = await db
      .from('questions')
      .select('id')
      .eq('slug', q.slug)
      .maybeSingle();

    let questionId = existing?.id as string | undefined;

    if (!questionId) {
      const { data: inserted, error } = await db
        .from('questions')
        .insert({ slug: q.slug, domain_id: domainId, status })
        .select('id')
        .single();
      if (error) throw error;
      questionId = inserted.id as string;
    }

    // Concept and skill links are edges of the graph, not versioned content.
    await db.from('question_concepts').delete().eq('question_id', questionId);
    await db.from('question_skills').delete().eq('question_id', questionId);

    const { error: linkError } = await db.from('question_concepts').insert(
      q.concepts.map((slug) => ({
        question_id: questionId,
        concept_id: conceptIdBySlug.get(slug),
      })),
    );
    if (linkError) throw linkError;

    const { error: skillLinkError } = await db.from('question_skills').insert(
      q.skills.map((slug) => ({
        question_id: questionId,
        skill_id: skillIdBySlug.get(slug),
      })),
    );
    if (skillLinkError) throw skillLinkError;

    const { data: currentVersion } = await db
      .from('question_versions')
      .select(
        'id, version, question_type, scenario, stem, options, correct_option_ids, jurisdiction',
      )
      .eq('question_id', questionId)
      .eq('is_current', true)
      .maybeSingle();

    if (currentVersion && versionFingerprint(currentVersion) === contentFingerprint(q)) {
      unchanged += 1;
      continue;
    }

    const { data: latest } = await db
      .from('question_versions')
      .select('version')
      .eq('question_id', questionId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = ((latest?.version as number) ?? 0) + 1;

    if (currentVersion) {
      // Retire the old current row first — a partial unique index enforces that
      // exactly one version per question may be current.
      const { error } = await db
        .from('question_versions')
        .update({ is_current: false })
        .eq('id', currentVersion.id);
      if (error) throw error;
    }

    const { error: versionError } = await db.from('question_versions').insert({
      question_id: questionId,
      version: nextVersion,
      is_current: true,
      question_type: q.type,
      scenario: q.scenario ?? null,
      stem: q.stem,
      options: q.options,
      correct_option_ids: q.correct,
      explanation: q.explanation,
      why_it_matters: q.whyItMatters,
      common_misconception: q.commonMisconception ?? null,
      memory_trick: q.memoryTrick ?? null,
      difficulty: q.difficulty,
      jurisdiction: q.jurisdiction,
      court: q.court ?? null,
      source_reference: q.sourceReference ?? null,
      source_url: q.sourceUrl ?? null,
      verification_status: 'requires_review',
    });
    if (versionError) throw versionError;

    if (nextVersion === 1) created += 1;
    else reversioned += 1;
  }

  /* --- daily facts ------------------------------------------------------- */
  // Facts are not versioned: nothing a learner does is recorded against one, so
  // correcting a fact just corrects it.
  const { error: factError } = await db.from('daily_facts').upsert(
    FACTS.map((fact, index) => ({
      slug: fact.slug,
      title: fact.title,
      body: fact.body,
      why_it_matters: fact.whyItMatters ?? null,
      jurisdiction: fact.jurisdiction,
      court: fact.court ?? null,
      domain_id: fact.domain ? domainIdBySlug.get(fact.domain) : null,
      source_reference: fact.sourceReference ?? null,
      source_url: fact.sourceUrl ?? null,
      status,
      verification_status: 'requires_review',
      sort_order: index,
    })),
    { onConflict: 'slug' },
  );
  if (factError) throw factError;

  const { count } = await db
    .from('question_versions')
    .select('id', { count: 'exact', head: true })
    .eq('is_current', true)
    .neq('verification_status', 'human_verified');

  return {
    domains: DOMAINS.length,
    concepts: CONCEPTS.length,
    skills: SKILLS.length,
    questionsCreated: created,
    questionsReversioned: reversioned,
    questionsUnchanged: unchanged,
    facts: FACTS.length,
    awaitingVerification: count ?? 0,
  };
}
