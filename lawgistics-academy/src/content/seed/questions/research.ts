import { TRUE_FALSE_OPTIONS, type SeedQuestion } from '../types';

/**
 * Legal research, Australia.
 *
 * Written as method rather than as a tour of databases. Which service a firm
 * subscribes to changes, and a junior who has learned one product has learned a
 * product; a junior who has learned to check currency and note up can walk into
 * any firm. Where a source is named it is one that is free and public, so the
 * question is answerable by a student without a subscription.
 *
 * NOT VERIFIED.
 */
export const RESEARCH_QUESTIONS: SeedQuestion[] = [
  {
    slug: 'res-start-secondary',
    domain: 'legal-research',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'You are asked to advise on an area of law you have never worked in. You have two hours.',
    stem: 'Where should you start?',
    options: [
      { id: 'a', text: 'A full-text case search for the key words' },
      { id: 'b', text: 'A secondary source: a practitioner text or looseleaf service, to get the framework and the leading cases' },
      { id: 'c', text: 'The legislation, read from the beginning' },
      { id: 'd', text: 'A general web search' },
    ],
    correct: ['b'],
    explanation:
      'A secondary source gives you the structure of the area, the leading authorities and the vocabulary, in one pass, written by someone who already knows it. Starting with a full-text search means searching for words you do not yet know are the right words, and reading cases without a framework to fit them into. Go to the primary sources second, and always go to them: the text tells you what to read, it is not what you cite.',
    whyItMatters:
      'It is the difference between two hours that produce an answer and two hours that produce forty open tabs.',
    commonMisconception:
      'That starting with a text is somehow cheating. It is the fastest route to the primary material, which is where you finish.',
    memoryTrick: 'Secondary to find it. Primary to rely on it.',
    concepts: ['research-strategy', 'search-technique'],
    skills: ['strategic-reasoning', 'statutory-analysis'],
  },
  {
    slug: 'res-currency-legislation',
    domain: 'legal-research',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    stem: 'You have found the section you need on a legislation website. What must you check before relying on it?',
    options: [
      { id: 'a', text: 'That the Act has a long title' },
      { id: 'b', text: 'That you are looking at the version in force at the relevant date, and whether any amendment is made but not yet commenced' },
      { id: 'c', text: 'That it has been cited by a court' },
      { id: 'd', text: 'Nothing; official sites are always current' },
    ],
    correct: ['b'],
    explanation:
      'Official sites publish point-in-time versions, and the version shown by default is not always the one that applies to your facts. Two things go wrong: reading today’s text when the conduct happened three years ago under a different provision, and missing an amending Act that has been passed but has not commenced. Both are invisible unless you look at the compilation date and the amendment history.',
    whyItMatters:
      'Advising on the wrong version of a section is not a small error. It produces an answer that is confidently and completely wrong.',
    memoryTrick: 'Which version, on what date.',
    concepts: ['currency', 'authoritative-sources'],
    skills: ['attention-to-detail', 'statutory-analysis'],
    sourceUrl: 'https://www.legislation.gov.au',
  },
  {
    slug: 'res-noting-up',
    domain: 'legal-research',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    stem: 'What does it mean to note up a case?',
    options: [
      { id: 'a', text: 'Summarising it for your file note' },
      { id: 'b', text: 'Checking how later courts have treated it: followed, distinguished, doubted or overruled' },
      { id: 'c', text: 'Checking the citation is formatted correctly' },
      { id: 'd', text: 'Finding the first instance decision it came from' },
    ],
    correct: ['b'],
    explanation:
      'Noting up traces a case forward in time. A decision that was good law when it was written may since have been distinguished into irrelevance, doubted by an appellate court, or overruled outright, and nothing on the face of the judgment tells you that. Databases show subsequent treatment; on free services you check later citing cases yourself.',
    whyItMatters:
      'Citing an overruled case in front of a judge who knows it was overruled costs you the point and something harder to get back.',
    memoryTrick: 'The case does not tell you what happened to it afterwards.',
    concepts: ['noting-up', 'currency'],
    skills: ['attention-to-detail', 'argument-construction'],
  },
  {
    slug: 'res-authorised-report',
    domain: 'legal-research',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    stem: 'A case appears in the Commonwealth Law Reports, in an unreported medium neutral version, and in a summary service. Which should you cite?',
    options: [
      { id: 'a', text: 'Whichever you found first' },
      { id: 'b', text: 'The authorised report, the CLR, because that is the version the court treats as authoritative' },
      { id: 'c', text: 'The summary service, because it is shortest' },
      { id: 'd', text: 'All three together' },
    ],
    correct: ['b'],
    explanation:
      'Where an authorised report exists it is the version to cite and to quote from, because it is the one the court accepts and page references must match. The medium neutral citation is used where there is no authorised report, or alongside it. A summary service is a finding aid and is never the thing you rely on, in the same way a headnote is not the ratio.',
    whyItMatters:
      'Quoting a passage from an unauthorised version means your page reference sends the judge to the wrong page, which is a small error that reads as a careless one.',
    concepts: ['authoritative-sources'],
    skills: ['attention-to-detail', 'written-communication'],
  },
  {
    slug: 'res-search-terms',
    domain: 'legal-research',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'A full-text search returns 1,400 results. Your first instinct is to start reading them.',
    stem: 'What is the better move?',
    options: [
      { id: 'a', text: 'Read the first fifty and hope' },
      { id: 'b', text: 'Narrow it: add the legal term of art, restrict the court or the date range, and search the catchwords rather than the full text' },
      { id: 'c', text: 'Search a different database with the same terms' },
      { id: 'd', text: 'Widen it, in case something was missed' },
    ],
    correct: ['b'],
    explanation:
      'Fourteen hundred results means the search is describing the facts rather than the legal question. The fix is usually the term of art: courts do not say "the money was not paid back", they say the debt was not discharged. Restricting to appellate courts finds the statements of principle rather than applications of it, and searching catchwords finds cases about your issue rather than cases that merely mention it.',
    whyItMatters:
      'Search skill is the difference between an afternoon and a week, and nobody is taught it directly.',
    commonMisconception:
      'That a big result set means good coverage. It usually means the wrong words.',
    concepts: ['search-technique', 'research-strategy'],
    skills: ['strategic-reasoning', 'attention-to-detail'],
  },
  {
    slug: 'res-record-what-you-did',
    domain: 'legal-research',
    type: 'true_false',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    stem: 'True or false: you should record which sources you searched, what terms you used, and the date you searched them.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['true'],
    explanation:
      'True, for three reasons. You will be asked how you know, and "I looked it up" is not an answer. Someone else may pick the matter up, and without your record they start from nothing. And the law changes: a note saying which database you searched and when is what lets anyone tell whether the research needs redoing.',
    whyItMatters:
      'It also protects you. Research that turns out to be wrong is a very different conversation when you can show exactly what you searched and when.',
    concepts: ['recording-research'],
    skills: ['attention-to-detail', 'professional-judgment'],
  },
  {
    slug: 'res-when-to-stop',
    domain: 'legal-research',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    stem: 'How do you know when to stop researching?',
    options: [
      { id: 'a', text: 'When you have found a case that agrees with your client' },
      { id: 'b', text: 'When the same authorities keep coming back from different starting points, and you can state the answer and its limits' },
      { id: 'c', text: 'When the time you were given runs out' },
      { id: 'd', text: 'When you have read everything on the topic' },
    ],
    correct: ['b'],
    explanation:
      'The signal is convergence: different search routes and different secondary sources returning the same small set of authorities. At that point more searching is finding the same law again. Stopping at the first helpful case is not research, it is confirmation, and it leaves the contrary authority to be found by the other side. Reading everything is not available on any real matter.',
    whyItMatters:
      'Juniors either stop far too early, at the first case that helps, or never stop at all. Both are expensive, and knowing the signal is what fixes it.',
    memoryTrick: 'Stop when the same names keep arriving by different roads.',
    concepts: ['knowing-when-to-stop', 'research-strategy'],
    skills: ['strategic-reasoning', 'professional-judgment'],
  },
];
