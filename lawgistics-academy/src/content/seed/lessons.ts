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
  /**
   * A question asked before the screen is shown: the learner commits to a
   * guess, then reads why. Guessing first, even wrongly, is what makes the
   * explanation land. The right answer must be what the body goes on to say.
   */
  guess?: LessonGuess;
}

export interface LessonGuess {
  prompt: string;
  /** Two to four. */
  options: Array<{ id: string; text: string }>;
  /** The id of the right option. */
  answer: string;
}

/**
 * The client whose problem the lesson follows. Invented, and said to be: a
 * lesson is teaching, not a case study.
 */
export interface LessonScene {
  /** Who walks in, in a few words. */
  who: string;
  /** What has happened and what you have been asked to do. Two or three sentences. */
  setup: string;
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
  /** The story the lesson follows, shown before the first screen. */
  scene?: LessonScene;
  /**
   * The lesson this one is written to replace. A replacement is shown to
   * nobody but staff until a lawyer has signed it off, and then takes the
   * other one's place.
   */
  replaces?: string;
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
  /* Running a file.
   *
   * Written as craft rather than as rules. The three areas this module covers,
   * procedure, evidence and drafting, are where the jurisdiction-specific
   * detail lives, and stating that detail here would put unverified propositions
   * in front of a learner before a single question has been asked. What a
   * paralegal is missing on day one is not the rule anyway. It is the shape of
   * the work: what a file is for, who reads it, and what each document has to
   * do. The questions carry the provisions, with a citation and a reviewer
   * behind each one.
   */
  {
    slug: 'litigation-support-my-intro',
    moduleSlug: 'litigation-support-my',
    title: 'What running a file actually involves',
    minutes: 3,
    country: 'MY',
    steps: [
      {
        heading: 'A file is for the reader',
        body: 'Everything in a matter is built for somebody who was not there: a partner picking it up at short notice, opposing solicitors, and eventually a judge. The test for any document you produce is whether that person can follow it without asking you a question.',
        takeaway: 'If it only makes sense with you in the room, it is not finished.',
      },
      {
        heading: 'The chronology is the thinking',
        body: 'A chronology looks like admin and is not. Putting events in order, each with the document it comes from, is usually the moment the case stops being a pile of complaints and becomes an argument. Do it early, and keep it current.',
        takeaway: 'Order the facts and the issues tend to appear.',
      },
      {
        heading: 'A bundle is navigation',
        body: 'An indexed bundle exists so that a judge can find a page while counsel is speaking. Pagination, an index that matches, and consistent references are not neatness for its own sake; they are the difference between an argument that lands and one that stalls while everybody hunts.',
        takeaway: 'Build it for the person turning the pages under time pressure.',
      },
      {
        heading: 'Evidence: how does it get in',
        body: 'Before asking whether a document helps, ask how it will be proved and whether it is admissible at all. The Evidence Act 1950 governs that, and the answer changes what you collect and how you record where it came from.',
        takeaway: 'Useful and admissible are different questions.',
      },
      {
        heading: 'Every document has a job',
        body: 'A pleading defines the issues. A witness statement gives evidence in the witness’s own words. A submission argues. Trouble usually starts when one of them tries to do another one’s job, most often a pleading that tells the whole story instead of setting out the case.',
        takeaway: 'Ask what this document is for before you write a line of it.',
      },
    ],
  },
  {
    slug: 'litigation-support-au-intro',
    moduleSlug: 'litigation-support-au',
    title: 'What running a file actually involves',
    minutes: 3,
    country: 'AU',
    steps: [
      {
        heading: 'A file is for the reader',
        body: 'Everything in a matter is built for somebody who was not there: a supervisor picking it up at short notice, the other side, and eventually a judge. The test for any document you produce is whether that person can follow it without asking you a question.',
        takeaway: 'If it only makes sense with you in the room, it is not finished.',
      },
      {
        heading: 'Check which rules apply',
        body: 'Procedure in Australia is not one set of rules. Each court has its own, and the State or Territory changes them again, so the first question on any step is which rules govern this matter in this court. A form or a deadline learned in one court is a guess in another.',
        takeaway: 'The rule you remember is the rule of the court you last worked in.',
      },
      {
        heading: 'The chronology is the thinking',
        body: 'A chronology looks like admin and is not. Putting events in order, each with the document it comes from, is usually the moment the case stops being a pile of complaints and becomes an argument. Do it early, and keep it current.',
        takeaway: 'Order the facts and the issues tend to appear.',
      },
      {
        heading: 'A bundle is navigation',
        body: 'A court book exists so that a judge can find a page while counsel is speaking. Pagination, an index that matches, and consistent references are not neatness for its own sake; they are the difference between an argument that lands and one that stalls while everybody hunts.',
        takeaway: 'Build it for the person turning the pages under time pressure.',
      },
      {
        heading: 'Every document has a job',
        body: 'A pleading defines the issues. An affidavit or witness statement gives evidence. Submissions argue. Trouble usually starts when one of them tries to do another one’s job, most often a pleading that tells the whole story instead of setting out the case.',
        takeaway: 'Ask what this document is for before you write a line of it.',
      },
    ],
  },
];

