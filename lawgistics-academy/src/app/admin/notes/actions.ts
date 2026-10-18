'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkCoach } from '@/lib/admin/guard';
import { createServiceClient } from '@/lib/supabase/service';
import { NOTE_MAX_LENGTH } from '@/lib/notes/rules';
import type { AdminState } from '../actions';

/**
 * Writing a morning note (0050): a few lines from the coach at the top of
 * Today, in the coach's own name.
 *
 * Like a session, this is the coach's own teaching rather than content: no
 * version, no answer key, no sign-off, never the training engine. The note is
 * always in the name of whoever is signed in, and only they may correct it;
 * the database holds both rules too, and refuses any delete.
 */

const schema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  body: z
    .string()
    .trim()
    .min(1, 'Write a line or two.')
    .max(NOTE_MAX_LENGTH, `Keep it under ${NOTE_MAX_LENGTH} characters: it is a note, not a lesson.`),
  forDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick the morning it is for.'),
  country: z.enum(['ALL', 'AU', 'MY']),
  traineesOnly: z.coerce.boolean(),
});

export async function saveMorningNote(_state: AdminState, formData: FormData): Promise<AdminState> {
  const coachId = await checkCoach();
  if (!coachId) return { error: 'You are not signed in as a coach or administrator.' };

  const parsed = schema.safeParse({
    id: formData.get('id') ?? '',
    body: formData.get('body'),
    forDate: formData.get('forDate'),
    country: formData.get('country'),
    traineesOnly: formData.get('traineesOnly') === 'on',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Something in the form is not valid.' };
  }
  const values = parsed.data;
  const fields = {
    body: values.body,
    for_date: values.forDate,
    country: values.country === 'ALL' ? null : values.country,
    // Who reads it is decided by the read policy and lib/notes/rules; this
    // records which audience the coach chose.
    trainees_only: values.traineesOnly,
  };

  const db = createServiceClient();
  if (values.id) {
    // Only the author corrects a note: words under a lawyer's name are theirs.
    const { data: existing } = await db
      .from('morning_notes')
      .select('author_id')
      .eq('id', values.id)
      .maybeSingle();
    if (!existing) return { error: 'That note could not be found.' };
    if (existing.author_id !== coachId) {
      return { error: 'Only the coach who wrote a note can change it. Write your own instead.' };
    }
    const { error } = await db.from('morning_notes').update(fields).eq('id', values.id);
    if (error) return { error: 'That could not be saved.' };
  } else {
    // Taken from the session, never from the form.
    const { error } = await db.from('morning_notes').insert({ ...fields, author_id: coachId });
    if (error) return { error: 'That could not be saved.' };
  }

  revalidatePath('/admin/notes');
  revalidatePath('/dashboard');
  return { error: null, ok: 'Saved. It shows at the top of Today on that morning.' };
}
