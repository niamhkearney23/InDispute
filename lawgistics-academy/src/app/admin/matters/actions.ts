'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { checkAdmin, checkReviewer } from '@/lib/admin/guard';
import { createServiceClient } from '@/lib/supabase/service';
import type { AdminState } from '../actions';

/**
 * Matters, from the staff side.
 *
 * Writing a matter is an administrator's job, as writing a question is, and
 * whoever last changed what a matter says is recorded as its author, so they
 * cannot then sign their own wording off. Signing off and flagging are a
 * coach's. Publishing is an administrator's, and the database refuses it for
 * anything not signed off. Marking an attempt is a coach's.
 */

function revalidateMatter(id?: string) {
  revalidatePath('/admin/matters');
  if (id) revalidatePath(`/admin/matters/${id}`);
  revalidatePath('/matters');
  if (id) revalidatePath(`/matters/${id}`);
}

const matterSchema = z.object({
  id: z.string().uuid().optional().or(z.literal('')),
  number: z.coerce.number().int().min(1).max(999),
  title: z.string().trim().min(3, 'Give it a title.').max(200),
  country: z.enum(['MY', 'AU']),
  area: z.string().trim().max(80),
  brief: z.string().trim().min(20, 'Write the facts.').max(6000),
  timeLimitMinutes: z.coerce.number().int().min(5).max(240),
  procedurePrompt: z.string().trim().min(5).max(500),
  draftPrompt: z.string().trim().min(5).max(500),
  speakPrompt: z.string().trim().min(5).max(500),
  modelAnswer: z.string().trim().min(20, 'Write how a lawyer would approach it.').max(12000),
  sources: z.string().trim().max(2000),
});

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'matter'
  );
}

export async function saveMatter(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'Only an administrator can write a matter.' };

  const parsed = matterSchema.safeParse({
    id: formData.get('id') ?? '',
    number: formData.get('number'),
    title: formData.get('title'),
    country: formData.get('country'),
    area: formData.get('area') ?? '',
    brief: formData.get('brief'),
    timeLimitMinutes: formData.get('timeLimitMinutes'),
    procedurePrompt: formData.get('procedurePrompt'),
    draftPrompt: formData.get('draftPrompt'),
    speakPrompt: formData.get('speakPrompt'),
    modelAnswer: formData.get('modelAnswer'),
    sources: formData.get('sources') ?? '',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Something in the form is not valid.' };
  }
  const v = parsed.data;
  const fields = {
    number: v.number,
    title: v.title,
    country: v.country,
    area: v.area,
    brief: v.brief,
    time_limit_minutes: v.timeLimitMinutes,
    procedure_prompt: v.procedurePrompt,
    draft_prompt: v.draftPrompt,
    speak_prompt: v.speakPrompt,
    model_answer: v.modelAnswer,
    sources: v.sources,
  };

  const db = createServiceClient();
  if (v.id) {
    const { data: before } = await db
      .from('matters')
      .select(
        'title, country, area, brief, time_limit_minutes, procedure_prompt, draft_prompt, speak_prompt, model_answer, sources',
      )
      .eq('id', v.id)
      .maybeSingle();
    if (!before) return { error: 'That matter could not be found.' };
    const changed = (Object.keys(before) as Array<keyof typeof before>).some(
      (key) => before[key] !== (fields as Record<string, unknown>)[key],
    );
    // Whoever changes the words is their author now, so the sign-off that the
    // database clears has to come from somebody else.
    const { error } = await db
      .from('matters')
      .update(changed ? { ...fields, created_by: adminId } : fields)
      .eq('id', v.id);
    if (error) return { error: 'That could not be saved.' };
    revalidateMatter(v.id);
    return {
      error: null,
      ok: changed
        ? 'Saved. It needs signing off again, by somebody other than you, before it can go up.'
        : 'Saved.',
    };
  }

  const { data, error } = await db
    .from('matters')
    .insert({ ...fields, slug: `${slugify(v.title)}-${Date.now().toString(36)}`, created_by: adminId })
    .select('id')
    .single();
  if (error || !data) return { error: 'That could not be created.' };
  revalidateMatter();
  redirect(`/admin/matters/${data.id}`);
}

const decisionSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(['verify', 'flag']),
  note: z.string().trim().max(2000),
});

/**
 * Signing a matter off, or flagging it. A coach's decision under their own
 * name. A flag needs a note, because a flag without one is a dead end, and
 * it takes the matter down.
 */
export async function decideMatter(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const coachId = await checkReviewer();
  if (!coachId) return { error: 'Not authorised.' };

  const parsed = decisionSchema.safeParse({
    id: formData.get('id'),
    decision: formData.get('decision'),
    note: formData.get('note') ?? '',
  });
  if (!parsed.success) return { error: 'That decision could not be read.' };
  const { id, decision, note } = parsed.data;
  if (decision === 'flag' && !note) return { error: 'Say what is wrong with it.' };

  const db = createServiceClient();
  const { data: matter } = await db
    .from('matters')
    .select('created_by, updated_at')
    .eq('id', id)
    .maybeSingle();
  if (!matter) return { error: 'That matter could not be found.' };
  if (decision === 'verify' && matter.created_by === coachId) {
    return { error: 'You wrote this, so somebody else has to sign it off.' };
  }
  // A decision is about the words on the screen. If they changed since the
  // page was opened, the coach reads them again first.
  if (formData.get('updatedAt') && formData.get('updatedAt') !== matter.updated_at) {
    return { error: 'This matter was changed while you had it open. Reload the page to read it again.' };
  }

  const now = new Date().toISOString();
  const patch =
    decision === 'verify'
      ? {
          verified_by: coachId,
          review_flagged: false,
          review_note: note,
          reviewed_by: coachId,
          reviewed_at: now,
        }
      : {
          verified_by: null,
          review_flagged: true,
          review_note: note,
          reviewed_by: coachId,
          reviewed_at: now,
        };
  const { error } = await db.from('matters').update(patch).eq('id', id);
  if (error) return { error: 'That decision could not be saved.' };
  revalidateMatter(id);
  return { error: null, ok: decision === 'verify' ? 'Signed off.' : 'Flagged and taken down.' };
}

/** Putting a matter up, or taking it down. The database refuses it unchecked. */
export async function setMatterPublished(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const adminId = await checkAdmin();
  if (!adminId) return { error: 'Only an administrator can publish a matter.' };

  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!id.success) return { error: 'That matter could not be found.' };
  const publish = formData.get('published') === 'true';

  const { error } = await createServiceClient()
    .from('matters')
    .update({ published: publish })
    .eq('id', id.data);
  if (error) {
    return { error: publish ? 'It has to be signed off, and not flagged, before it can go up.' : 'That could not be saved.' };
  }
  revalidateMatter(id.data);
  return { error: null, ok: publish ? 'Published.' : 'Taken down.' };
}

const markSchema = z.object({
  attemptId: z.string().uuid(),
  verdict: z.enum(['good', 'again']),
  feedback: z.string().trim().max(4000),
});

/** A lawyer's mark on a handed-in attempt: a verdict and a paragraph. */
export async function markMatterAttempt(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const coachId = await checkReviewer();
  if (!coachId) return { error: 'Not authorised.' };

  const parsed = markSchema.safeParse({
    attemptId: formData.get('attemptId'),
    verdict: formData.get('verdict'),
    feedback: formData.get('feedback') ?? '',
  });
  if (!parsed.success) return { error: 'Choose Good or Needs another go.' };

  const db = createServiceClient();
  const { data, error } = await db
    .from('matter_attempts')
    .update({
      verdict: parsed.data.verdict,
      feedback: parsed.data.feedback,
      marked_by: coachId,
    })
    .eq('id', parsed.data.attemptId)
    .not('submitted_at', 'is', null)
    .select('matter_id')
    .maybeSingle();
  if (error || !data) return { error: 'Only an attempt that has been handed in can be marked.' };
  revalidateMatter(data.matter_id as string);
  revalidatePath('/certificate');
  revalidatePath('/dashboard');
  return { error: null, ok: 'Marked.' };
}