export function lessonForModule(moduleSlug: string): SeedLesson | null {
  return LESSONS.find((lesson) => lesson.moduleSlug === moduleSlug) ?? null;
}

/**
 * A live lesson retold as a story with a guess before each screen. Every
 * screen's words are carried across from the original exactly as they are,
 * so a rewrite adds a scene and guesses but never a new statement of law;
 * what a reviewer is checking is that each guess and its right answer match
 * the screen it opens.
 */
function retold(
  fromSlug: string,
  story: {
    slug: string;
    title: string;
    minutes: number;
    scene: LessonScene;
    guesses: LessonGuess[];
  },
): SeedLesson {
  const original = LESSONS.find((l) => l.slug === fromSlug);
  if (!original) throw new Error(`No lesson ${fromSlug} to retell`);
  if (story.guesses.length !== original.steps.length) {
    throw new Error(
      `${story.slug} has ${story.guesses.length} guesses for ${original.steps.length} screens`,
    );
  }
  return {
    ...original,
    slug: story.slug,
    title: story.title,
    minutes: story.minutes,
    scene: story.scene,
    replaces: fromSlug,
    steps: original.steps.map((step, i) => ({ ...step, guess: story.guesses[i] })),
  };
}

/**
 * Rewrites waiting for a lawyer: each follows a client through the lesson and
 * asks the learner to guess before each screen. Drafted with AI help, so none
 * of it reaches a learner until somebody has read every screen and signed it
 * off under their own name (Admin, Lessons); until then the lesson it
 * replaces stays where it is.
 */
