'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkAdmin } from '@/lib/admin/guard';
import { createServiceClient } from '@/lib/supabase/service';
import type { AdminState } from '../actions';

/**
 * Writing the firm's induction.
 *
 * The one rule that shapes all of this: content is versioned, never edited in
 * place. An acknowledgement points at a version, so editing the words somebody
 * acknowledged would silently change what they are recorded as having agreed
 * to. Saving different words supersedes the current version and puts the module
 * back in front of everyone, which is the correct and slightly inconvenient
 * behaviour. Saving the same words changes nothing, so fixing a typo in the
 * summary does not force the whole firm to re-acknowledge a policy.
 */

const schema = z.object({
  moduleId: z.string().uuid().optional().or(z.literal('')),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Use lower-case letters, numbers and hyphens only'),
  name: z.string().trim().min(2).max(200),
  summary: z.string().trim().max(400).optional().or(z.literal('')),
  kind: z.enum(['welcome', 'policy']),
  // 'ALL' is the default and the useful one. See the migration for why.
  country: z.enum(['ALL', 'AU', 'MY']),
  required: z.coerce.boolean(),
  position: z.coerce.number().int().min(0).max(99),
  published: z.coerce.boolean(),
  body: z.string().trim().min(20, 'There is not enough here to ask somebody to read it').max(40000),
});

export async function saveFirmModule(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'You are not signed in as an administrator.' };

  const parsed = schema.safeParse({
    moduleId: formData.get('moduleId') ?? '',
    slug: formData.get('slug'),
    name: formData.get('name'),
    summary: formData.get('summary') ?? '',
    kind: formData.get('kind'),
    country: formData.get('country'),
    required: formData.get('required') === 'on',
    position: formData.get('position') ?? 0,
    published: formData.get('published') === 'on',
    body: formData.get('body'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Something in the form is not valid.' };
  }

  const values = parsed.data;
  const db = createServiceClient();

  const fields = {
    slug: values.slug,
    name: values.name,
    summary: values.summary ?? '',
    kind: values.kind,
    country: values.country === 'ALL' ? null : values.country,
    required: values.required,
    position: values.position,
    published: values.published,
  };

  let moduleId = values.moduleId || null;

  if (moduleId) {
    const { error } = await db.from('firm_modules').update(fields).eq('id', moduleId);
    if (error) return { error: 'That could not be saved. Is the slug already in use?' };
  } else {
    const { data, error } = await db.from('firm_modules').insert(fields).select('id').single();
    if (error || !data) return { error: 'That could not be created. Is the slug already in use?' };
    moduleId = data.id as string;
  }

  const { data: current } = await db
    .from('firm_module_versions')
    .select('id, version, body')
    .eq('firm_module_id', moduleId)
    .eq('is_current', true)
    .maybeSingle();

  const unchanged = current && (current.body as string) === values.body;

  if (!unchanged) {
    // Stand the old version down first. The partial unique index allows exactly
    // one current version per module, so doing this the other way round fails.
    if (current) {
      await db.from('firm_module_versions').update({ is_current: false }).eq('id', current.id);
    }

    const { error } = await db.from('firm_module_versions').insert({
      firm_module_id: moduleId,
      version: current ? (current.version as number) + 1 : 1,
      body: values.body,
      is_current: true,
      created_by: adminId,
    });

    if (error) {
      // Put the previous version back rather than leaving the module with none,
      // which would take a published policy off every learner's screen.
      if (current) {
        await db.from('firm_module_versions').update({ is_current: true }).eq('id', current.id);
      }
      return { error: 'The content could not be saved. Nothing was changed.' };
    }
  }

  revalidatePath('/admin/firm');
  revalidatePath('/modules');
  redirect('/admin/firm');
}
