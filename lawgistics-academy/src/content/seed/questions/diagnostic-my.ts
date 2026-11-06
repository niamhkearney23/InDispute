import { type SeedQuestion } from '../types';

/**
 * The Malaysian diagnostic's own questions (0055).
 *
 * The owner, November 2026: "can the diagnostic questions be totally
 * different from the learning and other questions?", after sitting the
 * diagnostic without having studied Malaysian law and coming out Advanced.
 * These are asked in the diagnostic and nowhere else: never in daily
 * training, a module or a review. Four in each of the eight areas, from
 * difficulty 2 to 5, so the paper tells somebody who knows a lot from
 * somebody who knows a little.
 *
 * DRAFTED BY AN AI. NOT CHECKED BY A LAWYER. Like everything in the bank they
 * load waiting for review, and no learner sees one until a lawyer has signed
 * it off and it is published. The diagnostic uses them only once at least
 * thirty are published for Malaysia; until then it uses the main bank.
 *
 * TENTATIVE: seven of them, marked tentative below, turn on a number, a
 * section or a case name that is the likeliest thing to be wrong or out of
 * date. Check each question against the source named, not against how sure
 * the wording sounds. Options were
 * written to similar lengths, because the bank's right answer is otherwise
 * usually the longest; the sign-off page still flags any that are not.
 */
