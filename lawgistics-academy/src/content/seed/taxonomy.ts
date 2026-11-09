import type { SeedConcept, SeedDomain, SeedSkill } from './types';

/**
 * The knowledge graph's vocabulary.
 *
 * Domains are how content is browsed. Concepts are what mastery is tracked
 * against. Skills are the cognitive moves a question exercises; they cut
 * across domains, and they are the axis that eventually says "strong at
 * strategic reasoning, weaker at procedural sequencing" rather than merely
 * "good at Evidence".
 */

export const DOMAINS: SeedDomain[] = [
  {
    slug: 'court-system',
    name: 'Court System',
    description:
      'Court hierarchy, jurisdiction, appellate structure and the terminology of the courtroom.',
  },
  {
    slug: 'civil-procedure',
    name: 'Civil Procedure',
    description:
      'How a civil proceeding is commenced, prosecuted and resolved: pleadings, discovery, subpoenas, interlocutory steps and costs.',
  },
  {
    slug: 'evidence',
    name: 'Evidence',
    description:
      'Relevance, hearsay, opinion, privilege and proof, including which Australian jurisdictions apply the uniform Evidence Acts.',
  },
  {
    slug: 'advocacy',
    name: 'Advocacy',
    description:
      'Examination, cross-examination, objections, oral submissions and the advocate’s duties to the court.',
  },
  {
    slug: 'drafting',
    name: 'Drafting',
    description:
      'Affidavits, pleadings, correspondence and written submissions, the documents a litigator actually produces.',
  },
  {
    slug: 'legal-research',
    name: 'Legal research',
    description:
      'Finding the law, checking it is still the law, and being able to say how you know.',
  },
  {
    slug: 'ethics-and-ai',
    name: 'Ethics and AI',
    description:
      'The duties that do not change when the drafting is done by a machine: confidentiality, verification, candour to the court, and who is answerable for the work.',
  },
  {
    slug: 'legal-reasoning',
    name: 'Legal Reasoning',
    description:
      'Precedent, ratio and obiter, statutory interpretation and reasoning by elements and analogy.',
  },

  // --- Practice skills (the owner, November 2026: the skills "the new
  // generation of lawyers" can build). Situational judgement, not law: see
  // questions/practice-skills-my.ts. Drafting, legal research and technology
  // fluency (in Ethics and AI) are the existing areas above.
  {
    slug: 'plain-language',
    name: 'Plain-language communication',
    description:
      'Explaining a complicated issue so that a client can make a decision: the answer first, plain words, and checking it was understood.',
  },
  {
    slug: 'time-management',
    name: 'Time management',
    description:
      'Recording time accurately, meeting deadlines, and managing several matters and several seniors at once.',
  },
  {
    slug: 'commercial-awareness',
    name: 'Commercial awareness',
    description:
      'How a client’s business makes money, what a dispute costs against what it is worth, and advice that solves the real problem.',
  },
  {
    slug: 'client-care',
    name: 'Client care',
    description:
      'Responding promptly, managing expectations, delivering bad news and keeping clients informed.',
  },
  {
    slug: 'negotiation',
    name: 'Negotiation',
    description:
      'Knowing your position and your fallback, taking instructions, and recording what was agreed.',
  },
  {
    slug: 'business-development',
    name: 'Business development',
    description:
      'Building relationships, referral networks and a professional reputation from day one, within the profession’s rules.',
  },
  {
    slug: 'resilience',
    name: 'Resilience and self-management',
    description:
      'Handling pressure, asking for feedback and looking after your own wellbeing.',
  },
];

/**
 * The seven areas that are practice skills rather than knowledge of the law.
 * The diagnostic's own set is about the eight knowledge areas, so these are
 * not required of it (tests/diagnostic-set.test.ts); the mock exam, drills
 * and daily training draw on them like any other area.
 */
export const PRACTICE_SKILL_DOMAINS = [
  'plain-language',
  'time-management',
  'commercial-awareness',
  'client-care',
  'negotiation',
  'business-development',
  'resilience',
] as const;

