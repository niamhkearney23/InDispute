import { TRUE_FALSE_OPTIONS, type SeedQuestion } from '../types';

/**
 * Ethics and AI, Malaysia.
 *
 * The duties are close cousins of the Australian ones, because both descend
 * from the same professional tradition, but they sit in different instruments
 * and are enforced by a different body. Where the underlying obligation is the
 * same the question says so rather than pretending at a distinction; where the
 * source differs the source is named.
 *
 * The Bar Council has issued its own guidance, which these questions cite:
 * Circular No 342/2023 of November 2023, the first formal advisory to the
 * Malaysian Bar on generative AI, and Circular No 242/2025 of July 2025, a
 * substantially expanded update. Naming them matters more here than in the
 * Australian half, because a Malaysian practitioner asked where the obligation
 * comes from should be pointing at their own regulator rather than at a court
 * practice note from another country.
 *
 * NOT VERIFIED, and drafted without any Malaysian legal qualification. Of
 * everything in this repository, an ethics module is the worst thing to be
 * wrong about, because it is the content a learner is most likely to act on
 * directly rather than merely be tested on.
 */
export const ETHICS_AI_MY_QUESTIONS: SeedQuestion[] = [
  {
    slug: 'my-ai-confidentiality',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You paste a client’s instructions, including their name and the sum in dispute, into a free public AI chatbot to have it summarised.',
    stem: 'What is the primary problem?',
    options: [
      { id: 'a', text: 'The summary may be badly written' },
      { id: 'b', text: 'Client information has been disclosed to a third party, which engages your duty of confidentiality' },
      { id: 'c', text: 'It takes longer than doing it yourself' },
      { id: 'd', text: 'Nothing, so long as you read the summary' },
    ],
    correct: ['b'],
    explanation:
      'An advocate and solicitor owes a duty of confidence to the client, reinforced by section 126 of the Evidence Act 1950, which prohibits disclosure of professional communications. Entering the material into a system operated by another party discloses it to that party, and many consumer services reserve the right to retain and use what is entered. Reading the output afterwards does not undo it.',
    whyItMatters:
      'It is the most common way this goes wrong anywhere, and it happens without any intention to disclose.',
    commonMisconception:
      'That removing the client’s name is sufficient. A matter is often identifiable from its facts.',
    memoryTrick: 'Pressing enter is sending it.',
    concepts: ['ai-confidentiality', 'ai-supervision'],
    skills: ['professional-judgment', 'attention-to-detail'],
    sourceReference:
      'Evidence Act 1950 s 126; Legal Profession Act 1976; Bar Council Circular No 342/2023 and Circular No 242/2025 on generative AI',
  },
  {
    slug: 'my-ai-fabricated-citation',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'An AI tool drafts written submissions and cites a Federal Court decision that fits your argument exactly. You cannot find it on any database.',
    stem: 'What should you do?',
    options: [
      { id: 'a', text: 'Cite it anyway; the tool found it somewhere' },
      { id: 'b', text: 'Remove it, and check every other authority in the draft' },
      { id: 'c', text: 'Cite it with a note that it is unverified' },
      { id: 'd', text: 'Ask the tool whether the case is real' },
    ],
    correct: ['b'],
    explanation:
      'These systems produce text shaped like a citation whether or not the case exists. If it cannot be found, treat it as not existing. One fabrication is reason to check all of them, because the same process produced the rest. Asking the tool to confirm its own output achieves nothing; it will confirm it.',
    whyItMatters:
      'Putting a non-existent authority before a court misleads it. Inadvertence is mitigation, not an answer, and the duty to the court is paramount.',
    memoryTrick: 'If you have not read it, you cannot cite it.',
    concepts: ['ai-verification', 'ai-candour'],
    skills: ['professional-judgment', 'attention-to-detail'],
    sourceReference:
      'Bar Council Circular No 342/2023, which lists hallucinated citations first among the risks it identifies',
  },
  {
    slug: 'my-ai-bar-council-guidance',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'Where does the Malaysian Bar’s own guidance on generative AI come from?',
    options: [
      { id: 'a', text: 'There is none; practitioners rely on overseas court practice notes' },
      { id: 'b', text: 'Bar Council circulars, beginning with Circular No 342/2023 and expanded by Circular No 242/2025' },
      { id: 'c', text: 'The Evidence Act 1950 alone' },
      { id: 'd', text: 'The terms of service of the tool being used' },
    ],
    correct: ['b'],
    explanation:
      'The Bar Council issued Circular No 342/2023 in November 2023 as its first formal advisory to the Malaysian Bar on generative AI, identifying risks including hallucinated citations, bias, threats to client confidentiality and data privacy, and security risks. Circular No 242/2025, in July 2025, substantially expanded it. The consistent position across both is that these tools are guidance only: the advocate and solicitor applies their own mind, and bears responsibility for the content and the advice.',
    whyItMatters:
      'Asked where the obligation comes from, the answer should be your own regulator, not a court practice note from another country that does not bind you.',
    commonMisconception:
      'That because the tools are new there is no local guidance yet. There has been since 2023, and it has already been updated once.',
    concepts: ['ai-competence', 'ai-supervision'],
    skills: ['professional-judgment', 'statutory-analysis'],
    sourceReference: 'Bar Council Circular No 342/2023; Bar Council Circular No 242/2025',
  },
  {
    slug: 'my-ai-responsibility',
    domain: 'ethics-and-ai',
    type: 'true_false',
    difficulty: 1,
    jurisdiction: 'MY_GENERAL',
    stem: 'True or false: using an AI tool to prepare cause papers reduces your responsibility for their contents.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['false'],
    explanation:
      'False. A document filed in your name or your firm’s name is your work. The tool owes no duty to the court, cannot be disciplined, and cannot be called to explain itself. Responsibility stays where it was, which means the checking must happen before the document leaves you.',
    whyItMatters:
      'Every other rule in this area follows from this one.',
    concepts: ['ai-supervision', 'ai-verification'],
    skills: ['professional-judgment'],
    sourceReference: 'Legal Profession (Practice and Etiquette) Rules 1978',
  },
  {
    slug: 'my-ai-firm-policy',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'Before using an AI tool on client work, what should you establish first?',
    options: [
      { id: 'a', text: 'Whether it is the newest model available' },
      { id: 'b', text: 'Whether the firm permits it, on what terms, and for what kinds of material' },
      { id: 'c', text: 'Whether other firms are using it' },
      { id: 'd', text: 'Whether the client would find it impressive' },
    ],
    correct: ['b'],
    explanation:
      'The decision about which tools may touch client material, and under what contractual terms the provider holds it, belongs to the firm, not to the individual using it. A junior who adopts a tool privately has made a confidentiality decision on the firm’s behalf without the firm knowing, and usually without reading the terms.',
    whyItMatters:
      'On day one this is the practical rule that prevents most of the other problems in this module.',
    concepts: ['ai-supervision', 'ai-confidentiality'],
    skills: ['professional-judgment'],
  },
  {
    slug: 'my-ai-competence',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'What does competence require of you in relation to a tool you rely on?',
    options: [
      { id: 'a', text: 'Nothing; competence concerns legal knowledge only' },
      { id: 'b', text: 'Knowing what it characteristically gets wrong, and checking for exactly that' },
      { id: 'c', text: 'Being able to explain how the model works technically' },
      { id: 'd', text: 'Only what the client asks about' },
    ],
    correct: ['b'],
    explanation:
      'Competence extends to the means used to do the work. You need not explain the mathematics. You must know the failure modes: that it invents citations, that it is fluent when wrong, that its knowledge has a cutoff and so it does not know recent amendments, and that it cannot tell you which of its answers is unreliable.',
    whyItMatters:
      'The failure modes are knowable, which is what makes not knowing them a choice rather than bad luck.',
    concepts: ['ai-competence', 'ai-verification'],
    skills: ['professional-judgment'],
  },
  {
    slug: 'my-ai-jurisdiction-drift',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You ask an AI tool about the limitation period for a contract claim. It answers confidently, citing an Act, and the answer looks right.',
    stem: 'What is the specific risk for a Malaysian matter?',
    options: [
      { id: 'a', text: 'That it will refuse to answer' },
      { id: 'b', text: 'That it answers from English or another country’s law, which reads as plausible and is the wrong law' },
      { id: 'c', text: 'That the answer will be too detailed' },
      { id: 'd', text: 'There is no particular risk' },
    ],
    correct: ['b'],
    explanation:
      'These systems are trained overwhelmingly on English and American material. Asked a Malaysian question they will often answer from that material, in confident and familiar language, citing an Act that exists somewhere else. The answer is not garbled, which is what makes it dangerous: it looks exactly like a correct answer, and it takes a Malaysian lawyer to notice that the Act named is not the governing one.',
    whyItMatters:
      'It is the failure most likely to catch a Malaysian junior, and it is invisible unless you check the source rather than the tone.',
    memoryTrick: 'Confident and foreign reads exactly like confident and correct.',
    concepts: ['ai-verification', 'ai-competence'],
    skills: ['professional-judgment', 'statutory-analysis'],
  },
  {
    slug: 'my-ai-correcting-the-record',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'Submissions were filed last week. You realise an authority in them does not exist; it came from an unchecked AI draft.',
    stem: 'What do you do?',
    options: [
      { id: 'a', text: 'Say nothing unless the court raises it' },
      { id: 'b', text: 'Tell your supervising partner at once, and correct it with the court' },
      { id: 'c', text: 'File amended submissions without explaining why' },
      { id: 'd', text: 'Wait and see whether the other side notices' },
    ],
    correct: ['b'],
    explanation:
      'An advocate who has misled the court, even inadvertently, must correct it at the earliest opportunity. The duty to the court is paramount and does not yield to embarrassment. Prompt correction is treated very differently from discovery after the fact, and that difference is usually the whole difference.',
    whyItMatters:
      'The instinct to conceal a mistake like this is strong and entirely human. Deciding in advance what you will do is what makes it possible on the day.',
    memoryTrick: 'The mistake is survivable. Concealing it is not.',
    concepts: ['ai-candour', 'ai-verification'],
    skills: ['professional-judgment'],
  },
];
