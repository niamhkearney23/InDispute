/**
 * The Advocacy Studio's exercises, written in the code like the lessons.
 *
 * Every one is a DRAFT until a lawyer signs it off at Admin, Courts and
 * essays (it is a reference item, src/lib/content/wording.ts), and the
 * sign-off is pinned to a fingerprint of everything here: the task, the
 * facts, the preparation notes, the authorities and the rubric. Change a
 * word and it leaves learners until it is signed again.
 *
 * The facts are invented, and say so. No exercise here cites a statute or a
 * case: there are no approved authorities yet, so "legal reasoning" is not
 * assessed on any of them, and the feedback says so. A lawyer who wants it
 * assessed adds the authorities here and signs the exercise off with them.
 *
 * Never import this file from a 'use client' component: a browser import
 * would ship every draft to every visitor. Pages receive one exercise as a
 * prop, from the server, once it is signed off.
 */

export type StudioDimension =
  | 'structure'
  | 'clarity'
  | 'persuasiveness'
  | 'responsiveness'
  | 'legal_reasoning';

export type StudioCategory =
  | 'opening'
  | 'bail'
  | 'written-to-oral'
  | 'judicial-questions'
  | 'interlocutory'
  | 'closing'
  | 'free';

export interface StudioAuthority {
  /** As a learner should cite it. */
  citation: string;
  /** What it is approved as authority for, in the reviewer's words. */
  proposition: string;
}

export interface StudioCriterion {
  dimension: StudioDimension;
  /** What is being looked for, in the words the feedback and the learner see. */
  criterion: string;
}

export interface StudioExercise {
  /** Lowercase letters, digits and hyphens; the sign-off is recorded under studio-<slug>. */
  slug: string;
  title: string;
  category: StudioCategory;
  /** The language the learner speaks in. Only English is written so far. */
  language: 'en' | 'ms';
  /** Whose learners see it once signed; null for both countries. */
  country: 'MY' | 'AU' | null;
  /** What to do, in a sentence or two. */
  task: string;
  /** The invented facts. Empty for free practice. */
  facts: string[];
  /** What to think about before recording. */
  preparation: string[];
  /** Approved authorities. Empty means legal reasoning is not assessed. */
  authorities: StudioAuthority[];
  /** The longest recording accepted, in seconds. */
  maxSeconds: number;
  /** What the feedback is measured against, dimension by dimension. */
  rubric: StudioCriterion[];
}

/** The four dimensions that need no legal authority to assess. */
const COMMUNICATION_RUBRIC: StudioCriterion[] = [
  {
    dimension: 'structure',
    criterion:
      'The submission has a clear beginning, middle and end: it says what is sought, gives the reasons in an order that can be followed, and closes by asking for it again.',
  },
  {
    dimension: 'clarity',
    criterion:
      'Each point can be understood the first time it is heard: short sentences, no unexplained jargon, and the important propositions stated plainly.',
  },
  {
    dimension: 'persuasiveness',
    criterion:
      'Each proposition is supported by a reason drawn from the facts given, and the obvious answer from the other side is met.',
  },
  {
    dimension: 'responsiveness',
    criterion:
      'The submission does the task that was set, on the facts that were given, and deals with the issues those facts raise.',
  },
];

