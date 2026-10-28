'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import {
  confirmStudioUpload,
  requestStudioFeedback,
  startStudioAttempt,
} from '@/app/(app)/studio/actions';
import { Button, Notice, cn } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { STUDIO_BUCKET, STUDIO_MAX_BYTES, bareMime, chooseMime, type RecordingKind } from '@/lib/studio/rules';

/**
 * The Advocacy Studio's recorder: a real recording in the learner's browser
 * (getUserMedia and MediaRecorder), never simulated.
 *
 * Nothing is switched on until the learner presses a button: not the
 * camera, not the microphone. The format is the first one this browser says
 * it can record (MP4 on Safari, WebM elsewhere). The recording stops itself
 * at the exercise's limit. It is played back before anything leaves the
 * device, and the camera and microphone are released when recording stops,
 * when the learner chooses again, and when they leave the page.
 */

type Phase =
  | 'idle'
  | 'asking'
  | 'ready'
  | 'recording'
  | 'review'
  | 'uploading'
  | 'checking'
  | 'processing';

type Problem = 'unsupported' | 'denied' | 'no-device' | 'failed' | null;

function canRecord(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}
const noSubscription = () => () => {};

function clock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function StudioRecorder({
  exerciseSlug,
  maxSeconds,
  aiFeedback,
}: {
  exerciseSlug: string;
  maxSeconds: number;
  /** Whether the learner agreed to AI feedback (otherwise a recording is only kept). */
  aiFeedback: boolean;
}) {
  const router = useRouter();
  const supported = useSyncExternalStore(noSubscription, canRecord, () => true);
  const [kind, setKind] = useState<RecordingKind>('video');
  const [phase, setPhase] = useState<Phase>('idle');
  const [problem, setProblem] = useState<Problem>(null);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [recording, setRecording] = useState<{ blob: Blob; url: string; seconds: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedRef = useRef(0);

  const release = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  // Leaving the page releases the camera and microphone, whatever state it was in.
  useEffect(() => release, [release]);
  useEffect(() => () => {
    if (recording) URL.revokeObjectURL(recording.url);
  }, [recording]);

  async function turnOn(which: RecordingKind) {
    setError(null);
    setProblem(null);
    setKind(which);
    setPhase('asking');
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        which === 'video'
          ? { audio: { echoCancellation: true, noiseSuppression: true }, video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } }
          : { audio: { echoCancellation: true, noiseSuppression: true } },
      );
      streamRef.current = stream;
      setMuted(false);
      setCameraOff(false);
      if (which === 'video' && previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.play().catch(() => {});
      }
      setPhase('ready');
    } catch (e) {
      const name = (e as { name?: string }).name;
      setProblem(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : name === 'NotFoundError' || name === 'OverconstrainedError' ? 'no-device' : 'failed');
      setPhase('idle');
    }
  }

  // The preview element mounts after the stream exists on a first render.
  useEffect(() => {
    if (phase === 'ready' && kind === 'video' && previewRef.current && streamRef.current) {
      if (previewRef.current.srcObject !== streamRef.current) {
        previewRef.current.srcObject = streamRef.current;
        previewRef.current.play().catch(() => {});
      }
    }
  }, [phase, kind]);

  function start() {
    const stream = streamRef.current;
    if (!stream) return;
    setError(null);
    const type = chooseMime(kind, (t) => MediaRecorder.isTypeSupported(t));
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, {
        ...(type ? { mimeType: type } : {}),
        audioBitsPerSecond: 64_000,
        ...(kind === 'video' ? { videoBitsPerSecond: 1_000_000 } : {}),
      });
    } catch {
      setProblem('failed');
      return;
    }
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const took = Math.max(1, Math.round((Date.now() - startedRef.current) / 1000));
      const blob = new Blob(chunksRef.current, { type: bareMime(recorder.mimeType || type || `${kind}/webm`) });
      release();
      setRecording({ blob, url: URL.createObjectURL(blob), seconds: Math.min(took, maxSeconds) });
      setPhase('review');
    };
    recorderRef.current = recorder;
    recorder.start(1000);
    startedRef.current = Date.now();
    setSeconds(0);
    setPhase('recording');
    timerRef.current = setInterval(() => {
      const s = Math.floor((Date.now() - startedRef.current) / 1000);
      setSeconds(s);
      if (s >= maxSeconds) stop();
    }, 250);
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }

  function toggleMute() {
    const next = !muted;
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
  }

  function toggleCamera() {
    const next = !cameraOff;
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !next));
    setCameraOff(next);
  }

  function again() {
    if (recording) URL.revokeObjectURL(recording.url);
    setRecording(null);
    setSeconds(0);
    setPhase('idle');
  }

  async function submit() {
    if (!recording) return;
    setError(null);
    if (recording.blob.size > STUDIO_MAX_BYTES) {
      setError('That recording is too large to keep. Record a shorter one.');
      return;
    }
    setPhase('uploading');
    const started = await startStudioAttempt({
      exerciseSlug,
      kind,
      mime: recording.blob.type,
      seconds: recording.seconds,
      bytes: recording.blob.size,
    });
    if ('error' in started) {
      setError(started.error);
      setPhase('review');
      return;
    }
    const { error: uploadError } = await createClient()
      .storage.from(STUDIO_BUCKET)
      .uploadToSignedUrl(started.path, started.token, recording.blob, { contentType: recording.blob.type });
    if (uploadError) {
      setError('The recording could not be uploaded. Check your connection and try again.');
      setPhase('review');
      return;
    }
    setPhase('checking');
    const confirmed = await confirmStudioUpload(started.attemptId);
    if ('error' in confirmed) {
      setError(confirmed.error);
      setPhase('review');
      return;
    }
    if (aiFeedback) {
      setPhase('processing');
      const begun = Date.now();
      const tick = setInterval(() => setElapsed(Math.floor((Date.now() - begun) / 1000)), 500);
      try {
        await requestStudioFeedback(started.attemptId);
      } catch {
        // The recording is kept either way; the attempt page says where
        // feedback stands and offers to try again.
      } finally {
        clearInterval(tick);
      }
    }
    router.push(`/studio/attempts/${started.attemptId}`);
  }

  if (!supported) {
    return (
      <Notice tone="warn">
        This browser cannot record. Try the latest Chrome, Edge, Firefox or Safari, on a computer or
        a phone.
      </Notice>
    );
  }

  const busy = phase === 'uploading' || phase === 'checking' || phase === 'processing';

  return (
    <div className="space-y-5">
      {problem ? (
        <Notice tone={problem === 'failed' ? 'error' : 'warn'}>
          {problem === 'denied'
            ? 'The browser was not allowed to use the camera or microphone. Allow it in the address bar (or your phone’s settings for this browser), then try again, or record sound only.'
            : problem === 'no-device'
              ? 'No camera was found. You can record sound only.'
              : 'Recording could not start on this device. Try sound only, or another browser.'}
        </Notice>
      ) : null}

      {/* The stage: the camera preview, a sound-only panel, or the playback. */}
      <div className="overflow-hidden rounded-lg border border-rule bg-ink">
        {phase === 'review' || busy ? (
          kind === 'video' ? (
            <video src={recording?.url} controls playsInline className="aspect-video w-full bg-ink" />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center bg-ink p-6">
              <audio src={recording?.url} controls className="w-full max-w-md" />
            </div>
          )
        ) : kind === 'video' && (phase === 'ready' || phase === 'recording') ? (
          <video
            ref={previewRef}
            muted
            playsInline
            aria-label="Your camera"
            className={cn('aspect-video w-full -scale-x-100 bg-ink object-cover', cameraOff && 'opacity-0')}
          />
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 p-6 text-center text-paper/80">
            <p className="font-serif text-2xl text-paper">
              {phase === 'asking'
                ? 'Waiting for your browser…'
                : phase === 'ready' || phase === 'recording'
                  ? 'Recording sound only'
                  : 'Your camera and microphone are off'}
            </p>
            {phase === 'idle' ? <p className="text-sm">Nothing is recorded until you press Start.</p> : null}
          </div>
        )}
      </div>

      {/* Status line: the clock while recording, the real state while sending. */}
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-3" aria-live="polite">
        {phase === 'recording' ? (
          <p className="flex items-center gap-2 font-medium tabular-nums">
            <span className="inline-block size-2.5 animate-pulse rounded-full bg-record" aria-hidden />
            <span className="text-record-ink">Recording</span> {clock(seconds)} of {clock(maxSeconds)}
            {muted ? <span className="text-sm text-slate">(microphone muted)</span> : null}
          </p>
        ) : phase === 'review' && recording ? (
          <p className="text-slate">
            {clock(recording.seconds)} recorded. Watch it back, then send it or record again.
          </p>
        ) : phase === 'uploading' ? (
          <p className="text-slate">Uploading your recording…</p>
        ) : phase === 'checking' ? (
          <p className="text-slate">Checking it arrived…</p>
        ) : phase === 'processing' ? (
          <p className="text-slate tabular-nums">
            Transcribing and preparing feedback: {elapsed} {elapsed === 1 ? 'second' : 'seconds'} so far.
            Short recordings usually take under half a minute.
          </p>
        ) : (
          <p className="text-sm text-slate">Up to {clock(maxSeconds)}. It stops by itself at the limit.</p>
        )}
      </div>

      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className="flex flex-wrap gap-2">
        {phase === 'idle' || phase === 'asking' ? (
          <>
            <Button variant="accent" onClick={() => turnOn('video')} disabled={phase === 'asking'}>
              Turn on camera and microphone
            </Button>
            <Button variant="outline" onClick={() => turnOn('audio')} disabled={phase === 'asking'}>
              Sound only
            </Button>
          </>
        ) : phase === 'ready' ? (
          <>
            <Button variant="accent" onClick={start}>
              Start recording
            </Button>
            <Button variant="outline" onClick={toggleMute}>
              {muted ? 'Unmute microphone' : 'Mute microphone'}
            </Button>
            {kind === 'video' ? (
              <Button variant="outline" onClick={toggleCamera}>
                {cameraOff ? 'Show camera' : 'Hide camera'}
              </Button>
            ) : null}
            <Button
              variant="ghost"
              onClick={() => {
                release();
                setPhase('idle');
              }}
            >
              Turn off
            </Button>
          </>
        ) : phase === 'recording' ? (
          <>
            <Button variant="primary" onClick={stop}>
              Stop
            </Button>
            <Button variant="outline" onClick={toggleMute}>
              {muted ? 'Unmute microphone' : 'Mute microphone'}
            </Button>
            {kind === 'video' ? (
              <Button variant="outline" onClick={toggleCamera}>
                {cameraOff ? 'Show camera' : 'Hide camera'}
              </Button>
            ) : null}
          </>
        ) : phase === 'review' ? (
          <>
            <Button variant="accent" onClick={submit}>
              {aiFeedback ? 'Get my feedback' : 'Keep this recording'}
            </Button>
            <Button variant="outline" onClick={again}>
              Record again
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
