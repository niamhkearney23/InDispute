'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { hasAccess } from '@/lib/access/service';
import { getLearnerProfile } from '@/lib/learner-overview';
import { asCountry } from '@/lib/types';
import { studioExerciseFor, studioExercisesFor, viewerIsStaff } from '@/lib/content/service';
import { getProvider } from '@/lib/ai/provider';
import { assess, AssessmentFailed } from '@/lib/studio/assess';
import { latestConsent, ownAttempt } from '@/lib/studio/service';
import { transcribe, transcriptionAvailable } from '@/lib/studio/transcribe';
import {
  NOTICE_VERSION,
  PROCESSING_STALE_MS,
  STUDIO_BUCKET,
  STUDIO_MAX_BYTES,
  bareMime,
  extensionFor,
  mayRecord,
  mayRequestFeedback,
  recordingPath,
  type AttemptStatus,
} from '@/lib/studio/rules';

/**
 * The Advocacy Studio's actions (0053). Each asks who is signed in first,
 * then whether they may train, then whether the thing they name is theirs.
 * Nothing here trusts the browser for who the learner is, which exercise
 * wording they were given, or where a file goes.
 */

/** Practice attempts a person may start in a day: enough for any honest use, a stop on a loop. */
const ATTEMPTS_PER_DAY = 40;

export interface ConsentState {
  error: string | null;
  ok: boolean;
}

export async function recordStudioConsent(_prev: ConsentState, formData: FormData): Promise<ConsentState> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.', ok: false };
  if (!(await hasAccess(user.id))) return { error: 'Your access to the academy has ended.', ok: false };

  const recording = formData.get('recording') === 'on';
  const aiProcessing = recording && formData.get('aiProcessing') === 'on';
  const trainerSharing = recording && formData.get('trainerSharing') === 'on';
  const { error } = await createServiceClient().from('studio_consents').insert({
    user_id: user.id,
    notice_version: NOTICE_VERSION,
    recording,
    ai_processing: aiProcessing,
    trainer_sharing: trainerSharing,
  });
  if (error) return { error: 'Your choice could not be saved. Please try again.', ok: false };
  revalidatePath('/studio');
  return { error: null, ok: true };
}

const startSchema = z.object({
  exerciseSlug: z.string().regex(/^[a-z0-9-]{1,80}$/),
  kind: z.enum(['video', 'audio']),
  mime: z.string().max(80),
  seconds: z.number().int().min(1).max(600),
  bytes: z.number().int().min(1).max(STUDIO_MAX_BYTES),
});

export type StartResult =
  | { error: string }
  | { attemptId: string; path: string; token: string };

/**
 * Makes the attempt and a link to upload exactly one file to exactly its
 * place. The browser then sends the recording straight to storage, so its
 * size is not held to the website's 4.5 MB request limit.
 */
export async function startStudioAttempt(input: z.input<typeof startSchema>): Promise<StartResult> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };
  if (!(await hasAccess(user.id))) return { error: 'Your access to the academy has ended.' };
  const parsed = startSchema.safeParse(input);
  if (!parsed.success) return { error: 'That recording could not be read.' };
  const { exerciseSlug, kind, seconds, bytes } = parsed.data;
  const mime = bareMime(parsed.data.mime);
  if (!mime.startsWith(`${kind}/`) || !extensionFor(mime)) {
    return { error: 'That recording format is not one the Studio keeps. Try another browser.' };
  }

  const consent = await latestConsent(user.id);
  if (!mayRecord(consent)) return { error: 'Agree to recording on the Studio page first.' };

  const profile = await getLearnerProfile(user.id);
  if (!profile) return { error: 'Your profile could not be found.' };
  const shown = await studioExerciseFor(exerciseSlug, asCountry(profile.country), await viewerIsStaff(user.id));
  if (!shown) return { error: 'That exercise is not available.' };
  if (seconds > shown.exercise.maxSeconds + 2) return { error: 'That recording is longer than the exercise allows.' };

  const db = createServiceClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await db
    .from('studio_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('started_at', since);
  if (count === null || count >= ATTEMPTS_PER_DAY) {
    return { error: 'That is as many recordings as one day allows. Try again tomorrow.' };
  }

  const attemptId = crypto.randomUUID();
  const path = recordingPath(user.id, attemptId, mime)!;
  const { error } = await db.from('studio_attempts').insert({
    id: attemptId,
    user_id: user.id,
    exercise_key: shown.exercise.slug,
    exercise_hash: shown.hash,
    recording_kind: kind,
    recording_path: path,
    recording_mime: mime,
    recording_seconds: seconds,
    recording_bytes: bytes,
    ai_processing: consent!.aiProcessing,
    shared_with_trainer: consent!.trainerSharing,
  });
  if (error) {
    console.error('[studio] attempt could not be made', error);
    return { error: 'The recording could not be started. Please try again.' };
  }
  const { data: link, error: linkError } = await db.storage.from(STUDIO_BUCKET).createSignedUploadUrl(path);
  if (linkError || !link) {
    console.error('[studio] upload link could not be made', linkError);
    return { error: 'The upload could not be prepared. Please try again.' };
  }
  return { attemptId, path, token: link.token };
}

