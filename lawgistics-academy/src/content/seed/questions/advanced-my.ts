import { type SeedQuestion } from '../types';

/**
 * Advanced civil litigation, Malaysia.
 *
 * The counterpart to advanced.ts. The existing Malaysian bank runs to
 * difficulty 3 and covers the structure: which court, which rules, what a writ
 * is. These go to the places where an experienced practitioner is tested, which
 * in a codified system is usually the interaction between a section and the
 * practice built on it.
 *
 * TENTATIVE. READ THIS BEFORE TRUSTING ANY OF IT.
 *
 * Four of the questions below are marked TENTATIVE, which loads them as drafts
 * so they are never served to anybody until a person publishes them
 * deliberately, one at a time. They are the ones whose accuracy turns on a rule
 * number, a section, or a procedural detail I could not stand up: setting aside
 * a default judgment, the Mareva requirements, the Anton Piller threshold, and
 * the limitation postponement provisions.
 *
 * My confidence across this whole file is materially lower than in the
 * Australian one, and that is worth saying plainly rather than burying. The
 * Malaysian material is codified, which makes it look easy to state and easy to
 * get subtly wrong. The questions not marked tentative are unverified like
 * everything else here, which is not the same as being right.
 *
 * The citations are the point. Check the proposition against the section and
 * the case named, not against how confident the wording sounds. If a numbered
 * threshold appears anywhere below, treat it as the single most likely thing to
 * be out of date.
 */
