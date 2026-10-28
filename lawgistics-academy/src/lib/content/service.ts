import 'server-only';
import { cache } from 'react';
import { COURT_HIERARCHIES } from '@/content/seed/court-hierarchies';
import type { CourtHierarchy } from '@/content/seed/court-shape';
import { essayTopic, type EssayTopic } from '@/content/seed/essay-topics';
import { getLearnerProfile } from '@/lib/learner-overview';
import { currentSignOffs } from '@/lib/lessons/signoff';
import { currentReferenceSignOffs } from '@/lib/content/signoff';
import { MAXIMS_KEY, courtMapKey, essayKey, maxims, type Maxim } from '@/lib/content/wording';
import { staffSessionChecked } from '@/lib/auth/two-step-server';
import { forViewer, isStaff, lessonForViewer, type LessonForViewer, type Shown } from '@/lib/content/gate';
import type { Country } from '@/lib/types';
import {
  STUDIO_EXERCISES,
  studioExercise,
  studioKey,
  studioWording,
  type StudioExercise,
} from '@/content/studio/exercises';
import { fingerprint } from '@/lib/content/wording';

/**
 * What legal content a person may be shown, decided on the server.
 *
 * Every page that shows a lesson, a court map or an essay topic asks here
 * rather than importing the content itself, so the rule in gate.ts is
 * applied before anything is sent to the browser: an item a learner may not
 * see is never in the page at all, not merely hidden.
 *
 * The sign-offs are read once per request (React's cache), because the
 * layout asks about the court map for the menu and the page may ask again.
 */

const lessonSignOffs = cache(currentSignOffs);
const referenceSignOffs = cache(currentReferenceSignOffs);

/**
 * Whether this person sees unsigned content, labelled: staff, with the code
 * typed on this session (0047's rule, which the database applies to the same
 * reads). False if unknown.
 */
export const viewerIsStaff = cache(async (userId: string): Promise<boolean> => {
  if (!isStaff(await getLearnerProfile(userId))) return false;
  return staffSessionChecked(userId);
});

/** A country's court map, if this person may see it. */
export async function courtMapFor(
  country: Country,
  staff: boolean,
): Promise<Shown<CourtHierarchy> | null> {
  const signed = await referenceSignOffs();
  return forViewer(COURT_HIERARCHIES[country], signed.has(courtMapKey(country)), staff);
}

/** Both countries' court maps, each only if this person may see it. */
export async function courtMapsFor(
  staff: boolean,
): Promise<Partial<Record<Country, Shown<CourtHierarchy>>>> {
  const [au, my] = await Promise.all([courtMapFor('AU', staff), courtMapFor('MY', staff)]);
  return { ...(au ? { AU: au } : {}), ...(my ? { MY: my } : {}) };
}

/** The lesson for a module, if this person may see it. */
export async function lessonFor(moduleSlug: string, staff: boolean): Promise<LessonForViewer> {
  const signed = await lessonSignOffs();
  return lessonForViewer(moduleSlug, (slug) => signed.has(slug), staff);
}

export interface EssayForViewer {
  topic: Shown<EssayTopic> | null;
  /** A topic was assigned but is waiting for a lawyer's check. */
  waiting: boolean;
}

/** An assigned comparison essay topic, if this person may see it. */
export async function essayFor(slug: string | null | undefined, staff: boolean): Promise<EssayForViewer> {
  const topic = slug ? essayTopic(slug) : undefined;
  if (!topic) return { topic: null, waiting: false };
  const signed = await referenceSignOffs();
  const shown = forViewer(topic, signed.has(essayKey(topic.slug)), staff);
  return { topic: shown, waiting: shown === null };
}

/**
 * The twenty rules for the sign-in pages, only once a lawyer has signed off
 * their wording. Those pages are seen signed out, so nobody is staff there:
 * unsigned, or if the sign-offs cannot be read, there are no rules at all.
 */
export async function signedMaxims(): Promise<Maxim[] | null> {
  try {
    const signed = await referenceSignOffs();
    return signed.has(MAXIMS_KEY) ? maxims() : null;
  } catch {
    return null;
  }
}

/** An Advocacy Studio exercise as a person may be shown it, with the fingerprint of its wording. */
export interface StudioExerciseForViewer {
  exercise: StudioExercise;
  /** False only for staff looking at a draft no lawyer has signed off. */
  checked: boolean;
  /** SHA-256 of the wording and rubric as they stand (what an attempt pins). */
  hash: string;
}

function studioShown(
  exercise: StudioExercise,
  signed: Set<string>,
  country: Country,
  staff: boolean,
): StudioExerciseForViewer | null {
  if (!staff && exercise.country !== null && exercise.country !== country) return null;
  const shown = forViewer(exercise, signed.has(studioKey(exercise.slug)), staff);
  return shown ? { exercise: shown.item, checked: shown.checked, hash: fingerprint(studioWording(exercise)) } : null;
}

/**
 * The Studio exercises this person may use (0053): to a learner, only those
 * a lawyer has signed off in their current wording, for their country; to
 * staff with the code typed, every one, drafts labelled. A sign-off that
 * cannot be read counts as none.
 */
export async function studioExercisesFor(country: Country, staff: boolean): Promise<StudioExerciseForViewer[]> {
  let signed: Set<string>;
  try {
    signed = new Set((await referenceSignOffs()).keys());
  } catch {
    signed = new Set();
  }
  return STUDIO_EXERCISES.map((e) => studioShown(e, signed, country, staff)).filter(
    (e): e is StudioExerciseForViewer => e !== null,
  );
}

/** One Studio exercise, if this person may use it. */
export async function studioExerciseFor(
  slug: string,
  country: Country,
  staff: boolean,
): Promise<StudioExerciseForViewer | null> {
  const exercise = studioExercise(slug);
  if (!exercise) return null;
  let signed: Set<string>;
  try {
    signed = new Set((await referenceSignOffs()).keys());
  } catch {
    signed = new Set();
  }
  return studioShown(exercise, signed, country, staff);
}
