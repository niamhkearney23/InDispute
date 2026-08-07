/**
 * Seeds the taxonomy and the question bank.
 *
 * Idempotent: running it twice changes nothing. If a question's content has
 * been edited in this repository since the last run, a NEW version is minted
 * and the old one is retained, because historical attempts point at the version
 * a learner actually saw.
 *
 * Run with:  npm run seed
 *
 * IMPORTANT — read before going live:
 * Every question shipped in this repository is seeded with
 * verification_status = 'requires_review'. The content is drafted to be
 * accurate, but it has not been signed off by an Australian legal practitioner,
 * and no automated process can do that. Work through the admin verification
 * queue at /admin before putting this in front of real learners.
 *
 * By default seed questions are set to `published` so a fresh install has a
 * working training loop. If you would rather nothing be servable until a person
 * has signed it off — the stricter and safer posture — run:
 *
 *     npm run seed -- --drafts-only
 *
 * and publish from /admin as you verify each question.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { CONCEPTS, DOMAINS, FACTS, QUESTIONS, SKILLS, validateSeed } from '../src/content/seed';
import type { SeedQuestion } from '../src/content/seed/types';

config({ path: '.env.local' });
config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Copy .env.example to .env.local and fill it in before seeding.',
  );
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const draftsOnly = process.argv.includes('--drafts-only');
const seedStatus = draftsOnly ? 'requires_review' : 'published';

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

async function main() {
  const errors = validateSeed();
  if (errors.length > 0) {
    console.error('Seed content failed validation:\n');
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  console.log(
    `Seeding ${DOMAINS.length} domains, ${CONCEPTS.length} concepts, ` +
      `${SKILLS.length} skills, ${QUESTIONS.length} questions, ${FACTS.length} daily facts.\n`,
  );

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

  console.log('Taxonomy up to date.');

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
        .insert({
          slug: q.slug,
          domain_id: domainId,
          // Published by default so the product is usable out of the box, but
          // every version carries requires_review until a person signs it off.
          // Pass --drafts-only to hold everything back instead.
          status: seedStatus,
        })
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

  console.log(
    `Questions: ${created} created, ${reversioned} re-versioned, ${unchanged} unchanged.`,
  );

  /* --- daily facts -------------------------------------------------------- */
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
      status: seedStatus,
      verification_status: 'requires_review',
      sort_order: index,
    })),
    { onConflict: 'slug' },
  );
  if (factError) throw factError;

  console.log(`Daily facts: ${FACTS.length} up to date.`);

  const { count } = await db
    .from('question_versions')
    .select('id', { count: 'exact', head: true })
    .eq('is_current', true)
    .neq('verification_status', 'human_verified');

  console.log(
    `\nDone.\n\n` +
      (draftsOnly
        ? `  Questions were seeded as drafts awaiting review. Verify and publish\n` +
          `  them at /admin — until you do, training sessions will be empty.\n`
        : `  ${count ?? 0} published question(s) still await human verification.\n` +
          `  Sign them off at /admin before real learners use this.\n`),
  );
}

main().catch((error) => {
  console.error('\nSeed failed:', error);
  process.exit(1);
});