export const CONCEPTS: SeedConcept[] = [
  // --- Court System ---------------------------------------------------------
  { slug: 'court-hierarchy', domain: 'court-system', name: 'Court hierarchy', description: 'The vertical ordering of courts and what each may hear.' },
  { slug: 'appellate-structure', domain: 'court-system', name: 'Appellate structure', description: 'Which court hears appeals from which, and on what basis.' },
  { slug: 'federal-jurisdiction', domain: 'court-system', name: 'Federal jurisdiction', description: 'The federal courts and the split between federal and state jurisdiction.' },
  { slug: 'court-terminology', domain: 'court-system', name: 'Court terminology', description: 'The vocabulary of proceedings, parties and hearings.' },
  { slug: 'courtroom-conduct', domain: 'court-system', name: 'Courtroom conduct', description: 'Modes of address, appearances and courtroom etiquette.' },
  { slug: 'tribunals', domain: 'court-system', name: 'Tribunals', description: 'How tribunals differ from courts and what follows from that.' },
  { slug: 'monetary-jurisdiction', domain: 'court-system', name: 'Monetary jurisdiction', description: 'Which court a claim belongs in, by value.' },

  // --- Civil Procedure ------------------------------------------------------
  { slug: 'originating-process', domain: 'civil-procedure', name: 'Originating process', description: 'How a proceeding is commenced and what document starts it.' },
  { slug: 'pleadings', domain: 'civil-procedure', name: 'Pleadings', description: 'Statements of claim, defences and replies, and what they must contain.' },
  { slug: 'particulars', domain: 'civil-procedure', name: 'Particulars', description: 'Detail supplied to explain a pleaded allegation.' },
  { slug: 'discovery', domain: 'civil-procedure', name: 'Discovery', description: 'The obligation to disclose relevant documents between parties.' },
  { slug: 'subpoenas', domain: 'civil-procedure', name: 'Subpoenas', description: 'Compulsory production of documents or attendance to give evidence.' },
  { slug: 'interlocutory-applications', domain: 'civil-procedure', name: 'Interlocutory applications', description: 'Applications made before final determination of a proceeding.' },
  { slug: 'default-judgment', domain: 'civil-procedure', name: 'Default judgment', description: 'Judgment entered where a defendant fails to respond in time.' },
  { slug: 'summary-judgment', domain: 'civil-procedure', name: 'Summary judgment', description: 'Disposing of a claim or defence without a trial.' },
  { slug: 'limitation-periods', domain: 'civil-procedure', name: 'Limitation periods', description: 'The time within which a proceeding must be commenced.' },
  { slug: 'costs', domain: 'civil-procedure', name: 'Costs', description: 'Who pays, on what basis, and how that is influenced by offers.' },

  // --- Evidence -------------------------------------------------------------
  { slug: 'uniform-evidence-acts', domain: 'evidence', name: 'Uniform Evidence Acts', description: 'Which Australian jurisdictions apply the uniform scheme, and which do not.' },
  { slug: 'relevance', domain: 'evidence', name: 'Relevance', description: 'The threshold every piece of evidence must cross.' },
  { slug: 'hearsay', domain: 'evidence', name: 'Hearsay', description: 'Previous representations tendered to prove the fact asserted.' },
  { slug: 'opinion-evidence', domain: 'evidence', name: 'Opinion evidence', description: 'The opinion rule and the specialised knowledge exception.' },
  { slug: 'client-legal-privilege', domain: 'evidence', name: 'Client legal privilege', description: 'Advice privilege, litigation privilege and the dominant purpose test.' },
  { slug: 'settlement-privilege', domain: 'evidence', name: 'Settlement privilege', description: 'Protection for genuine attempts to settle a dispute.' },
  { slug: 'standard-of-proof', domain: 'evidence', name: 'Standard of proof', description: 'Balance of probabilities, and how gravity affects satisfaction.' },
  { slug: 'onus-of-proof', domain: 'evidence', name: 'Onus of proof', description: 'Who must prove what.' },
  { slug: 'documentary-evidence', domain: 'evidence', name: 'Documentary evidence', description: 'Getting documents into evidence, including business records.' },
  { slug: 'questioning-rules', domain: 'evidence', name: 'Rules of questioning', description: 'Leading questions and the limits on how a witness may be asked.' },

  // --- Advocacy -------------------------------------------------------------
  { slug: 'examination-in-chief', domain: 'advocacy', name: 'Examination in chief', description: 'Leading your own witness through their evidence.' },
  { slug: 'cross-examination', domain: 'advocacy', name: 'Cross-examination', description: 'Testing the other side’s evidence and putting your case.' },
  { slug: 're-examination', domain: 'advocacy', name: 'Re-examination', description: 'Repairing damage, within strict limits.' },
  { slug: 'browne-v-dunn', domain: 'advocacy', name: 'The rule in Browne v Dunn', description: 'The obligation to put your case to a witness.' },
  { slug: 'objections', domain: 'advocacy', name: 'Objections', description: 'When and how to object, and on what ground.' },
  { slug: 'oral-submissions', domain: 'advocacy', name: 'Oral submissions', description: 'Structuring and delivering argument to a court.' },
  { slug: 'duty-to-court', domain: 'advocacy', name: 'Duty to the court', description: 'The paramount duty, and what it overrides.' },
  { slug: 'candour-and-disclosure', domain: 'advocacy', name: 'Candour and disclosure', description: 'Adverse authority, corrections and personal opinion.' },

  // --- Drafting -------------------------------------------------------------
  { slug: 'affidavits', domain: 'drafting', name: 'Affidavits', description: 'Form, content and the limits of what an affidavit may say.' },
  { slug: 'affidavit-formalities', domain: 'drafting', name: 'Affidavit formalities', description: 'Jurats, exhibits, annexures and alterations.' },
  { slug: 'statutory-declarations', domain: 'drafting', name: 'Statutory declarations', description: 'What they are for, and how they differ from affidavits.' },
  { slug: 'letters-of-demand', domain: 'drafting', name: 'Letters of demand', description: 'The first formal step in most commercial disputes.' },
  { slug: 'drafting-pleadings', domain: 'drafting', name: 'Drafting pleadings', description: 'Turning a cause of action into a pleaded case.' },
  { slug: 'relief-claimed', domain: 'drafting', name: 'Relief claimed', description: 'Asking the court for the right orders.' },
  { slug: 'chronologies', domain: 'drafting', name: 'Chronologies', description: 'Organising facts so a court can follow them.' },
  { slug: 'written-submissions', domain: 'drafting', name: 'Written submissions', description: 'Argument in writing, to a court’s requirements.' },

  // --- Legal Reasoning ------------------------------------------------------
  { slug: 'ratio-and-obiter', domain: 'legal-reasoning', name: 'Ratio and obiter', description: 'What actually binds in a judgment, and what merely persuades.' },
  { slug: 'stare-decisis', domain: 'legal-reasoning', name: 'Stare decisis', description: 'Which decisions bind which courts.' },
  { slug: 'appellate-comity', domain: 'legal-reasoning', name: 'Appellate comity', description: 'How Australian courts treat each other across hierarchies.' },
  { slug: 'distinguishing', domain: 'legal-reasoning', name: 'Distinguishing', description: 'Confining an authority on its facts.' },
  { slug: 'statutory-interpretation', domain: 'legal-reasoning', name: 'Statutory interpretation', description: 'Text, context and purpose.' },
  { slug: 'extrinsic-materials', domain: 'legal-reasoning', name: 'Extrinsic materials', description: 'When you may look outside the statute.' },
  { slug: 'elements-analysis', domain: 'legal-reasoning', name: 'Elements analysis', description: 'Breaking a cause of action into what must be proved.' },
  { slug: 'issue-identification', domain: 'legal-reasoning', name: 'Issue identification', description: 'Finding the question that actually decides the case.' },

  // Ethics and AI. Deliberately expressed as duties rather than as tool
  // behaviour: the tools change every few months, the obligations do not.
  { slug: 'ai-confidentiality', domain: 'ethics-and-ai', name: 'Confidentiality and AI', description: 'What putting client material into a third party system actually does.' },
  { slug: 'ai-verification', domain: 'ethics-and-ai', name: 'Verifying output', description: 'The obligation to check what the machine produced before it leaves your desk.' },
  { slug: 'ai-candour', domain: 'ethics-and-ai', name: 'Candour about AI use', description: 'What a court must be told, and what happens when it is not.' },
  { slug: 'ai-competence', domain: 'ethics-and-ai', name: 'Competence with the tool', description: 'Understanding a system well enough to be responsible for using it.' },
  { slug: 'ai-supervision', domain: 'ethics-and-ai', name: 'Supervision and responsibility', description: 'Who answers for work a machine helped produce.' },
  { slug: 'ai-privilege', domain: 'ethics-and-ai', name: 'Privilege and AI', description: 'Whether disclosure to a system is disclosure to a third party.' },
  { slug: 'ai-billing', domain: 'ethics-and-ai', name: 'Billing and AI', description: 'Charging for work that took an hour and used to take five.' },

  // The firm-facing half of the same subject. The concepts above are what an
  // individual owes; these are what an organisation has to be able to show.
  { slug: 'ai-policy', domain: 'ethics-and-ai', name: 'Approved tools', description: 'Who decides which systems may touch client material, and on what terms.' },
  { slug: 'ai-client-consent', domain: 'ethics-and-ai', name: 'Telling the client', description: 'What a client is told about AI use, and when consent is needed.' },
  { slug: 'ai-vendor-terms', domain: 'ethics-and-ai', name: 'Provider terms', description: 'What the provider may retain, use and train on.' },
  { slug: 'ai-incident', domain: 'ethics-and-ai', name: 'When it goes wrong', description: 'The path a mistake follows, and how fast.' },
  { slug: 'ai-records', domain: 'ethics-and-ai', name: 'Records', description: 'Being able to show what was used, by whom, and how it was checked.' },

  // Legal research. Ordered roughly as the work happens.
  { slug: 'research-strategy', domain: 'legal-research', name: 'Where to start', description: 'Getting a framework before going near a database.' },
  { slug: 'currency', domain: 'legal-research', name: 'Currency', description: 'Whether what you are reading is the law today.' },
  { slug: 'noting-up', domain: 'legal-research', name: 'Noting up', description: 'Checking a case has not been overruled, distinguished or doubted.' },
  { slug: 'authoritative-sources', domain: 'legal-research', name: 'Authoritative sources', description: 'Which version of a case or an Act you may rely on and cite.' },
  { slug: 'search-technique', domain: 'legal-research', name: 'Search technique', description: 'Getting to the right result without reading a thousand.' },
  { slug: 'recording-research', domain: 'legal-research', name: 'Recording research', description: 'Being able to say what you searched, where, and when.' },
  { slug: 'knowing-when-to-stop', domain: 'legal-research', name: 'Knowing when to stop', description: 'Recognising the point at which more searching adds nothing.' },

  // Malaysia. The domains are the same six, because the shape of litigation
  // work is the same; these are the concepts that have no Australian
  // equivalent, or whose Australian equivalent would be misleading.
  { slug: 'my-court-structure', domain: 'court-system', name: 'Malaysian court structure', description: 'The Federal Court, Court of Appeal, the two High Courts and the subordinate courts.' },
  { slug: 'my-monetary-jurisdiction', domain: 'court-system', name: 'Malaysian monetary jurisdiction', description: 'Which Malaysian court a claim belongs in, by value.' },
  { slug: 'syariah-courts', domain: 'court-system', name: 'Syariah courts', description: 'State courts of limited personal jurisdiction, outside the civil hierarchy.' },
  { slug: 'rules-of-court-2012', domain: 'civil-procedure', name: 'Rules of Court 2012', description: 'The unified rules governing civil procedure in the Malaysian courts.' },
  { slug: 'evidence-act-1950', domain: 'evidence', name: 'Evidence Act 1950', description: 'The codified Malaysian law of evidence.' },
  // --- Practice skills --------------------------------------------------------
  { slug: 'explain-to-decide', domain: 'plain-language', name: 'Explaining so that somebody can decide', description: 'Leading with the answer and the reason, so that the client can act on it.' },
  { slug: 'plain-words', domain: 'plain-language', name: 'Plain words', description: 'Saying a technical thing in the client’s own terms, without false promises.' },
  { slug: 'advice-structure', domain: 'plain-language', name: 'Structuring advice', description: 'Ordering a long document so that the point is found first.' },
  { slug: 'time-recording', domain: 'time-management', name: 'Recording time', description: 'Accurate, prompt time records, including late entries.' },
  { slug: 'deadlines', domain: 'time-management', name: 'Deadlines', description: 'Diarising dates, working back from them and saying early when one is at risk.' },
  { slug: 'prioritising', domain: 'time-management', name: 'Prioritising', description: 'Handling competing requests and several matters at once.' },
  { slug: 'client-business', domain: 'commercial-awareness', name: 'The client’s business', description: 'How the client makes money and what matters to it.' },
  { slug: 'cost-benefit', domain: 'commercial-awareness', name: 'Cost against benefit', description: 'What a step costs against what it is worth, and fee estimates.' },
  { slug: 'commercial-outcome', domain: 'commercial-awareness', name: 'The commercial outcome', description: 'Advising on the result the client needs, not only the legal result.' },
  { slug: 'responsiveness', domain: 'client-care', name: 'Responsiveness', description: 'Acknowledging promptly and saying when the client will hear more.' },
  { slug: 'expectations', domain: 'client-care', name: 'Managing expectations', description: 'Setting honest expectations of time, cost and outcome early.' },
  { slug: 'keeping-informed', domain: 'client-care', name: 'Keeping the client informed', description: 'Delivering bad news, owning an error, and agreeing how often to update.' },
  { slug: 'position-and-fallback', domain: 'negotiation', name: 'Position and fallback', description: 'Knowing your target, your walk-away point and what the other side needs.' },
  { slug: 'settlement', domain: 'negotiation', name: 'Settlement', description: 'Taking instructions, weighing an offer and recording what was agreed.' },
  { slug: 'relationships', domain: 'business-development', name: 'Relationships', description: 'Building and keeping professional relationships, without pitching.' },
  { slug: 'referrals', domain: 'business-development', name: 'Referrals', description: 'Handling referrals within the profession’s rules.' },
  { slug: 'reputation', domain: 'business-development', name: 'Reputation', description: 'Being known for reliable work, and publicity within the rules.' },
  { slug: 'feedback', domain: 'resilience', name: 'Feedback', description: 'Receiving criticism, asking for feedback and learning from a loss.' },
  { slug: 'pressure', domain: 'resilience', name: 'Pressure', description: 'Handling workload and setbacks.' },
  { slug: 'wellbeing', domain: 'resilience', name: 'Wellbeing', description: 'Looking after yourself and asking for help early.' },
  { slug: 'precise-wording', domain: 'drafting', name: 'Precise wording', description: 'Exact dates, defined terms and the request placed first.' },
  { slug: 'asking-a-senior', domain: 'legal-research', name: 'Knowing when to ask a senior', description: 'Asking early, with what you have tried.' },
  { slug: 'document-management', domain: 'ethics-and-ai', name: 'Document management', description: 'Filing in the right matter and handling a misfiled document.' },
  { slug: 'e-discovery', domain: 'ethics-and-ai', name: 'E-discovery tools', description: 'Using review software without handing it the responsibility.' },
];

