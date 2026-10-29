import assert from 'node:assert/strict';
import test from 'node:test';
import { STUDIO_EXERCISES, studioExercise, studioWording } from '../src/content/studio/exercises';
import {
  NO_AUTHORITIES,
  NO_EVIDENCE,
  NOTICE_VERSION,
  SUMMARY_WITHHELD,
  chooseMime,
  extensionFor,
  groundFeedback,
  locate,
  mayRecord,
  mayRequestFeedback,
  parseRawFeedback,
  recordingPath,
  spokenLength,
  type RawFeedback,
  type TranscriptSegment,
} from '../src/lib/studio/rules';

/**
 * The Advocacy Studio's rules (0053). The one that matters is groundFeedback:
 * whatever the AI says, a learner is shown only what their own recording
 * supports, and never a statement of law the exercise does not contain.
 */

const exercise = studioExercise('adjournment-opening')!;
const wording = studioWording(exercise);

const TRANSCRIPT =
  'May it please the court, I appear for the defendant. We ask that the trial be adjourned. ' +
  'Our only witness of fact, the site manager, is in hospital and cannot attend. ' +
  'The plaintiff will not be prejudiced by a short delay.';

const SEGMENTS: TranscriptSegment[] = [
  { start: 0, end: 4, text: 'May it please the court, I appear for the defendant.' },
  { start: 4, end: 7.5, text: 'We ask that the trial be adjourned.' },
  { start: 7.5, end: 13, text: 'Our only witness of fact, the site manager, is in hospital and cannot attend.' },
  { start: 13, end: 17, text: 'The plaintiff will not be prejudiced by a short delay.' },
];

function raw(over: Partial<RawFeedback> = {}): RawFeedback {
  return {
    overall_summary: 'A clear, short opening that says what is sought and why.',
    strengths: [{ text: 'You said what you wanted at once.', quotes: ['We ask that the trial be adjourned'] }],
    areas_to_improve: [{ text: 'Meet the plaintiff’s point about travel directly.', quotes: [] }],
    scores: [
      { dimension: 'structure', score: 7, quotes: ['I appear for the defendant'], improvement: 'Close by asking again.', uncertainty: '' },
      { dimension: 'clarity', score: 8, quotes: ['is in hospital and cannot attend'], improvement: '', uncertainty: '' },
    ],
    next_exercise: null,
    limitations: [],
    ...over,
  };
}

function ground(r: RawFeedback, opts: { nextOptions?: string[]; segments?: TranscriptSegment[] | null; seconds?: number } = {}) {
  return groundFeedback({
    raw: r,
    exercise,
    exerciseWording: wording,
    transcript: TRANSCRIPT,
    segments: opts.segments === undefined ? SEGMENTS : opts.segments,
    recordingSeconds: opts.seconds ?? 17,
    nextOptions: opts.nextOptions ?? [],
    processingMs: 1234,
  });
}

test('a quotation stands only when its words are in the transcript', () => {
  const f = ground(
    raw({
      strengths: [
        { text: 'Good opening.', quotes: ['I appear for the defendant'] },
        { text: 'Invented praise.', quotes: ['as the learned authorities make plain'] },
      ],
    }),
  );
  assert.deepEqual(
    f.strengths.map((s) => s.text),
    ['Good opening.'],
    'a strength with no quotation from the recording is not shown',
  );
  assert.ok(f.dropped >= 2, 'the invented quotation and the strength resting on it are both counted as dropped');
});

test('a quotation of fewer than three words is not evidence', () => {
  const f = ground(raw({ strengths: [{ text: 'Nice.', quotes: ['the court'] }] }));
  assert.equal(f.strengths.length, 0);
});

test('a quotation matches despite case and punctuation, and is placed in the recording', () => {
  const f = ground(raw({ strengths: [{ text: 'Plain.', quotes: ['THE SITE MANAGER, IS IN HOSPITAL'] }] }));
  assert.equal(f.strengths.length, 1);
  assert.equal(f.strengths[0].evidence[0].at, 7.5);
  assert.equal(locate('not be prejudiced by a short delay', SEGMENTS), 13);
  assert.equal(locate('words nobody said', SEGMENTS), null);
  assert.equal(locate('I appear for the defendant', null), null, 'no timings are invented without segments');
});

