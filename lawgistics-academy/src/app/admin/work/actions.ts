'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { checkCoach } from '@/lib/admin/guard';
import { createServiceClient } from '@/lib/supabase/service';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { WORK_FILE_TYPES, isTrustedWorkLink, workFileProblem } from '@/lib/work/links';
import type { AdminState } from '../actions';

/**
 * The coach's work board.
 *
 * The same reasoning as sessions: a coach posting work for their own juniors
 * is not writing content in the sense the rule cares about. Nothing here is
 * versioned, carries an answer key, or reaches the training engine. It is a
 * lawyer handing a junior something to do, under their own name, and marking
 * what comes back. Keeping the coach out would mean the person who supervises
 * these interns could not give them work.
 *
 * Two clients, and which one does what is the point. The file goes up
 * through the RLS-bound client, so the bucket's own policy (coaches write
 * under posts/, nobody else does) is load-bearing rather than decorative.
 * The row goes in through the service client after `checkCoach`, as a
 * session does.
 */

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const schema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  kind: z.enum(['task', 'material']),
  title: z.string().trim().min(3, 'Give it a title.').max(200),
  instructions: z.string().trim().max(5000).optional().or(z.literal('')),
  linkUrl: z.string().trim().max(2000).optional().or(z.literal('')),
  scope: z.enum(['one', 'everyone']),
  traineesOnly: z.boolean(),
  country: z.enum(['ALL', 'AU', 'MY']),
  dueOn: z.string().trim().regex(DAY_RE, 'Use the date picker').optional().or(z.literal('')),
  sessionId: z.string().uuid().optional().or(z.literal('')),
  homeworkDay: z.coerce.number().int().min(0).max(20),
  published: z.boolean(),
});

/** The name the coach gave the file, kept short and free of path characters. */
function cleanFileName(name: string): string {
  return name.replace(/[\\/]/g, ' ').trim().slice(0, 200) || 'Attached file';
}

export async function saveWorkPost(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const coachId = await checkCoach();
  if (!coachId) return { error: 'You are not signed in as a coach or administrator.' };

  const parsed = schema.safeParse({
    id: formData.get('id') ?? '',
    kind: formData.get('kind'),
    title: formData.get('title'),
    instructions: formData.get('instructions') ?? '',
    linkUrl: formData.get('linkUrl') ?? '',
    scope: formData.get('scope') ?? 'one',
    traineesOnly: formData.get('traineesOnly') === 'on',
    country: formData.get('country') ?? 'ALL',
    dueOn: formData.get('dueOn') ?? '',
    sessionId: formData.get('sessionId') ?? '',
    homeworkDay: formData.get('homeworkDay') || 0,
    published: formData.get('published') === 'on',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Something in the form is not valid.' };
  }

  const values = parsed.data;

  if (values.linkUrl && !isTrustedWorkLink(values.linkUrl)) {
    return {
      error:
        'That link cannot be used here. Share the file from Google Drive or Google Docs ' +
        'and paste that link: it should begin https://drive.google.com/ or https://docs.google.com/',
    };
  }

  // A file, if one was chosen. The post's id is settled before the upload so
  // the file can be stored under it.
  const id = values.id || crypto.randomUUID();
  const file = formData.get('file');
  let uploaded: { file_path: string; file_name: string } | null = null;

  if (file instanceof File && file.size > 0) {
    const problem = workFileProblem(file);
    if (problem) return { error: problem };

    const path = `posts/${id}/${crypto.randomUUID()}.${WORK_FILE_TYPES[file.type]}`;
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.storage
      .from('work')
      .upload(path, file, { contentType: file.type });
    if (error) return { error: 'The file could not be uploaded. Please try again.' };

    uploaded = { file_path: path, file_name: cleanFileName(file.name) };
  }

  const db = createServiceClient();

  // A material with nothing attached is nothing to read. A task may stand on
  // its instructions alone.
  if (values.kind === 'material' && !uploaded && !values.linkUrl) {
    let hasFile = false;
    if (values.id) {
      const { data } = await db.from('work_posts').select('file_path').eq('id', values.id).maybeSingle();
      hasFile = Boolean((data as { file_path: string | null } | null)?.file_path);
    }
    if (!hasFile) return { error: 'A material needs a file or a link.' };
  }

  const fields = {
    kind: values.kind,
    title: values.title,
    instructions: values.instructions ?? '',
    link_url: values.linkUrl || null,
    scope: values.scope,
    trainees_only: values.traineesOnly,
    country: values.country === 'ALL' ? null : values.country,
    due_on: values.dueOn || null,
    session_id: values.sessionId || null,
    homework_day: values.homeworkDay || null,
    published: values.published,
    ...(uploaded ?? {}),
  };

  if (values.id) {
    const { error } = await db.from('work_posts').update(fields).eq('id', values.id);
    if (error) return { error: 'That could not be saved.' };
  } else {
    // Whose post this is comes from the session, never from the form.
    const { error } = await db.from('work_posts').insert({ id, posted_by: coachId, ...fields });
    if (error) return { error: 'That could not be created.' };
  }

  revalidatePath('/admin/work');
  revalidatePath(`/admin/work/${id}`);
  revalidatePath('/work');
  revalidatePath(`/work/${id}`);
  revalidatePath('/dashboard');
  if (fields.session_id) revalidatePath('/sessions');
  if (fields.homework_day) revalidatePath('/homework');

  return { error: null, ok: values.published ? 'Put up.' : 'Saved as a draft.' };
}

const markSchema = z.object({
  id: z.string().uuid(),
  verdict: z.enum(['good', 'again']),
  feedback: z.string().trim().max(5000),
});

/**
 * Marking what was handed in.
 *
 * The trigger on the table keeps this to the marking columns and dates the
 * mark itself, so the only thing the coach can change about a submission is
 * what they thought of it. A mark can be changed, as a session can be
 * corrected: the record of what was handed in stays exactly as it was.
 */
export async function markSubmission(
  _state: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const coachId = await checkCoach();
  if (!coachId) return { error: 'You are not signed in as a coach or administrator.' };

  const parsed = markSchema.safeParse({
    id: formData.get('id'),
    verdict: formData.get('verdict'),
    feedback: formData.get('feedback') ?? '',
  });
  if (!parsed.success) return { error: 'Choose a verdict before saving.' };

  const db = createServiceClient();
  const { data, error } = await db
    .from('work_submissions')
    .update({
      verdict: parsed.data.verdict,
      feedback: parsed.data.feedback,
      marked_by: coachId,
    })
    .eq('id', parsed.data.id)
    .select('post_id')
    .maybeSingle();

  if (error) return { error: 'That could not be saved.' };

  const postId = (data as { post_id: string } | null)?.post_id;
  revalidatePath('/admin/work');
  revalidatePath('/work');
  revalidatePath('/dashboard');
  if (postId) {
    revalidatePath(`/admin/work/${postId}`);
    revalidatePath(`/work/${postId}`);
  }

  return { error: null, ok: 'Marked.' };
}