export const DIAGNOSTIC_MY_QUESTIONS: SeedQuestion[] = [
  /* --- Court system ------------------------------------------------------- */
  {
    slug: 'diag-my-sessions-court-limit',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A client is owed RM 750,000 under a supply contract. The claim does not concern land, a motor accident or a tenancy.',
    stem: 'What is the lowest court with jurisdiction to hear it?',
    options: [
      { id: 'a', text: 'The Magistrates’ Court' },
      { id: 'b', text: 'The Sessions Court' },
      { id: 'c', text: 'The High Court' },
      { id: 'd', text: 'The Court of Appeal' },
    ],
    correct: ['b'],
    explanation:
      'Since the amendments that came into force in 2012, the Sessions Court hears civil claims up to RM 1 million and the Magistrates’ Court up to RM 100,000. A RM 750,000 contract claim is within the Sessions Court’s limit. The High Court could hear it too, but it is not the lowest court that can.',
    whyItMatters:
      'Starting in the wrong court costs the client time and money, and the limits are the first thing a supervisor will ask about.',
    commonMisconception: 'That any claim over RM 100,000 has to go to the High Court.',
    concepts: ['my-monetary-jurisdiction'],
    skills: [],
    sourceReference: 'Subordinate Courts Act 1948 ss 65 and 90, as amended by the Subordinate Courts (Amendment) Act 2010',
    tentative: true,
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-appeal-leave-threshold',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'After a full trial the High Court dismissed your client’s claim for RM 180,000, excluding interest. The client wants to appeal to the Court of Appeal.',
    stem: 'What must you check first?',
    options: [
      { id: 'a', text: 'Whether the Court of Appeal’s leave is needed, given the amount' },
      { id: 'b', text: 'Whether the appeal goes straight to the Federal Court' },
      { id: 'c', text: 'Whether the appeal lies to the Sessions Court instead' },
      { id: 'd', text: 'Nothing: every High Court judgment is appealable as of right' },
    ],
    correct: ['a'],
    explanation:
      'Section 68(1)(a) of the Courts of Judicature Act 1964 says no appeal lies to the Court of Appeal, except with its leave, where the amount or value of the subject matter of the claim (exclusive of interest) is less than RM 250,000. A RM 180,000 claim is below that line, so leave is the first question.',
    whyItMatters:
      'An appeal filed without leave where leave was needed is incompetent, and the time for doing it properly may have gone.',
    concepts: ['appellate-structure', 'my-court-structure'],
    skills: [],
    sourceReference: 'Courts of Judicature Act 1964 s 68(1)(a)',
    tentative: true,
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-federal-court-leave',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'The Court of Appeal has decided a civil appeal against your client, who wants to take it to the Federal Court.',
    stem: 'Broadly, what does the Federal Court need to see before it grants leave?',
    options: [
      { id: 'a', text: 'That the Court of Appeal judges were not unanimous' },
      { id: 'b', text: 'A question of law of general principle, or of public importance' },
      { id: 'c', text: 'That the amount in dispute is more than RM 1 million' },
      { id: 'd', text: 'That new evidence has come to light since the appeal' },
    ],
    correct: ['b'],
    explanation:
      'Section 96 of the Courts of Judicature Act 1964 allows an appeal to the Federal Court only with its leave, on the grounds the section sets out: in broad terms, a question of general principle decided for the first time, or a question of importance on which further argument and a decision of the Federal Court would be to the public advantage, or a question on the effect of a provision of the Constitution. The amount at stake is not the test.',
    whyItMatters:
      'Most leave applications fail because they argue that the Court of Appeal was wrong, which is not what section 96 asks.',
    commonMisconception: 'That a big enough claim, or a split decision, gives a right to go further.',
    concepts: ['appellate-structure', 'my-court-structure'],
    skills: [],
    sourceReference:
      'Courts of Judicature Act 1964 s 96; Terengganu Forest Products Sdn Bhd v Cosco Container Lines Co Ltd [2011] 1 MLJ 25 (FC)',
    tentative: true,
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-constitutional-reference',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 5,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'In a civil trial in the High Court, a question arises as to the effect of a provision of the Federal Constitution.',
    stem: 'Which describes how such a question can be dealt with?',
    options: [
      { id: 'a', text: 'Only Parliament can decide what the Constitution means' },
      { id: 'b', text: 'The trial judge decides it, and that decision is final' },
      { id: 'c', text: 'The Federal Court can decide it and send the case back' },
      { id: 'd', text: 'It must be heard first by the Court of Appeal' },
    ],
    correct: ['c'],
    explanation:
      'Article 128(2) of the Federal Constitution: where, in proceedings before another court, a question arises as to the effect of a provision of the Constitution, the Federal Court has jurisdiction to determine it and to remit the case to the other court to be disposed of in accordance with that determination. Section 84 of the Courts of Judicature Act 1964 deals with the reference.',
    whyItMatters:
      'A constitutional point changes where the argument is decided, and so how long the case will take.',
    concepts: ['my-court-structure'],
    skills: [],
    sourceReference: 'Federal Constitution art 128(2); Courts of Judicature Act 1964 s 84',
    tentative: true,
    diagnosticOnly: true,
  },

  /* --- Civil procedure ---------------------------------------------------- */
  {
    slug: 'diag-my-time-to-appear',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'Your client, in Kuala Lumpur, was served personally with a writ and statement of claim yesterday.',
    stem: 'Unless the writ allows longer, within what time must the client enter appearance?',
    options: [
      { id: 'a', text: '7 days after service' },
      { id: 'b', text: '14 days after service' },
      { id: 'c', text: '21 days after service' },
      { id: 'd', text: '30 days after service' },
    ],
    correct: ['b'],
    explanation:
      'Under Order 12 rule 4 of the Rules of Court 2012, a defendant served within the jurisdiction has 14 days after service to enter appearance. Missing it opens the way to judgment in default of appearance under Order 13.',
    whyItMatters: 'It is the first deadline on every defended file, and the one a new clerk most often has to diary.',
    concepts: ['rules-of-court-2012', 'default-judgment'],
    skills: [],
    sourceReference: 'Rules of Court 2012 O 12 r 4; O 13',
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-time-for-defence',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    stem: 'The defendant has entered appearance in time. By default under the Rules of Court 2012, when is the defence due?',
    options: [
      { id: 'a', text: 'Within 7 days of the day on which appearance was entered' },
      { id: 'b', text: '14 days after appearance is due, or after the claim is served if later' },
      { id: 'c', text: 'Within 30 days of the date on which the writ was filed in court' },
      { id: 'd', text: 'At any time up to the date fixed for the first case management' },
    ],
    correct: ['b'],
    explanation:
      'Order 18 rule 2(1): a defendant who enters appearance must serve a defence before the end of 14 days after the time limited for appearing, or after the statement of claim is served on him, whichever is later. The time can be extended by agreement or by the court; a defendant who lets it pass risks judgment in default of defence under Order 19.',
    whyItMatters: 'Counting from the wrong day is how a defence comes to be late without anybody noticing.',
    concepts: ['rules-of-court-2012', 'pleadings'],
    skills: ['procedural-sequencing'],
    sourceReference: 'Rules of Court 2012 O 18 r 2(1); O 19',
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-summary-judgment-triable-issue',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You act for a plaintiff owed a fixed sum. The defendant has entered appearance and served a defence that is a bare denial. You apply for summary judgment under Order 14.',
    stem: 'What will the defendant need to show to resist the application?',
    options: [
      { id: 'a', text: 'That the plaintiff has not yet served a reply' },
      { id: 'b', text: 'That there is a triable issue, or another reason for a trial' },
      { id: 'c', text: 'That the writ was not served on him personally' },
      { id: 'd', text: 'That the sum claimed is over the Sessions Court limit' },
    ],
    correct: ['b'],
    explanation:
      'Once the defendant has entered appearance and the statement of claim has been served, the plaintiff may apply under Order 14 on affidavit for judgment on the ground that there is no defence. The defendant resists by showing, usually on affidavit, that there is an issue or question in dispute which ought to be tried, or some other reason for a trial. A bare denial in the pleading does not do that by itself.',
    whyItMatters: 'Order 14 is the fastest way to judgment on a debt, and the commonest application a junior drafts.',
    commonMisconception: 'That filing any defence at all is enough to stop summary judgment.',
    concepts: ['summary-judgment', 'rules-of-court-2012'],
    skills: [],
    sourceReference:
      'Rules of Court 2012 O 14 rr 1 and 3; National Company for Foreign Trade v Kayu Raya Sdn Bhd [1984] 2 MLJ 300 (FC)',
    tentative: true,
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-setting-aside-regular-default',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 5,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'Judgment in default of defence was entered properly against your client, who missed the deadline. Two months later the client brings you a strong answer to the claim.',
    stem: 'On an application to set the judgment aside, what will the court treat as the most important question?',
    options: [
      { id: 'a', text: 'Whether every day of the delay can be explained' },
      { id: 'b', text: 'Whether the client has a defence on the merits' },
      { id: 'c', text: 'Whether the plaintiff consents to it being set aside' },
      { id: 'd', text: 'Whether the judgment has already been executed' },
    ],
    correct: ['b'],
    explanation:
      'A judgment entered irregularly is set aside as of right. One entered regularly is set aside in the court’s discretion, and the Malaysian courts treat a defence on the merits as the paramount consideration; delay and the reasons for it are relevant but not decisive on their own. The application is supported by an affidavit setting out that defence.',
    whyItMatters:
      'Clients who missed a deadline usually think the case is lost. Often it is not, if there is a real defence and the application is made promptly.',
    concepts: ['default-judgment', 'rules-of-court-2012'],
    skills: ['strategic-reasoning'],
    sourceReference:
      'Rules of Court 2012 O 13 r 8 and O 19 r 9; Hasil Bumi Perumahan Sdn Bhd v United Malayan Banking Corp Bhd [1994] 1 MLJ 312 (SC)',
    tentative: true,
    diagnosticOnly: true,
  },

  /* --- Evidence ----------------------------------------------------------- */
  {
    slug: 'diag-my-burden-who-asserts',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario: 'Your client sues for the price of goods it says it delivered. The buyer says the goods never arrived.',
    stem: 'Under the Evidence Act 1950, who must prove that the goods were delivered?',
    options: [
      { id: 'a', text: 'The buyer, because it is refusing to pay' },
      { id: 'b', text: 'Your client, because it asserts the delivery' },
      { id: 'c', text: 'Neither: the court decides on the documents' },
      { id: 'd', text: 'Whichever party filed its documents first' },
    ],
    correct: ['b'],
    explanation:
      'Section 101 of the Evidence Act 1950: whoever desires a court to give judgment as to a legal right dependent on the existence of facts which he asserts must prove that those facts exist. Your client asserts delivery, so the burden is its, and in a civil case it is proved on the balance of probabilities.',
    whyItMatters: 'Knowing who must prove what decides which documents and witnesses you need before trial.',
    concepts: ['onus-of-proof', 'evidence-act-1950'],
    skills: [],
    sourceReference: 'Evidence Act 1950 ss 101 to 103',
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-adverse-inference',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'The defendant company says a meeting was minuted, but it neither produces the minutes nor calls the director who kept them, and gives no reason.',
    stem: 'What may the court do?',
    options: [
      { id: 'a', text: 'Nothing: a party may run its case as it likes' },
      { id: 'b', text: 'Presume the minutes would not have helped the defendant' },
      { id: 'c', text: 'Order the director to be arrested and brought to court' },
      { id: 'd', text: 'Strike out the defence without further argument' },
    ],
    correct: ['b'],
    explanation:
      'Illustration (g) to section 114 of the Evidence Act 1950 lets the court presume that evidence which could be and is not produced would, if produced, be unfavourable to the person who withholds it. The court may draw it, not must, and it carries less weight where there is a good reason the evidence was not produced.',
    whyItMatters: 'It is often the strongest point a cross-examiner has against a party that is holding something back.',
    concepts: ['evidence-act-1950', 'documentary-evidence'],
    skills: [],
    sourceReference: 'Evidence Act 1950 s 114 illustration (g)',
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-parol-evidence',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A written tenancy agreement fixes the rent at RM 5,000 a month. Your client, the tenant, says the landlord agreed beforehand, orally, to accept RM 4,000.',
    stem: 'What is the main obstacle to proving the oral agreement?',
    options: [
      { id: 'a', text: 'The rule against oral evidence varying written terms' },
      { id: 'b', text: 'Oral agreements are never enforceable in Malaysia' },
      { id: 'c', text: 'The tenancy must be registered before it is relied on' },
      { id: 'd', text: 'Only the landlord may give evidence about the rent' },
    ],
    correct: ['a'],
    explanation:
      'Where the terms of a contract have been reduced to writing, section 92 of the Evidence Act 1950 bars evidence of an oral agreement made at the time to contradict, vary, add to or subtract from them. Its provisos let some evidence in, for example of fraud, or of a separate oral agreement on a matter the document is silent on and which is not inconsistent with it, so the tenant’s case depends on fitting one of them.',
    whyItMatters: 'Clients often rely on what was said before signing; whether it counts depends on section 92.',
    concepts: ['evidence-act-1950', 'documentary-evidence'],
    skills: [],
    sourceReference: 'Evidence Act 1950 ss 91 and 92',
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-business-entries-deceased',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 5,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A company’s accounts clerk, who has since died, recorded in the ledger that a customer paid in cash on certain dates. The customer now denies paying.',
    stem: 'Under which provision of the Evidence Act 1950 are the clerk’s entries most likely to be admitted?',
    options: [
      { id: 'a', text: 'Section 32: statements by persons who cannot be called' },
      { id: 'b', text: 'Section 92: the rule on written contracts' },
      { id: 'c', text: 'Section 114(g): the adverse inference' },
      { id: 'd', text: 'None: the clerk cannot now be cross-examined' },
    ],
    correct: ['a'],
    explanation:
      'Section 32(1) of the Evidence Act 1950 makes relevant a statement by a person who is dead, among others, and paragraph (b) covers statements made in the ordinary course of business, including entries in books kept in that course. The clerk’s death opens the exception; how much weight the entries carry is still for the court.',
    whyItMatters:
      'Records outlive the people who made them. Knowing how they get in decides whether an old file can still be proved.',
    concepts: ['hearsay', 'evidence-act-1950'],
    skills: ['evidence-analysis'],
    sourceReference: 'Evidence Act 1950 s 32(1)(b)',
    diagnosticOnly: true,
  },

  /* --- Advocacy ----------------------------------------------------------- */
  {
    slug: 'diag-my-addressing-the-judge',
    domain: 'advocacy',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'In the High Court, how is the judge addressed in Bahasa Malaysia?',
    options: [
      { id: 'a', text: 'Tuan Hakim' },
      { id: 'b', text: 'Yang Arif' },
      { id: 'c', text: 'Yang Berhormat' },
      { id: 'd', text: 'Datuk Hakim' },
    ],
    correct: ['b'],
    explanation:
      'Judges of the superior courts are addressed as Yang Arif; in English, My Lord or My Lady. Yang Berhormat is for members of Parliament, not judges. Ask your supervisor how the judge and the subordinate courts in front of you are addressed, because local practice matters.',
    whyItMatters: 'Getting the form of address wrong is the first thing a judge notices about a new advocate.',
    concepts: ['oral-submissions', 'courtroom-conduct'],
    skills: [],
    sourceReference: 'Practice in the Malaysian superior courts; check with your supervisor',
    tentative: true,
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-leading-in-chief',
    domain: 'advocacy',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'In examination-in-chief you ask your own witness: "You saw the lorry run the red light, didn’t you?" The other side objects.',
    stem: 'Why is the objection good?',
    options: [
      { id: 'a', text: 'It is a leading question, allowed in chief only with permission' },
      { id: 'b', text: 'Questions in chief must first be put to the court in writing' },
      { id: 'c', text: 'You may not ask your own witness about the accident itself' },
      { id: 'd', text: 'Only the judge may ask a witness what they saw at the scene' },
    ],
    correct: ['a'],
    explanation:
      'A leading question suggests the answer the person asking it wants. Under section 142 of the Evidence Act 1950, leading questions must not, if objected to, be asked in examination-in-chief or re-examination except with the court’s permission, which is usually given on introductory or undisputed matters. They may be asked in cross-examination (section 143).',
    whyItMatters: 'Evidence your witness gives in their own words carries weight; evidence you put in their mouth does not.',
    concepts: ['examination-in-chief', 'objections'],
    skills: [],
    sourceReference: 'Evidence Act 1950 ss 141 to 143',
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-re-examination-scope',
    domain: 'advocacy',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'Your witness was cross-examined only about the date of a meeting. In re-examination you want to ask about a phone call that was not mentioned in chief or in cross-examination.',
    stem: 'What is the position?',
    options: [
      { id: 'a', text: 'You may ask about anything at all that helps your case' },
      { id: 'b', text: 'Only matters raised in cross-examination, unless the court allows' },
      { id: 'c', text: 'Re-examination is not allowed at all in a civil trial' },
      { id: 'd', text: 'You must first apply to recall the witness on a later day' },
    ],
    correct: ['b'],
    explanation:
      'Section 138 of the Evidence Act 1950: re-examination is directed to the explanation of matters referred to in cross-examination, and if new matter is introduced in re-examination by the court’s permission, the other side may further cross-examine on it. A question about something not raised in cross-examination needs that permission.',
    whyItMatters: 'Re-examination repairs what cross-examination damaged. It is not a second examination-in-chief.',
    concepts: ['re-examination'],
    skills: [],
    sourceReference: 'Evidence Act 1950 s 138',
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-ex-parte-disclosure',
    domain: 'advocacy',
    type: 'multiple_choice',
    difficulty: 5,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You are moving an application for an interim injunction without notice to the other side. The night before, you learn of a letter that badly undermines your client’s account of the facts.',
    stem: 'What must you do?',
    options: [
      { id: 'a', text: 'Leave it for the other side to raise at the full hearing' },
      { id: 'b', text: 'Put it before the court: full and frank disclosure is owed' },
      { id: 'c', text: 'Adjourn until the client agrees the letter can be shown' },
      { id: 'd', text: 'Mention it only if the judge asks you about letters' },
    ],
    correct: ['b'],
    explanation:
      'A party applying without notice must make full and frank disclosure of all material facts, including those against it, because the court hears only one side. Failing to do so is a ground on which the injunction can be set aside whatever the merits, and the duty is the advocate’s as well as the client’s. If the client will not allow the letter to be disclosed, you cannot go on with the application.',
    whyItMatters: 'Non-disclosure loses injunctions that would otherwise have been granted, and damages the advocate’s standing.',
    concepts: ['candour-and-disclosure', 'duty-to-court'],
    skills: ['professional-judgment'],
    sourceReference: 'Rules of Court 2012 O 29; the duty of full and frank disclosure on applications without notice',
    diagnosticOnly: true,
  },

  /* --- Drafting ----------------------------------------------------------- */
  {
    slug: 'diag-my-material-facts-not-evidence',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'Under the Rules of Court 2012, what should a statement of claim contain?',
    options: [
      { id: 'a', text: 'The material facts relied on, in summary form, but not the evidence' },
      { id: 'b', text: 'The evidence of every witness the plaintiff intends to call' },
      { id: 'c', text: 'The legal arguments, and the cases the plaintiff relies on' },
      { id: 'd', text: 'A chronology of every letter that passed between the parties' },
    ],
    correct: ['a'],
    explanation:
      'Order 18 rule 7(1): every pleading must contain, and contain only, a statement in summary form of the material facts on which the party relies, and not the evidence by which they are to be proved. Points of law may be raised, but a pleading is not the place for argument.',
    whyItMatters: 'A pleading that argues or narrates is harder to read and easier to attack.',
    concepts: ['drafting-pleadings'],
    skills: [],
    sourceReference: 'Rules of Court 2012 O 18 r 7(1)',
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-particulars-of-fraud',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario: 'You are drafting a claim that the defendant fraudulently misrepresented the condition of a building.',
    stem: 'What must the pleading include?',
    options: [
      { id: 'a', text: 'The word "fraud" and the amount claimed, nothing more' },
      { id: 'b', text: 'Full particulars of the fraud that is alleged' },
      { id: 'c', text: 'A statutory declaration made by the client' },
      { id: 'd', text: 'The police report number, if there is one' },
    ],
    correct: ['b'],
    explanation:
      'Order 18 rule 12(1) requires particulars of any misrepresentation, fraud, breach of trust, wilful default or undue influence a party relies on. Fraud must be distinctly alleged and particularised; a general allegation is liable to be struck out, and it should not be pleaded at all without credible material behind it.',
    whyItMatters: 'Fraud is the allegation a court looks hardest at, and the one most often pleaded too loosely.',
    concepts: ['drafting-pleadings', 'particulars'],
    skills: ['attention-to-detail'],
    sourceReference: 'Rules of Court 2012 O 18 r 12(1)',
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-general-denial',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'The defence you are reviewing answers a detailed statement of claim with one paragraph: "The Defendant denies each and every allegation in the Statement of Claim."',
    stem: 'What is the risk?',
    options: [
      { id: 'a', text: 'None: a general denial puts everything in issue' },
      { id: 'b', text: 'Allegations not specifically traversed may be taken as admitted' },
      { id: 'c', text: 'The defence will be treated as a counterclaim instead' },
      { id: 'd', text: 'The plaintiff will have to serve a second claim' },
    ],
    correct: ['b'],
    explanation:
      'Under Order 18 rule 13, an allegation of fact in a pleading is taken as admitted unless it is traversed, and a general denial, or a general statement of non-admission, is not a sufficient traverse. Each allegation should be admitted, denied or not admitted specifically, with the defendant’s own version where there is one.',
    whyItMatters: 'A careless defence can concede the facts the plaintiff most needed to prove.',
    concepts: ['drafting-pleadings', 'pleadings'],
    skills: ['attention-to-detail'],
    sourceReference: 'Rules of Court 2012 O 18 r 13',
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-affidavit-information-belief',
    domain: 'drafting',
    type: 'multiple_choice',
    difficulty: 5,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You are drafting your client’s affidavit in support of an interlocutory application. Some of what she says she learned from her company’s finance manager.',
    stem: 'How should those statements be put?',
    options: [
      { id: 'a', text: 'As things she knows herself, so it reads more cleanly' },
      { id: 'b', text: 'As information and belief, naming the source and grounds' },
      { id: 'c', text: 'Leave them out: only her own knowledge can go in' },
      { id: 'd', text: 'In an exhibit signed by the finance manager instead' },
    ],
    correct: ['b'],
    explanation:
      'Order 41 rule 5: an affidavit may contain only such facts as the deponent can prove from her own knowledge, but an affidavit sworn for an interlocutory proceeding may contain statements of information or belief, with the sources and grounds of it. Swearing to second-hand facts as her own knowledge is wrong, and can be serious for her.',
    whyItMatters: 'An affidavit is sworn evidence. The client signs it, but the drafter decides how true it reads.',
    concepts: ['affidavits', 'affidavit-formalities'],
    skills: [],
    sourceReference: 'Rules of Court 2012 O 41 r 5',
    diagnosticOnly: true,
  },

  /* --- Legal reasoning ---------------------------------------------------- */
  {
    slug: 'diag-my-binding-court-of-appeal',
    domain: 'legal-reasoning',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario: 'A High Court judge is shown a Court of Appeal decision directly on the point in issue.',
    stem: 'Which is right?',
    options: [
      { id: 'a', text: 'The judge is bound to follow it' },
      { id: 'b', text: 'The judge may follow it if persuaded' },
      { id: 'c', text: 'It binds only the High Court where it began' },
      { id: 'd', text: 'It binds only once the Federal Court approves it' },
    ],
    correct: ['a'],
    explanation:
      'Under stare decisis, decisions of the Court of Appeal bind the High Court and the courts below it, and decisions of the Federal Court bind every court beneath it. A High Court judge who thinks a binding decision wrong must still apply it, and may say why.',
    whyItMatters: 'Which court decided a case is the first thing to know about it before you cite it.',
    concepts: ['stare-decisis'],
    skills: [],
    sourceReference: 'The doctrine of precedent in Malaysia',
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-ratio-or-obiter',
    domain: 'legal-reasoning',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A judgment holds that a notice was bad because it was sent to the wrong address. The judge adds that, even if it had been sent properly, the 7 days it gave would have been too short.',
    stem: 'How should you treat the remark about the 7 days?',
    options: [
      { id: 'a', text: 'As part of the binding reasoning of the case' },
      { id: 'b', text: 'As obiter: it may persuade, but it does not bind' },
      { id: 'c', text: 'As a finding of fact for later cases to follow' },
      { id: 'd', text: 'As overruling the earlier cases on notice periods' },
    ],
    correct: ['b'],
    explanation:
      'The ratio decidendi is the reasoning necessary to the decision. The decision here rested on the wrong address; what the judge said about the notice period was not needed to decide it, so it is obiter dictum. It may be persuasive, more so from a senior court, but it does not bind.',
    whyItMatters: 'Citing an obiter remark as if it decided the point is an easy way to lose a judge’s confidence.',
    concepts: ['ratio-and-obiter'],
    skills: ['argument-construction'],
    sourceReference: 'The doctrine of precedent: ratio decidendi and obiter dicta',
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-civil-law-act-cutoff',
    domain: 'legal-reasoning',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_MALAYA',
    stem:
      'In Peninsular Malaysia, where no written law covers a point, the Civil Law Act 1956 lets the court apply the common law of England and the rules of equity as administered in England on which date?',
    options: [
      { id: 'a', text: '31 August 1957' },
      { id: 'b', text: '7 April 1956' },
      { id: 'c', text: '16 September 1963' },
      { id: 'd', text: '1 January 1900' },
    ],
    correct: ['b'],
    explanation:
      'Section 3(1)(a) of the Civil Law Act 1956 applies, in West Malaysia, the common law of England and the rules of equity as administered in England on 7 April 1956, so far as local circumstances permit and subject to local qualifications. Sabah and Sarawak have their own dates in the same section. English decisions after the date are persuasive only.',
    whyItMatters: 'It tells you how much weight an English case can carry in a Malaysian court.',
    concepts: ['statutory-interpretation', 'stare-decisis'],
    skills: [],
    sourceReference: 'Civil Law Act 1956 s 3(1)(a)',
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-purposive-interpretation',
    domain: 'legal-reasoning',
    type: 'multiple_choice',
    difficulty: 5,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'Two readings of a section in a Malaysian Act are possible. One promotes the purpose the Act was passed for; the other, more literal, defeats it.',
    stem: 'Which provision directs the court to prefer the first?',
    options: [
      { id: 'a', text: 'Section 17A of the Interpretation Acts 1948 and 1967' },
      { id: 'b', text: 'Section 3 of the Civil Law Act 1956' },
      { id: 'c', text: 'Article 4 of the Federal Constitution' },
      { id: 'd', text: 'Order 92 rule 4 of the Rules of Court 2012' },
    ],
    correct: ['a'],
    explanation:
      'Section 17A of the Interpretation Acts 1948 and 1967: in interpreting a provision of an Act, a construction that would promote the purpose or object underlying the Act, whether or not that purpose is expressly stated, is to be preferred to one that would not. Article 4 concerns the supremacy of the Constitution, and Order 92 rule 4 the court’s inherent powers.',
    whyItMatters: 'Most arguments about what a section means end at section 17A.',
    concepts: ['statutory-interpretation'],
    skills: ['statutory-analysis'],
    sourceReference: 'Interpretation Acts 1948 and 1967 s 17A',
    diagnosticOnly: true,
  },

  /* --- Ethics and AI ------------------------------------------------------ */
  {
    slug: 'diag-my-ai-client-documents',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You are asked to summarise a client’s 40-page witness statement quickly. A free public chatbot would do it in seconds.',
    stem: 'What should you do?',
    options: [
      { id: 'a', text: 'Paste it in: the summary is only for internal use' },
      { id: 'b', text: 'Use only a tool the firm has approved for client work' },
      { id: 'c', text: 'Paste it in, but take the page numbers out first' },
      { id: 'd', text: 'Ask the chatbot whether it keeps what is pasted in' },
    ],
    correct: ['b'],
    explanation:
      'A client’s documents are confidential. A free public tool may keep or reuse what is pasted into it, and the firm cannot control what happens to it. Use only tools the firm has approved for client material, under its policy, or do the work yourself; when unsure, ask your supervisor before, not after.',
    whyItMatters: 'One paste can put a client’s confidential material somewhere the firm can never get it back from.',
    concepts: ['ai-confidentiality', 'ai-policy'],
    skills: [],
    sourceReference: 'The firm’s AI policy; the duty of confidentiality owed to clients',
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-ai-citations-checked',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario: 'An AI tool drafts submissions for you that cite three Federal Court cases you have not seen before.',
    stem: 'Before the submissions go anywhere, what must happen?',
    options: [
      { id: 'a', text: 'Nothing more, as long as the tool is a well-known one' },
      { id: 'b', text: 'Each case is found and read, to confirm it says that' },
      { id: 'c', text: 'The citations are checked for the right format' },
      { id: 'd', text: 'A note is added to say that an AI tool was used' },
    ],
    correct: ['b'],
    explanation:
      'AI tools can invent cases or misstate real ones, and the lawyer who puts a citation before a court answers for it. Every authority must be found in a law report or a reliable database and read before it is relied on. Saying that AI was used does not cure a false citation.',
    whyItMatters: 'Courts in several countries have sanctioned lawyers for citing cases an AI made up.',
    concepts: ['ai-verification', 'ai-candour'],
    skills: [],
    sourceReference: 'The duty not to mislead the court; the firm’s AI policy',
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-ai-false-authority-handed-up',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A colleague used an AI tool to prepare a list of authorities that has been handed up. During the hearing you realise one of the cases on it does not exist.',
    stem: 'What must you do?',
    options: [
      { id: 'a', text: 'Say nothing unless the judge relies on that case' },
      { id: 'b', text: 'Tell the court at the first opportunity and withdraw it' },
      { id: 'c', text: 'Quietly swap in a real case in the written version' },
      { id: 'd', text: 'Leave it: the other side should have spotted it' },
    ],
    correct: ['b'],
    explanation:
      'The duty not to mislead the court continues for as long as the case does. As soon as you know an authority you have put forward is false, you correct it with the court, whether or not anybody has noticed and whoever made the mistake. Then find out how it happened, so the firm’s checks catch it next time.',
    whyItMatters: 'How a mistake is corrected decides whether it stays a mistake or becomes misconduct.',
    concepts: ['ai-candour', 'ai-verification'],
    skills: ['professional-judgment'],
    sourceReference: 'The duty not to mislead the court',
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-ai-supervisor-answers',
    domain: 'ethics-and-ai',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'A pupil uses an approved AI tool for a first draft of an opinion, checks it, and gives it to the supervising lawyer, who sends it to the client unread because the pupil said it was checked.',
    stem: 'Who answers to the client for what the opinion says?',
    options: [
      { id: 'a', text: 'The company that provides the AI tool' },
      { id: 'b', text: 'The pupil, who said the draft was checked' },
      { id: 'c', text: 'The supervising lawyer and the firm' },
      { id: 'd', text: 'Nobody, because the tool was approved' },
    ],
    correct: ['c'],
    explanation:
      'Work that goes out under the firm’s name is the firm’s and the supervising lawyer’s responsibility. Approving a tool does not approve what it produces, and a pupil’s checking does not replace the supervisor’s review. The supervisor should read what goes out, or not send it.',
    whyItMatters: 'Supervision is what makes a junior’s work safe to send. AI does not change who does it.',
    concepts: ['ai-supervision'],
    skills: ['professional-judgment'],
    sourceReference: 'The duty to supervise; the firm’s AI policy',
    diagnosticOnly: true,
  },

  /* --- Legal research ----------------------------------------------------- */
  {
    slug: 'diag-my-official-text-of-an-act',
    domain: 'legal-research',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'MY_GENERAL',
    stem: 'You need the current text of an Act of Parliament, with its amendments. Which source is official?',
    options: [
      { id: 'a', text: 'A summary of the Act on a law firm’s own website' },
      { id: 'b', text: 'The Laws of Malaysia from the Attorney General’s Chambers' },
      { id: 'c', text: 'A textbook on the subject published some years ago' },
      { id: 'd', text: 'Whichever page an internet search shows first' },
    ],
    correct: ['b'],
    explanation:
      'The Attorney General’s Chambers publishes the Laws of Malaysia, including reprints that bring amendments together, and its online portal is the place to start for the current text. Commentary and textbooks help with meaning, but may be out of date, and the amendment you need may have come after them.',
    whyItMatters: 'Advice based on an old version of an Act is wrong advice, however good the reasoning.',
    concepts: ['authoritative-sources', 'currency'],
    skills: [],
    sourceReference: 'Attorney General’s Chambers, Laws of Malaysia',
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-noting-up-a-case',
    domain: 'legal-research',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    scenario: 'You have found a 1998 decision of the former Supreme Court that is exactly on point.',
    stem: 'Before relying on it, what should you check first?',
    options: [
      { id: 'a', text: 'That more than one law report has published it' },
      { id: 'b', text: 'How later cases have treated it, using a citator' },
      { id: 'c', text: 'That the judges who decided it are still sitting' },
      { id: 'd', text: 'That the judgment runs to more than ten pages' },
    ],
    correct: ['b'],
    explanation:
      'A case may since have been overruled, distinguished or doubted. A citator in a legal database lists the later cases that refer to it and how they treated it. Noting up is part of the research, not an extra.',
    whyItMatters: 'A case that has been overruled is worse than no case at all.',
    concepts: ['noting-up', 'currency'],
    skills: [],
    sourceReference: 'Research practice: noting up with a citator',
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-reading-a-citation',
    domain: 'legal-research',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'MY_GENERAL',
    stem: 'In the citation "[1993] 3 MLJ 36", what does the 3 stand for?',
    options: [
      { id: 'a', text: 'The third case decided that year' },
      { id: 'b', text: 'The volume of the report series for 1993' },
      { id: 'c', text: 'The number of judges who sat' },
      { id: 'd', text: 'The court: 3 means the Federal Court' },
    ],
    correct: ['b'],
    explanation:
      'In "[1993] 3 MLJ 36", 1993 is the year of the report series, 3 the volume for that year, MLJ the Malayan Law Journal and 36 the first page. Square brackets mean the year is needed to find the report.',
    whyItMatters: 'Reading a citation correctly is how you find the case, and how you notice one that looks wrong.',
    concepts: ['authoritative-sources', 'search-technique'],
    skills: [],
    sourceReference: 'Citation of Malaysian law reports',
    diagnosticOnly: true,
  },
  {
    slug: 'diag-my-old-rules-authority',
    domain: 'legal-research',
    type: 'multiple_choice',
    difficulty: 5,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You find a strong 2005 Court of Appeal decision on striking out, decided under the Rules of the High Court 1980.',
    stem: 'Before relying on it in a case under the Rules of Court 2012, what must you check?',
    options: [
      { id: 'a', text: 'Nothing: a Court of Appeal decision binds whatever the rules' },
      { id: 'b', text: 'Whether the 2012 rule is in the same terms as the old one' },
      { id: 'c', text: 'Whether the Federal Court has cited it in the past year' },
      { id: 'd', text: 'Whether the 1980 rules have since been reprinted' },
    ],
    correct: ['b'],
    explanation:
      'The Rules of Court 2012 replaced the Rules of the High Court 1980 and the Subordinate Courts Rules 1980. A decision on an old rule holds for the new one only so far as the new rule is in the same terms and serves the same purpose. Compare the wording first, then check how courts have treated the old authorities under the 2012 Rules.',
    whyItMatters: 'Much of the case law on procedure predates 2012; knowing when it still applies is a large part of the job.',
    concepts: ['currency', 'authoritative-sources'],
    skills: ['statutory-analysis'],
    sourceReference: 'Rules of Court 2012; Rules of the High Court 1980',
    diagnosticOnly: true,
  },
];
