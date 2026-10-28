'use client';

import { useActionState } from 'react';
import { recordStudioConsent, type ConsentState } from '@/app/(app)/studio/actions';
import { Button, Notice } from '@/components/ui';

/**
 * The Studio's consent: three separate choices, none ticked for the
 * learner. The notice says where recordings and words actually go on this
 * deployment, from the server's own settings, and claims nothing about any
 * company's retention or training that this site cannot check.
 */
export function StudioConsentForm({
  aiCompany,
  transcription,
  current,
}: {
  /** The company that writes feedback here, or null when AI is off. */
  aiCompany: 'OpenAI' | 'Anthropic' | null;
  /** Whether recordings are transcribed (by OpenAI) on this deployment. */
  transcription: boolean;
  /** What they chose last time, if anything, to start from. */
  current: { recording: boolean; aiProcessing: boolean; trainerSharing: boolean } | null;
}) {
  const [state, action, pending] = useActionState<ConsentState, FormData>(recordStudioConsent, {
    error: null,
    ok: false,
  });

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-3 text-[0.9375rem] leading-relaxed text-slate">
        <p>
          The Studio records you, on video or sound alone, so you can watch yourself back and get
          feedback. Before anything is recorded, here is what happens to it.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Your recording is stored privately in this academy&rsquo;s own database storage. Only you
            can play it, through a link that expires after half an hour. Nobody else sees it unless
            you share it with your coaches.
          </li>
          {transcription && aiCompany ? (
            <li>
              If you agree to AI feedback, the recording is sent to OpenAI to be turned into text,
              and that text, with the exercise, is sent to {aiCompany} to write feedback. These
              companies may process it outside Malaysia. Their own terms govern what they keep.
            </li>
          ) : (
            <li>
              AI feedback is not switched on for this academy yet. If it is switched on later, you
              will be asked again before anything is sent to an AI company.
            </li>
          )}
          <li>
            The feedback is written by AI, from your words alone. It is a practice aid, not a
            lawyer&rsquo;s review and not a mark.
          </li>
          <li>
            You can delete any recording at any time from its page. Deleting your account deletes
            them all. No other period for keeping them has been set yet.
          </li>
          <li>
            Practise only on the exercises given. Never record anything about a real client or a
            real case.
          </li>
        </ul>
      </div>

      <fieldset className="space-y-1">
        <legend className="eyebrow mb-2">Your choices</legend>
        <Choice name="recording" defaultChecked={current?.recording ?? false}>
          Record me and keep the recording for me to watch back.
        </Choice>
        <Choice name="aiProcessing" defaultChecked={current?.aiProcessing ?? false}>
          Send my recordings for AI transcription and feedback, as described above.
        </Choice>
        <Choice name="trainerSharing" defaultChecked={current?.trainerSharing ?? false}>
          Share my recordings, their transcripts and feedback with the academy&rsquo;s coaches, so
          they can review them. I can stop sharing any one of them later.
        </Choice>
      </fieldset>

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="good">Saved. You can change these at any time.</Notice> : null}

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save my choices'}
      </Button>
    </form>
  );
}

function Choice({
  name,
  defaultChecked,
  children,
}: {
  name: string;
  defaultChecked: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-h-11 items-start gap-3 py-2 text-[0.9375rem]">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 size-5 shrink-0" />
      <span>{children}</span>
    </label>
  );
}