export const DRAFT_LESSONS: SeedLesson[] = [
  {
    slug: 'ai-ethics-my-story',
    moduleSlug: 'ai-ethics-my',
    replaces: 'ai-ethics-my-intro',
    title: 'The six o\u2019clock email',
    minutes: 4,
    country: 'MY',
    scene: {
      who: 'Puan Rohana, an invented client',
      setup:
        'At six in the evening your supervising partner forwards you an email. Puan Rohana\u2019s company has been served with a writ, and the partner wants a first draft of the defence by nine tomorrow. A colleague leans over: \u201cJust paste the whole file into a free AI chatbot. It will write it in a minute.\u201d',
    },
    steps: [
      {
        heading: 'The duties are the old ones',
        guess: {
          prompt:
            'If you let a chatbot draft Puan Rohana\u2019s defence, do your professional duties change?',
          options: [
            { id: 'a', text: 'Yes: there are new AI duties, and they replace the old ones' },
            {
              id: 'b',
              text: 'No: confidentiality, competence and responsibility for the work apply exactly as before',
            },
            { id: 'c', text: 'Only if Puan Rohana agreed to AI being used' },
          ],
          answer: 'b',
        },
        body: 'Nothing in your professional obligations changed because a machine can draft. Confidentiality, competence and responsibility for your own work apply exactly as before. What is new is the number of ways to breach them without it feeling like a breach at the time, which is exactly how your colleague\u2019s suggestion feels at six in the evening.',
        takeaway: 'New tools, same duties.',
      },
      {
        heading: 'The Bar Council has said so',
        guess: {
          prompt: 'Has the Malaysian Bar Council said anything to the Bar about generative AI?',
          options: [
            { id: 'a', text: 'Not yet: it is left to each firm' },
            { id: 'b', text: 'Yes: it has issued circulars to the Bar on it' },
          ],
          answer: 'b',
        },
        body: 'This is not left to inference. Circular No 342/2023 was the Bar Council\u2019s first formal advisory to the Malaysian Bar on generative AI, listing risks including hallucinated citations, bias, threats to client confidentiality and data privacy. Circular No 242/2025 expanded it substantially.',
        takeaway: 'Your regulator has already written this down.',
      },
      {
        heading: 'Pressing enter is sending it',
        guess: {
          prompt:
            'Your colleague says: \u201cTake Puan Rohana\u2019s name out first and it is anonymous.\u201d Is that right?',
          options: [
            { id: 'a', text: 'Yes: without the name, nobody can tell whose matter it is' },
            {
              id: 'b',
              text: 'No: the matter is usually identifiable from its facts, and pasting it hands it to whoever runs the system',
            },
          ],
          answer: 'b',
        },
        body: 'Putting client information into a system run by someone else discloses it to that someone else, and many consumer services reserve the right to keep it and train on it. Section 126 of the Evidence Act 1950 protects professional communications, and that protection assumes you have not handed them to a third party. Removing a name rarely helps, because a matter is usually identifiable from its facts.',
      },
      {
        heading: 'It answers from the wrong country',
        guess: {
          prompt:
            'You ask a chatbot which Act governs the claim. It names one, confidently, with a section number. What is the risk?',
          options: [
            { id: 'a', text: 'None: a section number means it has checked' },
            {
              id: 'b',
              text: 'It may be answering from English or American material and naming an Act from somewhere else',
            },
          ],
          answer: 'b',
        },
        body: 'These systems are trained overwhelmingly on English and American material. Asked a Malaysian question they will often answer confidently from that material, citing an Act that exists somewhere else. The answer is fluent and familiar, which is exactly what makes it dangerous: it takes a Malaysian lawyer to notice the Act named is not the governing one.',
        takeaway: 'Confident and foreign reads exactly like confident and correct.',
      },
      {
        heading: 'The document is still yours',
        guess: {
          prompt:
            'The defence is filed, and a case cited in it turns out not to exist. Whose problem is that?',
          options: [
            { id: 'a', text: 'The company that runs the chatbot' },
            { id: 'b', text: 'Puan Rohana\u2019s, for not checking it' },
            { id: 'c', text: 'Yours: papers filed in your name are your work' },
          ],
          answer: 'c',
        },
        body: 'Cause papers filed in your name are your work. The tool owes no duty to the court, cannot be disciplined and cannot be asked to explain itself. If something in it turns out to be wrong, the correction is yours to make and to make promptly, which is survivable in a way that concealing it is not.',
        takeaway: 'Whatever helped you write it, you are the one who signed it.',
      },
    ],
  },
  retold('courts-au-intro', {
    slug: 'courts-au-story',
    title: 'Can she go straight to the top?',
    minutes: 4,
    scene: {
      who: 'Ms Tran, an invented client',
      setup:
        'Ms Tran runs a bakery in Ballarat. A supplier sued her for $450,000 in the County Court of Victoria, and she lost. She rings you: \u201cThis is wrong. I want to go straight to the High Court.\u201d Before you answer her, work out how the courts fit together.',
    },
    guesses: [
      {
        prompt: 'Why can Ms Tran ask a higher court to look at her case at all?',
        options: [
          {
            id: 'a',
            text: 'So a decision said to be wrong can be looked at, and so courts below follow the courts above',
          },
          { id: 'b', text: 'So that every case gets heard twice' },
        ],
        answer: 'a',
      },
      {
        prompt: 'Which court sits at the very top in Australia?',
        options: [
          { id: 'a', text: 'The Supreme Court of Victoria' },
          { id: 'b', text: 'The High Court of Australia' },
          { id: 'c', text: 'The Federal Court of Australia' },
        ],
        answer: 'b',
      },
      {
        prompt: 'Is the Federal Court above the Supreme Court of Victoria?',
        options: [
          { id: 'a', text: 'Yes: federal courts outrank State courts' },
          { id: 'b', text: 'No: they run side by side and meet only at the High Court' },
        ],
        answer: 'b',
      },
      {
        prompt: 'What usually decided that the supplier\u2019s claim started in the County Court?',
        options: [
          { id: 'a', text: 'How much it was worth' },
          { id: 'b', text: 'Which court the supplier\u2019s lawyer preferred' },
          { id: 'c', text: 'How long the hearing would take' },
        ],
        answer: 'a',
      },
      {
        prompt: 'So can Ms Tran go straight from the County Court to the High Court?',
        options: [
          { id: 'a', text: 'Yes, if she feels strongly enough' },
          { id: 'b', text: 'No: an appeal ordinarily goes to the court immediately above' },
        ],
        answer: 'b',
      },
    ],
  }),
  retold('courts-my-intro', {
    slug: 'courts-my-story',
    title: 'Which court, and how far?',
    minutes: 4,
    scene: {
      who: 'Encik Hafiz, an invented client',
      setup:
        'Encik Hafiz runs a hardware shop in Kuching. A customer owes him RM 80,000 and will not pay. He asks you two things: \u201cWhich court do we sue in? And if we lose, how far can it go?\u201d',
    },
    guesses: [
      {
        prompt: 'Why are courts arranged with some above others?',
        options: [
          {
            id: 'a',
            text: 'So a decision said to be wrong can be reviewed, and so courts below follow the courts above',
          },
          { id: 'b', text: 'So that every case gets heard twice' },
        ],
        answer: 'a',
      },
      {
        prompt: 'Which is Malaysia\u2019s top court?',
        options: [
          { id: 'a', text: 'The Court of Appeal' },
          { id: 'b', text: 'The Federal Court' },
          { id: 'c', text: 'The High Court in Malaya' },
        ],
        answer: 'b',
      },
      {
        prompt: 'The dispute arose in Kuching. Which High Court has it?',
        options: [
          { id: 'a', text: 'The High Court in Malaya, because it is the senior one' },
          {
            id: 'b',
            text: 'The High Court in Sabah and Sarawak: territory decides, and neither is senior',
          },
        ],
        answer: 'b',
      },
      {
        prompt:
          'What decides whether his claim starts in the Magistrates Court or the Sessions Court?',
        options: [
          { id: 'a', text: 'How much is in dispute' },
          { id: 'b', text: 'Whether the customer is a company' },
        ],
        answer: 'a',
      },
      {
        prompt: 'Is the Syariah court a lower rung, below the Magistrates Court?',
        options: [
          { id: 'a', text: 'Yes: it is the bottom of the same ladder' },
          { id: 'b', text: 'No: it is a different ladder, with its own jurisdiction' },
        ],
        answer: 'b',
      },
    ],
  }),
  retold('ai-ethics-au-intro', {
    slug: 'ai-ethics-au-story',
    title: 'The Thursday night affidavit',
    minutes: 4,
    scene: {
      who: 'Mr Kowalski, an invented client',
      setup:
        'Late on a Thursday your supervisor asks for a first draft of Mr Kowalski\u2019s affidavit by nine tomorrow. A colleague leans over: \u201cPaste the whole file into a free AI chatbot. It will write it in a minute.\u201d',
    },
    guesses: [
      {
        prompt: 'If a chatbot drafts it, do your professional duties change?',
        options: [
          { id: 'a', text: 'Yes: there are new AI duties, and they replace the old ones' },
          {
            id: 'b',
            text: 'No: confidentiality, competence, candour and responsibility for the work apply as before',
          },
        ],
        answer: 'b',
      },
      {
        prompt:
          'Your colleague says: \u201cTake his name out first and it is anonymous.\u201d Is that right?',
        options: [
          { id: 'a', text: 'Yes: without the name, nobody can tell whose matter it is' },
          {
            id: 'b',
            text: 'No: the matter is usually identifiable from its facts, and pasting it discloses it',
          },
        ],
        answer: 'b',
      },
      {
        prompt: 'The draft cites a case you cannot find anywhere. What do you do?',
        options: [
          { id: 'a', text: 'Ask the chatbot to confirm the case exists' },
          {
            id: 'b',
            text: 'Treat it as not existing, and check every other authority in the document',
          },
        ],
        answer: 'b',
      },
      {
        prompt: 'Do all Australian courts have the same rule on using AI?',
        options: [
          { id: 'a', text: 'Yes: there is one national rule' },
          { id: 'b', text: 'No: the principal courts each have a practice note, and they differ' },
        ],
        answer: 'b',
      },
      {
        prompt:
          'The affidavit is filed, and an error the AI introduced is found. Whose is it to fix?',
        options: [
          { id: 'a', text: 'The company that runs the chatbot' },
          { id: 'b', text: 'Yours: a document filed in your name is your work' },
        ],
        answer: 'b',
      },
    ],
  }),
  retold('research-au-intro', {
    slug: 'research-au-story',
    title: 'Two hours to find the law',
    minutes: 4,
    scene: {
      who: 'Ms Okafor, an invented client',
      setup:
        'Ms Okafor lent her brother-in-law $40,000 and he has not paid it back. The partner gives you two hours: \u201cFind me the law on this.\u201d You have never done a debt matter in your life.',
    },
    guesses: [
      {
        prompt: 'Where do you start?',
        options: [
          { id: 'a', text: 'Type the facts into a case database' },
          { id: 'b', text: 'A practitioner text on the area' },
        ],
        answer: 'b',
      },
      {
        prompt:
          'The loan was made years ago. Is the version of the Act a website shows by default the one that governs?',
        options: [
          { id: 'a', text: 'Yes: the website always shows the right one' },
          {
            id: 'b',
            text: 'Not necessarily: check which version applied on the date that matters',
          },
        ],
        answer: 'b',
      },
      {
        prompt: 'You find a case that helps. Can you rely on it straight away?',
        options: [
          { id: 'a', text: 'Yes: it is a judgment, so it is the law' },
          { id: 'b', text: 'Not until you have checked what has happened to it since' },
        ],
        answer: 'b',
      },
      {
        prompt:
          'Searching \u201cbrother-in-law did not pay back the money\u201d gives a thousand results. What is wrong?',
        options: [
          { id: 'a', text: 'Nothing: read them all' },
          {
            id: 'b',
            text: 'You are describing the facts, not the legal question; use the term of art',
          },
        ],
        answer: 'b',
      },
      {
        prompt: 'When can you stop?',
        options: [
          { id: 'a', text: 'At the first case that helps Ms Okafor' },
          { id: 'b', text: 'When different starting points keep returning the same authorities' },
        ],
        answer: 'b',
      },
    ],
  }),
  retold('research-my-intro', {
    slug: 'research-my-story',
    title: 'Two hours to find the law',
    minutes: 4,
    scene: {
      who: 'Encik Lim, an invented client',
      setup:
        'Encik Lim\u2019s contractor walked off his renovation half-way through, with the money paid. The partner gives you two hours: \u201cFind me the law on this.\u201d You have never done a construction dispute.',
    },
    guesses: [
      {
        prompt: 'Where do you start?',
        options: [
          { id: 'a', text: 'Type the facts into a case database' },
          { id: 'b', text: 'A practitioner text or commentary on the area' },
        ],
        answer: 'b',
      },
      {
        prompt:
          'A colleague points you to a copy of the Act on the firm\u2019s shared drive. Good enough?',
        options: [
          { id: 'a', text: 'Yes: an Act is an Act' },
          {
            id: 'b',
            text: 'No: use the official portal; a saved copy may not show later amendments',
          },
        ],
        answer: 'b',
      },
      {
        prompt: 'You find a Federal Court decision that helps. Safe to rely on without checking?',
        options: [
          { id: 'a', text: 'Yes: nothing can change a Federal Court decision' },
          {
            id: 'b',
            text: 'No: check its subsequent treatment, because even the Federal Court can depart from it',
          },
        ],
        answer: 'b',
      },
      {
        prompt: 'You have an unreported copy, and a reported version exists. Which do you cite?',
        options: [
          { id: 'a', text: 'The unreported copy you already have' },
          {
            id: 'b',
            text: 'The reported version, so your pinpoints lead the judge to the passage',
          },
        ],
        answer: 'b',
      },
      {
        prompt: 'When can you stop?',
        options: [
          { id: 'a', text: 'At the first case that helps Encik Lim' },
          { id: 'b', text: 'When different starting points keep returning the same authorities' },
        ],
        answer: 'b',
      },
    ],
  }),
  retold('litigation-support-my-intro', {
    slug: 'litigation-support-my-story',
    title: 'The box file',
    minutes: 4,
    scene: {
      who: 'Puan Siti, an invented client',
      setup:
        'Your first week. A partner puts a box file on your desk: Puan Siti\u2019s company is suing its former distributor. \u201cGet this into shape for the hearing,\u201d the partner says, and leaves.',
    },
    guesses: [
      {
        prompt: 'Who are you really organising this file for?',
        options: [
          { id: 'a', text: 'Yourself, so you can find things' },
          {
            id: 'b',
            text: 'Someone who was not there: the partner, the other side, eventually a judge',
          },
        ],
        answer: 'b',
      },
      {
        prompt: 'Is the chronology just admin, to tidy up at the end?',
        options: [
          { id: 'a', text: 'Yes: it is what juniors do last' },
          {
            id: 'b',
            text: 'No: putting events in order with their source is often when the case becomes an argument',
          },
        ],
        answer: 'b',
      },
      {
        prompt: 'Why does the bundle need page numbers and an index that matches?',
        options: [
          { id: 'a', text: 'It looks more professional' },
          { id: 'b', text: 'So a judge can find a page while counsel is speaking' },
        ],
        answer: 'b',
      },
      {
        prompt:
          'Puan Siti gives you a printout of a chat that helps her case. What is the first question?',
        options: [
          { id: 'a', text: 'How much it helps' },
          { id: 'b', text: 'How it will be proved, and whether it is admissible at all' },
        ],
        answer: 'b',
      },
      {
        prompt:
          'The draft statement of claim tells the whole story from the day they met. Problem?',
        options: [
          { id: 'a', text: 'No: more detail is always better' },
          {
            id: 'b',
            text: 'Yes: a pleading sets out the case; telling the story is another document\u2019s job',
          },
        ],
        answer: 'b',
      },
    ],
  }),
  retold('litigation-support-au-intro', {
    slug: 'litigation-support-au-story',
    title: 'The box file',
    minutes: 4,
    scene: {
      who: 'Mr Nguyen, an invented client',
      setup:
        'Your first week. Your supervisor puts a box file on your desk: a former business partner is suing Mr Nguyen. \u201cGet this into shape,\u201d your supervisor says, and leaves.',
    },
    guesses: [
      {
        prompt: 'Who are you really organising this file for?',
        options: [
          { id: 'a', text: 'Yourself, so you can find things' },
          {
            id: 'b',
            text: 'Someone who was not there: your supervisor, the other side, eventually a judge',
          },
        ],
        answer: 'b',
      },
      {
        prompt: 'You remember a deadline from a different court. Can you use it on this file?',
        options: [
          { id: 'a', text: 'Yes: procedure is the same across Australia' },
          { id: 'b', text: 'Not without checking: each court has its own rules' },
        ],
        answer: 'b',
      },
      {
        prompt: 'Is the chronology just admin, to tidy up at the end?',
        options: [
          { id: 'a', text: 'Yes: it is what juniors do last' },
          {
            id: 'b',
            text: 'No: putting events in order with their source is often when the case becomes an argument',
          },
        ],
        answer: 'b',
      },
      {
        prompt: 'Why does the court book need page numbers and an index that matches?',
        options: [
          { id: 'a', text: 'It looks more professional' },
          { id: 'b', text: 'So a judge can find a page while counsel is speaking' },
        ],
        answer: 'b',
      },
      {
        prompt:
          'The draft statement of claim tells the whole story from the day they met. Problem?',
        options: [
          { id: 'a', text: 'No: more detail is always better' },
          {
            id: 'b',
            text: 'Yes: a pleading sets out the case; telling the story is another document\u2019s job',
          },
        ],
        answer: 'b',
      },
    ],
  }),
];

