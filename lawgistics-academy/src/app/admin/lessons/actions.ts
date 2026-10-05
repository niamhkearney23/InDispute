'use server';

import { revalidatePath } from 'next/cache';
import { checkCoach } from '@/lib/admin/guard';
import { lessonBySlug } from '@/content/seed/lessons';
import { lessonHash, signOff } from '@/lib/lessons/signoff';

export interface LessonSignOffState {
  error: string | null;
  ok?: string;
}

/**
 * Signing a lesson off: a lawyer saying every screen of it, as it stands, is
 * right. The form carries the fingerprint of the wording the page showed, so
 * a lesson changed after the page was opened is not signed off unread.
 */
export async function signOffLesson(
  _prev: LessonSignOffState,
  formData: FormData,
): Promise<LessonSignOffState> {
  const reviewerId = await checkCoach();
  if (!reviewerId) return { error: 'You are not signed in as a coach or administrator.' };
  if (formData.get('confirm') !== 'yes') {
    return { error: 'Tick the box to say you have read every screen.' };
  }
  const lesson = lessonBySlug(String(formData.get('slug') ?? ''));
  if (!lesson) return { error: 'That lesson could not be found.' };
  if (formData.get('hash') !== lessonHash(lesson)) {
    return {
      error: 'This lesson has changed since the page was opened. Reload it and read it again.',
    };
  }
  if (!(await signOff(lesson, reviewerId))) {
    return { error: 'That could not be saved. Please try again.' };
  }
  revalidatePath('/admin/lessons');
  revalidatePath(`/admin/lessons/${lesson.slug}`);
  revalidatePath(`/modules/${lesson.moduleSlug}`);
  return { error: null, ok: 'Signed off.' };
}
