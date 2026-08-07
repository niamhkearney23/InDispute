import type { Country } from '@/lib/types';

/**
 * Named modules.
 *
 * A module is a set of questions with a name, a reason, and a finishing line.
 * Daily training is adaptive and never ends, which is right for keeping someone
 * sharp and useless for "have they done the induction". A firm needs to be able
 * to say a person has covered something, on a date.
 *
 * Completion is derived from attempts rather than recorded by a button. There
 * is no "mark as complete", because a button records that someone pressed a
 * button. A module is complete when every question in it has been answered
 * correctly at least once, and the date is the date that last became true. That
 * cannot be clicked through, it works backwards over training already done, and
 * there is no separate record to drift out of step with the attempts.
 */

export interface SeedModule {
  slug: string;
  name: string;
  /** One line, shown in the list. */
  summary: string;
  /** Why it exists, shown before starting. */
  rationale: string;
  country: Country;
  /** Questions are drawn from these domains. */
  domains: string[];
  /**
   * Required modules are surfaced until they are finished. Use sparingly: a
   * list of eight required things is a list of no required things.
   */
  required: boolean;
  /** Ordering in the list. */
  order: number;
}

const ETHICS_RATIONALE =
  'Every one of these situations arrives in an ordinary week, usually without ' +
  'announcing itself: a document that needs summarising quickly, a citation ' +
  'that looks right, a bill that has to be recorded. The rules have not changed ' +
  'because the drafting is done by a machine, but the ways of breaking them are ' +
  'new, and most of them do not feel like breaking a rule at the time. That is ' +
  'the reason for covering it before the first week rather than after.';

export const MODULES: SeedModule[] = [
  {
    slug: 'ai-ethics-au',
    name: 'Ethics and AI',
    summary: 'Confidentiality, verification, candour to the court, and who answers for the work.',
    rationale: ETHICS_RATIONALE,
    country: 'AU',
    domains: ['ethics-and-ai'],
    required: true,
    order: 0,
  },
  {
    slug: 'ai-ethics-my',
    name: 'Ethics and AI',
    summary: 'Confidentiality, verification, candour to the court, and who answers for the work.',
    rationale: ETHICS_RATIONALE,
    country: 'MY',
    domains: ['ethics-and-ai'],
    required: true,
    order: 0,
  },
  {
    slug: 'courts-au',
    name: 'Finding the right court',
    summary: 'The hierarchy, what each court may hear, and where an appeal goes.',
    rationale:
      'The first question on any new file is which court it belongs in, and the ' +
      'answer is usually decided by value and by where an appeal would go. ' +
      'Getting it wrong costs the client time and money before anyone has ' +
      'argued anything.',
    country: 'AU',
    domains: ['court-system'],
    required: false,
    order: 1,
  },
  {
    slug: 'courts-my',
    name: 'Finding the right court',
    summary: 'The hierarchy, the two High Courts, the subordinate courts, and where an appeal goes.',
    rationale:
      'Malaysia has two High Courts of equal standing and a subordinate court ' +
      'structure with monetary limits. Both decide where a matter starts and ' +
      'where an appeal from it goes, and neither is guessable from the names.',
    country: 'MY',
    domains: ['court-system'],
    required: false,
    order: 1,
  },
];

export function modulesFor(country: Country): SeedModule[] {
  return MODULES.filter((m) => m.country === country).sort((a, b) => a.order - b.order);
}

export function moduleBySlug(slug: string): SeedModule | null {
  return MODULES.find((m) => m.slug === slug) ?? null;
}
