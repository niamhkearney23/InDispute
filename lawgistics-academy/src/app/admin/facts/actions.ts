'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkAdmin } from '@/lib/admin/guard';
import { JURISDICTION_COUNTRY, JURISDICTION_VALUES } from '@/lib/types';
import { createServiceClient } from '@/lib/supabase/service';
import type { AdminState } from '../actions';

const factSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Use lower-case letters, numbers and hyphens only'),
  title: z.string().trim().min(10).max(300),
  body: z.string().trim().min(60).max(3000),
  whyItMatters: z.string().trim().max(2000).optional().or(z.literal('')),
  jurisdiction: z.enum(JURISDICTION_VALUES),
  court: z.string().trim().max(200).optional().or(z.literal('')),
  domainId: z.string().uuid().optional().or(z.literal('')),
  sourceReference: z.string().trim().max(500).optional().or(z.literal('')),
  sourceUrl: z.string().trim().url().max(1000).optional().or(z.literal('')),
  sourceCheckedOn: z.string().trim().optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().min(0).max(100000),
});

const empty = (value: string | undefined) => (value && value.length > 0 ? value : null);

function parseForm(formData: FormData) {
  return factSchema.safeParse({
    slug: formData.get('slug'),
    title: formData.get('title'),
    body: formData.get('body'),
    whyItMatters: formData.get('whyItMatters') ?? '',
    jurisdiction: formData.get('jurisdiction'),
    court: formData.get('court') ?? '',
    domainId: formData.get('domainId') ?? '',
    sourceReference: formData.get('sourceReference') ?? '',
    sourceUrl: formData.get('sourceUrl') ?? '',
    sourceCheckedOn: formData.get('sourceCheckedOn') ?? '',
    sortOrder: formData.get('sortOrder') || 0,
  });
}

function toRow(data: z.infer<typeof factSchema>) {
  return {
    slug: data.slug,
    title: data.title,
    body: data.body,
    why_it_matters: empty(data.whyItMatters),
    jurisdiction: data.jurisdiction,
    // Derived, never asked for separately, so the two cannot disagree.
    country: JURISDICTION_COUNTRY[data.jurisdiction],
    court: empty(data.court),
    domain_id: empty(data.domainId),
    source_reference: empty(data.sourceReference),
    source_url: empty(data.sourceUrl),
    source_checked_on: empty(data.sourceCheckedOn),
    sort_order: data.sortOrder,
  };
}

export async function createFact(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'Not authorised.' };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from('daily_facts')
    .insert({ ...toRow(parsed.data), status: 'draft', created_by: adminId })
    .select('id')
    .single();

  if (error || !data) {
    return {
      error: error?.message.includes('duplicate')
        ? 'That slug is already in use.'
        : (error?.message ?? 'Could not create the fact.'),
    };
  }

  revalidatePath('/admin/facts');
  redirect(`/admin/facts/${data.id}`);
}

export async function updateFact(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'Not authorised.' };

  const factId = String(formData.get('factId') ?? '');
  if (!z.string().uuid().safeParse(factId).success) return { error: 'Unknown fact.' };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' };
  }

  const db = createServiceClient();

  const { data: current } = await db
    .from('daily_facts')
    .select('title, body, status, jurisdiction')
    .eq('id', factId)
    .maybeSingle();

  // A new jurisdiction is a substantive change too: the sign-off said these
  // words are right for one place, and the country (which follows from the
  // jurisdiction) decides whose daily brief the fact goes into.
  const substantiveChange =
    current?.title !== parsed.data.title ||
    current?.body !== parsed.data.body ||
    current?.jurisdiction !== parsed.data.jurisdiction;

  // Rewriting the substance means the sign-off no longer covers what is there,
  // whether or not it had been published yet: a fact signed off and then
  // reworded before publishing would otherwise go out under the old sign-off.
  // The new words and the cleared sign-off go in one update (as two, the new
  // words sat for a moment, or for good if the second failed, under the old
  // sign-off), and whoever rewrote it becomes its writer, so they cannot then
  // sign it off themselves.
  const { error } = await db
    .from('daily_facts')
    .update({
      ...toRow(parsed.data),
      ...(substantiveChange
        ? {
            created_by: adminId,
            verification_status: 'requires_review',
            verified_by: null,
            verified_at: null,
            review_due_on: null,
            ...(current?.status === 'published' ? { status: 'requires_review' } : {}),
          }
        : {}),
    })
    .eq('id', factId);
  if (error) return { error: error.message };

  revalidatePath('/admin/facts');
  revalidatePath(`/admin/facts/${factId}`);
  revalidatePath('/dashboard');

  return {
    error: null,
    ok: !substantiveChange
      ? 'Saved.'
      : current?.status === 'published'
        ? 'Saved. The wording or jurisdiction changed, so this fact has been unpublished and needs verifying again.'
        : 'Saved. The wording or jurisdiction changed, so it needs verifying again.',
  };
}

const transitionSchema = z.object({
  factId: z.string().uuid(),
  action: z.enum(['verify', 'publish', 'unpublish', 'retire']),
});

export async function transitionFact(formData: FormData): Promise<void> {
  const adminId = await checkAdmin();
  if (!adminId) redirect('/dashboard');

  const parsed = transitionSchema.safeParse({
    factId: formData.get('factId'),
    action: formData.get('action'),
  });
  if (!parsed.success) redirect('/admin/facts');

  const db = createServiceClient();
  const { factId, action } = parsed.data;

  switch (action) {
    case 'verify': {
      const { data: fact } = await db
        .from('daily_facts')
        .select('created_by')
        .eq('id', factId)
        .maybeSingle();
      if (fact?.created_by && fact.created_by === adminId) {
        redirect(`/admin/facts/${factId}?error=own_version`);
      }
      const { error: verifyError } = await db
        .from('daily_facts')
        .update({
          verification_status: 'human_verified',
          verified_by: adminId,
          verified_at: new Date().toISOString(),
          status: 'verified',
        })
        .eq('id', factId);
      if (verifyError) redirect(`/admin/facts/${factId}?error=not_saved`);
      break;
    }

    case 'publish': {
      const { data: fact } = await db
        .from('daily_facts')
        .select('verification_status')
        .eq('id', factId)
        .maybeSingle();

      // Same rule as questions: no publishing without a person's sign-off.
      if (fact?.verification_status !== 'human_verified') {
        redirect(`/admin/facts/${factId}?error=verify_first`);
      }

      await db.from('daily_facts').update({ status: 'published' }).eq('id', factId);
      break;
    }

    case 'unpublish':
      await db.from('daily_facts').update({ status: 'verified' }).eq('id', factId);
      break;

    case 'retire':
      await db.from('daily_facts').update({ status: 'retired' }).eq('id', factId);
      break;
  }

  revalidatePath('/admin/facts');
  revalidatePath('/dashboard');
  redirect(`/admin/facts/${factId}`);
}
