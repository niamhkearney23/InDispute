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
  /**
   * An embedded video for this screen.
   *
   * Optional, and everything works without it: the text is the lesson, and a
   * video that fails to load must not leave a screen with nothing on it. The
   * host is checked at render time against a short list, because this value
   * ends up in an iframe src and an unchecked URL there is somebody else's page
   * running inside yours.
   */
  video?: { url: string; caption?: string };
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
  {
    slug: 'ai-ethics-my-intro',
    moduleSlug: 'ai-ethics-my',
    title: 'What does not change',
    minutes: 3,
    country: 'MY',
    steps: [
      {
        heading: 'The duties are the old ones',
        body: 'Nothing in your professional obligations changed because a machine can draft. Confidentiality, competence and responsibility for your own work apply exactly as before. What is new is the number of ways to breach them without it feeling like a breach at the time.',
        takeaway: 'New tools, same duties.',
      },
      {
        heading: 'The Bar Council has said so',
        body: 'This is not left to inference. Circular No 342/2023 was the Bar Council\u2019s first formal advisory to the Malaysian Bar on generative AI, listing risks including hallucinated citations, bias, threats to client confidentiality and data privacy. Circular No 242/2025 expanded it substantially.',
        takeaway: 'Your regulator has already written this down.',
      },
      {
        heading: 'Pressing enter is sending it',
        body: 'Putting client information into a system run by someone else discloses it to that someone else, and many consumer services reserve the right to keep it and train on it. Section 126 of the Evidence Act 1950 protects professional communications, and that protection assumes you have not handed them to a third party. Removing a name rarely helps, because a matter is usually identifiable from its facts.',
      },
      {
        heading: 'It answers from the wrong country',
        body: 'These systems are trained overwhelmingly on English and American material. Asked a Malaysian question they will often answer confidently from that material, citing an Act that exists somewhere else. The answer is fluent and familiar, which is exactly what makes it dangerous: it takes a Malaysian lawyer to notice the Act named is not the governing one.',
        takeaway: 'Confident and foreign reads exactly like confident and correct.',
      },
      {
        heading: 'The document is still yours',
        body: 'Cause papers filed in your name are your work. The tool owes no duty to the court, cannot be disciplined and cannot be asked to explain itself. If something in it turns out to be wrong, the correction is yours to make and to make promptly, which is survivable in a way that concealing it is not.',
      },
    ],
  },
  {
    slug: 'research-au-intro',
    moduleSlug: 'research-au',
    title: 'How to actually find the law',
    minutes: 3,
    country: 'AU',
    steps: [
      {
        heading: 'Start with a secondary source',
        body: 'Given an unfamiliar area and two hours, do not open a case database. A practitioner text gives you the structure, the vocabulary and the leading authorities in one pass, written by someone who already knows the area. Searching first means guessing at words you do not yet know are the right words.',
        takeaway: 'Secondary to find it. Primary to rely on it.',
      },
      {
        heading: 'Check you have today\u2019s law',
        body: 'Legislation sites publish point-in-time versions, and the one shown by default is not always the one that governs your facts. Two things go wrong: reading today\u2019s text when the conduct happened under an earlier provision, and missing an amendment that has passed but not commenced. Both are invisible unless you look at the compilation date.',
        takeaway: 'Which version, on what date.',
      },
      {
        heading: 'Note the case up',
        body: 'A judgment tells you nothing about what happened to it afterwards. It may since have been distinguished into irrelevance, doubted on appeal, or overruled outright. Noting up traces it forward through the cases that have cited it, and it is not optional for anything you intend to rely on.',
      },
      {
        heading: 'Narrow, do not widen',
        body: 'A thousand results means your search is describing the facts rather than the legal question. Courts do not say the money was not paid back, they say the debt was not discharged. Use the term of art, restrict to appellate courts for statements of principle, and search catchwords rather than full text.',
        takeaway: 'A big result set usually means the wrong words.',
      },
      {
        heading: 'Know when you are done',
        body: 'Stop when different starting points keep returning the same small set of authorities. That convergence is the signal. Stopping at the first case that helps is not research, it is confirmation, and it leaves the contrary authority for the other side to find. Record what you searched and when, because you will be asked how you know.',
        takeaway: 'Stop when the same names arrive by different roads.',
      },
    ],
  },
  {
    slug: 'research-my-intro',
    moduleSlug: 'research-my',
    title: 'How to actually find the law',
    minutes: 3,
    country: 'MY',
    steps: [
      {
        heading: 'Start with a secondary source',
        body: 'Given an unfamiliar area and two hours, do not open a case database. A practitioner text or commentary gives you the structure, the vocabulary and the leading authorities in one pass. Searching first means guessing at words you do not yet know are the right ones.',
        takeaway: 'Secondary to find it. Primary to rely on it.',
      },
      {
        heading: 'Go to the official text',
        body: 'For a federal Act, use the official legislation portal maintained by the Attorney General\u2019s Chambers. A copy on the firm\u2019s shared drive is a snapshot taken on a date nobody recorded, and amending Acts do not update it. The official source is also where you can see whether an amendment has passed, and separately whether it has commenced.',
        takeaway: 'A saved copy is the most convenient wrong answer available.',
      },
      {
        heading: 'Note the case up',
        body: 'A judgment says nothing about what happened to it afterwards. It may have been distinguished, doubted or overruled, and even a Federal Court decision can be departed from by the Federal Court itself. Check the subsequent treatment of anything you intend to rely on.',
      },
      {
        heading: 'Cite what the court will have',
        body: 'Where a reported version exists, cite and quote from it, so your pinpoint references lead the judge to the passage you are relying on. An unreported copy is fine for reading and useless for pinpointing. A summary service is a finding aid, never the thing you rely on.',
      },
      {
        heading: 'Know when you are done',
        body: 'Stop when different starting points keep returning the same authorities. Stopping at the first helpful case is confirmation rather than research. Record which sources you searched, the terms and the date: you will be asked how you know, someone may take the matter over, and the law will move.',
        takeaway: 'Stop when the same names arrive by different roads.',
      },
    ],
  },
];

export function lessonForModule(moduleSlug: string): SeedLesson | null {
  return LESSONS.find((lesson) => lesson.moduleSlug === moduleSlug) ?? null;
}
