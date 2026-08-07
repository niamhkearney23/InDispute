import { TRUE_FALSE_OPTIONS, type SeedQuestion } from '../types';

/**
 * The Malaysian starter bank.
 *
 * READ THIS BEFORE PUBLISHING ANY OF IT.
 *
 * Every question here was drafted by an AI system with no Malaysian legal
 * qualification, working from general knowledge rather than from the current
 * text of the legislation. Monetary limits, time periods and section numbers
 * are precisely the things that change and precisely the things stated here.
 *
 * These load as drafts and reach no learner until a Malaysian-qualified
 * practitioner signs each one off in the verification queue. That is not
 * caution for its own sake: a Malaysian student who learns the wrong Sessions
 * Court limit from this app is worse off than one who never opened it.
 */
export const MALAYSIA_QUESTIONS: SeedQuestion[] = [
  /* --- court system ------------------------------------------------------ */
  {
    slug: 'my-cs-apex-court',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'MY_FEDERAL',
    stem: 'Which court is the apex court of Malaysia?',
    options: [
      { id: 'a', text: 'The Court of Appeal' },
      { id: 'b', text: 'The Federal Court of Malaysia' },
      { id: 'c', text: 'The High Court in Malaya' },
      { id: 'd', text: 'The Judicial Committee of the Privy Council' },
    ],
    correct: ['b'],
    explanation:
      'The Federal Court of Malaysia sits at the top of the Malaysian judicial hierarchy. It hears appeals from the Court of Appeal and exercises the original and referral jurisdiction conferred on it by the Federal Constitution. Appeals to the Privy Council were abolished in stages and ended entirely from 1985.',
    whyItMatters:
      'It tells you where an argument must ultimately be able to survive. A point settled by the Federal Court cannot be decided differently by any court below it.',
    commonMisconception:
      'The Court of Appeal is sometimes treated as the final court because most appeals stop there in practice. It is not; it is the intermediate appellate court.',
    memoryTrick: 'Federal Court at the top, Court of Appeal below it, High Courts below that.',
    concepts: ['my-court-structure', 'court-hierarchy', 'appellate-structure'],
    skills: ['procedural-sequencing', 'argument-construction'],
    sourceReference: 'Federal Constitution art 121; Courts of Judicature Act 1964',
  },
  {
    slug: 'my-cs-two-high-courts',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_FEDERAL',
    stem: 'How many High Courts of co-ordinate jurisdiction does Malaysia have?',
    options: [
      { id: 'a', text: 'One, the High Court of Malaysia' },
      { id: 'b', text: 'Two, the High Court in Malaya and the High Court in Sabah and Sarawak' },
      { id: 'c', text: 'One for each State' },
      { id: 'd', text: 'Three, adding a separate commercial High Court' },
    ],
    correct: ['b'],
    explanation:
      'Article 121 of the Federal Constitution provides for two High Courts of co-ordinate jurisdiction and status: the High Court in Malaya, and the High Court in Sabah and Sarawak. They are equal, not superior and inferior to one another, and each has its own territorial reach.',
    whyItMatters:
      'It determines where a proceeding is properly commenced, and it means a decision of one High Court is persuasive rather than binding on the other.',
    commonMisconception:
      'Assuming a single national High Court with State registries. The division is constitutional, not administrative.',
    concepts: ['my-court-structure', 'court-hierarchy'],
    skills: ['procedural-sequencing', 'attention-to-detail'],
    sourceReference: 'Federal Constitution art 121(1)',
  },
  {
    slug: 'my-cs-subordinate-courts',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'MY_GENERAL',
    stem: 'Which courts are the subordinate courts in the ordinary Malaysian civil hierarchy?',
    options: [
      { id: 'a', text: 'The Sessions Court and the Magistrates’ Court' },
      { id: 'b', text: 'The District Court and the Local Court' },
      { id: 'c', text: 'The County Court and the Magistrates’ Court' },
      { id: 'd', text: 'The Syariah Court and the Native Court' },
    ],
    correct: ['a'],
    explanation:
      'Below the two High Courts sit the Sessions Courts and the Magistrates’ Courts, constituted under the Subordinate Courts Act 1948. The Sessions Court is the higher of the two. Syariah courts and native courts exist, but they are separate from this hierarchy rather than a rung within it.',
    whyItMatters:
      'Filing in the wrong court wastes time and costs, and the value of the claim usually decides which one is right.',
    concepts: ['my-court-structure', 'court-hierarchy'],
    skills: ['procedural-sequencing'],
    sourceReference: 'Subordinate Courts Act 1948',
  },
  {
    slug: 'my-cs-sessions-limit',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    court: 'Sessions Court',
    stem: 'What is the general upper limit on the Sessions Court’s civil jurisdiction?',
    options: [
      { id: 'a', text: 'RM100,000' },
      { id: 'b', text: 'RM250,000' },
      { id: 'c', text: 'RM1,000,000' },
      { id: 'd', text: 'There is no limit' },
    ],
    correct: ['c'],
    explanation:
      'The Sessions Court has civil jurisdiction in actions where the amount in dispute does not exceed RM1,000,000, subject to specific exceptions such as its unlimited jurisdiction over certain motor vehicle accident, landlord and tenant and distress actions. A claim above the general limit belongs in the High Court.',
    whyItMatters:
      'Getting this wrong means a claim filed in a court that cannot hear it, and a client who has lost time they may not have.',
    commonMisconception:
      'Treating the limit as fixed forever. It has been raised more than once, so it should be checked against the current Act rather than remembered.',
    concepts: ['my-monetary-jurisdiction', 'my-court-structure'],
    skills: ['procedural-sequencing', 'attention-to-detail'],
    sourceReference: 'Subordinate Courts Act 1948 s 65',
  },
  {
    slug: 'my-cs-magistrates-limit',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    court: 'Magistrates’ Court',
    stem: 'What is the general upper limit on a First Class Magistrate’s civil jurisdiction?',
    options: [
      { id: 'a', text: 'RM10,000' },
      { id: 'b', text: 'RM100,000' },
      { id: 'c', text: 'RM500,000' },
      { id: 'd', text: 'RM1,000,000' },
    ],
    correct: ['b'],
    explanation:
      'A First Class Magistrate may hear civil actions where the amount in dispute does not exceed RM100,000. Above that and up to the Sessions Court limit, the claim goes to the Sessions Court.',
    whyItMatters:
      'It is the first question on any new file: how much is this worth, and therefore where does it go.',
    concepts: ['my-monetary-jurisdiction'],
    skills: ['procedural-sequencing', 'attention-to-detail'],
    sourceReference: 'Subordinate Courts Act 1948 s 90',
  },
  {
    slug: 'my-cs-syariah-separate',
    domain: 'court-system',
    type: 'true_false',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'True or false: the Syariah courts are part of the federal civil court hierarchy and appeals from them lie to the High Court.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['false'],
    explanation:
      'False. The Syariah courts are State courts established under State law, with jurisdiction over persons professing the religion of Islam in the matters listed in the State List. They sit outside the federal civil hierarchy, and article 121(1A) of the Federal Constitution provides that the civil High Courts have no jurisdiction in respect of any matter within the jurisdiction of the Syariah courts. Appeals run through the Syariah appellate structure of the State, not to the civil High Court.',
    whyItMatters:
      'A file that turns on Islamic family law does not belong in the civil courts at all, and pressing it there wastes the client’s money on a jurisdictional argument you will lose.',
    commonMisconception:
      'Reading article 121(1A) as making the Syariah courts superior. It is a division of jurisdiction, not a ranking.',
    concepts: ['syariah-courts', 'my-court-structure'],
    skills: ['procedural-sequencing', 'professional-judgment'],
    sourceReference: 'Federal Constitution art 121(1A), Ninth Schedule List II',
  },
  {
    slug: 'my-cs-appeal-from-sessions',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'A civil appeal from a decision of the Sessions Court lies to which court?',
    options: [
      { id: 'a', text: 'The High Court' },
      { id: 'b', text: 'The Court of Appeal' },
      { id: 'c', text: 'The Federal Court' },
      { id: 'd', text: 'Another Sessions Court judge' },
    ],
    correct: ['a'],
    explanation:
      'Appeals from the subordinate courts go to the High Court, which exercises appellate jurisdiction over them. From there a further appeal may lie to the Court of Appeal, subject to the conditions in the Courts of Judicature Act.',
    whyItMatters:
      'Filing an appeal in the wrong court wastes time you usually do not have; appeal periods are short.',
    concepts: ['appellate-structure', 'my-court-structure'],
    skills: ['procedural-sequencing'],
    sourceReference: 'Courts of Judicature Act 1964 s 26',
  },
  {
    slug: 'my-cs-leave-to-federal-court',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_FEDERAL',
    court: 'Federal Court of Malaysia',
    stem: 'A client wants to appeal a Court of Appeal decision in a civil matter to the Federal Court. What is generally required first?',
    options: [
      { id: 'a', text: 'Nothing; an appeal lies as of right' },
      { id: 'b', text: 'Leave to appeal, granted by the Federal Court' },
      { id: 'c', text: 'A certificate from the trial judge' },
      { id: 'd', text: 'The consent of the other party' },
    ],
    correct: ['b'],
    explanation:
      'A civil appeal to the Federal Court generally requires leave, granted by the Federal Court itself. Leave is not given merely because the decision below is thought to be wrong; the questions are of the kind set out in the Courts of Judicature Act, including questions of general principle decided for the first time and questions of public importance.',
    whyItMatters:
      'It sets a client’s expectations honestly. Most cases end at the Court of Appeal, and saying so early is better than discovering it after a leave application fails.',
    concepts: ['appellate-structure', 'my-court-structure'],
    skills: ['procedural-sequencing', 'professional-judgment'],
    sourceReference: 'Courts of Judicature Act 1964 s 96',
  },

  /* --- civil procedure --------------------------------------------------- */
  {
    slug: 'my-cp-rules-of-court',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'MY_GENERAL',
    stem: 'Which rules govern civil procedure in the Malaysian High Court and subordinate courts?',
    options: [
      { id: 'a', text: 'The Rules of the High Court 1980 and the Subordinate Court Rules 1980' },
      { id: 'b', text: 'The Rules of Court 2012' },
      { id: 'c', text: 'The Civil Procedure Code' },
      { id: 'd', text: 'The Civil Law Act 1956' },
    ],
    correct: ['b'],
    explanation:
      'The Rules of Court 2012 unified what had been two separate sets of rules, the Rules of the High Court 1980 and the Subordinate Court Rules 1980, into a single body of procedural rules applying across the High Court and the subordinate courts.',
    whyItMatters:
      'Older textbooks and precedents still cite the 1980 rules. Working from them will give you the wrong order and rule numbers.',
    memoryTrick: 'Two sets of rules became one, in 2012.',
    concepts: ['rules-of-court-2012'],
    skills: ['procedural-sequencing', 'attention-to-detail'],
    sourceReference: 'Rules of Court 2012',
  },
  {
    slug: 'my-cp-writ-or-os',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'Your client and the defendant disagree about what was said at a meeting, whether goods were delivered, and whether an invoice was ever received.',
    stem: 'Which originating process is ordinarily appropriate?',
    options: [
      { id: 'a', text: 'An originating summons, because it is quicker' },
      { id: 'b', text: 'A writ, because there is a substantial dispute of fact' },
      { id: 'c', text: 'Either; the choice makes no practical difference' },
      { id: 'd', text: 'A notice of motion' },
    ],
    correct: ['b'],
    explanation:
      'A writ is the appropriate mode where there is, or is likely to be, a substantial dispute of fact, because it leads to pleadings, discovery and oral evidence. An originating summons suits matters turning on the construction of a document or a point of law with little factual controversy.',
    whyItMatters:
      'Choosing the wrong mode invites an application to convert or strike out, and the delay lands on your client rather than the other side.',
    commonMisconception:
      'Picking an originating summons for speed. Speed is no help if the disputed facts cannot be resolved on affidavit.',
    concepts: ['originating-process', 'rules-of-court-2012'],
    skills: ['procedural-sequencing', 'strategic-reasoning'],
    sourceReference: 'Rules of Court 2012 O 5',
  },
  {
    slug: 'my-cp-writ-validity',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    stem: 'For how long is a writ ordinarily valid for service after it is issued?',
    options: [
      { id: 'a', text: 'One month' },
      { id: 'b', text: 'Six months' },
      { id: 'c', text: 'One year' },
      { id: 'd', text: 'Indefinitely, once filed' },
    ],
    correct: ['b'],
    explanation:
      'A writ is ordinarily valid for service for six months beginning with the date of issue. The court may extend its validity on application, but an extension is not automatic and is harder to obtain once the limitation period has expired.',
    whyItMatters:
      'Filing stops the limitation clock, but an unserved writ that expires can leave a client with a claim that is now statute barred.',
    memoryTrick: 'Issuing is not serving. The writ has a shelf life.',
    concepts: ['originating-process', 'limitation-periods'],
    skills: ['procedural-sequencing', 'attention-to-detail'],
    sourceReference: 'Rules of Court 2012 O 6 r 7',
  },
  {
    slug: 'my-cp-limitation-contract',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_MALAYA',
    stem: 'In Peninsular Malaysia, what is the ordinary limitation period for an action founded on contract or tort?',
    options: [
      { id: 'a', text: 'Three years from the date of the breach' },
      { id: 'b', text: 'Six years from the date the cause of action accrued' },
      { id: 'c', text: 'Twelve years from the date of the contract' },
      { id: 'd', text: 'Six years from the date the client discovered the problem' },
    ],
    correct: ['b'],
    explanation:
      'The Limitation Act 1953 provides a six year period for actions founded on contract or on tort, running from the date the cause of action accrued. For contract that is ordinarily the date of breach, not the date the client noticed the consequences. Sabah and Sarawak have their own limitation ordinances.',
    whyItMatters:
      'Missed limitation dates are among the most common sources of negligence claims against solicitors anywhere, and they are entirely avoidable.',
    commonMisconception:
      'Running the period from when the client found out. Discoverability is a limited statutory exception, not the general rule.',
    concepts: ['limitation-periods'],
    skills: ['attention-to-detail', 'professional-judgment'],
    sourceReference: 'Limitation Act 1953 s 6',
  },
  {
    slug: 'my-cp-appearance-time',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    stem: 'A defendant served with a writ within Malaysia must ordinarily enter appearance within what time?',
    options: [
      { id: 'a', text: 'Eight days after service' },
      { id: 'b', text: 'Fourteen days after service' },
      { id: 'c', text: 'Twenty one days after service' },
      { id: 'd', text: 'Twenty eight days after service' },
    ],
    correct: ['b'],
    explanation:
      'A memorandum of appearance must ordinarily be entered within fourteen days after service of the writ where the defendant is served within Malaysia. Different periods apply to service out of the jurisdiction.',
    whyItMatters:
      'Failing to appear in time exposes the defendant to judgment in default, and setting that aside costs money the client should not have had to spend.',
    concepts: ['originating-process', 'default-judgment', 'rules-of-court-2012'],
    skills: ['procedural-sequencing', 'attention-to-detail'],
    sourceReference: 'Rules of Court 2012 O 12 r 4',
  },
  {
    slug: 'my-cp-default-judgment',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'A defendant has been properly served and has entered no appearance within the time allowed. What may the plaintiff seek?',
    options: [
      { id: 'a', text: 'Judgment in default of appearance' },
      { id: 'b', text: 'Summary judgment under Order 14' },
      { id: 'c', text: 'An order for specific discovery' },
      { id: 'd', text: 'Nothing until the trial date' },
    ],
    correct: ['a'],
    explanation:
      'Where a defendant fails to enter appearance within the prescribed time, the plaintiff may enter judgment in default. For a liquidated demand judgment may generally be entered for the sum claimed; for unliquidated damages, interlocutory judgment is entered with damages to be assessed.',
    whyItMatters:
      'It is the fastest route to judgment in an undefended matter, and knowing it exists stops a file drifting for months.',
    commonMisconception:
      'Confusing default of appearance with Order 14 summary judgment. Order 14 is for a defendant who has appeared but has no real defence.',
    concepts: ['default-judgment', 'rules-of-court-2012'],
    skills: ['procedural-sequencing', 'strategic-reasoning'],
    sourceReference: 'Rules of Court 2012 O 13',
  },
  {
    slug: 'my-cp-order-14',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    stem: 'Under Order 14 of the Rules of Court 2012, what must a plaintiff show to obtain summary judgment?',
    options: [
      { id: 'a', text: 'That the defence is unlikely to succeed at trial' },
      { id: 'b', text: 'That the defendant has no defence to the claim, or no defence except as to the amount' },
      { id: 'c', text: 'That the defendant has failed to give discovery' },
      { id: 'd', text: 'That the claim is for a liquidated sum' },
    ],
    correct: ['b'],
    explanation:
      'Order 14 allows a plaintiff to apply for judgment on the ground that the defendant has no defence to a claim, or no defence except as to the amount. The defendant resists by raising an issue that ought to be tried, or by showing some other reason for a trial. It is not a procedure for weighing which side is more likely to win.',
    whyItMatters:
      'It is the main way a plainly good claim avoids a full trial, and the main trap is treating a weak defence as no defence.',
    commonMisconception:
      'Arguing the merits. A triable issue defeats the application even if the judge doubts the defendant will succeed on it.',
    concepts: ['summary-judgment', 'rules-of-court-2012'],
    skills: ['strategic-reasoning', 'argument-construction'],
    sourceReference: 'Rules of Court 2012 O 14',
  },
  {
    slug: 'my-cp-discovery',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    stem: 'What is the scope of a party’s obligation on discovery of documents under the Rules of Court 2012?',
    options: [
      { id: 'a', text: 'Documents the party intends to rely on at trial' },
      { id: 'b', text: 'Documents relating to matters in question which are or have been in the party’s possession, custody or power' },
      { id: 'c', text: 'Every document the party holds' },
      { id: 'd', text: 'Only documents specifically requested by the other side' },
    ],
    correct: ['b'],
    explanation:
      'Discovery extends to documents relating to the matters in question in the action which are or have been in a party’s possession, custody or power. It is not confined to helpful documents, and "power" reaches documents a party has a presently enforceable right to obtain from someone else.',
    whyItMatters:
      'Clients consistently expect to disclose only what helps them. Explaining early that the obligation runs the other way avoids a much harder conversation later.',
    memoryTrick: 'Not just what is in the drawer: what you could get out of someone else’s drawer if you asked.',
    concepts: ['discovery', 'rules-of-court-2012'],
    skills: ['procedural-sequencing', 'professional-judgment'],
    sourceReference: 'Rules of Court 2012 O 24',
  },
  {
    slug: 'my-cp-costs-follow-event',
    domain: 'civil-procedure',
    type: 'true_false',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'True or false: in Malaysian civil proceedings, costs ordinarily follow the event.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['true'],
    explanation:
      'True. The general rule is that costs follow the event, so the unsuccessful party ordinarily pays the successful party’s costs. It remains a discretion rather than an entitlement, and the court may depart from it, for example where a party has succeeded on only part of its case or has conducted the litigation unreasonably.',
    whyItMatters:
      'It is what makes a costs risk analysis possible, and it is the single most useful thing to tell a client considering whether to fight.',
    concepts: ['costs'],
    skills: ['commercial-reasoning', 'professional-judgment'],
    sourceReference: 'Rules of Court 2012 O 59',
  },

  /* --- evidence ---------------------------------------------------------- */
  {
    slug: 'my-ev-evidence-act',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'MY_GENERAL',
    stem: 'Which statute governs the law of evidence in Malaysian civil and criminal proceedings?',
    options: [
      { id: 'a', text: 'The Evidence Act 1950' },
      { id: 'b', text: 'The Evidence Act 1995' },
      { id: 'c', text: 'The Rules of Court 2012' },
      { id: 'd', text: 'The Civil Law Act 1956' },
    ],
    correct: ['a'],
    explanation:
      'The Evidence Act 1950 is the governing statute. It is a code in the Indian tradition, descended from the Indian Evidence Act 1872, and it states the law of evidence in positive terms rather than as a set of exclusionary rules with exceptions.',
    whyItMatters:
      'Malaysian evidence law is codified. Reasoning from English or Australian common law authority without first reading the section is the most common way to get it wrong.',
    commonMisconception:
      'Assuming the Australian uniform Evidence Acts, or English common law, apply by analogy. The structure of the Malaysian Act is genuinely different.',
    concepts: ['evidence-act-1950'],
    skills: ['statutory-analysis', 'evidence-analysis'],
    sourceReference: 'Evidence Act 1950',
  },
  {
    slug: 'my-ev-relevance-code',
    domain: 'evidence',
    type: 'true_false',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    stem: 'True or false: under the Evidence Act 1950, evidence is admissible if it is relevant in the ordinary sense of assisting the court.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['false'],
    explanation:
      'False. The Act does not use relevance in an open, common sense way. Evidence is admissible only if it is relevant in the sense of falling within one of the specific relevancy provisions of the Act, which set out categories such as facts forming part of the same transaction, motive, preparation and conduct. Something can be logically probative and still be inadmissible because no section makes it relevant.',
    whyItMatters:
      'It changes how you argue admissibility. The question is not whether the evidence helps, but which section lets it in.',
    memoryTrick: 'Find the section first. Logic is not enough on its own.',
    concepts: ['evidence-act-1950', 'relevance'],
    skills: ['statutory-analysis', 'evidence-analysis'],
    sourceReference: 'Evidence Act 1950 ss 5 to 55',
  },
  {
    slug: 'my-ev-expert-opinion',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    stem: 'Under the Evidence Act 1950, when is the opinion of an expert relevant?',
    options: [
      { id: 'a', text: 'Whenever the witness holds a professional qualification' },
      { id: 'b', text: 'When the court has to form an opinion on a point of foreign law, science, art, or identity of handwriting or finger impressions' },
      { id: 'c', text: 'Only where both parties agree to the expert' },
      { id: 'd', text: 'Never; opinion evidence is always inadmissible' },
    ],
    correct: ['b'],
    explanation:
      'Section 45 makes relevant the opinions of persons specially skilled in the enumerated matters: foreign law, science or art, and the identity of handwriting or finger impressions. The section is the gateway, and the witness must be shown to be specially skilled in the field in question.',
    whyItMatters:
      'Expert reports are frequently vulnerable because nobody laid the foundation for the expertise. Reading a report with section 45 in mind is how you find that.',
    concepts: ['evidence-act-1950', 'opinion-evidence'],
    skills: ['evidence-analysis', 'statutory-analysis'],
    sourceReference: 'Evidence Act 1950 s 45',
  },
  {
    slug: 'my-ev-privilege',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    stem: 'Which provision of the Evidence Act 1950 protects professional communications between an advocate and solicitor and their client?',
    options: [
      { id: 'a', text: 'Section 23' },
      { id: 'b', text: 'Section 45' },
      { id: 'c', text: 'Section 126' },
      { id: 'd', text: 'Section 114' },
    ],
    correct: ['c'],
    explanation:
      'Section 126 prohibits an advocate from disclosing communications made to them in the course and for the purpose of their employment as such, subject to stated exceptions including communications made in furtherance of an illegal purpose. The privilege belongs to the client and can be waived by the client.',
    whyItMatters:
      'Privilege is decided document by document and is regularly lost through carelessness, so knowing which section you are relying on matters when it is challenged.',
    concepts: ['evidence-act-1950', 'client-legal-privilege'],
    skills: ['evidence-analysis', 'professional-judgment'],
    sourceReference: 'Evidence Act 1950 s 126',
  },
  {
    slug: 'my-ev-without-prejudice',
    domain: 'evidence',
    type: 'true_false',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    stem: 'True or false: marking a letter “without prejudice” is what makes it protected from being put before the court.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['false'],
    explanation:
      'False. Protection attaches to admissions made upon an express or implied condition that evidence of them is not to be given, which in practice means communications forming part of a genuine attempt to settle. The label is evidence of the intention, not the source of the protection. A letter marked without prejudice that makes no settlement proposal at all may not be protected, and a genuine settlement communication may be protected without the label.',
    whyItMatters:
      'Juniors mark correspondence without prejudice reflexively, and sometimes mark genuine open offers that way by mistake. Both errors have consequences.',
    concepts: ['evidence-act-1950', 'settlement-privilege'],
    skills: ['written-communication', 'professional-judgment'],
    sourceReference: 'Evidence Act 1950 s 23',
  },
  {
    slug: 'my-ev-burden',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'Under the Evidence Act 1950, on whom does the burden of proof lie?',
    options: [
      { id: 'a', text: 'On the defendant, who must disprove the claim' },
      { id: 'b', text: 'On the person who would fail if no evidence at all were given on either side' },
      { id: 'c', text: 'On whichever party the court directs' },
      { id: 'd', text: 'On neither; the court investigates for itself' },
    ],
    correct: ['b'],
    explanation:
      'Section 101 places the burden on the person who asserts, and section 102 states it lies on the person who would fail if no evidence at all were given on either side. Section 103 adds that the burden as to any particular fact lies on the person who wishes the court to believe in its existence.',
    whyItMatters:
      'It decides what your evidence has to establish, and it is the first thing to work out before deciding what witnesses you need.',
    concepts: ['evidence-act-1950', 'onus-of-proof'],
    skills: ['evidence-analysis', 'statutory-analysis'],
    sourceReference: 'Evidence Act 1950 ss 101 to 103',
  },
  {
    slug: 'my-ev-civil-standard',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'What is the standard of proof in an ordinary Malaysian civil action?',
    options: [
      { id: 'a', text: 'Beyond reasonable doubt' },
      { id: 'b', text: 'On the balance of probabilities' },
      { id: 'c', text: 'Clear and convincing evidence' },
      { id: 'd', text: 'Prima facie evidence only' },
    ],
    correct: ['b'],
    explanation:
      'Civil matters are decided on the balance of probabilities: the court must be satisfied that the fact is more likely than not. Beyond reasonable doubt is the criminal standard. Allegations of fraud raised in civil proceedings have attracted particular attention in the Malaysian authorities, and the position should be checked rather than assumed.',
    whyItMatters:
      'It is what you are actually trying to achieve with the evidence, and it is often lower than a client fears.',
    concepts: ['standard-of-proof'],
    skills: ['evidence-analysis'],
    sourceReference: 'Evidence Act 1950 s 3, definition of "proved"',
  },

  /* --- advocacy ---------------------------------------------------------- */
  {
    slug: 'my-ad-leading-questions',
    domain: 'advocacy',
    type: 'true_false',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'True or false: under the Evidence Act 1950, leading questions may generally be asked in examination in chief.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['false'],
    explanation:
      'False. Section 142 provides that leading questions must not, if objected to by the adverse party, be asked in examination in chief or re-examination without the permission of the court. Section 143 permits them in cross-examination. A leading question is one suggesting the answer the questioner wishes to receive.',
    whyItMatters:
      'It is the most common objection you will hear and the most common one taken against you, and it is entirely avoidable with prepared open questions.',
    memoryTrick: 'In chief you ask. In cross you tell, and wait for the answer.',
    concepts: ['evidence-act-1950', 'questioning-rules', 'examination-in-chief'],
    skills: ['oral-communication', 'evidence-analysis'],
    sourceReference: 'Evidence Act 1950 ss 141 to 143',
  },
  {
    slug: 'my-ad-duty-to-court',
    domain: 'advocacy',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'The night before a hearing you find a Federal Court decision squarely against your client’s position. Your opponent has not cited it.',
    stem: 'What should you do?',
    options: [
      { id: 'a', text: 'Say nothing; it is the opponent’s job to find their own authorities' },
      { id: 'b', text: 'Draw it to the court’s attention and distinguish it if you can' },
      { id: 'c', text: 'Withdraw from the matter' },
      { id: 'd', text: 'Ask the client whether to disclose it' },
    ],
    correct: ['b'],
    explanation:
      'An advocate’s paramount duty is to the court. That duty includes informing the court of binding authority known to the advocate and against the client’s case, even where the opponent has not found it. Having disclosed it, you may and should argue why it does not govern the present facts.',
    whyItMatters:
      'This is a professional obligation, not a courtesy. It comes up more often than juniors expect, usually late at night before a hearing.',
    commonMisconception:
      'Treating it as a balance between the duty to the client and the duty to the court. It is not a balance; the duty to the court prevails.',
    concepts: ['duty-to-court', 'candour-and-disclosure'],
    skills: ['professional-judgment'],
    sourceReference: 'Legal Profession Act 1976; Legal Profession (Practice and Etiquette) Rules 1978',
  },
  {
    slug: 'my-ad-reexamination',
    domain: 'advocacy',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    stem: 'What is the proper scope of re-examination?',
    options: [
      { id: 'a', text: 'Anything the advocate forgot to ask in chief' },
      { id: 'b', text: 'Matters arising out of the cross-examination, to explain what was raised there' },
      { id: 'c', text: 'Any matter, provided leading questions are not used' },
      { id: 'd', text: 'A summary of the witness’s evidence for the court' },
    ],
    correct: ['b'],
    explanation:
      'Section 138 confines re-examination to the explanation of matters referred to in cross-examination. New matter may be introduced only with the leave of the court, and if it is, the other side may cross-examine on it.',
    whyItMatters:
      'Juniors often want re-examination to repair everything that went badly. It cannot do that, and attempting it draws an objection and highlights the damage.',
    concepts: ['evidence-act-1950', 're-examination'],
    skills: ['oral-communication', 'strategic-reasoning'],
    sourceReference: 'Evidence Act 1950 s 138',
  },
  {
    slug: 'my-ad-answer-the-bench',
    domain: 'advocacy',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'A judge interrupts your submission with a question about a point you had planned to reach later. What should you do?',
    options: [
      { id: 'a', text: 'Ask to finish the current point first' },
      { id: 'b', text: 'Answer it directly, then return to your structure' },
      { id: 'c', text: 'Refer the judge to your written submissions' },
      { id: 'd', text: 'Defer to your instructing solicitor' },
    ],
    correct: ['b'],
    explanation:
      'A question from the bench tells you what is actually troubling the court, which matters more than the order of your outline. Answer it directly, ideally beginning with yes or no, give the reason, then return to your structure.',
    whyItMatters:
      'The court’s concern is the thing that will decide the case. An advocate who defers it is arguing to a plan rather than to the judge.',
    concepts: ['oral-submissions'],
    skills: ['oral-communication', 'argument-construction'],
  },

  /* --- drafting ---------------------------------------------------------- */
  {
    slug: 'my-dr-statement-of-claim',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'What must a statement of claim contain?',
    options: [
      { id: 'a', text: 'The material facts relied on, but not the evidence by which they will be proved' },
      { id: 'b', text: 'The material facts and the evidence supporting each of them' },
      { id: 'c', text: 'The legal argument in full' },
      { id: 'd', text: 'A narrative of the client’s dealings with the defendant' },
    ],
    correct: ['a'],
    explanation:
      'A pleading states the material facts relied on, and not the evidence by which those facts are to be proved. It also does not contain argument or law, beyond identifying the cause of action and any statutory provision relied on.',
    whyItMatters:
      'Clients almost always want the pleading to tell the whole story of how badly they were treated. Explaining why it cannot, and that the material will be deployed as evidence in due course, is part of the job.',
    concepts: ['drafting-pleadings', 'pleadings'],
    skills: ['written-communication', 'attention-to-detail'],
    sourceReference: 'Rules of Court 2012 O 18 r 7',
  },
  {
    slug: 'my-dr-affidavit-content',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'Which of these does not belong in an affidavit?',
    options: [
      { id: 'a', text: 'Facts within the deponent’s own knowledge' },
      { id: 'b', text: 'Legal submissions about why the application should succeed' },
      { id: 'c', text: 'Exhibited documents referred to in the body' },
      { id: 'd', text: 'The date and place it was affirmed' },
    ],
    correct: ['b'],
    explanation:
      'An affidavit contains evidence, not argument. Legal submissions belong in written or oral submissions made by the advocate, not sworn or affirmed to by a lay deponent. Affidavits containing argument invite objection and read as though the deponent is being told what to say.',
    whyItMatters:
      'Drafting affidavits is delegated to juniors constantly, and this is the error a supervising partner will send back most often.',
    concepts: ['affidavits'],
    skills: ['written-communication', 'attention-to-detail'],
    sourceReference: 'Rules of Court 2012 O 41',
  },
  {
    slug: 'my-dr-prayer-for-relief',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'What is the function of the prayer for relief in a statement of claim?',
    options: [
      { id: 'a', text: 'To summarise the facts pleaded above it' },
      { id: 'b', text: 'To state, in the form of the orders sought, exactly what the plaintiff asks the court to do' },
      { id: 'c', text: 'To estimate the costs of the proceeding' },
      { id: 'd', text: 'To identify the witnesses who will be called' },
    ],
    correct: ['b'],
    explanation:
      'The prayer sets out the relief sought in the form of the orders the plaintiff asks the court to make: judgment for a sum, a declaration, an injunction in specified terms, interest, and costs. It is what the client actually walks away with.',
    whyItMatters:
      'Drafting it first, before the body, forces you to be clear about what the case is for. Left to the end, it tends to be vague in exactly the way that causes trouble at judgment.',
    concepts: ['relief-claimed', 'drafting-pleadings'],
    skills: ['written-communication', 'strategic-reasoning'],
    sourceReference: 'Rules of Court 2012 O 18',
  },

  /* --- legal reasoning --------------------------------------------------- */
  {
    slug: 'my-lr-federal-court-binds',
    domain: 'legal-reasoning',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You are before the Sessions Court. A Federal Court decision is against your client. A more recent High Court decision supports your position.',
    stem: 'Which should the Sessions Court follow?',
    options: [
      { id: 'a', text: 'The High Court decision, because it is more recent' },
      { id: 'b', text: 'The Federal Court decision, because it binds' },
      { id: 'c', text: 'Whichever is better reasoned' },
      { id: 'd', text: 'Neither; the Sessions Court decides for itself' },
    ],
    correct: ['b'],
    explanation:
      'Courts are bound by decisions of courts above them in the hierarchy. The Federal Court sits above both the High Court and the Sessions Court, so its decision binds regardless of the date of the later High Court decision. The High Court decision was, on this scenario, given in the face of binding authority.',
    whyItMatters:
      'Recency is not authority. Citing the newest case you can find, without checking what sits above it, is a fast way to lose credibility with a judge.',
    commonMisconception:
      'Treating a later decision as superseding an earlier one. That works within a level, not across the hierarchy.',
    concepts: ['stare-decisis'],
    skills: ['argument-construction', 'professional-judgment'],
  },
  {
    slug: 'my-lr-ratio-obiter',
    domain: 'legal-reasoning',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    stem: 'Which part of a judgment binds a later court?',
    options: [
      { id: 'a', text: 'The headnote prepared by the law reporter' },
      { id: 'b', text: 'The ratio decidendi, the legal principle necessary to the decision on the facts found' },
      { id: 'c', text: 'Every proposition of law stated in the reasons' },
      { id: 'd', text: 'The orders made' },
    ],
    correct: ['b'],
    explanation:
      'Only the ratio decidendi binds: the proposition of law necessary to the court’s decision on the facts it found. Everything else in the reasons, including observations on hypothetical facts and comments on arguments not needed for the outcome, is obiter dicta and persuasive only. The headnote is the reporter’s summary and has no authority at all.',
    whyItMatters:
      'Citing an obiter passage as though it were binding is an error a judge will correct, usually in front of your client.',
    concepts: ['ratio-and-obiter'],
    skills: ['argument-construction', 'attention-to-detail'],
  },
  {
    slug: 'my-lr-purposive-approach',
    domain: 'legal-reasoning',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_FEDERAL',
    stem: 'Which provision requires a purposive approach to interpreting Malaysian written law?',
    options: [
      { id: 'a', text: 'Section 17A of the Interpretation Acts 1948 and 1967' },
      { id: 'b', text: 'Section 15AA of the Acts Interpretation Act 1901' },
      { id: 'c', text: 'Section 3 of the Civil Law Act 1956' },
      { id: 'd', text: 'Article 160 of the Federal Constitution' },
    ],
    correct: ['a'],
    explanation:
      'Section 17A of the Interpretation Acts 1948 and 1967 requires that, in interpreting a provision of an Act, a construction that would promote the purpose or object underlying the Act be preferred to a construction that would not. Section 15AA of the Acts Interpretation Act 1901 is the Australian equivalent, not the Malaysian one.',
    whyItMatters:
      'It changes how a submission on meaning is built: purpose is not a fallback for ambiguity, it is preferred from the start.',
    memoryTrick: '17A in Malaysia. Purpose is preferred, not merely consulted.',
    concepts: ['statutory-interpretation'],
    skills: ['statutory-analysis', 'argument-construction'],
    sourceReference: 'Interpretation Acts 1948 and 1967 s 17A',
  },
  {
    slug: 'my-lr-elements-analysis',
    domain: 'legal-reasoning',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A client says a supplier promised a delivery date, missed it, and cost them a contract with their own customer.',
    stem: 'What is the first analytical step?',
    options: [
      { id: 'a', text: 'Estimate the damages' },
      { id: 'b', text: 'Identify the cause of action and list what must be proved for each element' },
      { id: 'c', text: 'Research the most recent case law on delivery terms' },
      { id: 'd', text: 'Write a letter of demand' },
    ],
    correct: ['b'],
    explanation:
      'Legal analysis proceeds by elements. Identify the cause of action, here most likely breach of contract, then list what must be proved for it, and test the client’s account and documents against each requirement. That immediately reveals which elements are strong, which are contestable, and what evidence is missing.',
    whyItMatters:
      'It converts a client’s grievance into a legal question you can answer. It is also how you discover early that a client has a genuine complaint but no cause of action, which is far better found in the first conference than after filing.',
    concepts: ['elements-analysis', 'issue-identification'],
    skills: ['strategic-reasoning', 'argument-construction'],
  },
  {
    slug: 'my-ad-objection-ground',
    domain: 'advocacy',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'Your opponent asks a witness a question you consider objectionable. What is the proper course?',
    options: [
      { id: 'a', text: 'Wait for the answer, then apply to have it struck out' },
      { id: 'b', text: 'Rise, object before the answer is given, and state the ground shortly' },
      { id: 'c', text: 'Note it and raise it in closing submissions' },
      { id: 'd', text: 'Interrupt the witness directly' },
    ],
    correct: ['b'],
    explanation:
      'An objection should be taken before the answer is given, briefly, and on a stated ground: leading, irrelevant, opinion, or the form of the question. The advocate rises, identifies the ground in a sentence, and waits for the court before developing the point.',
    whyItMatters:
      'Once the answer is out, the court has heard it. Objecting afterwards achieves far less and looks like an afterthought.',
    commonMisconception:
      'Objecting at length. A short ground is more effective and less irritating to the bench than an argument.',
    concepts: ['objections', 'questioning-rules'],
    skills: ['oral-communication', 'evidence-analysis'],
  },
  {
    slug: 'my-ad-putting-your-case',
    domain: 'advocacy',
    type: 'true_false',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    stem: 'True or false: if you intend to submit that a witness is not telling the truth about a matter, you must put that to them in cross-examination.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['true'],
    explanation:
      'True. The rule in Browne v Dunn, applied in Malaysia, requires that a party who intends to contradict a witness or impeach their account put the substance of the contradiction to the witness, so the witness has an opportunity to answer it. Failing to do so may cost you the submission, or lead to the witness being recalled.',
    whyItMatters:
      'Breach of it is one of the most common ways a junior loses a point that was otherwise available, and it is discovered only in closing when it is too late.',
    memoryTrick: 'If you are going to say it about them, say it to them first.',
    concepts: ['browne-v-dunn', 'cross-examination'],
    skills: ['oral-communication', 'strategic-reasoning'],
  },
  {
    slug: 'my-dr-letter-of-demand',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'MY_GENERAL',
    stem: 'What should a letter of demand contain?',
    options: [
      { id: 'a', text: 'The amount claimed only' },
      { id: 'b', text: 'The parties, the obligation, the amount and its basis, a deadline, and the consequence of non-payment' },
      { id: 'c', text: 'A full statement of the evidence' },
      { id: 'd', text: 'An offer to settle at a discount' },
    ],
    correct: ['b'],
    explanation:
      'A letter of demand should identify the parties and the obligation, state the amount and its basis, specify a deadline, and set out the consequence of non-payment, commonly the commencement of proceedings and a claim for interest and costs. It is often the first document the other side’s lawyer reads.',
    whyItMatters:
      'It is frequently the first thing a junior drafts unsupervised, and a vague one invites a reply asking for the detail you should have given.',
    concepts: ['letters-of-demand'],
    skills: ['written-communication', 'commercial-reasoning'],
  },
  {
    slug: 'my-dr-chronology',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'What makes a chronology useful to a court?',
    options: [
      { id: 'a', text: 'It argues the client’s case in date order' },
      { id: 'b', text: 'It lists relevant events in date order, each with a reference to where it is established in the evidence' },
      { id: 'c', text: 'It lists every event in the file' },
      { id: 'd', text: 'It replaces the need for written submissions' },
    ],
    correct: ['b'],
    explanation:
      'A chronology lists relevant events in date order with a reference to where each is established in the evidence. It is a navigation aid, not argument. A chronology that characterises events rather than stating them loses the court’s trust, which is the one thing it exists to build.',
    whyItMatters:
      'It is often the document a judge keeps open throughout a hearing, and preparing it is usually the junior’s job.',
    concepts: ['chronologies'],
    skills: ['written-communication', 'attention-to-detail'],
  },
  {
    slug: 'my-dr-written-submissions',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'How should written submissions be structured?',
    options: [
      { id: 'a', text: 'As a narrative of the facts, followed by the law' },
      { id: 'b', text: 'By stating what the court has to decide, then answering each question in turn with references to the evidence and authority' },
      { id: 'c', text: 'As a list of every authority found in research' },
      { id: 'd', text: 'As a summary of the opponent’s case and why it is wrong' },
    ],
    correct: ['b'],
    explanation:
      'Written submissions should tell the court what it has to decide, then answer each of those questions in turn, supporting each proposition with a reference to the evidence and to authority. A narrative that leaves the court to work out the questions makes the court do the advocate’s job.',
    whyItMatters:
      'Judges read submissions before the hearing. What they take from that first reading often shapes everything after it.',
    concepts: ['written-submissions', 'issue-identification'],
    skills: ['written-communication', 'argument-construction'],
  },
  {
    slug: 'my-lr-distinguishing',
    domain: 'legal-reasoning',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    stem: 'What does it mean to distinguish an authority?',
    options: [
      { id: 'a', text: 'To argue the earlier decision was wrongly decided' },
      { id: 'b', text: 'To accept it as correct and binding, and argue it does not apply because a materially different fact or issue takes the present case outside its ratio' },
      { id: 'c', text: 'To find a later decision that contradicts it' },
      { id: 'd', text: 'To ask the court to overrule it' },
    ],
    correct: ['b'],
    explanation:
      'Distinguishing accepts the earlier decision as correct and binding, and argues that it does not apply because a materially different fact or issue takes the present case outside its ratio. It is not the same as saying the case was wrongly decided, which a court bound by it cannot act on anyway.',
    whyItMatters:
      'It is the only move available to you when binding authority is against your client and you are not in a court that can depart from it.',
    concepts: ['distinguishing', 'ratio-and-obiter'],
    skills: ['argument-construction', 'strategic-reasoning'],
  },
];
