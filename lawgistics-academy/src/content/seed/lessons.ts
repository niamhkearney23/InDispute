import type { Country } from '@/lib/types';

/**
 * Lessons: a few minutes of teaching before the questions.
 *
 * The brief was "a motion video sort of thing". This is not video, on purpose.
 * A video of a court hierarchy cannot be corrected when a court is renamed,
 * cannot be checked by any test, cannot be searched, needs hosting, and takes a
 * day to reshoot for one wrong sentence. Everything in this repository that
 * states law is data that a reviewer can fix in one line, and a lesson is the
 * last place to abandon that.
 *
 * What it keeps from video is the pacing. One idea to a screen, revealed when
 * the learner is ready for it, rather than a page of prose to scroll. A screen
 * can carry the court hierarchy diagram, so the thing being explained is drawn
 * next to the explanation rather than described in words.
 *
 * Kept deliberately short. Six screens is the ceiling: a lesson that outlasts
 * someone's attention has taught them nothing and cost them the quiz as well.
 */

export interface LessonStep {
  /** Four or five words. It is a signpost, not a sentence. */
  heading: string;
  /** Two or three sentences. If it needs four, it is two steps. */
  body: string;
  /** Draws the country's court hierarchy beside the text. */
  diagram?: boolean;
  /** A line worth remembering after the rest has faded. */
  takeaway?: string;
}

export interface SeedLesson {
  slug: string;
  /** The module this belongs to. */
  moduleSlug: string;
  title: string;
  /** Honest reading time, so nobody starts one they cannot finish. */
  minutes: number;
  country: Country;
  steps: LessonStep[];
}

export const LESSONS: SeedLesson[] = [
  {
    slug: 'courts-au-intro',
    moduleSlug: 'courts-au',
    title: 'How the courts fit together',
    minutes: 3,
    country: 'AU',
    steps: [
      {
        heading: 'Why there is an order at all',
        body: 'Courts are arranged with some above others for two reasons. A party who says a decision was wrong can have it looked at by a court above. And the law stays consistent, because courts below must follow what courts above have decided. Without that, the same question could be answered differently in two courtrooms on the same street.',
        takeaway: 'Higher courts correct, and higher courts set the rule.',
      },
      {
        heading: 'One country, one top court',
        body: 'The High Court of Australia sits above everything, federal and State alike. It is what keeps a single common law across the whole country rather than nine separate versions of it. Getting there generally requires special leave, so most cases never do.',
        diagram: true,
      },
      {
        heading: 'Two ladders, not one',
        body: 'The Federal Court and the State and Territory Supreme Courts run in parallel. Neither is above the other. They are separate hierarchies handling different work, and they meet only at the High Court.',
        diagram: true,
        takeaway: 'The Federal Court does not sit above the State courts.',
      },
      {
        heading: 'Value decides where you start',
        body: 'Below the Supreme Court sit the intermediate court, called the County Court in Victoria and the District Court in most other States, and below that the Magistrates or Local Court. Which one a civil claim begins in is usually decided by how much it is worth. Tasmania, the ACT and the Northern Territory have no intermediate court at all.',
        diagram: true,
      },
      {
        heading: 'Appeals go up one step',
        body: 'An appeal ordinarily goes to the court immediately above the one that decided the case, not straight to the top. From the Magistrates Court to the intermediate court, from there to the Supreme Court, and only then, with leave, towards the High Court.',
        takeaway: 'Up one rung at a time.',
      },
    ],
  },
  {
    slug: 'courts-my-intro',
    moduleSlug: 'courts-my',
    title: 'How the courts fit together',
    minutes: 3,
    country: 'MY',
    steps: [
      {
        heading: 'Why there is an order at all',
        body: 'Courts are arranged with some above others so that a decision said to be wrong can be reviewed by a court above, and so that the law stays consistent, because courts below must follow what courts above have decided.',
        takeaway: 'Higher courts correct, and higher courts set the rule.',
      },
      {
        heading: 'The Federal Court is the top',
        body: 'The Federal Court of Malaysia is the apex court. Below it is the Court of Appeal, which is where most appeals actually end, because a further appeal to the Federal Court generally requires leave.',
        diagram: true,
      },
      {
        heading: 'Two High Courts, side by side',
        body: 'Article 121 of the Federal Constitution provides for two High Courts of equal standing: the High Court in Malaya, and the High Court in Sabah and Sarawak. Neither is senior to the other. Each has its own territory, so where the matter arises decides which one has it.',
        diagram: true,
        takeaway: 'Equal, not stacked. Territory decides, not seniority.',
      },
      {
        heading: 'The subordinate courts',
        body: 'Below the High Courts sit the Sessions Court and then the Magistrates Court, both constituted under the Subordinate Courts Act 1948. Which one a civil claim starts in is decided by how much is in dispute, and each has a monetary limit.',
        diagram: true,
      },
      {
        heading: 'The Syariah courts are separate',
        body: 'Syariah courts exist but are not a rung on this ladder. They are State courts with jurisdiction over Muslims in the matters listed in the State List, and article 121(1A) provides that the civil High Courts have no jurisdiction in those matters. It is a division of jurisdiction, not a ranking.',
        takeaway: 'A different ladder, not a lower rung.',
      },
    ],
  },
  {
    slug: 'ai-ethics-au-intro',
    moduleSlug: 'ai-ethics-au',
    title: 'What does not change',
    minutes: 3,
    country: 'AU',
    steps: [
      {
        heading: 'The duties are the old ones',
        body: 'Nothing in your professional obligations changed because a machine can draft. Confidentiality, competence, candour to the court and responsibility for your own work all apply exactly as before. What is new is the number of ways to breach them without feeling like you are breaching anything.',
        takeaway: 'New tools, same duties.',
      },
      {
        heading: 'Pressing enter is sending it',
        body: 'Putting client information into a system run by someone else discloses it to that someone else, and many consumer services reserve the right to keep it and train on it. Checking the output afterwards does not undo that. Anonymising a name often does not either, because a matter is usually identifiable from its facts.',
      },
      {
        heading: 'It invents citations',
        body: 'These systems produce text shaped like a case reference whether or not the case exists. If you cannot find it, treat it as not existing, and check every other authority in the same document, because the same process produced them all. Asking the tool to confirm its own answer is worthless.',
        takeaway: 'If you have not read it, you cannot cite it.',
      },
      {
        heading: 'The courts have rules now',
        body: 'As at August 2026 the principal Australian courts each have a practice note on generative AI, and they do not say the same things. The Supreme Court of New South Wales prohibits using it to generate the content of affidavits and witness statements. The Supreme Court of Victoria requires you to be able to identify which parts of a document it produced and explain how you checked them.',
        takeaway: 'Read the practice note for the court you are in.',
      },
      {
        heading: 'The document is still yours',
        body: 'A document filed in your name is your work. The tool owes no duty to the court, cannot be disciplined and cannot be asked to explain itself. If something in it turns out to be wrong, the correction is yours to make, promptly, and that is survivable in a way that concealing it is not.',
      },
    ],
  },
];

export function lessonForModule(moduleSlug: string): SeedLesson | null {
  return LESSONS.find((lesson) => lesson.moduleSlug === moduleSlug) ?? null;
}