export const ADVANCED_MY_QUESTIONS: SeedQuestion[] = [
  {
    slug: 'adv-my-striking-out-no-evidence',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You apply to strike out a statement of claim under Order 18 rule 19 of the Rules of Court 2012 on the ground that it discloses no reasonable cause of action, and you want to file an affidavit exhibiting documents that contradict the pleaded facts.',
    stem: 'What is the problem with that approach?',
    options: [
      { id: 'a', text: 'None; affidavit evidence is expected on any striking out application' },
      { id: 'b', text: 'On the "no reasonable cause of action" ground no evidence is admissible, so the application is decided on the pleading as it stands' },
      { id: 'c', text: 'Affidavits are only allowed with the court’s leave' },
      { id: 'd', text: 'The documents must be discovered first' },
    ],
    correct: ['b'],
    explanation:
      'The grounds in Order 18 rule 19 are not interchangeable. Where the ground is that the pleading discloses no reasonable cause of action or defence, no evidence is admissible and the court assumes the pleaded facts are true, asking only whether they disclose a cause of action. Contradicting the facts requires a different ground, or a different application. The jurisdiction is also exercised sparingly: the case must be plain and obvious.',
    whyItMatters:
      'Choosing the wrong limb is the usual reason a striking out application fails on its own terms, before anybody reaches the merits.',
    commonMisconception:
      'That striking out is a mini-trial on the documents. On the first limb it is an argument about the pleading alone.',
    memoryTrick: 'No reasonable cause of action means: read the pleading, and nothing else.',
    concepts: ['rules-of-court-2012', 'pleadings'],
    skills: ['procedural-sequencing', 'statutory-analysis'],
    sourceReference:
      'Rules of Court 2012 O 18 r 19; Bandar Builder Sdn Bhd v United Malayan Banking Corporation Bhd [1993] 3 MLJ 36',
  },
  {
    slug: 'adv-my-adverse-inference-114g',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'The defendant company does not call its former finance manager, who prepared the disputed reconciliation and is available. You ask the court to draw an adverse inference.',
    stem: 'What is the basis, and what is its limit?',
    options: [
      { id: 'a', text: 'Section 114(g) of the Evidence Act 1950; the court may presume that evidence withheld would be unfavourable, but it is a discretion rather than an obligation and the party must have withheld rather than merely not called' },
      { id: 'b', text: 'Section 101; the burden shifts to the defendant once the witness is not called' },
      { id: 'c', text: 'There is no such provision in Malaysia; the rule is purely common law' },
      { id: 'd', text: 'Section 114(g) requires the court to presume the evidence was unfavourable' },
    ],
    correct: ['a'],
    explanation:
      'Illustration (g) to section 114 of the Evidence Act 1950 allows the court to presume that evidence which could be and is not produced would, if produced, be unfavourable to the person who withholds it. The language is permissive: the court may presume. Malaysian authority has emphasised that there must be withholding or suppression rather than a mere failure to call, and that the party must otherwise have discharged its own burden.',
    whyItMatters:
      'It is invoked constantly in submissions and refused often, usually because the applicant had not made out its own case first.',
    commonMisconception:
      'That the presumption is mandatory once a witness is not called. It is a discretion, and it does not relieve you of your own burden.',
    memoryTrick: 'May presume, not must. Withheld, not merely absent.',
    concepts: ['evidence-act-1950', 'onus-of-proof'],
    skills: ['evidence-analysis', 'argument-construction'],
    sourceReference: 'Evidence Act 1950 s 114 illustration (g)',
  },
  {
    slug: 'adv-my-s91-92-oral-variation',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 5,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'Your client says the written supply agreement was subject to an oral side agreement that delivery times were indicative only. The written agreement is complete on its face and contains no such term.',
    stem: 'What is the principal evidentiary obstacle?',
    options: [
      { id: 'a', text: 'Hearsay' },
      { id: 'b', text: 'Sections 91 and 92 of the Evidence Act 1950, which require the terms of a contract reduced to writing to be proved by the document and exclude oral evidence to contradict, vary, add to or subtract from those terms' },
      { id: 'c', text: 'The best evidence rule, which has no statutory form in Malaysia' },
      { id: 'd', text: 'Nothing; oral evidence of surrounding circumstances is always admissible' },
    ],
    correct: ['b'],
    explanation:
      'Sections 91 and 92 of the Evidence Act 1950 codify what the common law treats as the parol evidence rule. Section 91 requires the terms of a contract reduced to the form of a document to be proved by the document itself. Section 92 then excludes oral evidence for the purpose of contradicting, varying, adding to or subtracting from those terms as between the parties. The provisos to section 92 are where the real argument usually lies, and they are the part worth reading closely.',
    whyItMatters:
      'It is the difference between a case that runs and one that is decided on the documents, and it arrives early because it shapes what evidence you bother to gather.',
    commonMisconception:
      'That because the codification tracks the common law, the common law exceptions apply as such. The provisos to section 92 are the operative text.',
    memoryTrick: 'Section 91 says prove it by the document. Section 92 says do not talk it away.',
    concepts: ['evidence-act-1950', 'documentary-evidence'],
    skills: ['statutory-analysis', 'evidence-analysis'],
    sourceReference: 'Evidence Act 1950 ss 91, 92 and the provisos to s 92',
  },
  {
    slug: 'adv-my-setting-aside-regular-irregular',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 5,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'Judgment in default was entered against your client. On the file you find that the writ was never validly served, and separately your client has a genuine defence on the merits.',
    stem: 'Why does the service defect matter so much to how you frame the application?',
    options: [
      { id: 'a', text: 'It does not; every setting aside application requires a defence on the merits' },
      { id: 'b', text: 'A judgment that is irregular because of a defect such as invalid service is liable to be set aside as of right, whereas a regular judgment is set aside in the court’s discretion and requires a defence on the merits to be shown' },
      { id: 'c', text: 'Because irregular judgments cannot be set aside at all' },
      { id: 'd', text: 'Because service defects only affect costs' },
    ],
    correct: ['b'],
    explanation:
      'The distinction between a regular and an irregular judgment governs the application. Where the judgment is irregular, for example because the process was not validly served, it is set aside as of right rather than as a matter of discretion, and the applicant is not required to demonstrate a defence on the merits. Where the judgment is regular, the court exercises a discretion and will expect an affidavit disclosing a defence on the merits. Leading with the irregularity therefore relieves you of a burden.',
    whyItMatters:
      'Applications are routinely argued on the merits when the irregularity would have decided it, which puts the applicant to a proof they never needed to offer.',
    commonMisconception:
      'That you must always show a defence on the merits. Against an irregular judgment you should not have to.',
    memoryTrick: 'Irregular is a right. Regular is a request.',
    concepts: ['default-judgment', 'rules-of-court-2012'],
    skills: ['procedural-sequencing', 'strategic-reasoning'],
    sourceReference:
      'Rules of Court 2012 O 13 and O 42 r 13; and the line of authority following Evans v Bartlam [1937] AC 473',
    tentative: true,
  },
  {
    slug: 'adv-my-order-14a-point-of-law',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'The facts are largely agreed and the case turns on the construction of one clause. Summary judgment under Order 14 is awkward because the defendant raises an arguable question of construction rather than a factual dispute.',
    stem: 'What is the more suitable procedure?',
    options: [
      { id: 'a', text: 'Order 14A, which allows the court to determine a question of law or construction where it is suitable for determination without a full trial and will finally determine the matter' },
      { id: 'b', text: 'Order 18 rule 19, striking out' },
      { id: 'c', text: 'Interrogatories under Order 26' },
      { id: 'd', text: 'There is no such procedure; the matter must go to trial' },
    ],
    correct: ['a'],
    explanation:
      'Order 14A of the Rules of Court 2012 allows the court to determine a question of law or of construction of a document without a full trial, where the question is suitable for determination on that basis and the determination will finally determine the entire cause or matter or a claim or issue in it. It is the right tool where the dispute is about what a document means rather than about what happened, and it avoids the Order 14 difficulty that an arguable point of law may be treated as a triable issue.',
    whyItMatters:
      'Construction disputes reach trial unnecessarily because the only summary tool anyone reaches for is Order 14.',
    commonMisconception:
      'That Order 14A is a variant of summary judgment. It answers a legal question; it does not weigh the merits of a factual case.',
    memoryTrick: 'Order 14 is about whether there is a dispute. Order 14A is about what the words mean.',
    concepts: ['rules-of-court-2012', 'summary-judgment'],
    skills: ['procedural-sequencing', 'statutory-analysis'],
    sourceReference: 'Rules of Court 2012 O 14A',
  },
  {
    slug: 'adv-my-mareva-requirements',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 5,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'You suspect the defendant is moving assets offshore and want a Mareva injunction, applied for ex parte.',
    stem: 'Beyond a good arguable case, what must you establish and observe?',
    options: [
      { id: 'a', text: 'Only that the defendant has assets in the jurisdiction' },
      { id: 'b', text: 'A real risk of dissipation of assets so as to frustrate any judgment, together with the duty of full and frank disclosure that attaches to any ex parte application, and ordinarily an undertaking as to damages' },
      { id: 'c', text: 'That the defendant has been convicted of dishonesty' },
      { id: 'd', text: 'That the claim exceeds the Sessions Court limit' },
    ],
    correct: ['b'],
    explanation:
      'A Mareva or freezing injunction requires a good arguable case on the substantive claim and a real risk that assets will be dissipated so as to render any judgment nugatory. Because it is usually sought ex parte, the applicant owes a duty of full and frank disclosure of all material facts, including those adverse to the application, and the ordinary consequence of breaching that duty is discharge of the order. An undertaking as to damages is ordinarily required.',
    whyItMatters:
      'Orders obtained ex parte are lost on non-disclosure far more often than on the merits, and the loss is usually accompanied by an adverse costs order.',
    commonMisconception:
      'That the risk of dissipation can be inferred from the defendant simply being in financial difficulty. It requires evidence of a risk of dealing with assets to defeat the judgment.',
    memoryTrick: 'Ex parte means you argue both sides, including theirs.',
    concepts: ['interlocutory-applications', 'rules-of-court-2012'],
    skills: ['professional-judgment', 'strategic-reasoning'],
    sourceReference:
      'Rules of Court 2012 O 29; Mareva Compania Naviera SA v International Bulkcarriers SA [1975] 2 Lloyd’s Rep 509',
    tentative: true,
  },
  {
    slug: 'adv-my-anton-piller-threshold',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 5,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'Your client believes a former employee has taken confidential drawings and will destroy them if put on notice.',
    stem: 'What must be shown for an Anton Piller order?',
    options: [
      { id: 'a', text: 'A good arguable case and a risk of dissipation' },
      { id: 'b', text: 'An extremely strong prima facie case, very serious potential or actual damage, clear evidence that the defendant has incriminating material, and a real possibility of destruction before an inter partes application' },
      { id: 'c', text: 'That the police have declined to act' },
      { id: 'd', text: 'That the employment contract contained a confidentiality clause' },
    ],
    correct: ['b'],
    explanation:
      'The threshold set in Anton Piller KG v Manufacturing Processes Ltd [1976] Ch 55 is deliberately higher than for a freezing order, because the order permits entry and inspection of premises without prior notice. The applicant must show an extremely strong prima facie case, that the damage actual or potential is very serious, clear evidence that the defendant possesses incriminating documents or things, and a real possibility that they would be destroyed if notice were given. Full and frank disclosure applies with equal force.',
    whyItMatters:
      'It is one of the most intrusive orders a civil court makes, and the threshold reflects that. Applying on Mareva-level material invites refusal.',
    commonMisconception:
      'That it is a search warrant. It is a mandatory order permitting entry with consent, and refusing entry is contempt rather than something enforced by force.',
    memoryTrick: 'Extremely strong, very serious, clear evidence, real possibility. Four, all high.',
    concepts: ['interlocutory-applications'],
    skills: ['professional-judgment', 'strategic-reasoning'],
    sourceReference: 'Anton Piller KG v Manufacturing Processes Ltd [1976] Ch 55; Rules of Court 2012 O 29',
    tentative: true,
  },
  {
    slug: 'adv-my-federal-court-leave-criteria',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 5,
    jurisdiction: 'MY_FEDERAL',
    scenario:
      'You have lost in the Court of Appeal in a civil matter and your client wants to go to the Federal Court. The point is important to your client and worth a great deal of money.',
    // Narrowed on review. Section 96 has two limbs, and (b) is a separate
    // constitutional route, so the unqualified question was broader than the
    // keyed answer.
    stem:
      'Assuming the proposed appeal does not concern the effect of a constitutional provision, what must ordinarily be shown under s 96(a) to obtain leave?',
    options: [
      { id: 'a', text: 'That the amount in dispute exceeds a prescribed threshold' },
      { id: 'b', text: 'That the Court of Appeal was wrong' },
      { id: 'c', text: 'That the appeal raises a question of general principle decided for the first time, or a question of importance upon which further argument and a decision of the Federal Court would be to public advantage' },
      { id: 'd', text: 'Nothing; an appeal lies as of right from the Court of Appeal' },
    ],
    correct: ['c'],
    explanation:
      'Section 96 of the Courts of Judicature Act 1964 conditions civil appeals to the Federal Court on leave, and the criteria in s 96(a) are directed at the public significance of the question rather than at the size of the dispute or the strength of the applicant’s grievance. A question of general principle decided for the first time, or a question of importance on which a decision of the Federal Court would be to public advantage, is what that limb is looking for. That a party has lost and lost expensively is not a criterion. Section 96(b) is a separate route, concerned with the effect of a provision of the Constitution, and this question sets it aside.',
    whyItMatters:
      'Leave applications framed as a complaint about the result rather than as a question of general importance are the ones that fail.',
    commonMisconception:
      'That importance to the client is importance for the purposes of leave. The test looks past the parties.',
    memoryTrick: 'The question has to matter to more people than your client.',
    concepts: ['my-court-structure', 'appellate-structure'],
    skills: ['argument-construction', 'strategic-reasoning'],
    sourceReference: 'Courts of Judicature Act 1964 s 96(a)',
  },
  {
    slug: 'adv-my-order-14-triable-issue',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'On your Order 14 application the defendant files an affidavit raising a defence which is thin, but not obviously untrue, and which would require oral evidence to resolve.',
    stem: 'What is the likely outcome and why?',
    options: [
      { id: 'a', text: 'Judgment, because the defence is thin' },
      { id: 'b', text: 'Unconditional leave to defend, because any assertion in an affidavit defeats Order 14' },
      { id: 'c', text: 'Leave to defend, potentially conditional, because the question is whether there is a triable issue rather than whether the defence is likely to succeed' },
      { id: 'd', text: 'The application is adjourned to trial automatically' },
    ],
    correct: ['c'],
    explanation:
      'Order 14 asks whether there is an issue or question in dispute which ought to be tried, not whether the defendant will probably win. A defence that requires oral evidence to resolve will ordinarily cross that threshold. Where the defence is shadowy the court has the option of granting conditional leave, commonly on payment into court, which is the middle course between entering judgment and letting a weak defence proceed unencumbered.',
    whyItMatters:
      'The conditional leave option is under-used by applicants, who tend to argue for judgment or nothing and end up with unconditional leave.',
    commonMisconception:
      'That the court weighs which case is stronger on the affidavits. It asks whether there is something that ought to be tried.',
    memoryTrick: 'Triable, not winnable.',
    concepts: ['summary-judgment', 'rules-of-court-2012'],
    skills: ['strategic-reasoning', 'procedural-sequencing'],
    sourceReference: 'Rules of Court 2012 O 14',
  },
  {
    slug: 'adv-my-limitation-fraud-postponement',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 5,
    jurisdiction: 'MY_GENERAL',
    scenario:
      'Your client discovers in 2026 that a former agent misappropriated funds in 2016 and concealed it. The ordinary limitation period for the claim has expired on its face.',
    stem: 'What is the line of argument worth investigating first?',
    options: [
      { id: 'a', text: 'That limitation does not apply to claims against agents' },
      { id: 'b', text: 'The postponement provisions of the Limitation Act 1953 dealing with fraud and concealment, under which time may run from discovery rather than from the act' },
      { id: 'c', text: 'That the court has a general discretion to extend limitation in the interests of justice' },
      { id: 'd', text: 'That the claim should be reframed in contract to obtain a longer period' },
    ],
    correct: ['b'],
    explanation:
      'The ordinary period for actions founded on contract or tort under the Limitation Act 1953 runs from accrual of the cause of action. Where the action is based upon fraud, or the right of action is concealed by fraud, the Act postpones the running of time until the plaintiff has discovered the fraud or could with reasonable diligence have discovered it. There is no general judicial discretion to extend limitation in civil claims of this kind, so the argument has to be made within the statute.',
    whyItMatters:
      'Concealment cases look statute-barred on the face of the pleading, and the postponement provision is what makes them arguable at all.',
    commonMisconception:
      'That a court can extend a limitation period because it would be unjust not to. In these actions it cannot; the relief has to come from the Act.',
    memoryTrick: 'No general discretion. Find the provision or find another claim.',
    concepts: ['limitation-periods'],
    skills: ['statutory-analysis', 'strategic-reasoning'],
    sourceReference: 'Limitation Act 1953, including the provisions postponing time in cases of fraud and concealment',
    tentative: true,
  },
];
