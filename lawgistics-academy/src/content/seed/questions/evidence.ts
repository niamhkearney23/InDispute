import { TRUE_FALSE_OPTIONS, type SeedQuestion } from '../types';

export const EVIDENCE_QUESTIONS: SeedQuestion[] = [
  {
    slug: 'ev-uniform-evidence-jurisdictions',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'AU_GENERAL',
    stem: 'Which of the following jurisdictions does NOT apply a uniform Evidence Act?',
    options: [
      { id: 'a', text: 'New South Wales' },
      { id: 'b', text: 'Victoria' },
      { id: 'c', text: 'Queensland' },
      { id: 'd', text: 'The Australian Capital Territory' },
    ],
    correct: ['c'],
    explanation:
      'Queensland is not a uniform evidence jurisdiction. The uniform Evidence Acts operate in the Commonwealth, New South Wales, Victoria, Tasmania, the Australian Capital Territory and the Northern Territory. Queensland, Western Australia and South Australia retain their own evidence legislation together with the common law. So a Queensland proceeding is governed by the Evidence Act 1977 (Qld) and common law principles, not by the section numbers you learned for the uniform scheme.',
    whyItMatters:
      'This is the single most important jurisdictional distinction in Australian evidence law. Citing "section 59" to a Queensland court is a straightforward error, and the underlying rules genuinely differ in places — not just their numbering.',
    commonMisconception:
      'Believing evidence law is nationally uniform because the scheme is called "uniform". It covers six of nine jurisdictions, not all of them.',
    memoryTrick:
      'The three that opted out are the three across the top and west: Queensland, Western Australia and South Australia.',
    concepts: ['uniform-evidence-acts'],
    skills: ['statutory-analysis', 'attention-to-detail'],
    sourceReference: 'Evidence Act 1995 (Cth); Evidence Act 1977 (Qld)',
    sourceUrl: 'https://www.alrc.gov.au/publication/uniform-evidence-law-alrc-report-102/',
  },
  {
    slug: 'ev-relevance-threshold',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'CTH',
    stem: 'Under the uniform Evidence Acts, evidence is relevant if:',
    options: [
      { id: 'a', text: 'It proves a fact in issue' },
      { id: 'b', text: 'If it were accepted, it could rationally affect the assessment of the probability of the existence of a fact in issue' },
      { id: 'c', text: 'It is more probative than prejudicial' },
      { id: 'd', text: 'It relates to the subject matter of the proceeding' },
    ],
    correct: ['b'],
    explanation:
      'Section 55 sets a deliberately low threshold: evidence is relevant if, were it accepted, it could rationally affect — directly or indirectly — the assessment of the probability of the existence of a fact in issue. It does not have to prove anything by itself, and the court assumes for this purpose that the evidence would be accepted. Section 56 then provides that relevant evidence is admissible unless some other rule excludes it. The balance between probative value and prejudice is a separate question, arising under the discretionary exclusions.',
    whyItMatters:
      'Relevance is the gate every piece of evidence goes through, and it is a low gate. Objections framed as "that’s not relevant" usually fail; the real objection is almost always a specific exclusionary rule.',
    commonMisconception:
      'Setting the relevance bar too high. Evidence that merely makes a fact somewhat more or less likely is relevant.',
    memoryTrick:
      'Section 55 asks "could it matter?", not "does it prove it?".',
    concepts: ['relevance'],
    skills: ['evidence-analysis', 'statutory-analysis'],
    sourceReference: 'Evidence Act 1995 (Cth) ss 55–56',
  },
  {
    slug: 'ev-hearsay-definition',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'CTH',
    stem: 'Under the uniform Evidence Acts, the hearsay rule excludes evidence of a previous representation when it is tendered:',
    options: [
      { id: 'a', text: 'For any purpose whatsoever' },
      { id: 'b', text: 'To prove the existence of a fact that the person intended to assert by the representation' },
      { id: 'c', text: 'Only where the maker of the representation is unavailable' },
      { id: 'd', text: 'Only where the representation was made orally rather than in writing' },
    ],
    correct: ['b'],
    explanation:
      'Section 59 excludes evidence of a previous representation only where it is tendered to prove the existence of a fact that the person intended to assert by making it. The rule is defined by the purpose of the tender, not by the form of the statement. A written document can be hearsay; an oral statement tendered for a non-hearsay purpose is not. Availability of the maker goes to the exceptions, not to the definition.',
    whyItMatters:
      'Every objection to hearsay turns on identifying what the evidence is being tendered to prove. If you cannot state the purpose crisply, you cannot make or answer the objection.',
    commonMisconception:
      'Thinking that anything someone said out of court is hearsay. It depends entirely on why it is being led.',
    memoryTrick:
      'Hearsay is about purpose, not about who said it or how.',
    concepts: ['hearsay'],
    skills: ['evidence-analysis', 'statutory-analysis'],
    sourceReference: 'Evidence Act 1995 (Cth) s 59',
  },
  {
    slug: 'ev-non-hearsay-purpose',
    domain: 'evidence',
    type: 'scenario',
    difficulty: 4,
    jurisdiction: 'CTH',
    scenario:
      'In a negligence claim against an occupier, your client wishes to give evidence that a week before the accident a cleaner told the store manager, in your client’s hearing, "that step is loose". You do not need to prove the step was in fact loose — that is established by an engineer’s report. You want to prove the manager knew of the risk.',
    stem: 'Is the evidence of what the cleaner said excluded by the hearsay rule?',
    options: [
      { id: 'a', text: 'Yes — it is an out-of-court statement repeated in court' },
      { id: 'b', text: 'No — it is tendered to prove the manager was put on notice, not to prove the step was loose' },
      { id: 'c', text: 'Yes — unless the cleaner is called to give evidence' },
      { id: 'd', text: 'No — hearsay does not apply in civil proceedings' },
    ],
    correct: ['b'],
    explanation:
      'The hearsay rule bites only where the representation is tendered to prove the asserted fact. Here it is tendered for a different purpose: that the words were spoken in the manager’s presence, and so the manager knew of the risk. The truth of the assertion is irrelevant to that purpose — the manager was on notice whether or not the step was actually loose. Evidence led for such a purpose is not caught by section 59. Hearsay applies in civil proceedings as well as criminal ones, so (d) is simply wrong.',
    whyItMatters:
      'The non-hearsay purpose is one of the most useful moves in evidence. It regularly gets in material an opponent assumed was inadmissible — and it works both ways, so you need to spot it when it is used against you.',
    commonMisconception:
      'Assuming that repeating someone’s words is always hearsay. Ask what the words are being used to prove.',
    memoryTrick:
      'Words as facts, not words as truth.',
    concepts: ['hearsay', 'relevance'],
    skills: ['evidence-analysis', 'strategic-reasoning'],
    sourceReference: 'Evidence Act 1995 (Cth) ss 59–60',
  },
  {
    slug: 'ev-opinion-rule-expert',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'CTH',
    stem: 'Under the uniform Evidence Acts, an opinion is admissible under the specialised knowledge exception where:',
    options: [
      { id: 'a', text: 'The witness holds a relevant tertiary qualification' },
      { id: 'b', text: 'The witness has specialised knowledge based on training, study or experience, and the opinion is wholly or substantially based on that knowledge' },
      { id: 'c', text: 'Both parties agree the witness is an expert' },
      { id: 'd', text: 'The opinion concerns a matter outside the ordinary experience of the tribunal of fact' },
    ],
    correct: ['b'],
    explanation:
      'Section 76 excludes opinion evidence; section 79 creates the exception for a person with specialised knowledge based on training, study or experience, whose opinion is wholly or substantially based on that knowledge. Two requirements do the work: the field of specialised knowledge, and the demonstrated connection between the knowledge and the opinion. A formal qualification is evidence of specialised knowledge but is neither necessary nor sufficient, and the parties cannot confer admissibility by agreement.',
    whyItMatters:
      'Expert reports are frequently vulnerable precisely because they do not expose the reasoning connecting the expertise to the conclusion. Reading a report with section 79 in mind is how you find that weakness — or avoid it in your own expert’s report.',
    commonMisconception:
      'Equating "expert" with "qualified". The Act asks about specialised knowledge and its application, not about letters after a name.',
    memoryTrick:
      'Two links: knowledge, and the opinion resting on it. Break either and the opinion falls out.',
    concepts: ['opinion-evidence'],
    skills: ['evidence-analysis', 'statutory-analysis'],
    sourceReference: 'Evidence Act 1995 (Cth) ss 76, 79',
  },
  {
    slug: 'ev-advice-privilege',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'CTH',
    stem: 'Client legal privilege protects a confidential communication between a lawyer and client where the communication was made for the dominant purpose of:',
    options: [
      { id: 'a', text: 'Any professional purpose' },
      { id: 'b', text: 'The lawyer providing legal advice to the client' },
      { id: 'c', text: 'Keeping the communication out of the hands of the other party' },
      { id: 'd', text: 'Recording the client’s instructions' },
    ],
    correct: ['b'],
    explanation:
      'Advice privilege under section 118 protects confidential communications made for the dominant purpose of a lawyer providing legal advice. Litigation privilege under section 119 covers confidential communications and documents prepared for the dominant purpose of actual or anticipated litigation. The test is dominant purpose, not merely a substantial purpose, and it is assessed objectively at the time the communication was made.',
    whyItMatters:
      'Privilege is decided document by document and it is regularly lost through carelessness — a document created for mixed purposes, or an email copied to someone outside the privileged circle. Understanding the dominant purpose test is how you protect your client’s material.',
    commonMisconception:
      'Assuming everything sent to or from a lawyer is privileged. Commercial advice, or a document created principally for a business purpose, is not.',
    memoryTrick:
      'Dominant, not incidental. Ask why the document really came into existence.',
    concepts: ['client-legal-privilege'],
    skills: ['professional-judgment', 'evidence-analysis'],
    sourceReference: 'Evidence Act 1995 (Cth) ss 118–119',
  },
  {
    slug: 'ev-litigation-privilege-scenario',
    domain: 'evidence',
    type: 'scenario',
    difficulty: 4,
    jurisdiction: 'CTH',
    scenario:
      'After a workplace incident, a company commissions an internal report. The evidence establishes that the report was commissioned principally so the company’s solicitors could advise on its exposure in anticipated proceedings, although it was also circulated to management for safety improvements.',
    stem: 'Is the report likely to be privileged?',
    options: [
      { id: 'a', text: 'No — it was circulated to management, so confidentiality was lost' },
      { id: 'b', text: 'Yes — if the dominant purpose of its creation was use in anticipated litigation, the additional safety purpose does not defeat privilege' },
      { id: 'c', text: 'No — internal reports can never attract privilege' },
      { id: 'd', text: 'Yes — any document created after an incident is privileged' },
    ],
    correct: ['b'],
    explanation:
      'The test is dominant purpose, which tolerates the existence of other purposes so long as they are subordinate. On these facts the litigation purpose is the dominant one, so litigation privilege is likely to attach. Circulation within the client organisation to those who need the document does not by itself destroy confidentiality — although wider distribution can. Documents genuinely created for the dominant purpose of safety improvement or regulatory compliance would not be privileged, which is why the evidence about why the report was commissioned is critical.',
    whyItMatters:
      'Advising a client at the moment an incident occurs — who commissions the report, why, and what it says about its own purpose — determines whether it is later discoverable. That advice is often given by a junior, on the phone, within hours.',
    commonMisconception:
      'That any document touching a legal issue is protected, or conversely that any internal circulation destroys privilege. Both are wrong.',
    memoryTrick:
      'Privilege asks one question: why was this brought into existence?',
    concepts: ['client-legal-privilege'],
    skills: ['professional-judgment', 'strategic-reasoning'],
    sourceReference: 'Evidence Act 1995 (Cth) s 119',
  },
  {
    slug: 'ev-without-prejudice',
    domain: 'evidence',
    type: 'true_false',
    difficulty: 3,
    jurisdiction: 'CTH',
    stem: 'True or false: marking a letter "without prejudice" guarantees that it cannot be put before the court for any purpose.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['false'],
    explanation:
      'False. Protection attaches to communications made in connection with a genuine attempt to negotiate a settlement — it is the substance that matters, not the label. Writing "without prejudice" on a letter that makes no settlement proposal achieves nothing, and there are recognised exceptions, including where the communication is relevant to a question of costs. That is precisely how a Calderbank offer works: it is expressed to be without prejudice save as to costs, so it can be produced after judgment on the costs argument.',
    whyItMatters:
      'Juniors mark correspondence "without prejudice" reflexively, and sometimes mark genuine settlement offers as open. Both errors have consequences — one gives false comfort, the other exposes the client’s position.',
    commonMisconception:
      'Treating the words as a magic incantation. A court looks at whether the letter was truly part of settlement negotiations.',
    memoryTrick:
      'The protection is earned by content, not conferred by a heading.',
    concepts: ['settlement-privilege', 'costs'],
    skills: ['professional-judgment', 'written-communication'],
    sourceReference: 'Evidence Act 1995 (Cth) s 131',
  },
  {
    slug: 'ev-civil-standard',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    stem: 'What is the standard of proof in an Australian civil proceeding?',
    options: [
      { id: 'a', text: 'Beyond reasonable doubt' },
      { id: 'b', text: 'On the balance of probabilities' },
      { id: 'c', text: 'Clear and convincing evidence' },
      { id: 'd', text: 'To a reasonable degree of scientific certainty' },
    ],
    correct: ['b'],
    explanation:
      'Civil matters are decided on the balance of probabilities — the court must be satisfied that the fact is more likely than not. Beyond reasonable doubt is the criminal standard. "Clear and convincing evidence" is an American intermediate standard with no place in Australian law.',
    whyItMatters:
      'It shapes how you build a case. You are not eliminating every doubt; you are persuading a court that your version is the more probable one.',
    commonMisconception:
      'Importing "clear and convincing evidence" from American sources. It is not an Australian standard.',
    concepts: ['standard-of-proof'],
    skills: ['evidence-analysis', 'argument-construction'],
    sourceReference: 'Evidence Act 1995 (Cth) s 140',
  },
  {
    slug: 'ev-briginshaw',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'AU_GENERAL',
    stem: 'A serious allegation of fraud is made in a civil proceeding. What is the effect of the principle in Briginshaw v Briginshaw?',
    options: [
      { id: 'a', text: 'The criminal standard of proof applies to the allegation' },
      { id: 'b', text: 'The civil standard still applies, but the gravity of the allegation bears on whether the court is actually satisfied on the balance of probabilities' },
      { id: 'c', text: 'The onus shifts to the party denying the fraud' },
      { id: 'd', text: 'The allegation must be corroborated by independent evidence' },
    ],
    correct: ['b'],
    explanation:
      'Briginshaw does not create a third standard of proof. The standard remains the balance of probabilities. What the principle recognises is that reasonable satisfaction is not reached by inexact proofs or indefinite testimony, and that the seriousness of an allegation, the inherent unlikelihood of the conduct, and the gravity of the consequences all bear on whether the court is in fact persuaded. Section 140(2) of the uniform Evidence Acts expresses the same idea in statutory form.',
    whyItMatters:
      'Pleading fraud or serious misconduct commits you to proving it to a court that will look hard at the evidence. It is also why such allegations should never be pleaded without a proper foundation — there are professional conduct consequences for doing so.',
    commonMisconception:
      'Describing Briginshaw as raising the standard of proof. It does not; it affects the quality of persuasion required to meet the ordinary standard.',
    memoryTrick:
      'Same bar, heavier weight. The standard does not move; the evidence has to.',
    concepts: ['standard-of-proof', 'onus-of-proof'],
    skills: ['evidence-analysis', 'argument-construction', 'professional-judgment'],
    sourceReference: 'Briginshaw v Briginshaw (1938) 60 CLR 336; Evidence Act 1995 (Cth) s 140(2)',
  },
  {
    slug: 'ev-onus-civil',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    stem: 'In an ordinary civil claim, who bears the onus of proving the elements of the cause of action?',
    options: [
      { id: 'a', text: 'The defendant, who must disprove the claim' },
      { id: 'b', text: 'The plaintiff, who asserts the claim' },
      { id: 'c', text: 'Neither — the court investigates for itself' },
      { id: 'd', text: 'Whichever party holds the relevant documents' },
    ],
    correct: ['b'],
    explanation:
      'The party who asserts must prove. A plaintiff bears the onus on each element of the cause of action. A defendant bears the onus on matters it asserts affirmatively — a limitation defence, contributory negligence, or a positive defence such as illegality. Australian civil proceedings are adversarial, so the court decides on the material the parties put before it rather than investigating independently.',
    whyItMatters:
      'It determines what evidence you must gather. Identifying who bears the onus on each issue is the first step in building a case theory, and it tells you where a case will fail if a witness is not available.',
    memoryTrick:
      'He who asserts must prove.',
    concepts: ['onus-of-proof'],
    skills: ['evidence-analysis', 'argument-construction'],
  },
  {
    slug: 'ev-business-records',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'CTH',
    stem: 'Under the uniform Evidence Acts, the business records exception to the hearsay rule applies to a document that:',
    options: [
      { id: 'a', text: 'Was created by any company in the ordinary course of its affairs' },
      { id: 'b', text: 'Forms part of the records belonging to or kept in the course of a business, and contains a representation made by a person with personal knowledge of the asserted fact, or based on information from such a person' },
      { id: 'c', text: 'Has been produced under a subpoena' },
      { id: 'd', text: 'Is more than five years old' },
    ],
    correct: ['b'],
    explanation:
      'Section 69 requires two things: the document must form part of the records belonging to or kept by a business, and the representation must have been made by a person who had or might reasonably be supposed to have had personal knowledge of the asserted fact, or on the basis of information directly or indirectly supplied by such a person. Importantly, the exception does not apply to a representation prepared in connection with, or in contemplation of, an Australian or overseas proceeding. Production under subpoena goes to how a document reaches the court, not to whether it is admissible.',
    whyItMatters:
      'Commercial litigation runs on documents, and this is the exception that gets most of them in without calling the person who wrote them. Its limits are equally important — a document prepared with litigation in mind falls outside it.',
    commonMisconception:
      'Assuming any company document qualifies. A file note prepared once a dispute was on foot generally will not.',
    memoryTrick:
      'Records of a business doing business — not records of a business preparing for court.',
    concepts: ['documentary-evidence', 'hearsay'],
    skills: ['evidence-analysis', 'statutory-analysis'],
    sourceReference: 'Evidence Act 1995 (Cth) s 69',
  },
  {
    slug: 'ev-leading-questions-in-chief',
    domain: 'evidence',
    type: 'true_false',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    stem: 'True or false: an advocate may generally ask their own witness leading questions during examination in chief.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['false'],
    explanation:
      'False. Leading questions — questions that suggest the answer, or assume a fact in dispute — are generally not permitted in examination in chief. The court may allow them for formal or uncontroversial matters such as name, occupation and other background, and there are exceptions, including where the witness is unfavourable and leave is granted. In cross-examination, by contrast, leading questions are the ordinary tool.',
    whyItMatters:
      'Evidence given in answer to a leading question carries much less weight, even if no objection is taken. Learning to ask open questions in chief is one of the first genuine advocacy skills a junior develops.',
    commonMisconception:
      'Thinking the prohibition applies to all questioning. It is specific to chief; cross-examination is where leading belongs.',
    memoryTrick:
      'Your witness tells the story. The other side’s witness answers your propositions.',
    concepts: ['questioning-rules', 'examination-in-chief'],
    skills: ['oral-communication', 'evidence-analysis'],
    sourceReference: 'Evidence Act 1995 (Cth) ss 37, 42',
  },
];