export const SKILLS: SeedSkill[] = [
  { slug: 'procedural-sequencing', name: 'Procedural sequencing', description: 'Knowing what step comes next, and what must precede it.' },
  { slug: 'evidence-analysis', name: 'Evidence analysis', description: 'Assessing what a piece of material proves and whether it is admissible.' },
  { slug: 'attention-to-detail', name: 'Attention to detail', description: 'Catching the requirement, date or formality that others miss.' },
  { slug: 'strategic-reasoning', name: 'Strategic reasoning', description: 'Choosing the step that advances the client’s position.' },
  { slug: 'argument-construction', name: 'Argument construction', description: 'Building a case from authority and fact.' },
  { slug: 'oral-communication', name: 'Oral communication', description: 'Speaking persuasively and responsively on your feet.' },
  { slug: 'written-communication', name: 'Written communication', description: 'Producing documents that are clear, complete and correctly formed.' },
  { slug: 'statutory-analysis', name: 'Statutory analysis', description: 'Reading legislation closely and applying it accurately.' },
  { slug: 'professional-judgment', name: 'Professional judgment', description: 'Ethical decisions and duties owed to court and client.' },
  { slug: 'commercial-reasoning', name: 'Commercial reasoning', description: 'Weighing cost, risk and outcome the way a client does.' },
];
