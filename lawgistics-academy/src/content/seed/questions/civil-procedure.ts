import { TRUE_FALSE_OPTIONS, type SeedQuestion } from '../types';

export const CIVIL_PROCEDURE_QUESTIONS: SeedQuestion[] = [
  {
    slug: 'cp-subpoena-non-party-documents',
    domain: 'civil-procedure',
    type: 'scenario',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'A bank holds documents relevant to litigation between your client and a former business partner. The bank is not a party to the proceeding and refuses to provide the documents voluntarily.',
    stem: 'What process may be used to compel production of the documents?',
    options: [
      { id: 'a', text: 'An affidavit' },
      { id: 'b', text: 'A subpoena' },
      { id: 'c', text: 'A statement of claim' },
      { id: 'd', text: 'A notice of appearance' },
    ],
    correct: ['b'],
    explanation:
      'A subpoena is the court’s compulsory process. A subpoena to produce requires the recipient to produce specified documents to the court; a subpoena to give evidence requires attendance to testify. It is the standard mechanism for obtaining material from a person who is not a party. The other three documents do quite different work: an affidavit is a form of sworn evidence, a statement of claim commences a proceeding, and a notice of appearance records that a defendant is participating.',
    whyItMatters:
      'Banks, employers, hospitals and accountants almost never hand over documents voluntarily, and they should not; they owe duties of confidence to their own customers. A subpoena gives them the court order that answers that problem.',
    commonMisconception:
      'Reaching for discovery instead. Discovery operates between the parties to a proceeding; it does not reach a stranger to the litigation.',
    memoryTrick:
      'Party documents: discovery. Stranger’s documents: subpoena.',
    concepts: ['subpoenas', 'discovery'],
    skills: ['procedural-sequencing', 'strategic-reasoning'],
  },
  {
    slug: 'cp-conduct-money',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    stem: 'What is "conduct money" in the context of a subpoena?',
    options: [
      { id: 'a', text: 'A penalty payable by a recipient who fails to comply' },
      { id: 'b', text: 'An amount paid to the recipient to meet the reasonable expenses of complying' },
      { id: 'c', text: 'The court filing fee for issuing the subpoena' },
      { id: 'd', text: 'Security for the other party’s costs of the application' },
    ],
    correct: ['b'],
    explanation:
      'Conduct money is an amount provided to the person subpoenaed, sufficient to meet the reasonable expenses of complying: travelling to court, or locating and copying documents. It must be provided a reasonable time before the date for compliance. A subpoena served without conduct money will generally not be enforceable against the recipient.',
    whyItMatters:
      'It is a routine step that is routinely forgotten, and forgetting it can mean the documents simply do not arrive on the return date. That is an adjournment, a wasted appearance and an awkward conversation with the client.',
    commonMisconception:
      'Treating conduct money as a formality that can be sorted out later. It is a precondition to enforceability, not an afterthought.',
    memoryTrick:
      'You are asking a stranger to do work for your case. Pay their bus fare.',
    concepts: ['subpoenas'],
    skills: ['attention-to-detail', 'procedural-sequencing'],
    sourceReference:
      'See e.g. Uniform Civil Procedure Rules 2005 (NSW) r 33.6; Supreme Court (General Civil Procedure) Rules 2015 (Vic) O 42',
  },
  {
    slug: 'cp-fishing-expedition',
    domain: 'civil-procedure',
    type: 'scenario',
    difficulty: 4,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'You act for a defendant. The plaintiff has issued a subpoena to your client’s accountant seeking "all documents relating to the defendant’s financial affairs for the past ten years". The pleaded case concerns a single alleged breach of contract in the most recent financial year.',
    stem: 'What is the strongest basis on which to apply to set the subpoena aside?',
    options: [
      { id: 'a', text: 'The accountant is not a party to the proceeding' },
      { id: 'b', text: 'The subpoena is oppressive and lacks a legitimate forensic purpose; it is a fishing expedition' },
      { id: 'c', text: 'Accountants’ records are inherently privileged from production' },
      { id: 'd', text: 'The plaintiff has not yet completed discovery' },
    ],
    correct: ['b'],
    explanation:
      'A subpoena must be directed to identified documents with an apparent relevance to the issues on the pleadings, and the issuing party must be able to articulate a legitimate forensic purpose for them. A request framed at that breadth, against a case pleaded that narrowly, is classically oppressive: it is being used to discover whether there might be a case rather than to prove the case actually pleaded. That is an abuse of the court’s process. Non-parties are precisely who subpoenas are aimed at, so (a) is no objection at all, and there is no general privilege attaching to accountants’ records.',
    whyItMatters:
      'Broad subpoenas are a common tactic and they impose real cost on your client and on third parties. Recognising an oppressive subpoena, and being able to say why in one sentence, is a genuinely useful skill early in practice.',
    commonMisconception:
      'That anything relevant can be subpoenaed. Relevance is necessary but not sufficient; the subpoena must also be no wider than the forensic purpose requires.',
    memoryTrick:
      'A subpoena proves a case. It does not go looking for one.',
    concepts: ['subpoenas', 'interlocutory-applications'],
    skills: ['strategic-reasoning', 'evidence-analysis', 'argument-construction'],
  },
  {
    slug: 'cp-discovery-scope',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    stem: 'A party’s discovery obligation extends to relevant documents that are in that party’s:',
    options: [
      { id: 'a', text: 'Physical possession only' },
      { id: 'b', text: 'Possession, custody or power' },
      { id: 'c', text: 'Possession, or the possession of their solicitor' },
      { id: 'd', text: 'Possession, unless the documents are stored electronically' },
    ],
    correct: ['b'],
    explanation:
      'The formula is "possession, custody or power". It reaches beyond documents physically held. "Power" captures documents a party has a presently enforceable right to obtain, for example, records held by that party’s own accountant or by a company it controls. Electronic documents are documents; the medium is irrelevant to the obligation.',
    whyItMatters:
      'Clients routinely say "I don’t have those" when they mean "they’re with my bookkeeper". They are still discoverable, and failing to disclose them exposes the client to serious consequences and you to a professional problem.',
    commonMisconception:
      'That documents held by a third party are automatically outside discovery. If your client can require their production, they are within it.',
    memoryTrick:
      'Not just what is in the drawer: what you could get out of someone else’s drawer if you asked.',
    concepts: ['discovery'],
    skills: ['attention-to-detail', 'professional-judgment'],
  },
  {
    slug: 'cp-pleadings-material-facts',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    stem: 'What must a statement of claim plead?',
    options: [
      { id: 'a', text: 'The material facts relied on, but not the evidence by which they will be proved' },
      { id: 'b', text: 'All of the evidence the plaintiff intends to call at trial' },
      { id: 'c', text: 'The legal arguments the plaintiff will make at trial' },
      { id: 'd', text: 'Every fact the plaintiff believes to be true about the dispute' },
    ],
    correct: ['a'],
    explanation:
      'A pleading states the material facts (the facts which, if proved, establish the cause of action) and not the evidence by which those facts will be proved. It also does not contain argument. The classic formulation is that pleadings state facts, not evidence and not law.',
    whyItMatters:
      'A pleading’s job is to define the issues so both sides know the case they have to meet and the court knows what it is deciding. Overloading it with evidence makes it embarrassing and vulnerable to being struck out; under-pleading it means your client cannot run the case they wanted.',
    commonMisconception:
      'Drafting a statement of claim as a narrative of everything that happened. That is a chronology, not a pleading.',
    memoryTrick:
      'Facts in the pleading. Evidence in the witness box. Law in submissions.',
    concepts: ['pleadings', 'drafting-pleadings'],
    skills: ['written-communication', 'argument-construction'],
  },
  {
    slug: 'cp-particulars-function',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    stem: 'What is the function of particulars in a pleading?',
    options: [
      { id: 'a', text: 'To introduce new causes of action without amending' },
      { id: 'b', text: 'To supply detail of an already pleaded allegation so the other party knows the case to meet' },
      { id: 'c', text: 'To list the documents on which the party will rely' },
      { id: 'd', text: 'To set out the legal principles supporting the claim' },
    ],
    correct: ['b'],
    explanation:
      'Particulars give detail of an allegation that has already been pleaded: the dates, the representations, the respects in which conduct is said to have been negligent. They fill in the picture; they cannot add to it. A party cannot use particulars to introduce a cause of action that was never pleaded, and a request for further and better particulars is the ordinary response to a pleading that is too vague to answer.',
    whyItMatters:
      'Requesting particulars is often the cheapest and most effective early step against a thin pleading. It forces the other side to commit to a case, and what they commit to is frequently narrower than the pleading suggested.',
    commonMisconception:
      'Treating particulars as a way to expand a case. They explain what is already there; they do not enlarge it.',
    memoryTrick:
      'Particulars sharpen the picture. They do not paint a new one.',
    concepts: ['particulars', 'pleadings'],
    skills: ['strategic-reasoning', 'written-communication'],
  },
  {
    slug: 'cp-default-judgment',
    domain: 'civil-procedure',
    type: 'scenario',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'Your client served a statement of claim on a defendant three months ago. The defendant has not filed a notice of appearance or a defence, and the time for doing so has long expired.',
    stem: 'What step is ordinarily available to your client?',
    options: [
      { id: 'a', text: 'Apply for summary judgment on the merits' },
      { id: 'b', text: 'Apply for default judgment' },
      { id: 'c', text: 'Apply to strike out the defence' },
      { id: 'd', text: 'Serve a subpoena on the defendant' },
    ],
    correct: ['b'],
    explanation:
      'Where a defendant fails to file an appearance or defence within the time allowed, the plaintiff may seek default judgment. For a liquidated claim, a debt or a sum capable of precise calculation, judgment can commonly be entered administratively on filing the necessary material. For unliquidated claims, judgment is usually entered for damages to be assessed. Summary judgment is a different remedy directed at a defence that has no real prospect of success; there is no defence here to strike out.',
    whyItMatters:
      'It is one of the most common steps in commercial recovery work, and it is fast and cheap compared with a trial. Recognising that a matter has become a default judgment matter is the difference between resolving it in weeks and litigating it for a year.',
    commonMisconception:
      'Confusing default judgment with summary judgment. Default is about failing to respond. Summary is about responding with something hopeless.',
    memoryTrick:
      'Silence gets default. A bad answer gets summary.',
    concepts: ['default-judgment', 'summary-judgment'],
    skills: ['procedural-sequencing', 'commercial-reasoning'],
  },
  {
    slug: 'cp-summary-judgment-vic-test',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'VIC',
    stem: 'Under the Civil Procedure Act 2010 (Vic), what is the test for summary judgment?',
    options: [
      { id: 'a', text: 'That the claim or defence is "so obviously untenable that it cannot possibly succeed"' },
      { id: 'b', text: 'That the claim or defence has "no real prospect of success"' },
      { id: 'c', text: 'That the applicant is more likely than not to succeed at trial' },
      { id: 'd', text: 'That there is no arguable question of fact' },
    ],
    correct: ['b'],
    explanation:
      'Section 63 of the Civil Procedure Act 2010 (Vic) allows summary judgment where a claim, defence or counterclaim has "no real prospect of success". That was a deliberate legislative change: it set a lower threshold than the older common law test, which required a case to be so obviously untenable that it could not possibly succeed. The test is not, however, a prediction of who will probably win, a case with a real but weak prospect still goes to trial.',
    whyItMatters:
      'Advising on summary judgment means advising on the actual statutory test in the relevant jurisdiction, not the general idea of it. Applying the old common law formula in Victoria understates your client’s prospects.',
    commonMisconception:
      'Assuming the older, higher common law test still governs. In Victoria it has been displaced by statute.',
    concepts: ['summary-judgment'],
    skills: ['statutory-analysis', 'strategic-reasoning'],
    sourceReference: 'Civil Procedure Act 2010 (Vic) ss 61–64',
    sourceUrl: 'https://www.legislation.vic.gov.au/in-force/acts/civil-procedure-act-2010',
  },
  {
    slug: 'cp-limitation-contract-vic',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'VIC',
    stem: 'In Victoria, what is the ordinary limitation period for an action founded on simple contract?',
    options: [
      { id: 'a', text: 'Three years from the date of the breach' },
      { id: 'b', text: 'Six years from the date the cause of action accrued' },
      { id: 'c', text: 'Twelve years from the date of the breach' },
      { id: 'd', text: 'There is no limitation period for contractual claims' },
    ],
    correct: ['b'],
    explanation:
      'The Limitation of Actions Act 1958 (Vic) provides a six year period for actions founded on simple contract, running from the date the cause of action accrued; for contract, ordinarily the date of breach rather than the date loss was discovered. Different periods apply to deeds, to personal injury claims, and to some statutory causes of action, so the period always has to be checked against the specific claim.',
    whyItMatters:
      'A missed limitation period is the single most common source of professional negligence claims against solicitors. The limitation date should be diarised at the first client meeting, before anything else.',
    commonMisconception:
      'Assuming time runs from when the client discovered the problem. For simple contract it generally runs from breach, whether or not anyone noticed.',
    memoryTrick:
      'Contract time starts when the promise is broken, not when the client works out they have been wronged.',
    concepts: ['limitation-periods'],
    skills: ['attention-to-detail', 'professional-judgment', 'statutory-analysis'],
    sourceReference: 'Limitation of Actions Act 1958 (Vic) s 5',
    sourceUrl: 'https://www.legislation.vic.gov.au/in-force/acts/limitation-actions-act-1958',
  },
  {
    slug: 'cp-costs-follow-the-event',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    stem: 'What is the general rule about costs in Australian civil litigation?',
    options: [
      { id: 'a', text: 'Each party bears its own costs regardless of outcome' },
      { id: 'b', text: 'Costs follow the event; the unsuccessful party ordinarily pays the successful party’s costs' },
      { id: 'c', text: 'The party who commenced the proceeding pays all costs' },
      { id: 'd', text: 'Costs are always paid out of the sum recovered' },
    ],
    correct: ['b'],
    explanation:
      'The starting point is that costs follow the event: the losing party ordinarily pays the winner’s costs. It is a discretionary rule, not an entitlement, and courts depart from it, where a winner succeeded on only part of its case, where a party’s conduct wasted costs, or where an offer of compromise was unreasonably refused. Importantly, a costs order rarely covers the whole of what a client actually pays their own lawyers.',
    whyItMatters:
      'Costs drive settlement more than almost anything else. A client needs to understand both their exposure if they lose and the shortfall they will still carry if they win.',
    commonMisconception:
      'Telling a client that winning means their legal costs are covered. On the standard basis, recovery is typically well short of what they have been billed.',
    memoryTrick:
      'Costs follow the event, but they do not catch up with it.',
    concepts: ['costs'],
    skills: ['commercial-reasoning', 'professional-judgment'],
  },
  {
    slug: 'cp-indemnity-costs',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'AU_GENERAL',
    stem: 'When will a court ordinarily award costs on an indemnity basis rather than the standard basis?',
    options: [
      { id: 'a', text: 'Whenever the successful party asks for it' },
      { id: 'b', text: 'In any proceeding in a superior court' },
      { id: 'c', text: 'Where there is some special or unusual feature justifying a departure from the ordinary basis, such as unreasonable refusal of a genuine offer of compromise or misconduct in the litigation' },
      { id: 'd', text: 'Only where fraud has been established at trial' },
    ],
    correct: ['c'],
    explanation:
      'Indemnity costs are exceptional. They require some special or unusual feature taking the case out of the ordinary, for example, a case brought or maintained with no reasonable prospects, a serious allegation made without foundation, misconduct causing wasted costs, or the unreasonable rejection of a genuine offer of compromise or Calderbank offer. Recovery on the indemnity basis is substantially more generous than on the standard basis, which is precisely why the threshold is high.',
    whyItMatters:
      'A well-timed and properly framed offer creates real costs pressure. Understanding when indemnity costs become available is what makes an offer a strategic instrument rather than a formality.',
    commonMisconception:
      'Thinking that simply beating your own offer guarantees indemnity costs. The refusal must have been unreasonable in the circumstances known at the time.',
    memoryTrick:
      'Standard is the default. Indemnity is a rebuke.',
    concepts: ['costs'],
    skills: ['strategic-reasoning', 'commercial-reasoning'],
  },
  {
    slug: 'cp-interlocutory-meaning',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    stem: 'Which of the following is an interlocutory application?',
    options: [
      { id: 'a', text: 'An application for judgment after a trial on the merits' },
      { id: 'b', text: 'An application for an interim injunction pending trial' },
      { id: 'c', text: 'An appeal from a final judgment' },
      { id: 'd', text: 'An application for special leave to appeal to the High Court' },
    ],
    correct: ['b'],
    explanation:
      'An interlocutory application is one made during a proceeding that does not finally determine the parties’ rights. An interim injunction restraining conduct until trial is the classic example, alongside applications for security for costs, further discovery, strike out or adjournment. Judgment after trial, an appeal from a final judgment, and a special leave application all sit outside that description.',
    whyItMatters:
      'Almost all of a junior’s court time is interlocutory work. Knowing that these applications are supported by affidavit evidence, decided on the papers or in a short hearing, and usually appealable only with leave, tells you how to prepare for them.',
    commonMisconception:
      'Treating "interlocutory" as meaning "unimportant". Interlocutory orders routinely decide the practical outcome of a case.',
    memoryTrick:
      'Inter- as in "between". Anything between the start and the final judgment.',
    concepts: ['interlocutory-applications'],
    skills: ['procedural-sequencing', 'strategic-reasoning'],
  },
  {
    slug: 'cp-service-purpose',
    domain: 'civil-procedure',
    type: 'true_false',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    stem: 'True or false: filing an originating process at court is sufficient to bring a defendant into a proceeding, without more.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['false'],
    explanation:
      'False. Filing commences the proceeding; service brings the defendant into it. Until the originating process has been served in accordance with the rules, the defendant is not required to respond and the court will not ordinarily proceed against them. Originating process also has a limited life, if it is not served within the period allowed by the rules, it may need to be renewed before it can be served.',
    whyItMatters:
      'A proceeding issued just inside a limitation period but not served in time can be worth nothing. Filing is the beginning of the task, not the end of it.',
    commonMisconception:
      'Treating the filing date as the moment the defendant is "on notice". They are not, until served.',
    memoryTrick:
      'Filing starts the clock. Service starts the case.',
    concepts: ['originating-process', 'limitation-periods'],
    skills: ['procedural-sequencing', 'attention-to-detail'],
  },
];
