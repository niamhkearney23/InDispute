'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkAdmin } from '@/lib/admin/guard';
import { createServiceClient } from '@/lib/supabase/service';
import { JURISDICTION_COUNTRY, JURISDICTION_VALUES } from '@/lib/types';


export type AdminState = { error: string | null; ok?: string };

const optionSchema = z.object({
  id: z.string().trim().min(1).max(40),
  text: z.string().trim().min(1).max(600),
});

const questionSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Use lower-case letters, numbers and hyphens only'),
  domainId: z.string().uuid(),
  questionType: z.enum(['multiple_choice', 'true_false', 'scenario']),
  difficulty: z.coerce.number().int().min(1).max(5),
  jurisdiction: z.enum(JURISDICTION_VALUES),
  court: z.string().trim().max(200).optional().or(z.literal('')),
  scenario: z.string().trim().max(4000).optional().or(z.literal('')),
  stem: z.string().trim().min(5).max(2000),
  options: z.array(optionSchema).min(2).max(8),
  correctOptionIds: z.array(z.string()).min(1),
  explanation: z.string().trim().min(10).max(6000),
  whyItMatters: z.string().trim().max(4000).optional().or(z.literal('')),
  commonMisconception: z.string().trim().max(4000).optional().or(z.literal('')),
  memoryTrick: z.string().trim().max(2000).optional().or(z.literal('')),
  sourceReference: z.string().trim().max(500).optional().or(z.literal('')),
  sourceUrl: z.string().trim().url().max(1000).optional().or(z.literal('')),
  sourceCheckedOn: z.string().trim().optional().or(z.literal('')),
  conceptIds: z.array(z.string().uuid()).min(1, 'Link at least one concept'),
  skillIds: z.array(z.string().uuid()).min(1, 'Link at least one skill'),
});

function parseQuestionForm(formData: FormData) {
  let options: unknown = [];
  try {
    options = JSON.parse(String(formData.get('options') ?? '[]'));
  } catch {
    options = [];
  }

  return questionSchema.safeParse({
    slug: formData.get('slug'),
    domainId: formData.get('domainId'),
    questionType: formData.get('questionType'),
    difficulty: formData.get('difficulty'),
    jurisdiction: formData.get('jurisdiction'),
    court: formData.get('court') ?? '',
    scenario: formData.get('scenario') ?? '',
    stem: formData.get('stem'),
    options,
    correctOptionIds: formData.getAll('correctOptionIds').map(String),
    explanation: formData.get('explanation'),
    whyItMatters: formData.get('whyItMatters') ?? '',
    commonMisconception: formData.get('commonMisconception') ?? '',
    memoryTrick: formData.get('memoryTrick') ?? '',
    sourceReference: formData.get('sourceReference') ?? '',
    sourceUrl: formData.get('sourceUrl') ?? '',
    sourceCheckedOn: formData.get('sourceCheckedOn') ?? '',
    conceptIds: formData.getAll('conceptIds').map(String),
    skillIds: formData.getAll('skillIds').map(String),
  });
}

const empty = (value: string | undefined) => (value && value.length > 0 ? value : null);

/* -------------------------------------------------------------------------- */
/* Create                                                                     */
/* -------------------------------------------------------------------------- */

export async function createQuestion(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'Not authorised.' };

  const parsed = parseQuestionForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }

  const data = parsed.data;
  const optionIds = new Set(data.options.map((o) => o.id));
  if (!data.correctOptionIds.every((id) => optionIds.has(id))) {
    return { error: 'The correct answer must be one of the options.' };
  }
  if (data.correctOptionIds.length === data.options.length) {
    return { error: 'Every option cannot be correct.' };
  }

  const db = createServiceClient();

  const { data: question, error } = await db
    .from('questions')
    .insert({
      slug: data.slug,
      domain_id: data.domainId,
      // Derived from the jurisdiction rather than asked for separately, so the
      // two can never disagree. A question tagged MY_FEDERAL but filed as
      // Australian would be served to the wrong learners.
      country: JURISDICTION_COUNTRY[data.jurisdiction],
      // New questions always start as drafts. Nothing reaches a learner without
      // passing through the verification workflow.
      status: 'draft',
      created_by: adminId,
    })
    .select('id')
    .single();

  if (error || !question) {
    return {
      error: error?.message.includes('duplicate')
        ? 'That slug is already in use.'
        : (error?.message ?? 'Could not create the question.'),
    };
  }

  const versionError = await insertVersion(question.id, 1, data, adminId);
  if (versionError) {
    await db.from('questions').delete().eq('id', question.id);
    return { error: versionError };
  }

  const linkError = await replaceLinks(question.id, data.conceptIds, data.skillIds);
  if (linkError) return { error: linkError };

  revalidatePath('/admin');
  redirect(`/admin/questions/${question.id}?created=1`);
}