const idSchema = z.string().uuid();

/** After the browser's upload: checks the file is really there, and its size, before anything uses it. */
export async function confirmStudioUpload(attemptId: string): Promise<{ error: string } | { ok: true }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };
  if (!idSchema.safeParse(attemptId).success) return { error: 'That recording could not be found.' };
  const attempt = await ownAttempt(user.id, attemptId);
  if (!attempt || !attempt.path) return { error: 'That recording could not be found.' };
  if (attempt.status !== 'awaiting_upload') return { ok: true };

  const db = createServiceClient();
  const { data: files } = await db.storage.from(STUDIO_BUCKET).list(`${user.id}/${attempt.id}`);
  const name = attempt.path.split('/').pop();
  const file = (files ?? []).find((f) => f.name === name);
  const size = Number((file?.metadata as { size?: number } | undefined)?.size ?? 0);
  if (!file || size <= 0) return { error: 'The recording did not arrive. Please try again.' };
  if (size > STUDIO_MAX_BYTES) return { error: 'That recording is too large.' };

  const { error } = await db
    .from('studio_attempts')
    .update({ status: 'uploaded', uploaded_at: new Date().toISOString(), recording_bytes: size })
    .eq('id', attempt.id)
    .eq('user_id', user.id)
    .eq('status', 'awaiting_upload');
  if (error) return { error: 'The recording could not be saved. Please try again.' };
  revalidatePath('/studio');
  return { ok: true };
}

export type FeedbackResult = { error: string } | { status: AttemptStatus };

/**
 * Transcribes the recording and asks for feedback, as one claimed job:
 * only one request at a time works on an attempt, a transcript once made is
 * kept and reused on a retry, and a failure is recorded with what it was so
 * the learner can try again. Nothing is made up when a step is unavailable.
 */
export async function requestStudioFeedback(attemptId: string): Promise<FeedbackResult> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };
  if (!(await hasAccess(user.id))) return { error: 'Your access to the academy has ended.' };
  if (!idSchema.safeParse(attemptId).success) return { error: 'That recording could not be found.' };
  const attempt = await ownAttempt(user.id, attemptId);
  if (!attempt || !attempt.path) return { error: 'That recording could not be found.' };
  if (!attempt.aiProcessing) {
    return { error: 'You did not agree to AI feedback for this recording. A coach can still review it if you share it.' };
  }
  const stale =
    attempt.status === 'processing' &&
    (!attempt.processingStartedAt || Date.now() - Date.parse(attempt.processingStartedAt) > PROCESSING_STALE_MS);
  if (!mayRequestFeedback(attempt.status) && !stale) {
    return attempt.status === 'processing' ? { status: 'processing' } : { error: 'That recording is not ready for feedback.' };
  }

  const db = createServiceClient();
  const provider = getProvider();
  if (!transcriptionAvailable() || !provider) {
    await db.from('studio_attempts').update({ status: 'not_configured' }).eq('id', attempt.id).eq('user_id', user.id);
    revalidatePath(`/studio/attempts/${attempt.id}`);
    return { status: 'not_configured' };
  }

  // The exercise as it was given, still signed off in that wording.
  const profile = await getLearnerProfile(user.id);
  const country = asCountry(profile?.country);
  const staff = await viewerIsStaff(user.id);
  const shown = await studioExerciseFor(attempt.exerciseKey, country, staff);
  if (!shown || shown.hash !== attempt.exerciseHash) {
    return { error: 'This exercise has changed or been withdrawn since you recorded. Record it again for feedback.' };
  }

  const startedAt = Date.now();
  const { data: claimed } = await db
    .from('studio_attempts')
    .update({ status: 'processing', processing_started_at: new Date(startedAt).toISOString(), failure: null })
    .eq('id', attempt.id)
    .eq('user_id', user.id)
    .eq('status', attempt.status)
    .select('id');
  if (!claimed || claimed.length === 0) return { status: 'processing' };

  const fail = async (failure: string, timings: Record<string, number>) => {
    await db
      .from('studio_attempts')
      .update({ status: 'failed', failure, timings: { ...timings, total_ms: Date.now() - startedAt } })
      .eq('id', attempt.id);
    revalidatePath(`/studio/attempts/${attempt.id}`);
    return { status: 'failed' as const };
  };

  const timings: Record<string, number> = {};
  let transcript = attempt.transcript;
  let segments = attempt.segments;
  if (transcript === null) {
    const t0 = Date.now();
    try {
      const { data: file, error } = await db.storage.from(STUDIO_BUCKET).download(attempt.path);
      if (error || !file) return fail('The recording could not be read back from storage.', timings);
      const result = await transcribe(file, attempt.path.split('/').pop()!);
      timings.transcription_ms = Date.now() - t0;
      if (!result.text) return fail('No speech was heard in the recording.', timings);
      transcript = result.text;
      segments = result.segments;
      const { error: saveError } = await db
        .from('studio_attempts')
        .update({ transcript, transcript_segments: segments, transcript_model: result.model })
        .eq('id', attempt.id);
      if (saveError) return fail('The transcript could not be saved.', timings);
    } catch (e) {
      console.error('[studio] transcription failed', e);
      return fail('The recording could not be transcribed just now.', timings);
    }
  }

  const options = (await studioExercisesFor(country, false)).map((o) => ({
    slug: o.exercise.slug,
    title: o.exercise.title,
  }));
  const t1 = Date.now();
  try {
    const feedback = await assess({
      provider,
      exercise: shown.exercise,
      transcript,
      segments,
      recordingSeconds: attempt.seconds ?? 0,
      nextOptions: options,
      startedAt,
    });
    timings.assessment_ms = Date.now() - t1;
    timings.total_ms = Date.now() - startedAt;
    const { error } = await db
      .from('studio_attempts')
      .update({
        status: 'feedback',
        feedback: { ...feedback, processing_time_ms: timings.total_ms },
        feedback_model: provider.name,
        assessment_version: feedback.assessment_version,
        feedback_at: new Date().toISOString(),
        timings,
      })
      .eq('id', attempt.id);
    if (error) return fail('The feedback could not be saved.', timings);
  } catch (e) {
    console.error('[studio] assessment failed', e);
    return fail(
      e instanceof AssessmentFailed ? 'The AI did not give usable feedback this time.' : 'The AI could not be reached just now.',
      timings,
    );
  }
  revalidatePath(`/studio/attempts/${attempt.id}`);
  revalidatePath('/studio');
  return { status: 'feedback' };
}

