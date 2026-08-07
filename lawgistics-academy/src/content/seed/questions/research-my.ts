import { TRUE_FALSE_OPTIONS, type SeedQuestion } from '../types';

/**
 * Legal research, Malaysia.
 *
 * The method is the same everywhere: secondary source first, check currency,
 * note up, cite the authoritative version, record what you did. What differs is
 * where the material lives and which report series carries weight, so those are
 * what these questions are about.
 *
 * NOT VERIFIED, and drafted without Malaysian legal qualification. Report
 * series and official portals are exactly the kind of detail that changes.
 */
export const RESEARCH_MY_QUESTIONS: SeedQuestion[] = [
  {
    slug: 'my-res-start-secondary',
    domain: 'legal-research',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'MY_GENERAL',
    scenario: 'You are asked to advise on an unfamiliar area and have two hours.',
    stem: 'Where should you start?',
    options: [
      { id: 'a', text: 'A full-text case search on your key words' },
      { id: 'b', text: 'A practitioner text or commentary, to get the framework and the leading authorities' },
      { id: 'c', text: 'The Act, read from section 1' },
      { id: 'd', text: 'A general web search' },
    ],
    correct: ['b'],
    explanation:
      'A secondary source gives you the structure, the vocabulary and the leading cases in one pass. A full-text search asks you to guess the right words before you know them. Go to the primary material second, and always go to it: the commentary tells you what to read, it is not what you cite.',
    whyItMatters:
      'It is the difference between two hours that produce an answer and two hours that produce open tabs.',
    memoryTrick: 'Secondary to find it. Primary to rely on it.',
    concepts: ['research-strategy', 'search-technique'],
    skills: ['strategic-reasoning', 'statutory-analysis'],
  },
  {
    slug: 'my-res-current-legislation',
    domain: 'legal-research',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'Where should you go for the text of a Malaysian federal Act you intend to rely on?',
    options: [
      { id: 'a', text: 'The first result on a web search' },
      { id: 'b', text: 'The official federal legislation portal maintained by the Attorney General’s Chambers' },
      { id: 'c', text: 'A copy saved on the firm’s shared drive' },
      { id: 'd', text: 'A textbook’s appendix' },
    ],
    correct: ['b'],
    explanation:
      'Use the official source. Copies on shared drives and in textbook appendices are snapshots taken on a date nobody recorded, and amending Acts do not update them. The official portal is also where you can see whether an amendment has been passed, and whether it has commenced, which are two different things.',
    whyItMatters:
      'A saved copy of an Act is the most convenient wrong answer available, because it looks exactly like the right one.',
    concepts: ['currency', 'authoritative-sources'],
    skills: ['attention-to-detail', 'statutory-analysis'],
    sourceReference: 'Attorney General’s Chambers, Federal Legislation portal',
  },
  {
    slug: 'my-res-noting-up',
    domain: 'legal-research',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'Before relying on a judgment, what must you check about how it has been treated since?',
    options: [
      { id: 'a', text: 'Whether it has been reported in more than one series' },
      { id: 'b', text: 'Whether later courts have followed, distinguished, doubted or overruled it' },
      { id: 'c', text: 'Whether the judge has since retired' },
      { id: 'd', text: 'Nothing, if it is a Federal Court decision' },
    ],
    correct: ['b'],
    explanation:
      'A judgment says nothing about what happened to it afterwards. It may have been distinguished into irrelevance, doubted on appeal, or overruled. Even a Federal Court decision can be departed from by the Federal Court itself. Subsequent treatment has to be checked, on whatever service the firm uses or by reading the later citing cases.',
    whyItMatters:
      'Citing an overruled case in front of a judge who knows costs you the point and your credibility on the rest.',
    concepts: ['noting-up', 'currency'],
    skills: ['attention-to-detail', 'argument-construction'],
  },
  {
    slug: 'my-res-report-series',
    domain: 'legal-research',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    stem: 'You have an unreported copy of a judgment and a reported version in an established series. Which do you cite and quote from?',
    options: [
      { id: 'a', text: 'The unreported copy, because it is the original' },
      { id: 'b', text: 'The reported version, so the citation and page references match what the court will have' },
      { id: 'c', text: 'Either; it makes no difference' },
      { id: 'd', text: 'A summary of the case' },
    ],
    correct: ['b'],
    explanation:
      'Cite the reported version where one exists, because the court and the other side will be working from it and your page references have to lead them to the passage you are relying on. An unreported copy is fine for reading and useless for pinpointing. A summary is a finding aid, never the thing you rely on.',
    whyItMatters:
      'A pinpoint reference that sends the judge to the wrong page is a small error that reads as a careless one.',
    concepts: ['authoritative-sources'],
    skills: ['attention-to-detail', 'written-communication'],
  },
  {
    slug: 'my-res-search-terms',
    domain: 'legal-research',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario: 'A full-text search returns over a thousand results.',
    stem: 'What is the better move?',
    options: [
      { id: 'a', text: 'Start reading from the top' },
      { id: 'b', text: 'Narrow it: use the legal term of art, restrict the court or the years, and search catchwords rather than full text' },
      { id: 'c', text: 'Try the same words on another service' },
      { id: 'd', text: 'Widen the search in case something was missed' },
    ],
    correct: ['b'],
    explanation:
      'A thousand results means the search is describing the facts rather than the legal question. Courts do not say "the money was not paid back", they say the debt was not discharged. Restricting to the Federal Court and Court of Appeal finds statements of principle rather than applications of them.',
    whyItMatters:
      'Search skill is the difference between an afternoon and a week, and it is rarely taught directly.',
    concepts: ['search-technique', 'research-strategy'],
    skills: ['strategic-reasoning', 'attention-to-detail'],
  },
  {
    slug: 'my-res-record-and-stop',
    domain: 'legal-research',
    type: 'true_false',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'True or false: you should record which sources you searched, the terms you used, and the date.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['true'],
    explanation:
      'True. You will be asked how you know, and "I looked it up" is not an answer. Someone else may take the matter over and would otherwise start from nothing. And the law changes, so a dated note of what was searched is what tells anyone whether the research needs redoing. It also protects you if the research turns out to be wrong.',
    whyItMatters:
      'It is the habit that separates research you can stand behind from research you merely remember doing.',
    concepts: ['recording-research', 'knowing-when-to-stop'],
    skills: ['attention-to-detail', 'professional-judgment'],
  },
];
