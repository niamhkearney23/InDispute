import { z } from 'zod';
import type { StudioDimension, StudioExercise } from '@/content/studio/exercises';
import { judgesTheLaw, statesUncheckedLaw } from '@/lib/tutor/guard';

export type { StudioDimension };

/**
 * The Advocacy Studio's rules, as plain functions so they can be tested
 * without a browser, a database or an AI company (0053).
 *
 * The one that matters most is groundFeedback: whatever the AI says, a
 * learner is shown only what the recording supports. Every quotation the AI
 * offers as evidence is looked for in the transcript; one that is not there
 * is dropped, and a mark left with no evidence becomes "not assessed". The
 * AI never computes a total, never marks legal reasoning without approved
 * authorities, and never gets to state law the exercise does not contain.
 */

/** Which wording of the consent notice a decision was made on. */
export const NOTICE_VERSION = '2026-10';

export const STUDIO_BUCKET = 'studio-recordings';

/** The bucket's own limit (0053); the recorder stays well under it. */
export const STUDIO_MAX_BYTES = 50 * 1024 * 1024;

/** How long a playback link lasts. */
export const STUDIO_PLAYBACK_SECONDS = 60 * 30;

/** Which version of the feedback shape and prompt produced a review. */
export const ASSESSMENT_VERSION = 'studio-2026-10';

export const DIMENSION_LABELS: Record<StudioDimension, string> = {
  structure: 'Structure',
  clarity: 'Clarity',
  persuasiveness: 'Persuasiveness',
  responsiveness: 'Responsiveness',
  legal_reasoning: 'Legal reasoning',
};

export const DIMENSIONS = Object.keys(DIMENSION_LABELS) as StudioDimension[];

/* -------------------------------------------------------------------------- */
/* Recording formats                                                           */
/* -------------------------------------------------------------------------- */

export type RecordingKind = 'video' | 'audio';

/**
 * What to ask MediaRecorder for, best first. Safari records MP4, Chrome and
 * Firefox record WebM; the first one the browser says it supports is used,
 * so nothing is assumed about a browser from its name.
 */
export const MIME_CANDIDATES: Record<RecordingKind, string[]> = {
  video: [
    'video/mp4;codecs=avc1,mp4a',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ],
  audio: ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'],
};

/** The first candidate the browser supports, or null to let it choose. */
export function chooseMime(kind: RecordingKind, isSupported: (type: string) => boolean): string | null {
  return MIME_CANDIDATES[kind].find((type) => isSupported(type)) ?? null;
}

/** "video/webm;codecs=vp9,opus" is "video/webm". */
export function bareMime(type: string): string {
  return type.split(';')[0].trim().toLowerCase();
}

const EXTENSIONS: Record<string, 'webm' | 'mp4' | 'm4a' | 'ogg'> = {
  'video/webm': 'webm',
  'video/mp4': 'mp4',
  'audio/webm': 'webm',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
};

/** The file extension for a recording's type, or null for one the bucket refuses. */
export function extensionFor(mime: string): 'webm' | 'mp4' | 'm4a' | 'ogg' | null {
  return EXTENSIONS[bareMime(mime)] ?? null;
}

/** Where a recording lives: the learner's own folder, under the attempt (0053 checks the shape). */
export function recordingPath(userId: string, attemptId: string, mime: string): string | null {
  const ext = extensionFor(mime);
  return ext ? `${userId}/${attemptId}/recording.${ext}` : null;
}

/* -------------------------------------------------------------------------- */
/* Consent                                                                     */
/* -------------------------------------------------------------------------- */

export interface StudioConsent {
  noticeVersion: string;
  recording: boolean;
  aiProcessing: boolean;
  trainerSharing: boolean;
  decidedAt: string;
}

/** Recording needs a decision on the current notice that says yes to recording. */
export function mayRecord(consent: StudioConsent | null): boolean {
  return Boolean(consent && consent.noticeVersion === NOTICE_VERSION && consent.recording);
}