/** Deletes the recording itself, and empties the attempt of what was said. */
export async function deleteStudioRecording(attemptId: string): Promise<{ error: string } | { ok: true }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };
  if (!idSchema.safeParse(attemptId).success) return { error: 'That recording could not be found.' };
  const attempt = await ownAttempt(user.id, attemptId);
  if (!attempt) return { error: 'That recording could not be found.' };
  if (attempt.deletedAt) return { ok: true };

  const db = createServiceClient();
  if (attempt.path) {
    const { data: removed, error } = await db.storage.from(STUDIO_BUCKET).remove([attempt.path]);
    // Removing a file that never arrived is fine; failing to remove one that did is not.
    if (error) return { error: 'The recording could not be deleted. Please try again.' };
    void removed;
  }
  const { error } = await db
    .from('studio_attempts')
    .update({
      status: 'deleted',
      deleted_at: new Date().toISOString(),
      recording_path: null,
      transcript: null,
      transcript_segments: null,
      feedback: null,
      shared_with_trainer: false,
    })
    .eq('id', attempt.id)
    .eq('user_id', user.id);
  if (error) return { error: 'The recording could not be deleted. Please try again.' };
  revalidatePath('/studio');
  revalidatePath(`/studio/attempts/${attempt.id}`);
  return { ok: true };
}

/** Shares one attempt with the coaches, or stops sharing it. Sharing needs the separate consent. */
export async function setStudioSharing(
  attemptId: string,
  share: boolean,
): Promise<{ error: string } | { ok: true }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'You are not signed in.' };
  if (!idSchema.safeParse(attemptId).success) return { error: 'That recording could not be found.' };
  const attempt = await ownAttempt(user.id, attemptId);
  if (!attempt || attempt.deletedAt) return { error: 'That recording could not be found.' };
  if (share) {
    const consent = await latestConsent(user.id);
    if (!consent?.trainerSharing || consent.noticeVersion !== NOTICE_VERSION) {
      return { error: 'Agree to sharing with your coaches on the Studio page first.' };
    }
  }
  const { error } = await createServiceClient()
    .from('studio_attempts')
    .update({ shared_with_trainer: share })
    .eq('id', attempt.id)
    .eq('user_id', user.id)
    .is('deleted_at', null);
  if (error) return { error: 'That could not be changed. Please try again.' };
  revalidatePath(`/studio/attempts/${attempt.id}`);
  return { ok: true };
}
