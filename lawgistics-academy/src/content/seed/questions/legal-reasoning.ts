import { TRUE_FALSE_OPTIONS, type SeedQuestion } from '../types';

export const LEGAL_REASONING_QUESTIONS: SeedQuestion[] = [
  {
    slug: 'lr-ratio-decidendi',
    domain: 'legal-reasoning',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    stem: 'Which part of a judgment is capable of binding a later court?',
    options: [
      { id: 'a', text: 'The whole of the reasons for judgment' },
      { id: 'b', text: 'The ratio decidendi — the legal principle necessary to the decision on the facts found' },
      { id: 'c', text: 'The headnote prepared by the law reporter' },
      { id: 'd', text: 'The orders made at the end of the judgment' },
    ],
    correct: ['b'],
    explanation:
      'Only the ratio decidendi binds: the proposition of law necessary to the court’s decision on the facts it found. Everything else in the reasons — observations on hypothetical facts, comments on arguments not needed for the outcome — is obiter dicta and is persuasive only. The headnote is the reporter’s summary and has no authority at all. The orders bind the parties, but they are not a statement of legal principle.',
    whyItMatters:
      'Identifying the ratio is the core skill of using case law. Citing an obiter passage as though it were binding is an error a judge will correct, usually in front of your client.',
    commonMisconception:
      'Quoting the headnote. It is a research aid written by an editor, not part of the judgment.',
    memoryTrick:
      'Necessary to the decision, on the facts found. If the case would have come out the same without it, it is obiter.',
    concepts: ['ratio-and-obiter'],
    skills: ['argument-construction', 'attention-to-detail'],
  },
  {
    slug: 'lr-obiter-persuasive',
    domain: 'legal-reasoning',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    stem: 'A unanimous High Court makes an observation about a point that did not need to be decided. What is the status of that observation in a State Supreme Court?',
    options: [
      { id: 'a', text: 'Strictly binding, because it comes from the High Court' },
      { id: 'b', text: 'Of no weight, because it is obiter' },
      { id: 'c', text: 'Not strictly binding, but highly persuasive and in practice ordinarily followed' },
      { id: 'd', text: 'Binding only if the point was argued by counsel' },
    ],
    correct: ['c'],
    explanation:
      'Obiter dicta are not binding as a matter of strict precedent. But considered dicta of the High Court, particularly where unanimous, carry very great weight, and intermediate and lower courts ordinarily follow them. The practical answer to a client is that such a statement will almost certainly be applied, even though a court is not formally compelled to apply it.',
    whyItMatters:
      'Advising a client that a High Court statement "isn’t binding" is technically accurate and practically misleading. What matters is what a court will actually do.',
    commonMisconception:
      'Treating the binding/not-binding distinction as the end of the analysis. Persuasive authority decides most cases.',
    memoryTrick:
      'Not binding is not the same as not decisive.',
    concepts: ['ratio-and-obiter', 'stare-decisis'],
    skills: ['argument-construction', 'strategic-reasoning'],
  },
  {
    slug: 'lr-stare-decisis-hierarchy',
    domain: 'legal-reasoning',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    stem: 'A judge of the County Court of Victoria is considering a point decided by the Victorian Court of Appeal. What must the judge do?',
    options: [
      { id: 'a', text: 'Follow the Court of Appeal decision — it is binding' },
      { id: 'b', text: 'Treat it as persuasive only and reach an independent view' },
      { id: 'c', text: 'Refer the matter to the High Court' },
      { id: 'd', text: 'Follow it only if the facts are identical' },
    ],
    correct: ['a'],
    explanation:
      'Courts are bound by decisions of courts above them in the same hierarchy. The Victorian Court of Appeal sits above the County Court in the Victorian hierarchy, so its decisions bind. Identical facts are not required — what matters is whether the ratio applies to the case at hand. A lower court cannot refer a question to the High Court of its own motion.',
    whyItMatters:
      'Knowing which authorities bind the particular court you are in determines what your submission has to be. Against a binding authority, your argument must be that it is distinguishable, not that it is wrong.',
    commonMisconception:
      'Requiring identical facts before an authority applies. Precedent operates at the level of principle.',
    memoryTrick:
      'Look up your own hierarchy. Those decisions bind you.',
    concepts: ['stare-decisis'],
    skills: ['argument-construction', 'procedural-sequencing'],
  },
  {
    slug: 'lr-interstate-appellate',
    domain: 'legal-reasoning',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'AU_GENERAL',
    stem: 'The NSW Court of Appeal decides a point of Australian common law. A Victorian court is later faced with the same point. What is the position?',
    options: [
      { id: 'a', text: 'The decision is strictly binding on the Victorian court' },
      { id: 'b', text: 'The decision has no relevance outside New South Wales' },
      { id: 'c', text: 'The decision is not strictly binding, but the Victorian court should follow it unless convinced it is plainly wrong' },
      { id: 'd', text: 'The Victorian court must apply whichever view it prefers' },
    ],
    correct: ['c'],
    explanation:
      'Australia has a single common law. An intermediate appellate court in one State is not strictly bound by an intermediate appellate court in another, but should not depart from its decision on a matter of Australian common law, or on uniform national legislation, unless convinced the earlier decision is plainly wrong. That principle was stated emphatically by the High Court in Farah Constructions Pty Ltd v Say-Dee Pty Ltd.',
    whyItMatters:
      'It vastly expands the authority you can usefully rely on. Interstate appellate decisions are not merely interesting — they will ordinarily be followed, and you should be citing them.',
    commonMisconception:
      'Confining research to your own State. On common law and uniform legislation, the whole country is relevant.',
    memoryTrick:
      'One common law. Depart from a sister court only if it is plainly wrong.',
    concepts: ['appellate-comity', 'stare-decisis'],
    skills: ['argument-construction', 'strategic-reasoning'],
    sourceReference: 'Farah Constructions Pty Ltd v Say-Dee Pty Ltd (2007) 230 CLR 89',
  },
  {
    slug: 'lr-comity-single-judges',
    domain: 'legal-reasoning',
    type: 'true_false',
    difficulty: 4,
    jurisdiction: 'AU_GENERAL',
    stem: 'True or false: a single judge of a superior court is strictly bound by the decision of another single judge of the same court.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['false'],
    explanation:
      'False, but the practical position is close to it. Decisions of single judges of the same court are not strictly binding on each other. As a matter of judicial comity, however, a judge will ordinarily follow an earlier decision of a colleague unless convinced it is wrong. The convention exists so that the law administered by a court is consistent and litigants are not exposed to a lottery depending on which judge they draw.',
    whyItMatters:
      'It affects how you use a first instance decision. You can cite it with confidence that it will usually be followed, while recognising that a well-founded argument that it was wrongly decided remains open.',
    commonMisconception:
      'Dismissing single judge decisions as carrying little weight. In practice they are ordinarily applied.',
    memoryTrick:
      'Sideways is comity. Upwards is binding.',
    concepts: ['appellate-comity', 'stare-decisis'],
    skills: ['argument-construction'],
  },
  {
    slug: 'lr-purposive-interpretation',
    domain: 'legal-reasoning',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'CTH',
    stem: 'Under the Acts Interpretation Act 1901 (Cth), where a provision is capable of more than one interpretation, which is to be preferred?',
    options: [
      { id: 'a', text: 'The interpretation most favourable to the individual' },
      { id: 'b', text: 'The interpretation that would best achieve the purpose or object of the Act' },
      { id: 'c', text: 'The most literal interpretation of the words used' },
      { id: 'd', text: 'The interpretation adopted in the explanatory memorandum' },
    ],
    correct: ['b'],
    explanation:
      'Section 15AA requires that the interpretation which would best achieve the purpose or object of the Act be preferred to any other interpretation. Every State and Territory has an equivalent provision. This does not licence a court to disregard the text — purpose is drawn from the statute itself, read as a whole — but it displaces any rule that the literal meaning must prevail regardless of consequence.',
    whyItMatters:
      'Statutory interpretation is the substance of an enormous proportion of modern litigation. Knowing that purpose is a statutory command, not a last resort, changes how you frame the argument from the outset.',
    commonMisconception:
      'Treating the literal rule as the starting point and purpose as a fallback. The statute reverses that.',
    memoryTrick:
      '15AA: purpose is preferred. Not consulted — preferred.',
    concepts: ['statutory-interpretation'],
    skills: ['statutory-analysis', 'argument-construction'],
    sourceReference: 'Acts Interpretation Act 1901 (Cth) s 15AA',
    sourceUrl: 'https://www.legislation.gov.au/C1901A00002/latest/text',
  },
  {
    slug: 'lr-extrinsic-materials',
    domain: 'legal-reasoning',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'CTH',
    stem: 'When may extrinsic material such as an explanatory memorandum or a second reading speech be considered in interpreting a Commonwealth Act?',
    options: [
      { id: 'a', text: 'Never — only the text of the Act may be considered' },
      { id: 'b', text: 'To confirm the ordinary meaning conveyed by the text, or to determine the meaning where the provision is ambiguous or obscure, or where the ordinary meaning leads to a manifestly absurd or unreasonable result' },
      { id: 'c', text: 'Whenever the party relying on it considers it helpful, without restriction' },
      { id: 'd', text: 'Only where the Act expressly incorporates the material' },
    ],
    correct: ['b'],
    explanation:
      'Section 15AB permits recourse to extrinsic material in defined circumstances: to confirm the meaning conveyed by the ordinary meaning of the text taking into account its context and purpose, or to determine the meaning where the provision is ambiguous or obscure, or where the ordinary meaning leads to a result that is manifestly absurd or unreasonable. Extrinsic material cannot displace clear statutory text — the courts have consistently emphasised that the second reading speech is not the statute.',
    whyItMatters:
      'Extrinsic material is often the most attractive support for an argument, which is exactly why its limits matter. An argument that leans on a minister’s speech against the clear words of the section will fail.',
    commonMisconception:
      'Opening an interpretation argument with the explanatory memorandum. Start with the text; the extrinsic material has a defined and secondary role.',
    memoryTrick:
      'Confirm, or resolve ambiguity, or avoid absurdity. Three gates, and the text comes first.',
    concepts: ['extrinsic-materials', 'statutory-interpretation'],
    skills: ['statutory-analysis', 'argument-construction'],
    sourceReference: 'Acts Interpretation Act 1901 (Cth) s 15AB',
  },
  {
    slug: 'lr-text-context-purpose',
    domain: 'legal-reasoning',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'AU_GENERAL',
    stem: 'What is the orthodox Australian approach to interpreting a statutory provision?',
    options: [
      { id: 'a', text: 'Begin and end with the dictionary meaning of the words' },
      { id: 'b', text: 'Begin with the text, considered in its context and in light of the statute’s purpose, and end with the text' },
      { id: 'c', text: 'Begin with the purpose and treat the text as illustrative' },
      { id: 'd', text: 'Begin with the parliamentary debates' },
    ],
    correct: ['b'],
    explanation:
      'The High Court has repeatedly said that interpretation begins with the text and ends with the text, but that the text must be considered in its context — including the statute as a whole, its structure, and its purpose — from the outset rather than only after an ambiguity is found. Context is not a remedy applied once a difficulty appears; it is part of reading the provision in the first place.',
    whyItMatters:
      'It tells you how to build the argument: quote the provision, place it in the statutory scheme, identify the purpose the scheme serves, then return to the words. That is the structure judges expect.',
    commonMisconception:
      'Reaching for context only after asserting the words are ambiguous. Context is considered at the first stage.',
    memoryTrick:
      'Start with the text. Read it in context. Come back to the text.',
    concepts: ['statutory-interpretation'],
    skills: ['statutory-analysis', 'argument-construction'],
    sourceReference:
      'Project Blue Sky Inc v Australian Broadcasting Authority (1998) 194 CLR 355; CIC Insurance Ltd v Bankstown Football Club Ltd (1997) 187 CLR 384',
  },
  {
    slug: 'lr-elements-analysis',
    domain: 'legal-reasoning',
    type: 'scenario',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'A client says a supplier "completely ripped us off" on a contract. Before advising, you break the potential claim down.',
    stem: 'What is the first analytical step?',
    options: [
      { id: 'a', text: 'Estimate the likely quantum of damages' },
      { id: 'b', text: 'Identify the cause of action and the elements that must be proved to establish it, then test the available facts against each element' },
      { id: 'c', text: 'Search for cases with similar facts' },
      { id: 'd', text: 'Draft the letter of demand and see how the supplier responds' },
    ],
    correct: ['b'],
    explanation:
      'Legal analysis proceeds by elements. Identify the cause of action — here, most likely breach of contract, possibly misleading or deceptive conduct — then list what must be proved for it, and test the client’s account and documents against each requirement. That immediately reveals which elements are strong, which are contestable, and what evidence is missing. Quantum, case research and correspondence all follow from that analysis.',
    whyItMatters:
      'It converts a client’s grievance into a legal question you can actually answer. It is also how you spot, early, that the client has a genuine complaint but no cause of action — which is far better discovered in the first conference than after issuing.',
    commonMisconception:
      'Starting with case research. Without the elements you do not yet know what you are researching.',
    memoryTrick:
      'Cause of action, elements, facts, gaps. In that order.',
    concepts: ['elements-analysis', 'issue-identification'],
    skills: ['argument-construction', 'strategic-reasoning', 'commercial-reasoning'],
  },
  {
    slug: 'lr-distinguishing',
    domain: 'legal-reasoning',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    stem: 'What does it mean to distinguish an authority?',
    options: [
      { id: 'a', text: 'To argue that the earlier case was wrongly decided' },
      { id: 'b', text: 'To show that a material difference in the facts or issues means the ratio of the earlier case does not govern the present one' },
      { id: 'c', text: 'To point out that the earlier case is from another jurisdiction' },
      { id: 'd', text: 'To rely on the dissenting judgment instead' },
    ],
    correct: ['b'],
    explanation:
      'Distinguishing accepts the earlier decision as correct and binding, and argues that it does not apply because a materially different fact or issue takes the present case outside its ratio. That is quite different from submitting a case was wrongly decided, which is generally not open before a court bound by it. The difference relied on must be material — one that matters to the reasoning, not merely any factual difference.',
    whyItMatters:
      'When an authority is binding and against you, distinguishing is usually the only argument available. Being able to articulate the material difference in one sentence is the whole of the submission.',
    commonMisconception:
      'Pointing to any factual difference at all. Every case differs on its facts; the difference must engage the reasoning.',
    memoryTrick:
      'Accept the case. Escape its reach.',
    concepts: ['distinguishing', 'ratio-and-obiter'],
    skills: ['argument-construction', 'strategic-reasoning'],
  },
  {
    slug: 'lr-issue-identification',
    domain: 'legal-reasoning',
    type: 'scenario',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'On the pleadings, the defendant admits the contract, admits the term relied on, and admits that it did not deliver by the date specified. It denies only that the plaintiff suffered any loss, and pleads that the plaintiff obtained substitute goods at the same price.',
    stem: 'What is the real issue for trial?',
    options: [
      { id: 'a', text: 'Whether a binding contract was formed' },
      { id: 'b', text: 'Whether the defendant breached the contract' },
      { id: 'c', text: 'Whether the plaintiff suffered recoverable loss, and its quantification' },
      { id: 'd', text: 'Whether the term relied on was a condition or a warranty' },
    ],
    correct: ['c'],
    explanation:
      'Formation, the term, and breach are all admitted on the pleadings and are therefore not in issue. The only live question is loss: whether the plaintiff suffered any, and if so how much, in circumstances where substitute goods were obtained at the same price. Whether the term was a condition or a warranty would matter to a right to terminate, but that is not what is in dispute here.',
    whyItMatters:
      'Preparation follows the issues, not the story. Reading the pleadings to work out what is genuinely in dispute tells you which witnesses matter, which documents matter, and where the trial will actually be won or lost.',
    commonMisconception:
      'Preparing the whole case afresh regardless of admissions. Time spent proving what has been admitted is time taken from the issue that decides the case.',
    memoryTrick:
      'Read the defence, not the claim. The denials are the case.',
    concepts: ['issue-identification', 'pleadings'],
    skills: ['strategic-reasoning', 'argument-construction'],
  },
  {
    slug: 'lr-analogical-reasoning',
    domain: 'legal-reasoning',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    stem: 'You cannot find an authority directly on point for a novel factual situation. What is the appropriate reasoning technique?',
    options: [
      { id: 'a', text: 'Advise the client that there is no legal answer' },
      { id: 'b', text: 'Identify the principle underlying analogous authorities and reason by analogy to the present facts, explaining why the same principle applies' },
      { id: 'c', text: 'Rely on overseas decisions in preference to Australian principle' },
      { id: 'd', text: 'Argue that the court should create a new cause of action' },
    ],
    correct: ['b'],
    explanation:
      'The common law develops incrementally. Where no case is directly on point, you identify the principle that explains the analogous decisions and demonstrate that the same principle covers the present facts. Overseas authority may assist where Australian principle is genuinely undeveloped, but it is persuasive at most and cannot displace Australian authority. Australian courts are notably reluctant to recognise entirely new causes of action.',
    whyItMatters:
      'Most real problems do not have a case with matching facts. The ability to move from decided cases to underlying principle and back down to your facts is what legal reasoning actually consists of.',
    commonMisconception:
      'Searching for a case with the same facts and concluding there is no answer when none exists. Principle, not factual coincidence, is what you are looking for.',
    memoryTrick:
      'Up to the principle, across the analogy, down to your facts.',
    concepts: ['distinguishing', 'stare-decisis', 'issue-identification'],
    skills: ['argument-construction', 'strategic-reasoning'],
  },
  {
    slug: 'lr-dissent-status',
    domain: 'legal-reasoning',
    type: 'true_false',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    stem: 'True or false: a dissenting judgment forms part of the binding ratio of a case.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['false'],
    explanation:
      'False. A dissenting judgment is by definition not part of the court’s decision and binds no one. It may nevertheless be valuable — dissents are sometimes later preferred by an appellate court, and a well-reasoned dissent can supply the analytical framework for an argument that the majority position should be reconsidered by a court free to do so. But it is not authority for the proposition it advances.',
    whyItMatters:
      'Citing a dissent without identifying it as one is a serious error of candour as well as of research. Doing it deliberately would engage the duty to the court.',
    commonMisconception:
      'Pulling a helpful passage from a judgment without checking whether that judge was in the majority. Always check.',
    memoryTrick:
      'A dissent tells you what the law is not.',
    concepts: ['ratio-and-obiter', 'stare-decisis'],
    skills: ['attention-to-detail', 'professional-judgment'],
  },
];