/** Every lesson, live or waiting for sign-off. */
export const ALL_LESSONS: SeedLesson[] = [...LESSONS, ...DRAFT_LESSONS];

export function lessonBySlug(slug: string): SeedLesson | null {
  return ALL_LESSONS.find((lesson) => lesson.slug === slug) ?? null;
}

/**
 * Exactly what a sign-off covers: every word a learner sees, and nothing
 * else. A sign-off is pinned to this, so changing any of it (a word, a guess,
 * which answer is right) means it has to be signed off again.
 */
export function lessonContent(lesson: SeedLesson): string {
  return JSON.stringify({
    slug: lesson.slug,
    title: lesson.title,
    scene: lesson.scene ?? null,
    steps: lesson.steps.map((s) => ({
      heading: s.heading,
      body: s.body,
      takeaway: s.takeaway ?? null,
      diagram: Boolean(s.diagram),
      video: s.video ?? null,
      guess: s.guess ?? null,
    })),
  });
}

/**
 * The lesson a module shows, given which lessons are signed off as they
 * stand now. A signed-off rewrite takes its original's place; an unsigned
 * one is shown to nobody but staff, from Admin, Lessons.
 */
export function lessonToShow(
  moduleSlug: string,
  signedOff: (slug: string) => boolean,
): SeedLesson | null {
  const rewrite = DRAFT_LESSONS.find((l) => l.moduleSlug === moduleSlug && signedOff(l.slug));
  return rewrite ?? lessonForModule(moduleSlug);
}
