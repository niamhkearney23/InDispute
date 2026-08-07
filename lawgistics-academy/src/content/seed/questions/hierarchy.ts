import type { SeedQuestion } from '../types';

/**
 * Questions answered on the drawn hierarchy rather than from a list.
 *
 * The option ids are court slugs from `court-hierarchies.ts`, which is what
 * lets the diagram place them. A slug that does not exist there would render as
 * a court missing from the picture, so a test asserts every one of them.
 *
 * These ask the thing a list cannot: not "which of these four sentences is
 * true" but "where does this sit". Getting an appeal route wrong is a filing in
 * the wrong registry, and it is the kind of error that only shows up under time
 * pressure.
 *
 * NOT VERIFIED, like everything else here.
 */
export const HIERARCHY_QUESTIONS: SeedQuestion[] = [
  /* --- Australia --------------------------------------------------------- */
  {
    slug: 'ch-au-appeal-from-intermediate',
    domain: 'court-system',
    type: 'court_hierarchy',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    stem: 'An appeal from a District or County Court decision ordinarily goes to which court?',
    options: [
      { id: 'hca', text: 'High Court of Australia' },
      { id: 'fca', text: 'Federal Court of Australia' },
      { id: 'supreme-court', text: 'Supreme Court of the State or Territory' },
      { id: 'magistrates', text: 'Magistrates or Local Court' },
    ],
    correct: ['supreme-court'],
    explanation:
      'Appeals run up the hierarchy they belong to. The intermediate court sits below the Supreme Court of its State or Territory, and it is the Supreme Court, ordinarily through its Court of Appeal, that hears appeals from it. The High Court sits above everything but is reached only by special leave, and the Federal Court is a parallel hierarchy rather than a rung in this one.',
    whyItMatters:
      'Filing an appeal in the wrong court wastes time you rarely have, because appeal periods are short and are not extended for the mistake.',
    commonMisconception:
      'Treating the Federal Court as sitting above the State courts. It does not; the two hierarchies meet only at the High Court.',
    concepts: ['court-hierarchy', 'appellate-structure'],
    skills: ['procedural-sequencing'],
    sourceReference: 'Constitution s 73',
  },
  {
    slug: 'ch-au-where-hierarchies-meet',
    domain: 'court-system',
    type: 'court_hierarchy',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    stem: 'The federal and State hierarchies run in parallel. At which court do they meet?',
    options: [
      { id: 'hca', text: 'High Court of Australia' },
      { id: 'fca', text: 'Federal Court of Australia' },
      { id: 'supreme-court', text: 'Supreme Court of the State or Territory' },
      { id: 'fcfcoa', text: 'Federal Circuit and Family Court' },
    ],
    correct: ['hca'],
    explanation:
      'Australia has one common law and one court at the top of it. The Federal Court and the State and Territory Supreme Courts are parallel, neither above the other, and both are subject to the High Court. That single meeting point is what keeps the common law of Australia unified rather than nine separate bodies of law.',
    whyItMatters:
      'It tells you where an argument must ultimately survive, and therefore whether a point is genuinely open. If the High Court has decided it, no court below can decide otherwise.',
    memoryTrick: 'Two ladders, one landing.',
    concepts: ['court-hierarchy', 'federal-jurisdiction', 'appellate-structure'],
    skills: ['argument-construction', 'procedural-sequencing'],
    sourceReference: 'Constitution s 73; Australia Act 1986 (Cth)',
  },
  {
    slug: 'ch-au-small-claim-starts',
    domain: 'court-system',
    type: 'court_hierarchy',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'A client is owed roughly $18,000 on an unpaid invoice. There is no dispute of principle, only non-payment.',
    stem: 'In which court does that claim ordinarily begin?',
    options: [
      { id: 'magistrates', text: 'Magistrates or Local Court' },
      { id: 'intermediate', text: 'District or County Court' },
      { id: 'supreme-court', text: 'Supreme Court of the State or Territory' },
      { id: 'fca', text: 'Federal Court of Australia' },
    ],
    correct: ['magistrates'],
    explanation:
      'Value decides where a civil claim starts. A claim of this size falls within the monetary jurisdiction of the lowest court, which is the Magistrates Court in most States and the Local Court in New South Wales. Starting it higher exposes the client to a costs consequence for using a court more expensive than the claim warranted.',
    whyItMatters:
      'It is the first question on any new file, and getting it wrong costs the client money even when they win.',
    commonMisconception:
      'Choosing a higher court to signal that the claim is serious. The court is chosen by value, and the costs rules will say so.',
    concepts: ['monetary-jurisdiction', 'court-hierarchy'],
    skills: ['procedural-sequencing', 'commercial-reasoning'],
  },

  /* --- Malaysia ---------------------------------------------------------- */
  {
    slug: 'ch-my-apex',
    domain: 'court-system',
    type: 'court_hierarchy',
    difficulty: 1,
    jurisdiction: 'MY_FEDERAL',
    stem: 'Which court sits at the top of the Malaysian hierarchy?',
    options: [
      { id: 'federal-court', text: 'Federal Court of Malaysia' },
      { id: 'court-of-appeal', text: 'Court of Appeal' },
      { id: 'high-court-malaya', text: 'High Court in Malaya' },
      { id: 'sessions-court', text: 'Sessions Court' },
    ],
    correct: ['federal-court'],
    explanation:
      'The Federal Court is the apex court. Below it sits the Court of Appeal, then the two High Courts, then the Sessions Court and the Magistrates Court. Most appeals end at the Court of Appeal in practice, because a further appeal generally requires leave, but that does not make it the final court.',
    whyItMatters:
      'It tells you where a point of principle has to be able to survive, and what binds every court beneath it.',
    concepts: ['my-court-structure', 'court-hierarchy'],
    skills: ['procedural-sequencing', 'argument-construction'],
    sourceReference: 'Federal Constitution art 121; Courts of Judicature Act 1964',
  },
  {
    slug: 'ch-my-appeal-from-sessions',
    domain: 'court-system',
    type: 'court_hierarchy',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'A civil appeal from the Sessions Court goes to which court?',
    options: [
      { id: 'high-court-malaya', text: 'High Court in Malaya' },
      { id: 'court-of-appeal', text: 'Court of Appeal' },
      { id: 'federal-court', text: 'Federal Court of Malaysia' },
      { id: 'magistrates-court', text: 'Magistrates Court' },
    ],
    correct: ['high-court-malaya'],
    explanation:
      'Appeals from the subordinate courts go to the High Court, which exercises appellate as well as original jurisdiction. Only from there can a matter reach the Court of Appeal, and then the Federal Court, subject to the conditions in the Courts of Judicature Act.',
    whyItMatters:
      'Appeal periods are short. Filing in the Court of Appeal because it sounds like the appellate court loses the appeal on a point that has nothing to do with the merits.',
    commonMisconception:
      'Assuming appeals go to the court with "appeal" in its name. From the subordinate courts they do not.',
    concepts: ['my-court-structure', 'appellate-structure'],
    skills: ['procedural-sequencing', 'attention-to-detail'],
    sourceReference: 'Courts of Judicature Act 1964 s 26',
  },
  {
    slug: 'ch-my-two-high-courts',
    domain: 'court-system',
    type: 'court_hierarchy',
    difficulty: 3,
    jurisdiction: 'MY_FEDERAL',
    scenario:
      'A dispute arises in Kuching, Sarawak. A colleague suggests the High Court in Malaya is the senior of the two High Courts and should hear it.',
    stem: 'Which court properly has it?',
    options: [
      { id: 'high-court-sabah-sarawak', text: 'High Court in Sabah and Sarawak' },
      { id: 'high-court-malaya', text: 'High Court in Malaya' },
      { id: 'court-of-appeal', text: 'Court of Appeal' },
      { id: 'federal-court', text: 'Federal Court of Malaysia' },
    ],
    correct: ['high-court-sabah-sarawak'],
    explanation:
      'Article 121 of the Federal Constitution provides for two High Courts of co-ordinate jurisdiction and status: the High Court in Malaya, and the High Court in Sabah and Sarawak. Neither is senior to the other, and each has its own territorial reach. A Sarawak matter belongs to the latter.',
    whyItMatters:
      'It is a constitutional division rather than an administrative one, which is why a decision of one is persuasive on the other rather than binding.',
    commonMisconception:
      'Reading the two High Courts as a head office and a branch. They are equals with different territories.',
    memoryTrick: 'Two High Courts, side by side, not stacked.',
    concepts: ['my-court-structure', 'court-hierarchy'],
    skills: ['procedural-sequencing', 'attention-to-detail'],
    sourceReference: 'Federal Constitution art 121(1)',
  },
];