/* -------------------------------------------------------------------------- */
/* Transcripts                                                                 */
/* -------------------------------------------------------------------------- */

export interface TranscriptSegment {
  /** Seconds from the start of the recording, as the transcription service gave them. */
  start: number;
  end: number;
  text: string;
}

/** Words as compared: lower case, letters and digits only, single spaces. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^\p{L}\p{N}' ]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function wordCount(text: string): number {
  const n = normalise(text);
  return n ? n.split(' ').length : 0;
}

/**
 * Where a quotation sits in the recording: the start of the segment it
 * begins in, when the transcription gave segments. Null when it gave none,
 * or the quotation is not in the transcript at all.
 */
export function locate(quote: string, segments: TranscriptSegment[] | null): number | null {
  if (!segments || segments.length === 0) return null;
  const q = normalise(quote);
  if (!q) return null;
  let joined = '';
  const starts: Array<{ at: number; seconds: number }> = [];
  for (const seg of segments) {
    const text = normalise(seg.text);
    if (!text) continue;
    if (joined) joined += ' ';
    starts.push({ at: joined.length, seconds: seg.start });
    joined += text;
  }
  const index = joined.indexOf(q);
  if (index < 0) return null;
  let seconds: number | null = null;
  for (const s of starts) if (s.at <= index) seconds = s.seconds;
  return seconds;
}

/* -------------------------------------------------------------------------- */
/* Feedback: what the AI is asked for, and what a learner is shown             */
/* -------------------------------------------------------------------------- */

/** What the AI must reply with. Lenient on shape; groundFeedback decides what survives. */
export const RawFeedbackSchema = z.object({
  overall_summary: z.string().max(1500),
  strengths: z
    .array(z.object({ text: z.string().max(600), quotes: z.array(z.string().max(400)).max(4).default([]) }))
    .max(6)
    .default([]),
  areas_to_improve: z
    .array(z.object({ text: z.string().max(600), quotes: z.array(z.string().max(400)).max(4).default([]) }))
    .max(6)
    .default([]),
  scores: z
    .array(
      z.object({
        dimension: z.string(),
        score: z.number().nullable(),
        quotes: z.array(z.string().max(400)).max(4).default([]),
        improvement: z.string().max(600).default(''),
        uncertainty: z.string().max(400).default(''),
      }),
    )
    .max(10)
    .default([]),
  next_exercise: z.string().max(80).nullable().default(null),
  limitations: z.array(z.string().max(400)).max(6).default([]),
});
export type RawFeedback = z.infer<typeof RawFeedbackSchema>;

export interface Evidence {
  quote: string;
  /** Seconds into the recording, only when the transcription gave real timings. */
  at: number | null;
}

export interface FeedbackComment {
  id: string;
  text: string;
  evidence: Evidence[];
}

export interface DimensionScore {
  dimension: StudioDimension;
  criterion: string;
  status: 'assessed' | 'not_assessed';
  /** A whole number 0 to 10, only when assessed. */
  score: number | null;
  evidence: Evidence[];
  improvement: string;
  uncertainty: string;
  /** Why it was not assessed, in words the learner reads. */
  reason: string | null;
}

export interface Delivery {
  words: number;
  seconds: number;
  wordsPerMinute: number | null;
}

export interface StudioFeedback {
  assessment_version: string;
  exercise_id: string;
  overall_summary: string;
  strengths: FeedbackComment[];
  areas_to_improve: FeedbackComment[];
  scores: DimensionScore[];
  /** Measured from the transcript and the recording's length, never by the AI. */
  delivery: Delivery;
  next_exercise: string | null;
  confidence_limitations: string[];
  /** Comments and marks the AI offered that the recording did not support. */
  dropped: number;
  processing_time_ms: number;
}

export const SUMMARY_WITHHELD =
  'The summary was withheld because it stated law the exercise does not contain. The marks and comments below still stand.';

