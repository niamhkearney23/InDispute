import { TRUE_FALSE_OPTIONS, type SeedQuestion } from '../types';

export const DRAFTING_QUESTIONS: SeedQuestion[] = [
  {
    slug: 'dr-affidavit-sworn-or-affirmed',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    stem: 'An affidavit is a written statement that is:',
    options: [
      { id: 'a', text: 'Signed by the party’s solicitor on their behalf' },
      { id: 'b', text: 'Sworn on oath or affirmed by the deponent before an authorised person' },
      { id: 'c', text: 'Filed at court without any formality' },
      { id: 'd', text: 'Certified as correct by a barrister' },
    ],
    correct: ['b'],
    explanation:
      'An affidavit is evidence in written form. The person making it, the deponent, either swears it on oath or affirms it, before a person authorised to take affidavits, such as an Australian legal practitioner or a justice of the peace. Affirming has exactly the same effect as swearing; it is available to anyone who prefers not to take a religious oath. A solicitor cannot swear an affidavit on a client’s behalf.',
    whyItMatters:
      'An affidavit is sworn or affirmed evidence, which means a deponent who knowingly includes something false exposes themselves to serious consequences. That is worth explaining to a client before they sign, not after.',
    commonMisconception:
      'Treating an affirmation as a lesser form. It carries identical legal weight.',
    memoryTrick:
      'The deponent deposes. Nobody can do it for them.',
    concepts: ['affidavits'],
    skills: ['written-communication', 'attention-to-detail'],
  },
  {
    slug: 'dr-affidavit-no-submissions',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    stem: 'Which of the following does NOT belong in an affidavit?',
    options: [
      { id: 'a', text: 'The deponent’s account of what they saw and did' },
      { id: 'b', text: 'Legal argument about why the client should succeed' },
      { id: 'c', text: 'Documents exhibited or annexed to the affidavit' },
      { id: 'd', text: 'Dates and details of relevant events' },
    ],
    correct: ['b'],
    explanation:
      'An affidavit contains evidence, not argument. Legal submissions belong in written or oral submissions, made by the practitioner, not sworn to by a lay deponent. Affidavits containing argument are commonly criticised by courts and parts of them may be struck out, with costs consequences.',
    whyItMatters:
      'Junior lawyers draft affidavits constantly, and drifting into submissions is the most common failing. It also puts the deponent in the position of swearing to something they cannot know: a legal conclusion.',
    commonMisconception:
      'Thinking a persuasive affidavit is one that argues the case. A persuasive affidavit is one that sets out facts so clearly the argument becomes obvious.',
    memoryTrick:
      'Affidavits say what happened. Submissions say what it means.',
    concepts: ['affidavits', 'written-submissions'],
    skills: ['written-communication', 'argument-construction'],
  },
  {
    slug: 'dr-affidavit-information-and-belief',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'AU_GENERAL',
    stem: 'When may an affidavit ordinarily contain statements made on information and belief rather than personal knowledge?',
    options: [
      { id: 'a', text: 'Never; affidavits must always be based on personal knowledge' },
      { id: 'b', text: 'In interlocutory applications, provided the source of the information and the grounds of belief are stated' },
      { id: 'c', text: 'At final hearing, provided the deponent is unavailable' },
      { id: 'd', text: 'Whenever the deponent considers the information reliable' },
    ],
    correct: ['b'],
    explanation:
      'The general rule is that an affidavit is confined to facts within the deponent’s own knowledge. The rules of most Australian courts relax that for interlocutory applications, where a deponent may depose to matters on information and belief, but only if the affidavit states the source of the information and the grounds of the belief. At a final hearing the stricter rule applies. The exact rule and its wording vary between jurisdictions, so check the relevant court’s rules.',
    whyItMatters:
      'Interlocutory affidavits are often sworn by the solicitor on the file, relying on the client’s account. Omitting the source of the information is a defect an opponent will seize on, and it can lead to the paragraph being disregarded at the hearing.',
    commonMisconception:
      'Writing "I am informed and believe" without naming who informed you. Naming the source is the point of the formula.',
    memoryTrick:
      'Information and belief needs a name attached. "I am informed by X and believe."',
    concepts: ['affidavits', 'interlocutory-applications'],
    skills: ['written-communication', 'attention-to-detail'],
  },
  {
    slug: 'dr-jurat',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    stem: 'What is the jurat of an affidavit?',
    options: [
      { id: 'a', text: 'The introductory paragraph identifying the deponent' },
      { id: 'b', text: 'The concluding clause recording when, where and before whom the affidavit was sworn or affirmed' },
      { id: 'c', text: 'The index of exhibits' },
      { id: 'd', text: 'The court’s endorsement that the affidavit has been filed' },
    ],
    correct: ['b'],
    explanation:
      'The jurat is the formal clause at the end of an affidavit recording the date, the place, and the name and capacity of the person before whom the affidavit was sworn or affirmed, together with the signatures. A defective jurat, an omitted date, or a missing description of the authorised person, can lead to the affidavit being rejected on filing or requiring leave to be read.',
    whyItMatters:
      'Affidavits get rejected on formal defects with real frequency, and always at the worst moment. Checking the jurat is a thirty-second task that prevents a wasted filing.',
    commonMisconception:
      'Confusing the jurat with the attestation of an exhibit. They are separate formalities and both need attention.',
    memoryTrick:
      'The jurat is where the swearing is recorded. Latin "jurare", to swear.',
    concepts: ['affidavit-formalities', 'affidavits'],
    skills: ['attention-to-detail', 'written-communication'],
  },
  {
    slug: 'dr-exhibit-vs-annexure',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'AU_GENERAL',
    stem: 'What is the practical difference between an exhibit and an annexure to an affidavit?',
    options: [
      { id: 'a', text: 'There is none; the terms are interchangeable in all Australian courts' },
      { id: 'b', text: 'An annexure is attached to and forms part of the affidavit itself, while an exhibit is a separate document identified by a certificate signed by the person before whom the affidavit is sworn' },
      { id: 'c', text: 'An exhibit is a document the other party produced; an annexure is one your client produced' },
      { id: 'd', text: 'An annexure must be an original; an exhibit may be a copy' },
    ],
    correct: ['b'],
    explanation:
      'An annexure is physically attached to the affidavit and forms part of it. An exhibit is kept separately and identified by a certificate, typically signed by the authorised person before whom the affidavit was sworn, which links it to the affidavit. Exhibits are used where the material is bulky or cannot practically be bound in, such as a physical object or a large volume of documents. Terminology and requirements vary between jurisdictions, so the court’s own rules and practice notes govern.',
    whyItMatters:
      'Getting this wrong means documents arriving at court unidentified, or an affidavit that refers to material the court does not have. It is a small formality with an outsized capacity to derail a hearing.',
    commonMisconception:
      'Using the words interchangeably. The rules of each court draw a real distinction and prescribe how each is to be identified.',
    memoryTrick:
      'Annexures are bound in. Exhibits travel separately with a certificate.',
    concepts: ['affidavit-formalities'],
    skills: ['attention-to-detail', 'written-communication'],
  },
  {
    slug: 'dr-statutory-declaration',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    stem: 'How does a statutory declaration principally differ from an affidavit?',
    options: [
      { id: 'a', text: 'A statutory declaration cannot be used to state facts' },
      { id: 'b', text: 'A statutory declaration is made under statute for general purposes and is not sworn or affirmed as evidence in a proceeding, whereas an affidavit is sworn or affirmed evidence for use in a proceeding' },
      { id: 'c', text: 'A statutory declaration must be witnessed by a judge' },
      { id: 'd', text: 'A statutory declaration has no legal consequences if false' },
    ],
    correct: ['b'],
    explanation:
      'A statutory declaration is a written statement declared to be true under the relevant statutory declarations legislation. It is used for a wide range of general purposes, verifying identity, supporting an application, confirming a fact to a government body. An affidavit is sworn or affirmed evidence intended for use in a court proceeding. Both carry serious consequences if knowingly false; the difference is their purpose and form, not the seriousness of lying in them.',
    whyItMatters:
      'Filing a statutory declaration where a court requires an affidavit means the material is not properly before the court. Clients also frequently ask which one they need, and the answer depends on where it is going.',
    commonMisconception:
      'Believing a statutory declaration is a "softer" document with no consequences. Making a false declaration is an offence.',
    memoryTrick:
      'Affidavits are for courts. Statutory declarations are for everywhere else.',
    concepts: ['statutory-declarations', 'affidavits'],
    skills: ['written-communication', 'professional-judgment'],
    sourceReference: 'Statutory Declarations Act 1959 (Cth) and State equivalents',
  },
  {
    slug: 'dr-letter-of-demand-elements',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'Your client is owed $75,000 under a written supply contract. You are instructed to write a letter of demand.',
    stem: 'Which of the following is least appropriate to include?',
    options: [
      { id: 'a', text: 'Identification of the contract, the obligation breached and the amount claimed' },
      { id: 'b', text: 'A clear deadline for payment and a statement of what will follow if it is not met' },
      { id: 'c', text: 'A threat to report the debtor to the police for fraud unless payment is made' },
      { id: 'd', text: 'A reference to the client’s entitlement to interest and costs' },
    ],
    correct: ['c'],
    explanation:
      'A letter of demand should identify the parties and the obligation, state the amount and its basis, specify a deadline, and set out the consequences of non-payment, commonly the commencement of proceedings and a claim for interest and costs. Threatening criminal proceedings, or a complaint to an authority, to gain a private advantage in a civil matter is improper and can amount to professional misconduct.',
    whyItMatters:
      'The letter of demand is often the first document a junior drafts unsupervised, and it goes out on the firm’s letterhead. An improper threat in it exposes the client and the practitioner.',
    commonMisconception:
      'Assuming a more aggressive letter is a more effective one. Precision about the obligation and the consequence does the work.',
    memoryTrick:
      'Say what is owed, why, by when, and what happens next. Nothing more.',
    concepts: ['letters-of-demand'],
    skills: ['written-communication', 'professional-judgment', 'commercial-reasoning'],
    sourceReference: 'Australian Solicitors’ Conduct Rules r 34',
  },
  {
    slug: 'dr-prayer-for-relief',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    stem: 'What is the function of the relief claimed (sometimes called the prayer for relief) in an originating process?',
    options: [
      { id: 'a', text: 'To summarise the facts relied on' },
      { id: 'b', text: 'To identify precisely the orders the court is asked to make' },
      { id: 'c', text: 'To set out the legal authorities supporting the claim' },
      { id: 'd', text: 'To estimate the likely quantum of damages for the court’s information' },
    ],
    correct: ['b'],
    explanation:
      'The relief claimed states, in the form of draft orders, exactly what the plaintiff asks the court to do: judgment for a sum, a declaration, an injunction in specified terms, interest, costs. A court will generally not grant relief that has not been sought, so relief that is vague or omitted can limit what your client can obtain even after a successful trial.',
    whyItMatters:
      'It is the part of the document that determines what your client actually walks away with. Drafting it should be the first thing you do, not the last; it forces you to be clear about the outcome you are pursuing.',
    commonMisconception:
      'Treating the relief as boilerplate at the end. It defines the boundaries of the case.',
    memoryTrick:
      'Write the orders you want first. Then work backwards to the facts that get you there.',
    concepts: ['relief-claimed', 'drafting-pleadings'],
    skills: ['written-communication', 'strategic-reasoning'],
  },
  {
    slug: 'dr-chronology-purpose',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    stem: 'What is the purpose of a chronology prepared for a hearing?',
    options: [
      { id: 'a', text: 'To argue the client’s case in narrative form' },
      { id: 'b', text: 'To set out the relevant events in date order, with references to the evidence establishing each' },
      { id: 'c', text: 'To replace the need for witness statements' },
      { id: 'd', text: 'To record the procedural history of the proceeding only' },
    ],
    correct: ['b'],
    explanation:
      'A chronology lists relevant events in date order with a reference to where each is established in the evidence. Courts value them highly, and many practice notes require one. A good chronology is neutral in tone, a contentious or argumentative chronology invites a competing one from the other side and loses its utility to the court. Some courts also require a separate procedural chronology, which is a different document.',
    whyItMatters:
      'Preparing the chronology is often a junior’s first substantive task on a hearing, and doing it well means you end up knowing the evidence better than anyone in the room.',
    commonMisconception:
      'Writing the chronology as advocacy. Its persuasive power comes from its neutrality and its references.',
    memoryTrick:
      'Date, event, reference. Nothing else in the column.',
    concepts: ['chronologies'],
    skills: ['attention-to-detail', 'written-communication'],
  },
  {
    slug: 'dr-first-person-affidavit',
    domain: 'drafting',
    type: 'true_false',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    stem: 'True or false: an affidavit is written in the first person and divided into numbered paragraphs.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['true'],
    explanation:
      'True. An affidavit is the deponent’s own account, expressed in the first person, "I", not "the deponent" or "our client", and set out in consecutively numbered paragraphs, each confined so far as possible to a distinct matter. Court rules generally require both.',
    whyItMatters:
      'Numbered paragraphs are how everyone in the case refers to the evidence: in cross-examination, in submissions, and in the judgment. Long undivided paragraphs make an affidavit painful to use and mark the drafter out immediately.',
    memoryTrick:
      'One idea, one paragraph, one number.',
    concepts: ['affidavits', 'affidavit-formalities'],
    skills: ['written-communication', 'attention-to-detail'],
  },
  {
    slug: 'dr-alterations-initialled',
    domain: 'drafting',
    type: 'true_false',
    difficulty: 4,
    jurisdiction: 'AU_GENERAL',
    stem: 'True or false: an alteration made to an affidavit before it is sworn should be initialled by both the deponent and the authorised person.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['true'],
    explanation:
      'True. Where an affidavit contains an interlineation, erasure or other alteration, the ordinary requirement is that it be initialled by both the deponent and the person before whom the affidavit is sworn or affirmed. An affidavit with uninitialled alterations may not be accepted for filing, or may require the court’s leave to be read.',
    whyItMatters:
      'Last-minute corrections happen constantly, often minutes before a filing deadline. Knowing the formality saves the affidavit; not knowing it means re-engrossing and re-swearing the whole document.',
    commonMisconception:
      'Thinking a clean strike-through is sufficient. The initials are what evidences that the change was made before swearing.',
    memoryTrick:
      'Two people signed the affidavit. Two people initial any change to it.',
    concepts: ['affidavit-formalities'],
    skills: ['attention-to-detail'],
  },
  {
    slug: 'dr-written-submissions-structure',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    stem: 'What is the most effective structure for written submissions to a court?',
    options: [
      { id: 'a', text: 'A chronological narrative of the dispute from the client’s perspective' },
      { id: 'b', text: 'Identification of the issues to be decided, followed by the argument on each issue with references to the evidence and authority' },
      { id: 'c', text: 'A list of every authority located during research, with summaries' },
      { id: 'd', text: 'A restatement of the pleadings' },
    ],
    correct: ['b'],
    explanation:
      'Written submissions should tell the court what it has to decide, then answer each of those questions in turn, supporting each proposition with a reference to the evidence and to authority. Many courts impose page limits and require an outline of propositions, so discipline is not optional. A narrative retelling, or a catalogue of every case found, makes the court do the work of identifying the issues, which is the advocate’s job.',
    whyItMatters:
      'In a great many matters the written submissions do most of the persuading, because they are what the judge has when writing the judgment. Structure is what makes them usable at that point.',
    commonMisconception:
      'Believing that citing more authority is more persuasive. One authority squarely on point beats ten that are merely adjacent.',
    memoryTrick:
      'Issue, argument, evidence, authority. Then the next issue.',
    concepts: ['written-submissions'],
    skills: ['written-communication', 'argument-construction'],
  },
  {
    slug: 'dr-pleading-a-contract-claim',
    domain: 'drafting',
    type: 'scenario',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'You are drafting a statement of claim for breach of a written contract. Your client wants you to include a paragraph describing how unreasonably the defendant behaved throughout the commercial relationship, and attaching the email chain that shows it.',
    stem: 'What is the correct approach?',
    options: [
      { id: 'a', text: 'Include it; background conduct helps the court understand the dispute' },
      { id: 'b', text: 'Plead only the material facts establishing the contract, the term, the breach and the loss; the emails are evidence and belong at trial, not in the pleading' },
      { id: 'c', text: 'Include the emails as annexures but omit the description' },
      { id: 'd', text: 'Plead it in the relief claimed instead' },
    ],
    correct: ['b'],
    explanation:
      'The elements of the claim are the existence of the contract, the relevant term, the breach, and the resulting loss. Those are the material facts to be pleaded. The email chain is evidence going to proof of those facts and does not belong in the pleading. Nor does a general characterisation of the defendant as unreasonable, unless unreasonable conduct is itself an element of a pleaded cause of action.',
    whyItMatters:
      'Clients almost always want the pleading to tell the whole story of how badly they were treated. Explaining why it cannot, and that the material will be deployed as evidence in due course, is a conversation you will have many times.',
    commonMisconception:
      'Believing a fuller pleading is a stronger one. An overloaded pleading is vulnerable to strike out and gives the other side a map of your evidence.',
    memoryTrick:
      'Elements in the pleading. Everything else waits for trial.',
    concepts: ['drafting-pleadings', 'pleadings', 'elements-analysis'],
    skills: ['written-communication', 'argument-construction', 'professional-judgment'],
  },
];