export const STUDIO_EXERCISES: StudioExercise[] = [
  {
    slug: 'free-practice',
    title: 'Free practice: two minutes on your feet',
    category: 'free',
    language: 'en',
    country: null,
    task:
      'Speak for up to two minutes as if you were addressing a judge in chambers, on any short application you have prepared, read about or made up. Say who you act for, what you ask for, and why.',
    facts: [],
    preparation: [
      'Write down, in one sentence, what you are asking for. Say that sentence first.',
      'Pick no more than three reasons. Number them out loud.',
      'Finish by asking for the order again.',
    ],
    authorities: [],
    maxSeconds: 120,
    rubric: COMMUNICATION_RUBRIC.filter((c) => c.dimension !== 'responsiveness'),
  },
  {
    slug: 'adjournment-opening',
    title: 'Opening an application to adjourn a hearing',
    category: 'interlocutory',
    language: 'en',
    country: 'MY',
    task:
      'You act for the defendant. Open your application to adjourn the trial, which is fixed for next week. Speak for up to ninety seconds.',
    facts: [
      'These facts are invented for practice. They are not a real case.',
      'The plaintiff, a supplier, sues the defendant, a small building company, for unpaid invoices.',
      "The defendant's only witness of fact, its site manager, was admitted to hospital three days ago and will not be discharged before the trial date. A medical letter says so.",
      'The trial has been adjourned once before, at the plaintiff’s request.',
      'The plaintiff opposes a second adjournment because its director is travelling to the hearing from abroad.',
    ],
    preparation: [
      'Say at the start exactly what you ask for, and to when.',
      "Explain why the trial cannot fairly go ahead without the site manager, using only the facts above.",
      "Meet the plaintiff's objection: what can be offered to lessen the inconvenience to its director?",
    ],
    authorities: [],
    maxSeconds: 90,
    rubric: COMMUNICATION_RUBRIC,
  },
  {
    slug: 'judicial-questions',
    title: 'Answering the judge',
    category: 'judicial-questions',
    language: 'en',
    country: 'MY',
    task:
      'Using the adjournment facts below, answer the three questions the judge puts to you, in order. Speak for up to two minutes in all. Answer each question directly before explaining.',
    facts: [
      'These facts are invented for practice. They are not a real case.',
      "You act for the defendant, applying to adjourn next week's trial because its only witness of fact, its site manager, is in hospital. A medical letter says so.",
      'The trial has been adjourned once before, at the plaintiff’s request. The plaintiff opposes a second adjournment.',
      'The judge asks: "One. Why can the site manager not give evidence another way? Two. How long an adjournment do you need, and how do you know? Three. Why should the plaintiff bear the cost of this?"',
    ],
    preparation: [
      'Start each answer with "Yes", "No" or a number where the question allows it.',
      "If you do not know something from the facts, say so rather than inventing it.",
      'Keep each answer under forty seconds.',
    ],
    authorities: [],
    maxSeconds: 120,
    rubric: COMMUNICATION_RUBRIC,
  },
  {
    slug: 'closing-short',
    title: 'A short closing on the facts',
    category: 'closing',
    language: 'en',
    country: 'MY',
    task:
      'You act for the plaintiff supplier. The evidence is finished. Close your case in up to two minutes, using only the facts below.',
    facts: [
      'These facts are invented for practice. They are not a real case.',
      'The plaintiff delivered building materials to the defendant on four occasions. Signed delivery orders exist for all four.',
      'The defendant paid for the first two deliveries and not for the last two.',
      'The defendant says the last two deliveries were defective, but raised no complaint until the plaintiff demanded payment two months later.',
      "The defendant's site manager accepted under cross-examination that the materials from the last two deliveries were used in the building.",
    ],
    preparation: [
      'Tell the judge in one sentence what you want at the end.',
      'Use the signed delivery orders and the site manager’s answer; quote what matters.',
      'Deal with the complaint about defects: what does its timing suggest?',
    ],
    authorities: [],
    maxSeconds: 120,
    rubric: COMMUNICATION_RUBRIC,
  },
];

export function studioExercise(slug: string): StudioExercise | undefined {
  return STUDIO_EXERCISES.find((e) => e.slug === slug);
}

/** The sign-off key for an exercise. */
export function studioKey(slug: string): string {
  return `studio-${slug}`;
}

/** Every word a learner sees, and the rubric the AI is held to, as one string: what is fingerprinted. */
export function studioWording(exercise: StudioExercise): string {
  return JSON.stringify({
    slug: exercise.slug,
    title: exercise.title,
    category: exercise.category,
    language: exercise.language,
    country: exercise.country,
    task: exercise.task,
    facts: exercise.facts,
    preparation: exercise.preparation,
    authorities: exercise.authorities,
    maxSeconds: exercise.maxSeconds,
    rubric: exercise.rubric,
  });
}