test('marks only for the rubric, with evidence, as whole numbers 0 to 10, and no total', () => {
  const f = ground(
    raw({
      scores: [
        { dimension: 'structure', score: 7.4, quotes: ['I appear for the defendant'], improvement: '', uncertainty: '' },
        { dimension: 'clarity', score: 9, quotes: ['words that were never said here'], improvement: '', uncertainty: '' },
        { dimension: 'persuasiveness', score: 14, quotes: ['will not be prejudiced by a short delay'], improvement: '', uncertainty: '' },
        { dimension: 'charisma', score: 10, quotes: ['I appear for the defendant'], improvement: '', uncertainty: '' },
      ],
    }),
  );
  const by = new Map(f.scores.map((s) => [s.dimension, s]));
  assert.deepEqual([...by.keys()], exercise.rubric.map((c) => c.dimension), 'one entry per rubric dimension, nothing else');
  assert.equal(by.get('structure')!.score, 7);
  assert.equal(by.get('structure')!.status, 'assessed');
  assert.equal(by.get('clarity')!.status, 'not_assessed', 'a mark resting on an invented quotation is not shown');
  assert.equal(by.get('clarity')!.reason, NO_EVIDENCE);
  assert.equal(by.get('persuasiveness')!.status, 'not_assessed', 'a mark out of range is not shown');
  assert.equal(by.get('responsiveness')!.status, 'not_assessed', 'a dimension the AI did not mark is not assessed');
  assert.ok(!('total' in f), 'no total is computed');
});

test('legal reasoning is never assessed without approved authorities', () => {
  const withLaw = { ...exercise, rubric: [...exercise.rubric, { dimension: 'legal_reasoning' as const, criterion: 'x' }] };
  const f = groundFeedback({
    raw: raw({
      scores: [{ dimension: 'legal_reasoning', score: 9, quotes: ['I appear for the defendant'], improvement: '', uncertainty: '' }],
    }),
    exercise: withLaw,
    exerciseWording: studioWording(withLaw),
    transcript: TRANSCRIPT,
    segments: SEGMENTS,
    recordingSeconds: 17,
    nextOptions: [],
    processingMs: 1,
  });
  const legal = f.scores.find((s) => s.dimension === 'legal_reasoning')!;
  assert.equal(legal.status, 'not_assessed');
  assert.equal(legal.reason, NO_AUTHORITIES);
  assert.ok(f.confidence_limitations.includes(NO_AUTHORITIES));
});

test('law the exercise does not contain is never shown', () => {
  const law = 'Under section 15 of the Courts of Judicature Act 1964 the court must grant the adjournment.';
  const f = ground(
    raw({
      overall_summary: law,
      areas_to_improve: [
        { text: 'Cite Order 35 rule 3 of the Rules of Court 2012.', quotes: [] },
        { text: 'Slow down a little.', quotes: [] },
      ],
      limitations: ['Section 99 decides this.', 'The audio was quiet.'],
    }),
  );
  assert.equal(f.overall_summary, SUMMARY_WITHHELD);
  assert.deepEqual(f.areas_to_improve.map((a) => a.text), ['Slow down a little.']);
  assert.ok(!f.confidence_limitations.some((l) => /Section 99/.test(l)));
  assert.ok(f.confidence_limitations.includes('The audio was quiet.'));
  assert.doesNotMatch(JSON.stringify(f), /Courts of Judicature|Order 35|Section 99/);
});

test('the learner’s own words may be quoted back even when they sound like law', () => {
  const transcript = `${TRANSCRIPT} I rely on section 15.`;
  const f = groundFeedback({
    raw: raw({ strengths: [{ text: 'You named your ground: "I rely on section 15."', quotes: ['I rely on section 15'] }] }),
    exercise,
    exerciseWording: wording,
    transcript,
    segments: null,
    recordingSeconds: 20,
    nextOptions: [],
    processingMs: 1,
  });
  assert.equal(f.strengths.length, 1);
});