export const NO_AUTHORITIES =
  'This exercise has no approved legal authorities, so the legal substance of what you said was not assessed.';

export const NO_EVIDENCE = 'Nothing quoted from your recording supports a mark for this, so it was not assessed.';

/** What is always true of this feedback, whatever the AI says. */
export function fixedLimitations(exercise: StudioExercise): string[] {
  return [
    'This is AI-generated feedback, written from a transcript of your recording. It is a practice aid, not a mark, and not a lawyer’s review.',
    'It reads your words only. It does not hear your tone or pace beyond the words-per-minute figure, and it does not see your delivery.',
    'Transcription can mishear names, legal terms and accents. Check the transcript against what you said.',
    ...(exercise.authorities.length === 0 ? [NO_AUTHORITIES] : []),
  ];
}

/**
 * What a learner is shown, from what the AI said. Nothing here trusts the AI:
 *
 *   - a quotation stays only when its words are in the transcript;
 *   - a strength stays only with at least one quotation that stays;
 *   - a mark stays only for a dimension in this exercise's rubric, with a
 *     quotation that stays, and as a whole number 0 to 10; anything else is
 *     "not assessed", with the reason;
 *   - legal reasoning is not assessed without approved authorities;
 *   - any text stating law the exercise does not contain is dropped (or, for
 *     the summary, replaced with a fixed sentence);
 *   - the next exercise is one of those offered, or none;
 *   - no total is computed.
 */
export function groundFeedback(input: {
  raw: RawFeedback;
  exercise: StudioExercise;
  exerciseWording: string;
  transcript: string;
  segments: TranscriptSegment[] | null;
  recordingSeconds: number;
  nextOptions: string[];
  processingMs: number;
}): StudioFeedback {
  const { raw, exercise, transcript, segments } = input;
  const said = normalise(transcript);
  let dropped = 0;

  const statesLaw = (text: string) =>
    statesUncheckedLaw(text, input.exerciseWording, [transcript]) || judgesTheLaw(text);

  const ground = (quotes: string[]): Evidence[] => {
    const out: Evidence[] = [];
    for (const quote of quotes) {
      const q = normalise(quote);
      // Three words at least: "the" is in every transcript.
      if (q.split(' ').length < 3 || !said.includes(q)) {
        dropped += 1;
        continue;
      }
      if (out.some((e) => normalise(e.quote) === q)) continue;
      out.push({ quote: quote.trim(), at: locate(quote, segments) });
    }
    return out;
  };

  const strengths: FeedbackComment[] = [];
  for (const s of raw.strengths) {
    const evidence = ground(s.quotes);
    if (evidence.length === 0 || !s.text.trim() || statesLaw(s.text)) {
      dropped += 1;
      continue;
    }
    strengths.push({ id: `s${strengths.length + 1}`, text: s.text.trim(), evidence });
  }

  const areas: FeedbackComment[] = [];
  for (const a of raw.areas_to_improve) {
    // Something missing cannot be quoted, so an area to improve may stand
    // without a quotation; it still may not state law.
    if (!a.text.trim() || statesLaw(a.text)) {
      dropped += 1;
      continue;
    }
    areas.push({ id: `a${areas.length + 1}`, text: a.text.trim(), evidence: ground(a.quotes) });
  }

  const byDimension = new Map(raw.scores.map((s) => [s.dimension, s]));
  const scores: DimensionScore[] = exercise.rubric.map(({ dimension, criterion }) => {
    const r = byDimension.get(dimension);
    const notAssessed = (reason: string): DimensionScore => ({
      dimension,
      criterion,
      status: 'not_assessed',
      score: null,
      evidence: [],
      improvement: '',
      uncertainty: '',
      reason,
    });
    if (dimension === 'legal_reasoning' && exercise.authorities.length === 0) return notAssessed(NO_AUTHORITIES);
    if (!r || r.score === null || !Number.isFinite(r.score)) return notAssessed(NO_EVIDENCE);
    const evidence = ground(r.quotes);
    if (evidence.length === 0) {
      dropped += 1;
      return notAssessed(NO_EVIDENCE);
    }
    const score = Math.round(r.score);
    if (score < 0 || score > 10) {
      dropped += 1;
      return notAssessed(NO_EVIDENCE);
    }
    const improvement = r.improvement.trim() && !statesLaw(r.improvement) ? r.improvement.trim() : '';
    const uncertainty = r.uncertainty.trim() && !statesLaw(r.uncertainty) ? r.uncertainty.trim() : '';
    return { dimension, criterion, status: 'assessed', score, evidence, improvement, uncertainty, reason: null };
  });
  // Anything the AI marked outside this exercise's rubric is not shown.
  dropped += raw.scores.filter((s) => !exercise.rubric.some((c) => c.dimension === s.dimension)).length;

  const summary = raw.overall_summary.trim();
  const words = wordCount(transcript);
  return {
    assessment_version: ASSESSMENT_VERSION,
    exercise_id: exercise.slug,
    overall_summary: !summary ? '' : statesLaw(summary) ? SUMMARY_WITHHELD : summary,
    strengths,
    areas_to_improve: areas,
    scores,
    delivery: {
      words,
      seconds: input.recordingSeconds,
      wordsPerMinute:
        input.recordingSeconds >= 10 && words > 0 ? Math.round((words / input.recordingSeconds) * 60) : null,
    },
    next_exercise:
      raw.next_exercise && input.nextOptions.includes(raw.next_exercise) ? raw.next_exercise : null,
    confidence_limitations: [
      ...fixedLimitations(exercise),
      ...raw.limitations.map((l) => l.trim()).filter((l) => l && !statesLaw(l)),
    ],
    dropped,
    processing_time_ms: input.processingMs,
  };
}

