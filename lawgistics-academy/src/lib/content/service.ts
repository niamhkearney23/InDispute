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
