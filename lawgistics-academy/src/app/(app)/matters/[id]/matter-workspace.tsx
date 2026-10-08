'use client';

import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Button, Notice, cn } from '@/components/ui';
import { CheckIcon } from '@/components/icons';
import {
  DRAFT_MAX,
  FOLLOW_UP_ANSWER_MAX,
  PROCEDURE_MAX,
  SPEAK_MAX_SECONDS,
} from '@/lib/matters/rules';
import { WORK_MEMO_ACCEPT, bareMemoType } from '@/lib/work/links';
import type { Attempt } from '@/lib/matters/service';
import { askFollowUps, saveMatterWork, uploadMatterRecording } from '../../actions';
import { CaseFile } from './case-file';

/**
 * Working a matter: the file, the clock, and the four tasks in one form.
 *
 * One form so that nothing typed is lost between steps. Each button sends
 * the whole form to its own action: Save, Save recording, Ask me the
 * questions, and Hand in. The recording travels in a hidden file input,
 * which is emptied once it has been uploaded so that saving afterwards does
 * not send the audio again.
 */
export function MatterWorkspace({
  attempt,
  recordingUrl,
}: {
  attempt: Attempt;
  recordingUrl: string | null;
}) {
  const [saveState, saveAction, saving] = useActionState(saveMatterWork, { error: null });
  const [askState, askAction, asking] = useActionState(askFollowUps, { error: null });
  const [recState, recAction, uploading] = useActionState(uploadMatterRecording, { error: null });
  const [procedure, setProcedure] = useState(attempt.procedureAnswer);
  const [draft, setDraft] = useState(attempt.draftAnswer);

  const s = attempt.snapshot;
  const questions = attempt.followUpQuestions;

  return (
    <div className="space-y-6">
      <Clock deadlineAt={attempt.deadlineAt} startedAt={attempt.startedAt} />

      <h1 className="text-3xl sm:text-4xl">{s.title}</h1>
      <CaseFile snapshot={s} />

      <form action={saveAction} className="space-y-6">
        <input type="hidden" name="attemptId" value={attempt.id} />

        <Task n={1} title="The procedure" prompt={s.procedurePrompt} done={procedure.trim().length > 0}>
          <textarea
            name="procedureAnswer"
            value={procedure}
            onChange={(e) => setProcedure(e.target.value)}
            rows={4}
            maxLength={PROCEDURE_MAX}
            aria-label="The procedure"
            className="w-full rounded-lg border-2 border-rule bg-paper px-3.5 py-3 text-base outline-none focus:border-accent"
          />
        </Task>

        <Task n={2} title="Your advice" prompt={s.draftPrompt} done={draft.trim().length > 0}>
          <textarea
            name="draftAnswer"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={10}
            maxLength={DRAFT_MAX}
            aria-label="Your advice"
            className="w-full rounded-lg border-2 border-rule bg-paper px-3.5 py-3 font-serif text-[1.0625rem] leading-relaxed outline-none focus:border-accent"
          />
          <p className="mt-1 text-right text-xs text-muted tabular-nums">
            {draft.trim() ? draft.trim().split(/\s+/).length : 0} words
          </p>
        </Task>

        <Task
          n={3}
          title="Explain it out loud"
          prompt={s.speakPrompt}
          done={attempt.hasRecording}
          optional
        >
          <SpeakRecorder existingUrl={recordingUrl} recAction={recAction} uploading={uploading} ok={recState.ok} />
          {recState.error ? (
            <div className="mt-2">
              <Notice tone="warn">{recState.error}</Notice>
            </div>
          ) : null}
        </Task>

        <Task
          n={4}
          title="Five follow-up questions"
          prompt="Once your procedure and advice are written, ask for the questions a supervising lawyer would put to you about them."
          done={
            questions.length > 0 &&
            questions.every((_, i) => (attempt.followUpAnswers[i] ?? '').trim().length > 0)
          }
        >
          {questions.length === 0 ? (
            <div>
              <Button
                type="submit"
                variant="outline"
                formAction={askAction}
                disabled={asking || procedure.trim().length < 20 || draft.trim().length < 80}
              >
                {asking ? 'Reading your draft…' : 'Ask me the follow-up questions'}
              </Button>
              <p className="mt-2 text-xs text-muted">
                {procedure.trim().length < 20 || draft.trim().length < 80
                  ? 'Write your procedure and a few sentences of advice first.'
                  : 'They are asked once, about what you have written, so finish your draft first.'}
              </p>
              {askState.error ? (
                <div className="mt-2">
                  <Notice tone="warn">{askState.error}</Notice>
                </div>
              ) : null}
            </div>
          ) : (
            <ol className="space-y-4">
              {attempt.followUpsByAi === false ? (
                <p className="text-xs text-muted">
                  These are the standard questions a supervisor asks about any advice; the
                  questions written about your own draft were not available.
                </p>
              ) : null}
              {questions.map((q, i) => (
                <li key={i} className="rise-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <label htmlFor={`fu-${i}`} className="mb-1.5 flex gap-2.5 font-medium">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ink text-xs text-paper">
                      {i + 1}
                    </span>
                    {q}
                  </label>
                  <textarea
                    id={`fu-${i}`}
                    name="followUpAnswer"
                    defaultValue={attempt.followUpAnswers[i] ?? ''}
                    rows={3}
                    maxLength={FOLLOW_UP_ANSWER_MAX}
                    className="w-full rounded-lg border-2 border-rule bg-paper px-3.5 py-2.5 text-base outline-none focus:border-accent"
                  />
                </li>
              ))}
            </ol>
          )}
        </Task>

        {saveState.error ? <Notice tone="warn">{saveState.error}</Notice> : null}
        {saveState.ok === 'Saved.' ? <Notice tone="good">Saved.</Notice> : null}

        <div className="sticky bottom-3 z-10 flex items-center gap-2 rounded-xl border border-rule bg-paper-raised/95 p-2.5 shadow-raised backdrop-blur sm:gap-3 sm:p-3">
          <Button type="submit" variant="outline" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button
            type="submit"
            name="intent"
            value="hand-in"
            variant="accent"
            disabled={saving}
            className="flex-1 sm:flex-none"
          >
            <span className="sm:hidden">Hand in</span>
            <span className="hidden sm:inline">Hand in and see the lawyer&rsquo;s approach</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

function Task({
  n,
  title,
  prompt,
  done,
  optional = false,
  children,
}: {
  n: number;
  title: string;
  prompt: string;
  done: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-rule bg-paper-raised p-5 shadow-card sm:p-6">
      <div className="mb-3 flex items-start gap-3">
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-full font-serif text-lg transition-colors',
            done ? 'bg-accent text-paper' : 'bg-accent-wash text-accent',
          )}
          aria-hidden
        >
          {done ? <CheckIcon className="size-4" /> : n}
        </span>
        <div>
          <h2 className="text-xl">
            {title}
            {optional ? <span className="ml-2 font-sans text-xs text-muted">(if you can)</span> : null}
          </h2>
          <p className="mt-0.5 text-sm text-slate">{prompt}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/** The time left, ticking. Red and pulsing in the last five minutes. */
function Clock({ deadlineAt, startedAt }: { deadlineAt: string; startedAt: string }) {
  const now = useSyncExternalStore(subscribeSecond, () => Math.floor(Date.now() / 1000), () => 0);
  const end = Date.parse(deadlineAt) / 1000;
  const start = Date.parse(startedAt) / 1000;
  const left = now === 0 ? end - start : end - now;
  const total = Math.max(1, end - start);
  const over = left < 0;
  const urgent = !over && left <= 300;
  const abs = Math.abs(Math.round(left));
  const clock = `${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, '0')}`;

  return (
    <div
      className={cn(
        'sticky top-2 z-20 flex items-center gap-4 rounded-xl border px-4 py-3 shadow-raised backdrop-blur',
        over
          ? 'border-verdict-wrong/40 bg-verdict-wrong-wash/95'
          : urgent
            ? 'border-warn/60 bg-warn-wash/95'
            : 'border-rule bg-paper-raised/95',
      )}
      role="timer"
      aria-live="off"
    >
      <span
        className={cn(
          'font-mono text-2xl font-semibold tabular-nums',
          over ? 'text-verdict-wrong' : urgent ? 'clock-urgent text-warn' : 'text-ink',
        )}
      >
        {over ? `+${clock}` : clock}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate">
          {over ? 'Over time. You can still hand in; the record will say it was late.' : urgent ? 'Five minutes or less.' : 'Time left'}
        </p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-sunk">
          <div
            className={cn('h-full rounded-full transition-[width] duration-1000', over ? 'bg-verdict-wrong' : urgent ? 'bg-amber-500' : 'bg-accent')}
            style={{ width: `${over ? 100 : Math.max(0, Math.min(100, (left / total) * 100))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function subscribeSecond(callback: () => void): () => void {
  const timer = window.setInterval(callback, 1000);
  return () => window.clearInterval(timer);
}

function canRecord(): boolean {
  return typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
}
const noSubscription = () => () => {};

/**
 * Up to three minutes, recorded in the page and played back before it is
 * saved. Browsers that cannot record get a file picker instead.
 */
function SpeakRecorder({
  existingUrl,
  recAction,
  uploading,
  ok,
}: {
  existingUrl: string | null;
  recAction: (formData: FormData) => void;
  uploading: boolean;
  ok?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const supported = useSyncExternalStore(noSubscription, canRecord, () => false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  // Once uploaded, the file leaves the form, so later saves do not resend it.
  useEffect(() => {
    if (ok && inputRef.current) {
      inputRef.current.value = '';
      setPreview(null);
    }
  }, [ok]);

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
  }, []);

  function setFile(blob: Blob) {
    const type = bareMemoType(blob.type) || 'audio/webm';
    const ext = type === 'audio/mp4' ? 'm4a' : type === 'audio/ogg' ? 'ogg' : 'webm';
    const file = new File([blob], `explanation.${ext}`, { type });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    if (inputRef.current) inputRef.current.files = transfer.files;
    setPreview(URL.createObjectURL(file));
  }

  async function start() {
    setProblem(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setFile(new Blob(chunksRef.current, { type: recorder.mimeType }));
        setRecording(false);
        if (timerRef.current) window.clearInterval(timerRef.current);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => {
        setSeconds((value) => {
          if (value + 1 >= SPEAK_MAX_SECONDS) recorderRef.current?.stop();
          return value + 1;
        });
      }, 1000);
    } catch {
      setProblem('The microphone could not be used. Check the browser has permission.');
    }
  }

  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div>
      {existingUrl && !preview ? (
        <div className="mb-3">
          <p className="mb-1 text-xs text-muted">Your saved explanation. Recording again replaces it.</p>
          <audio controls src={existingUrl} className="w-full" />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {supported ? (
          recording ? (
            <button
              type="button"
              onClick={() => recorderRef.current?.stop()}
              className="inline-flex h-11 items-center gap-2.5 rounded-full bg-verdict-wrong px-5 font-medium text-paper"
            >
              <span aria-hidden className="size-2.5 animate-pulse rounded-full bg-paper" />
              Stop {clock} / 3:00
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              className="inline-flex h-11 items-center gap-2.5 rounded-full border-2 border-accent px-5 font-medium text-accent hover:bg-accent-wash"
            >
              <span aria-hidden className="size-2.5 rounded-full bg-verdict-wrong" />
              {preview || existingUrl ? 'Record again' : 'Start recording'}
            </button>
          )
        ) : null}
        {preview && !recording ? (
          <Button type="submit" variant="accent" formAction={recAction} disabled={uploading}>
            {uploading ? 'Saving…' : 'Save this recording'}
          </Button>
        ) : null}
      </div>

      {preview ? (
        <figure className="m-0 mt-3">
          <figcaption className="mb-1 text-xs text-muted">Listen back before you save it.</figcaption>
          <audio controls src={preview} className="w-full" />
        </figure>
      ) : null}
      {/* Asked with the recording, not as a rule somewhere else: the box is
          a statement the learner is making. Not pre-ticked, and not marked
          required, because the same form also saves the written answers. */}
      {preview && !recording ? (
        <label className="mt-3 flex items-start gap-2.5 py-2 text-sm">
          <input type="checkbox" name="recordingDeclaredClean" className="mt-0.5 size-5" />
          <span>I have checked, and there is nothing in this recording that identifies a client.</span>
        </label>
      ) : null}
      {problem ? <p className="mt-1.5 text-xs text-verdict-wrong">{problem}</p> : null}
      {ok && !preview ? <p className="mt-1.5 text-xs text-verdict-correct">Recording saved.</p> : null}

      <input type="hidden" name="seconds" value={seconds} />
      <input
        ref={inputRef}
        name="memo"
        type="file"
        accept={WORK_MEMO_ACCEPT}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) setPreview(URL.createObjectURL(file));
        }}
        className={
          supported
            ? 'hidden'
            : 'block w-full text-base file:mr-3 file:rounded-[5px] file:border file:border-rule-strong file:bg-paper-raised file:px-3 file:py-2 file:text-sm'
        }
        aria-label="Recording file"
      />
      {!supported ? (
        <p className="mt-1 text-xs text-muted">
          This browser cannot record. Record on your phone and attach the file, then press
          Save this recording.
        </p>
      ) : null}
    </div>
  );
}
