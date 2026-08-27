'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkCoach } from '@/lib/admin/guard';
import { createServiceClient } from '@/lib/supabase/service';
import { isEmbeddable } from '@/lib/lessons/embed';
import type { AdminState } from '../actions';

/**
 * Publishing the coach's own sessions.
 *
 * The one place in the product where a coach writes something learners read,
 * and it is deliberate. The rule that a coach may not write content is about
 * the question bank: versioned, immutable, carrying an answer key and a
 * sign-off somebody is answerable for. A session is the coach's own teaching,
 * under their own name, that nobody signs off because nobody else is standing
 * behind it. Keeping the coach out would leave the person who actually teaches
 * these juniors unable to teach them.
 *
 * The url is checked here and constrained in the database. An iframe src is
 * somebody else's page running inside ours, so the question is never whether a
 * link looks safe but whether we chose the host.
 */

const schema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  title: z.string().trim().min(3, 'Give it a title.').max(200),
  summary: z.string().trim().max(2000).optional().or(z.literal('')),
  url: z.string().trim().url('That is not a web address.'),
  country: z.enum(['ALL', 'AU', 'MY']),
  airsOn: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date picker')
    .optional()
    .or(z.literal('')),
  published: z.coerce.boolean(),
});

export async function saveSession(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const coachId = await checkCoach();
  if (!coachId) return { error: 'You are not signed in as a coach or administrator.' };

  const parsed = schema.safeParse({
    id: formData.get('id') ?? '',
    title: formData.get('title'),
    summary: formData.get('summary') ?? '',
    url: formData.get('url'),
    country: formData.get('country'),
    airsOn: formData.get('airsOn') ?? '',
    published: formData.get('published') === 'on',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Something in the form is not valid.' };
  }

  const values = parsed.data;

  if (!isEmbeddable(values.url)) {
    return {
      error:
        'That link cannot be played here. Upload to YouTube or Vimeo and paste the embed link: ' +
        'it should begin https://www.youtube-nocookie.com/embed/ or https://player.vimeo.com/video/',
    };
  }

  const fields = {
    title: values.title,
    summary: values.summary ?? '',
    url: values.url,
    country: values.country === 'ALL' ? null : values.country,
    airs_on: values.airsOn || null,
    published: values.published,
    // Taken from the session, never from the form. Whose teaching this is is the
    // one thing on the row that has to be true.
    published_by: values.published ? coachId : null,
  };

  const db = createServiceClient();

  if (values.id) {
    const { error } = await db.from('coach_sessions').update(fields).eq('id', values.id);
    if (error) return { error: 'That could not be saved.' };
  } else {
    const { error } = await db.from('coach_sessions').insert(fields);
    if (error) return { error: 'That could not be created.' };
  }

  revalidatePath('/admin/sessions');
  revalidatePath('/sessions');
  revalidatePath('/dashboard');
  return { error: null, ok: values.published ? 'Published.' : 'Saved as a draft.' };
}

/**
 * Taking one down.
 *
 * Unpublishing rather than deleting, and there is no delete at all. Somebody
 * watched it. A record that vanishes when somebody tidies up is not a record,
 * and "we covered that in a session" is worth nothing if the session can be
 * made never to have existed.
 */
export async function setPublished(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const coachId = await checkCoach();
  if (!coachId) return { error: 'You are not signed in as a coach or administrator.' };

  const id = String(formData.get('id') ?? '');
  const next = String(formData.get('published') ?? '') === 'true';
  if (!id) return { error: 'That session could not be found.' };

  const db = createServiceClient();
  const { error } = await db
    .from('coach_sessions')
    .update({ published: next, published_by: next ? coachId : null })
    .eq('id', id);

  if (error) return { error: 'That could not be changed.' };

  revalidatePath('/admin/sessions');
  revalidatePath('/sessions');
  revalidatePath('/dashboard');
  return { error: null, ok: next ? 'Published.' : 'Taken down.' };
}