/* -------------------------------------------------------------------------- */
/* Update: mints a new version when content changed                          */
/* -------------------------------------------------------------------------- */

export async function updateQuestion(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'Not authorised.' };

  const questionId = String(formData.get('questionId') ?? '');
  if (!z.string().uuid().safeParse(questionId).success) {
    return { error: 'Unknown question.' };
  }

  const parsed = parseQuestionForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }

  const data = parsed.data;
  const optionIds = new Set(data.options.map((o) => o.id));
  if (!data.correctOptionIds.every((id) => optionIds.has(id))) {
    return { error: 'The correct answer must be one of the options.' };
  }

  const db = createServiceClient();

  const { data: current } = await db
    .from('question_versions')
    .select('id, version, question_type, scenario, stem, options, correct_option_ids, jurisdiction')
    .eq('question_id', questionId)
    .eq('is_current', true)
    .maybeSingle();

  if (!current) return { error: 'This question has no current version.' };

  const contentChanged =
    current.question_type !== data.questionType ||
    (current.scenario ?? '') !== (data.scenario ?? '') ||
    current.stem !== data.stem ||
    JSON.stringify(current.options) !== JSON.stringify(data.options) ||
    JSON.stringify([...current.correct_option_ids].sort()) !==
      JSON.stringify([...data.correctOptionIds].sort()) ||
    current.jurisdiction !== data.jurisdiction;

  await db
    .from('questions')
    .update({
      domain_id: data.domainId,
      country: JURISDICTION_COUNTRY[data.jurisdiction],
    })
    .eq('id', questionId);

  const linkError = await replaceLinks(questionId, data.conceptIds, data.skillIds);
  if (linkError) return { error: linkError };

  if (!contentChanged) {
    // Explanatory text and provenance may be corrected on the existing version;
    // the immutability trigger only guards what the learner was actually asked.
    const { error } = await db
      .from('question_versions')
      .update({
        explanation: data.explanation,
        why_it_matters: empty(data.whyItMatters),
        common_misconception: empty(data.commonMisconception),
        memory_trick: empty(data.memoryTrick),
        difficulty: data.difficulty,
        court: empty(data.court),
        source_reference: empty(data.sourceReference),
        source_url: empty(data.sourceUrl),
        source_checked_on: empty(data.sourceCheckedOn),
      })
      .eq('id', current.id);

    if (error) return { error: error.message };

    revalidatePath(`/admin/questions/${questionId}`);
    return { error: null, ok: 'Saved. The question text was unchanged, so no new version was needed.' };
  }

  // Content changed: retire the current version and mint a new one. Attempts
  // already recorded keep pointing at the version the learner actually saw.
  const { error: retireError } = await db
    .from('question_versions')
    .update({ is_current: false })
    .eq('id', current.id);
  if (retireError) return { error: retireError.message };

  const versionError = await insertVersion(
    questionId,
    (current.version as number) + 1,
    data,
    adminId,
  );

  if (versionError) {
    await db.from('question_versions').update({ is_current: true }).eq('id', current.id);
    return { error: versionError };
  }

  // A rewritten question is unverified again, whatever it was before.
  await db
    .from('questions')
    .update({ status: 'requires_review' })
    .eq('id', questionId)
    .eq('status', 'published');

  revalidatePath(`/admin/questions/${questionId}`);
  revalidatePath('/admin');
  return {
    error: null,
    ok: `Version ${(current.version as number) + 1} created. The question needs verifying again before it can be published.`,
  };
}