/** The first JSON object in a model's reply, parsed and checked, or null. */
export function parseRawFeedback(reply: string): RawFeedback | null {
  const start = reply.indexOf('{');
  const end = reply.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const parsed = RawFeedbackSchema.safeParse(JSON.parse(reply.slice(start, end + 1)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Attempts                                                                    */
/* -------------------------------------------------------------------------- */

export type AttemptStatus =
  | 'awaiting_upload'
  | 'uploaded'
  | 'processing'
  | 'feedback'
  | 'failed'
  | 'not_configured'
  | 'deleted';

/** What the learner is told about where an attempt stands. */
export const STATUS_LABELS: Record<AttemptStatus, string> = {
  awaiting_upload: 'Not uploaded',
  uploaded: 'Recorded, no feedback yet',
  processing: 'Feedback being prepared',
  feedback: 'Feedback ready',
  failed: 'Feedback could not be prepared',
  not_configured: 'Recorded; AI feedback is not switched on here',
  deleted: 'Recording deleted',
};

/** 90 reads "90 seconds", 120 reads "2 minutes". */
export function spokenLength(seconds: number): string {
  return seconds % 60 === 0 ? `${seconds / 60} minute${seconds === 60 ? '' : 's'}` : `${seconds} seconds`;
}

/** A request for feedback may start only from these. */
export function mayRequestFeedback(status: AttemptStatus): boolean {
  return status === 'uploaded' || status === 'failed' || status === 'not_configured';
}

/**
 * A processing claim older than this is treated as abandoned (the function
 * running it was stopped), so the learner can try again.
 */
export const PROCESSING_STALE_MS = 3 * 60 * 1000;

/** A coach's mark for one dimension: a whole number 0 to 10, or "not_assessed". */
export const ScoreOverridesSchema = z.record(
  z.enum(['structure', 'clarity', 'persuasiveness', 'responsiveness', 'legal_reasoning']),
  z.union([z.number().int().min(0).max(10), z.literal('not_assessed')]),
);

export const CommentDecisionsSchema = z.record(
  z.string().regex(/^[sa][0-9]{1,2}$/),
  z.enum(['approved', 'rejected']),
);
