'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkAdmin } from '@/lib/admin/guard';
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
  jurisdiction: z.enum([
    'AU_GENERAL',
    'CTH',
    'NSW',
    'VIC',
    'QLD',
    'WA',
    'SA',
    'TAS',
    'ACT',
    'NT',
  ]),
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
    .select('title, body, status')
    .eq('id', factId)
    .maybeSingle();

  const substantiveChange =
    current?.title !== parsed.data.title || current?.body !== parsed.data.body;

  const { error } = await db.from('daily_facts').update(toRow(parsed.data)).eq('id', factId);
  if (error) return { error: error.message };

  // Rewriting the substance means the sign-off no longer covers what is there.
  if (substantiveChange && current?.status === 'published') {
    await db
      .from('daily_facts')
      .update({ status: 'requires_review', verification_status: 'requires_review' })
      .eq('id', factId);
  }

  revalidatePath('/admin/facts');
  revalidatePath(`/admin/facts/${factId}`);
  revalidatePath('/dashboard');

  return {
    error: null,
    ok: substantiveChange && current?.status === 'published'
      ? 'Saved. The wording changed, so this fact has been unpublished and needs verifying again.'
      : 'Saved.',
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
    case 'verify':
      await db
        .from('daily_facts')
        .update({
          verification_status: 'human_verified',
          verified_by: adminId,
          verified_at: new Date().toISOString(),
          status: 'verified',
        })
        .eq('id', factId);
      break;

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