async function insertVersion(
  questionId: string,
  version: number,
  data: z.infer<typeof questionSchema>,
  adminId: string,
): Promise<string | null> {
  const db = createServiceClient();

  const { error } = await db.from('question_versions').insert({
    question_id: questionId,
    version,
    is_current: true,
    question_type: data.questionType,
    scenario: empty(data.scenario),
    stem: data.stem,
    options: data.options,
    correct_option_ids: data.correctOptionIds,
    explanation: data.explanation,
    why_it_matters: empty(data.whyItMatters),
    common_misconception: empty(data.commonMisconception),
    memory_trick: empty(data.memoryTrick),
    difficulty: data.difficulty,
    jurisdiction: data.jurisdiction,
    court: empty(data.court),
    source_reference: empty(data.sourceReference),
    source_url: empty(data.sourceUrl),
    source_checked_on: empty(data.sourceCheckedOn),
    verification_status: 'requires_review',
    created_by: adminId,
  });

  return error ? error.message : null;
}

async function replaceLinks(
  questionId: string,
  conceptIds: string[],
  skillIds: string[],
): Promise<string | null> {
  const db = createServiceClient();

  await db.from('question_concepts').delete().eq('question_id', questionId);
  await db.from('question_skills').delete().eq('question_id', questionId);

  const { error: conceptError } = await db
    .from('question_concepts')
    .insert(conceptIds.map((id) => ({ question_id: questionId, concept_id: id })));
  if (conceptError) return conceptError.message;

  const { error: skillError } = await db
    .from('question_skills')
    .insert(skillIds.map((id) => ({ question_id: questionId, skill_id: id })));
  if (skillError) return skillError.message;

  return null;
}

/* -------------------------------------------------------------------------- */
/* Workflow transitions                                                       */
/* -------------------------------------------------------------------------- */

const transitionSchema = z.object({
  questionId: z.string().uuid(),
  action: z.enum(['submit_for_review', 'verify', 'publish', 'retire', 'unpublish']),
});

export async function transitionQuestion(formData: FormData): Promise<void> {
  const adminId = await checkAdmin();
  if (!adminId) redirect('/dashboard');

  const parsed = transitionSchema.safeParse({
    questionId: formData.get('questionId'),
    action: formData.get('action'),
  });
  if (!parsed.success) redirect('/admin');

  const db = createServiceClient();
  const { questionId, action } = parsed.data;

  const { data: question } = await db
    .from('questions')
    .select('id, status')
    .eq('id', questionId)
    .maybeSingle();
  if (!question) redirect('/admin');

  switch (action) {
    case 'submit_for_review':
      await db.from('questions').update({ status: 'requires_review' }).eq('id', questionId);
      break;

    case 'verify': {
      // Verification is a statement by a person that the legal content is
      // correct. It is recorded against the version, not the question, so a
      // later rewrite cannot inherit someone else's sign-off.
      await db
        .from('question_versions')
        .update({
          verification_status: 'human_verified',
          verified_by: adminId,
          verified_at: new Date().toISOString(),
        })
        .eq('question_id', questionId)
        .eq('is_current', true);

      await db.from('questions').update({ status: 'verified' }).eq('id', questionId);
      break;
    }

    case 'publish': {
      const { data: version } = await db
        .from('question_versions')
        .select('verification_status')
        .eq('question_id', questionId)
        .eq('is_current', true)
        .maybeSingle();

      // The one rule that must not be bypassable from the UI.
      if (version?.verification_status !== 'human_verified') {
        redirect(`/admin/questions/${questionId}?error=verify_first`);
      }

      await db.from('questions').update({ status: 'published' }).eq('id', questionId);
      break;
    }

    case 'unpublish':
      await db.from('questions').update({ status: 'verified' }).eq('id', questionId);
      break;

    case 'retire':
      await db
        .from('questions')
        .update({ status: 'retired', retired_at: new Date().toISOString() })
        .eq('id', questionId);
      break;
  }

  revalidatePath('/admin');
  revalidatePath(`/admin/questions/${questionId}`);
  redirect(`/admin/questions/${questionId}`);
}
