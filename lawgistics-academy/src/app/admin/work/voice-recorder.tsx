'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui';
import { WORK_MEMO_ACCEPT, WORK_MEMO_MAX_SECONDS, bareMemoType } from '@/lib/work/links';

/**
 * A voice memo, recorded in the page.
 *
 * The lawyer presses the button, talks, presses it again. What they recorded
 * plays back here first, because a memo nobody has listened to is how a
 * brief that cut out at the important sentence reaches an intern.
 *
 * The recording goes into the ordinary form as a file, in a hidden file
 * input, so the server action receives it exactly as it receives the
 * document: nothing here uploads on its own, and the same bucket policy
 * decides whether the upload is allowed. Browsers that cannot record (or
 * that refuse the microphone) get a plain file picker instead, for a
 * recording made on a phone.
 */
/** Whether this browser can record at all. False on the server, so the
 *  first paint matches, and true on the client only once it is known. */
function canRecord(): boolean {
  return typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
}
const noSubscription = () => () => {};

export function VoiceRecorder({ existing }: { existing: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const supported = useSyncExternalStore(noSubscription, canRecord, () => false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (preview) URL.revokeObjectURL(preview);
    };
    // The preview is revoked when it changes, below; this is only the unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopTimer() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function setFile(blob: Blob) {
    const type = bareMemoType(blob.type) || 'audio/webm';
    const ext = type === 'audio/mp4' ? 'm4a' : type === 'audio/ogg' ? 'ogg' : 'webm';
    const file = new File([blob], `memo.${ext}`, { type });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    if (inputRef.current) inputRef.current.files = transfer.files;
    if (preview) URL.revokeObjectURL(preview);
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
        stopTimer();
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= WORK_MEMO_MAX_SECONDS) recorderRef.current?.stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      setProblem(
        'The microphone could not be used. Check the browser has permission, or attach a recording below.',
      );
    }
  }

  function stop() {
    recorderRef.current?.stop();
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = '';
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSeconds(0);
  }

  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">Voice memo (optional)</p>
      {existing && !preview ? (
        <p className="mb-1.5 text-sm text-slate">
          A memo is attached now. Recording a new one replaces it.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {supported ? (
          recording ? (
            <Button type="button" variant="accent" onClick={stop}>
              Stop ({clock})
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={start}>
              {preview ? 'Record again' : 'Record a memo'}
            </Button>
          )
        ) : null}
        {preview && !recording ? (
          <Button type="button" variant="outline" onClick={clear}>
            Remove
          </Button>
        ) : null}
      </div>

      {recording ? (
        <p className="mt-1.5 text-xs text-verdict-wrong">
          Recording. Up to five minutes; say what the work is for and what a good answer looks
          like.
        </p>
      ) : null}

      {preview ? (
        <figure className="m-0 mt-3">
          <figcaption className="mb-1 text-xs text-muted">
            Listen back before you save. If it cut out, record it again.
          </figcaption>
          <audio controls src={preview} className="w-full" />
        </figure>
      ) : null}

      {problem ? <p className="mt-1.5 text-xs text-verdict-wrong">{problem}</p> : null}

      {/* The recording travels in this input. It doubles as the fallback for a
          browser that cannot record, where it is shown as an ordinary picker. */}
      <input
        ref={inputRef}
        id="memo"
        name="memo"
        type="file"
        accept={WORK_MEMO_ACCEPT}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            if (preview) URL.revokeObjectURL(preview);
            setPreview(URL.createObjectURL(file));
          }
        }}
        className={
          supported
            ? 'hidden'
            : 'mt-2 block w-full text-base file:mr-3 file:rounded-[5px] file:border file:border-rule-strong file:bg-paper-raised file:px-3 file:py-2 file:text-sm file:text-ink'
        }
      />
      {!supported ? (
        <p className="mt-1 text-xs text-muted">
          This browser cannot record. Record on your phone and attach the file here.
        </p>
      ) : null}

      {existing ? (
        <label className="mt-3 flex items-start gap-2.5 py-2 text-sm">
          <input type="checkbox" name="removeMemo" className="mt-0.5 size-5" />
          <span className="text-slate">Remove the memo that is attached now.</span>
        </label>
      ) : null}
    </div>
  );
}
