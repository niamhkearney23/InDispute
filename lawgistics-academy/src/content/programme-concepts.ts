/**
 * One concept a day, and the outline of the video that teaches it.
 *
 * The month is twenty working days. Each one teaches a single idea in a
 * short video in the morning, then puts it to work on the training file
 * for the rest of the day (the morning and afternoon in programme-days.ts).
 * The concept is the theory; the file is the practice.
 *
 * The outlines are prompts for the coach recording the video, not a script
 * to read out and not statements of law. They say what to show, what to
 * explain and what to ask, and they leave the legal content in the coach's
 * own words, because that is the part a lawyer has to stand behind. Each
 * ends with one line to remember, which the trainee sees.
 *
 * NOT YET REVIEWED BY THE FIRM. Drafted as a starting set. The coach should
 * read each outline before recording it and change anything that is not how
 * the firm does it.
 */

export interface DayConcept {
  day: number;
  /** The one idea the day teaches. Short enough to be a heading. */
  concept: string;
  /** What the coach covers in the video, in order. Three or four prompts. */
  talkingPoints: string[];
  /** One line the trainee keeps. Shown to them, and the last thing said in the video. */
  remember: string;
}

export const DAY_CONCEPTS: DayConcept[] = [
  // Week one: the file and the facts
  {
    day: 1,
    concept: 'How a file is organised',
    talkingPoints: [
      'Open a real (closed, anonymised) file on camera and name its parts: correspondence, pleadings, documents, attendance notes, bills.',
      'Explain why the order matters to the next person who opens it.',
      'Say what the first hour with a new file is for: read everything once, write nothing.',
      'Show them the training file and what they will do with it over four weeks.',
    ],
    remember: 'Read the whole file once before you write anything.',
  },
  {
    day: 2,
    concept: 'Taking instructions',
    talkingPoints: [
      'Open questions first, closed questions later, and why the order matters.',
      'Take the account by topic, not as one long story, and come back to the gaps.',
      'Separate what the client saw, what they were told, and what they believe.',
      'Ask them to listen for what the client wants, which is not always what they asked for.',
    ],
    remember: 'Write it down the same day, or it did not happen.',
  },
  {
    day: 3,
    concept: 'Facts that have to be proved',
    talkingPoints: [
      'The difference between the client’s story and the facts the case turns on.',
      'In your own words, how you work out what a claim or a defence has to show.',
      'Make a list of those facts, and mark each one proved, disputed or unknown.',
      'Show how the list drives everything that follows this month.',
    ],
    remember: 'A fact nobody can prove is a hope.',
  },
  {
    day: 4,
    concept: 'Reading a document as evidence',
    talkingPoints: [
      'Ask of every document: who made it, when, why, and for whom.',
      'What a document proves, and what people assume it proves.',
      'Messages and screenshots: what you would want to know before relying on one.',
      'Walk through one document from the training file as an example.',
    ],
    remember: 'Ask of every document: who wrote it, and why.',
  },
  {
    day: 5,
    concept: 'Witnesses and reliability',
    talkingPoints: [
      'What a witness saw, what they heard, and what they worked out afterwards.',
      'Interest in the outcome, consistency with the documents, and confidence that outruns knowledge.',
      'How to write down "I am not sure" without losing it.',
      'Debrief: the three things most of them missed this week.',
    ],
    remember: 'A keen witness is not the same as a reliable one.',
  },

  // Week two: the law and the timeline
  {
    day: 6,
    concept: 'Researching from the question',
    talkingPoints: [
      'Write the question down in one sentence before opening anything.',
      'Start from a framework in a secondary source, then go to the primary material.',
      'Check that what you are reading is still the law, and what later courts did with it.',
      'Keep a note of what you searched and when, so somebody can follow it.',
    ],
    remember: 'Write down the question before you open a database.',
  },
  {
    day: 7,
    concept: 'The authority against you',
    talkingPoints: [
      'Why the case that hurts you is the one to find first.',
      'In your own words, what the firm and the court expect of you when an authority goes against the client.',
      'How to deal with it in writing: distinguish it, or say why it does not decide this case.',
      'Ask them to find the strongest point against the client in the training file.',
    ],
    remember: 'Find the case that beats you before the other side does.',
  },
  {
    day: 8,
    concept: 'Writing a recommendation',
    talkingPoints: [
      'Answer first, then the reasons, then the risks, then the next step.',
      'One page a partner can read in two minutes.',
      'How to say "I do not know yet" usefully: what would settle it, and how long it will take.',
      'Show a good memo and a bad one side by side (anonymised).',
    ],
    remember: 'Lead with the answer.',
  },
  {
    day: 9,
    concept: 'Building a chronology',
    talkingPoints: [
      'One fact per line, dated, with its source.',
      'Mark each line undisputed, disputed or to be checked.',
      'How a chronology shows you the gaps nobody noticed.',
      'Build the first five lines of the training file’s chronology on camera.',
    ],
    remember: 'Every line needs a source.',
  },
  {
    day: 10,
    concept: 'Deadlines and the case plan',
    talkingPoints: [
      'Every step has a date and an owner, and both are written down.',
      'How the firm diarises, and why it is done twice.',
      'Check every deadline against the rules yourself; never take a date from a colleague.',
      'Debrief: the spine is done. What the file looks like now that they know it.',
    ],
    remember: 'A deadline nobody owns gets missed.',
  },

  // Week three: drafting
  {
    day: 11,
    concept: 'How a courtroom runs',
    talkingPoints: [
      'The cause list, and the difference between a mention and a hearing.',
      'Who sits where, how to address the court, and when to stand.',
      'What to watch for this morning: how the judge reads the papers.',
      'What a judge does with a pleading when it first lands on the desk.',
    ],
    remember: 'Watch how the judge reads the papers.',
  },
  {
    day: 12,
    concept: 'Pleading the facts',
    talkingPoints: [
      'In your own words, what a pleading is for and what it must and must not contain.',
      'Numbered paragraphs, one allegation each, in an order the reader can follow.',
      'Read a paragraph from the training file’s statement of claim and improve it on camera.',
      'Reading your own drafting as the other side will read it.',
    ],
    remember: 'Every paragraph should be something the other side has to admit or deny.',
  },
  {
    day: 13,
    concept: 'Asking for what you need',
    talkingPoints: [
      'Why vague requests get vague answers, or none.',
      'Tie every request to a fact in issue.',
      'In your own words, when the firm asks for particulars and when it asks for documents.',
      'Draft one request on camera from the training file.',
    ],
    remember: 'Ask for exactly what you need, and say why.',
  },
  {
    day: 14,
    concept: 'Affidavits',
    talkingPoints: [
      'An affidavit is evidence, in the first person, of what the deponent knows.',
      'Exhibits: annexed, numbered, and referred to in the body.',
      'What does not belong in it: argument, and anything the deponent did not see or know.',
      'Common faults you see in first drafts.',
    ],
    remember: 'An affidavit is evidence. Write it like one.',
  },
  {
    day: 15,
    concept: 'Witness statements',
    talkingPoints: [
      'The witness’s story in their own words, in the order it happened.',
      'Following the chronology, and only what they can speak to.',
      'Thinking ahead to what they will be asked in cross-examination.',
      'Debrief: the sentence every first draft this week had.',
    ],
    remember: 'Their words, not yours.',
  },

  // Week four: court
  {
    day: 16,
    concept: 'Bundles',
    talkingPoints: [
      'Paginated, indexed, in an order a judge can follow under pressure.',
      'What goes first, and what nobody needs.',
      'Noting gaps and disputes about documents before the hearing, not at it.',
      'Show a bundle index from a real (closed, anonymised) matter.',
    ],
    remember: 'If the judge cannot find it, it is not there.',
  },
  {
    day: 17,
    concept: 'Structuring an argument',
    talkingPoints: [
      'Frame the issues first, in the judge’s words if you can.',
      'Apply the law to the facts you can prove, issue by issue.',
      'Meet the other side’s best point head on, never their worst.',
      'End on exactly what you are asking the court to do.',
    ],
    remember: 'Answer their best point, not their worst.',
  },
  {
    day: 18,
    concept: 'Speaking to a court',
    talkingPoints: [
      'Three minutes: what to say first, and what to leave for questions.',
      'Signposting, so the judge always knows where you are.',
      'When the judge asks a question, answer it before anything else.',
      'Record yourself once and watch it back. Show them yours.',
    ],
    remember: 'If the judge asks a question, answer it first.',
  },
  {
    day: 19,
    concept: 'Thinking on your feet',
    talkingPoints: [
      'Listening to the question that was asked, not the one you prepared for.',
      'Conceding a small point to keep a big one.',
      'What to do when you do not know: say so, and say when you will.',
      'Debrief the moot from the bench: what persuaded you, and what did not.',
    ],
    remember: 'Concede the small point to keep the big one.',
  },
  {
    day: 20,
    concept: 'Reviewing your own work',
    talkingPoints: [
      'Take one piece from week one and read it now. What would you change?',
      'Which habits from this month to keep, and how.',
      'Where they stand for certification, and what comes next.',
      'Thank them, and say what you saw them get better at.',
    ],
    remember: 'Keep the habits, not the notes.',
  },
];

export function conceptForDay(day: number): DayConcept | null {
  return DAY_CONCEPTS.find((c) => c.day === day) ?? null;
}
