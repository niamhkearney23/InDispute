import { createHash } from 'node:crypto';
import { COURT_HIERARCHIES } from '@/content/seed/court-hierarchies';
import type { CourtHierarchy } from '@/content/seed/court-shape';
import { ESSAY_TOPICS, type EssayTopic } from '@/content/seed/essay-topics';
import { lessonContent, type SeedLesson } from '@/content/seed/lessons';
import type { Country } from '@/lib/types';

/**
 * Exactly what a lawyer's sign-off covers, for the legal content that lives
 * in the code rather than the database: lessons, each country's court map,
 * and the comparison essay topics.
 *
 * A sign-off records a fingerprint (SHA-256) of the wording it covers. The
 * fingerprint is worked out from the code as it stands, every time, so
 * changing a word in the code changes the fingerprint, and the old sign-off
 * stops covering it. Nobody has to remember to withdraw anything: the change
 * withdraws it, and learners stop seeing it until a lawyer signs it again.
 *
 * Plain functions with no database and no server-only import, so the tests
 * and the visual check's stand-in database can work out the same
 * fingerprints the app does.
 */

export function fingerprint(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/** The fingerprint a lesson sign-off is pinned to (0032). */
export function lessonHash(lesson: SeedLesson): string {
  return fingerprint(lessonContent(lesson));
}

/* -------------------------------------------------------------------------- */
/* Reference content: court maps and essay topics (0046)                      */
/* -------------------------------------------------------------------------- */

export type ReferenceKind = 'courts' | 'essay';

export interface ReferenceItem {
  /** What the sign-off is recorded under. Lowercase letters, digits and hyphens. */
  key: string;
  kind: ReferenceKind;
  /** What a reviewer calls it. */
  title: string;
  /** The country whose learners see it, or null when it is for both. */
  country: Country | null;
  /** Every word a learner sees, as one string. This is what is fingerprinted. */
  wording: string;
}

export function courtMapKey(country: Country): string {
  return `courts-${country.toLowerCase()}`;
}

export function essayKey(slug: string): string {
  return `essay-${slug}`;
}

/**
 * Every word of a court map a learner can read: the courts, their notes,
 * where each one's appeals go, the row labels and the legend under it.
 */
export function courtMapWording(hierarchy: CourtHierarchy): string {
  return JSON.stringify({
    country: hierarchy.country,
    name: hierarchy.name,
    legend: hierarchy.legend,
    tierLabels: Object.entries(hierarchy.tierLabels).sort(([a], [b]) => Number(a) - Number(b)),
    courts: hierarchy.courts.map((c) => ({
      slug: c.slug,
      name: c.name,
      short: c.short ?? null,
      tier: c.tier,
      appealsTo: c.appealsTo,
      alsoAppealsTo: c.alsoAppealsTo ?? null,
      note: c.note ?? null,
    })),
  });
}

export function essayWording(topic: EssayTopic): string {
  return JSON.stringify({ slug: topic.slug, domain: topic.domain, prompt: topic.prompt });
}

const COUNTRY_NAME: Record<Country, string> = { AU: 'Australia', MY: 'Malaysia' };

export const REFERENCE_ITEMS: ReferenceItem[] = [
  ...(['MY', 'AU'] as const).map((country) => ({
    key: courtMapKey(country),
    kind: 'courts' as const,
    title: `Court map: ${COUNTRY_NAME[country]}`,
    country,
    wording: courtMapWording(COURT_HIERARCHIES[country]),
  })),
  ...ESSAY_TOPICS.map((topic) => ({
    key: essayKey(topic.slug),
    kind: 'essay' as const,
    title: `Essay topic: ${topic.slug.replace(/-au-my$/, '').replace(/-/g, ' ')}`,
    country: null,
    wording: essayWording(topic),
  })),
];

export function referenceByKey(key: string): ReferenceItem | null {
  return REFERENCE_ITEMS.find((item) => item.key === key) ?? null;
}

/** The fingerprint a reference sign-off is pinned to. */
export function referenceHash(item: ReferenceItem): string {
  return fingerprint(item.wording);
}
