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

const RESEARCH_RATIONALE =
  'Nobody is taught this directly, and it is most of what a junior actually ' +
  'does. The method is the same everywhere: get a framework from a secondary ' +
  'source, check that what you are reading is the law today, check what later ' +
  'courts did to it, cite the version the court will have in front of them, and ' +
  'be able to say what you searched and when. Get that right and you can walk ' +
  'into any firm; learn one database instead and you have learned a product.';

export const MODULES: SeedModule[] = [
  {
    slug: 'research-au',
    name: 'Legal research',
    summary: 'Finding the law, checking it is still the law, and being able to say how you know.',
    rationale: RESEARCH_RATIONALE,
    country: 'AU',
    domains: ['legal-research'],
    required: false,
    order: 2,
  },
  {
    slug: 'research-my',
    name: 'Legal research',
    summary: 'Finding the law, checking it is still the law, and being able to say how you know.',
    rationale: RESEARCH_RATIONALE,
    country: 'MY',
    domains: ['legal-research'],
    required: false,
    order: 2,
  },
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
  {
    slug: 'litigation-support-my',
    name: 'Running a file',
    summary:
      'Procedure, evidence and drafting: the parts of a matter a paralegal touches every day.',
    rationale:
      'The work a litigation paralegal actually does on an ordinary day sits in ' +
    'these three areas, and none of them was in a module: the file was in the ' +
    'bank and reachable only by daily training, which never finishes. Daily ' +
    'training is right for staying sharp and no use at all for a firm that needs ' +
    'to say somebody has covered filing, or evidence, or how a pleading is put ' +
    'together, on a date. This gives that work a finishing line.',
    country: 'MY',
    domains: ['civil-procedure', 'evidence', 'drafting'],
    required: false,
    order: 3,
  },
  {
    slug: 'litigation-support-au',
    name: 'Running a file',
    summary:
      'Procedure, evidence and drafting: the parts of a matter a paralegal touches every day.',
    rationale:
      'The work a litigation paralegal actually does on an ordinary day sits in ' +
    'these three areas, and none of them was in a module: the file was in the ' +
    'bank and reachable only by daily training, which never finishes. Daily ' +
    'training is right for staying sharp and no use at all for a firm that needs ' +
    'to say somebody has covered filing, or evidence, or how a pleading is put ' +
    'together, on a date. This gives that work a finishing line.',
    country: 'AU',
    domains: ['civil-procedure', 'evidence', 'drafting'],
    required: false,
    order: 3,
  },
];

export function modulesFor(country: Country): SeedModule[] {
  return MODULES.filter((m) => m.country === country).sort((a, b) => a.order - b.order);
}

export function moduleBySlug(slug: string): SeedModule | null {
  return MODULES.find((m) => m.slug === slug) ?? null;
}