test('the next exercise is one offered, or none', () => {
  assert.equal(ground(raw({ next_exercise: 'closing-short' }), { nextOptions: ['closing-short'] }).next_exercise, 'closing-short');
  assert.equal(ground(raw({ next_exercise: 'made-up' }), { nextOptions: ['closing-short'] }).next_exercise, null);
});

test('delivery is measured, not judged by the AI', () => {
  const f = ground(raw(), { seconds: 17 });
  assert.equal(f.delivery.words, 41);
  assert.equal(f.delivery.wordsPerMinute, Math.round((41 / 17) * 60));
  assert.equal(ground(raw(), { seconds: 5 }).delivery.wordsPerMinute, null, 'too short to say');
});

test('the fixed limitations are always there', () => {
  const f = ground(raw({ limitations: [] }));
  assert.match(f.confidence_limitations[0], /AI-generated feedback/);
  assert.match(f.confidence_limitations.join(' '), /mishear/);
});

test('a model reply is read only as the expected shape', () => {
  assert.equal(parseRawFeedback('no json here'), null);
  assert.equal(parseRawFeedback('{"overall_summary": 5}'), null);
  const parsed = parseRawFeedback('Here you go: {"overall_summary": "Fine."} Thanks');
  assert.ok(parsed);
  assert.deepEqual(parsed!.strengths, []);
});

test('recordings: the browser’s own format, stored only in the learner’s folder', () => {
  assert.equal(chooseMime('video', (t) => t === 'video/webm'), 'video/webm');
  assert.equal(chooseMime('audio', () => false), null);
  assert.equal(extensionFor('audio/mp4'), 'm4a');
  assert.equal(extensionFor('video/quicktime'), null, 'a type the bucket refuses has no path');
  assert.equal(recordingPath('u1', 'a1', 'video/webm;codecs=vp9,opus'), 'u1/a1/recording.webm');
  assert.equal(recordingPath('u1', 'a1', 'image/png'), null);
});

test('consent: recording needs a yes on the current notice', () => {
  const base = { recording: true, aiProcessing: false, trainerSharing: false, decidedAt: '2026-10-01T00:00:00Z' };
  assert.equal(mayRecord(null), false);
  assert.equal(mayRecord({ ...base, noticeVersion: NOTICE_VERSION }), true);
  assert.equal(mayRecord({ ...base, noticeVersion: '2020-01' }), false, 'a decision on an older notice is asked again');
  assert.equal(mayRecord({ ...base, recording: false, noticeVersion: NOTICE_VERSION }), false);
});

test('feedback is asked for only from a state that can start it', () => {
  assert.equal(mayRequestFeedback('uploaded'), true);
  assert.equal(mayRequestFeedback('failed'), true);
  assert.equal(mayRequestFeedback('not_configured'), true);
  for (const s of ['awaiting_upload', 'processing', 'feedback', 'deleted'] as const) assert.equal(mayRequestFeedback(s), false, s);
});

test('the exercises are honest drafts: invented facts, no authorities, nothing unlabelled', () => {
  const slugs = new Set<string>();
  for (const e of STUDIO_EXERCISES) {
    assert.match(e.slug, /^[a-z0-9-]{3,80}$/);
    assert.ok(!slugs.has(e.slug), `duplicate slug ${e.slug}`);
    slugs.add(e.slug);
    assert.ok(e.maxSeconds > 0 && e.maxSeconds <= 600, e.slug);
    assert.ok(e.rubric.length > 0, e.slug);
    if (e.facts.length) assert.match(e.facts[0], /invented/i, `${e.slug} says its facts are invented`);
    if (e.authorities.length === 0) {
      assert.ok(!e.rubric.some((c) => c.dimension === 'legal_reasoning'), `${e.slug} cannot assess law without authorities`);
    }
    assert.doesNotMatch(studioWording(e), /\u2014/, `${e.slug} has no long dash`);
  }
  assert.equal(spokenLength(90), '90 seconds');
  assert.equal(spokenLength(120), '2 minutes');
  assert.equal(spokenLength(60), '1 minute');
});
