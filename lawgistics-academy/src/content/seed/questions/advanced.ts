import { type SeedQuestion } from '../types';

/**
 * Advanced civil litigation, Australia.
 *
 * Written for somebody who already knows what a subpoena is. The existing bank
 * asks whether you know the rule; these ask whether you know what the rule does
 * at the edges, which is where practitioners actually get caught: the doctrine
 * that is not a third standard of proof, the inference that cannot fill a gap,
 * the objection that does not produce exclusion, the offer whose costs
 * consequences are discretionary rather than automatic.
 *
 * Every one of these is a proposition somebody could be wrong about for years
 * without noticing, because the wrong version is close enough to the right one
 * to survive most conversations.
 *
 * NOT VERIFIED. Drafted from a reading of the authorities named in each
 * sourceReference and not by an Australian lawyer. The named cases are the
 * point of the citation: check the proposition against the case rather than
 * against the confidence of the wording here. Difficulty 4 and 5 content is the
 * worst place to be subtly wrong, because the people answering it are the least
 * likely to doubt it.
 *
 * Uniform Evidence Act references are to the Commonwealth Act. Victoria, New
 * South Wales, Tasmania, the ACT, the Northern Territory and Norfolk Island
 * have substantially uniform provisions; Queensland, South Australia and
 * Western Australia do not, and a question that turns on a section number is
 * marked AU_GENERAL only where the underlying principle is common law.
 */
export const ADVANCED_QUESTIONS: SeedQuestion[] = [
  {
    slug: 'adv-au-anshun-estoppel',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 5,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'Your client sued a builder for defective waterproofing and won. Eighteen months later they want to sue the same builder over defective tiling in the same bathroom, discovered during the first proceeding but not pleaded.',
    stem: 'What is the strongest obstacle?',
    options: [
      { id: 'a', text: 'Res judicata, because the parties are the same' },
      { id: 'b', text: 'Issue estoppel, because the defects were mentioned in evidence' },
      { id: 'c', text: 'Anshun estoppel, because the claim was so relevant to the first proceeding that it was unreasonable not to raise it' },
      { id: 'd', text: 'Nothing, because a separate defect is a separate cause of action' },
    ],
    correct: ['c'],
    explanation:
      'Res judicata bars re-litigating a cause of action already determined, and issue estoppel bars re-litigating an issue actually decided. Neither fits: this is a different cause of action that was never decided. Port of Melbourne Authority v Anshun Pty Ltd (1981) 147 CLR 589 extends the principle to a claim that was not raised, where it was unreasonable not to have raised it in the earlier proceeding. Relevance to the earlier subject matter and knowledge of the claim at the time are what make the omission unreasonable.',
    whyItMatters:
      'It is the trap in running a modest claim first to test the defendant. Winning small can extinguish the larger claim you were saving.',
    commonMisconception:
      'That a distinct cause of action is always safe. Anshun is precisely the doctrine that says otherwise.',
    memoryTrick: 'Res judicata is what was decided. Anshun is what should have been.',
    concepts: ['limitation-periods', 'pleadings'],
    skills: ['strategic-reasoning', 'procedural-sequencing'],
    sourceReference: 'Port of Melbourne Authority v Anshun Pty Ltd (1981) 147 CLR 589',
  },
  {
    slug: 'adv-au-house-v-king',
    domain: 'legal-reasoning',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'A judge refuses your client’s application for an adjournment. You think the decision was wrong and want to appeal.',
    stem: 'What must you establish on appeal?',
    options: [
      { id: 'a', text: 'That the appellate court would have decided it differently' },
      { id: 'b', text: 'That the judge acted on a wrong principle, was guided by irrelevant matters, mistook the facts, failed to take a material consideration into account, or that the result is unreasonable or plainly unjust' },
      { id: 'c', text: 'That the decision caused your client loss' },
      { id: 'd', text: 'That the judge gave inadequate reasons' },
    ],
    correct: ['b'],
    explanation:
      'An adjournment is a discretionary decision, and House v The King (1936) 55 CLR 499 sets the test for appellate interference with a discretion. Mere disagreement is not enough: the appellate court must find an identifiable error of the kind described, or infer that some error must have occurred because the result is unreasonable or plainly unjust. This is a materially higher bar than appealing an error of law.',
    whyItMatters:
      'Most interlocutory decisions are discretionary, so most interlocutory appeals live or die on this test rather than on the merits of the underlying question.',
    commonMisconception:
      'That an appeal asks the appellate court to decide the question again. Against a discretion it does not.',
    memoryTrick: 'Not "was it wrong", but "was it wrongly reached".',
    concepts: ['appellate-structure', 'stare-decisis'],
    skills: ['argument-construction', 'strategic-reasoning'],
    sourceReference: 'House v The King (1936) 55 CLR 499',
  },
  {
    slug: 'adv-au-browne-v-dunn-remedy',
    domain: 'advocacy',
    type: 'multiple_choice',
    difficulty: 5,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'Your opponent closes their cross-examination without putting to your witness the allegation that she fabricated a file note, then submits in closing that she fabricated it.',
    stem: 'What is the most accurate statement of the consequence?',
    options: [
      { id: 'a', text: 'The submission is inadmissible and must be disregarded' },
      { id: 'b', text: 'The evidence of the other side’s witness on that topic is automatically excluded' },
      { id: 'c', text: 'There is no single fixed consequence; the court may allow recall, grant an adjournment, permit further evidence, or take the failure into account in weighing the allegation' },
      { id: 'd', text: 'A mistrial must be ordered' },
    ],
    correct: ['c'],
    explanation:
      'Browne v Dunn (1893) 6 R 67 is a rule of fairness rather than a rule of admissibility, and breaching it does not produce a fixed sanction. The court has a range of responses, and the appropriate one depends on the stage of the trial and the prejudice caused. Recall of the witness is often the least disruptive. Australian appellate discussion has cautioned against treating the rule as producing automatic exclusion of evidence.',
    whyItMatters:
      'Knowing the range of responses is what lets you ask for the one that helps your client, rather than demanding a remedy the court was never going to give.',
    commonMisconception:
      'That a Browne v Dunn breach automatically excludes something. It is about fairness to the witness, and the cure is usually procedural.',
    memoryTrick: 'The rule is a duty to put, not a switch that deletes.',
    concepts: ['browne-v-dunn', 'cross-examination'],
    skills: ['oral-communication', 'strategic-reasoning'],
    sourceReference: 'Browne v Dunn (1893) 6 R 67; Allied Pastoral Holdings Pty Ltd v FCT [1983] 1 NSWLR 1; MWJ v The Queen (2005) 80 ALJR 329',
  },
  {
    slug: 'adv-au-dominant-purpose',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'A report was commissioned after an industrial accident. The board wanted it both to decide whether to change safety procedures and to prepare for litigation it expected. The two purposes were about equally weighted.',
    stem: 'Is the report privileged?',
    options: [
      { id: 'a', text: 'Yes, because litigation was one of the purposes' },
      { id: 'b', text: 'No, because litigation was not the dominant purpose' },
      { id: 'c', text: 'Yes, because it was commissioned by the board' },
      { id: 'd', text: 'Only the parts that discuss the litigation' },
    ],
    correct: ['b'],
    explanation:
      'Esso Australia Resources Ltd v Commissioner of Taxation (1999) 201 CLR 49 adopted the dominant purpose test at common law, aligning it with the uniform Evidence Acts. Dominant means ruling or prevailing, not merely substantial and not merely one of several. Where two purposes are of roughly equal weight, neither is dominant, and the claim fails.',
    whyItMatters:
      'Dual-purpose documents are extremely common in corporate clients, and the answer decides whether an internal investigation is discoverable.',
    commonMisconception:
      'That a substantial litigation purpose is enough. That was the older test, and it was displaced.',
    memoryTrick: 'Dominant means it beat the others, not that it was among them.',
    concepts: ['client-legal-privilege', 'discovery'],
    skills: ['evidence-analysis', 'commercial-reasoning'],
    sourceReference: 'Esso Australia Resources Ltd v FCT (1999) 201 CLR 49; Evidence Act 1995 (Cth) ss 118, 119',
  },
  {
    slug: 'adv-au-jones-v-dunkel-limit',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 5,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'The defendant does not call its site manager, who was present at the relevant meeting and is plainly in the defendant’s camp. You have no direct evidence of what was said at that meeting.',
    stem: 'What does the failure to call him allow the court to do?',
    options: [
      { id: 'a', text: 'Infer that the site manager’s evidence would have been adverse to the defendant, which can supply the missing account of the meeting' },
      { id: 'b', text: 'Draw an inference more comfortably where an inference is already open on the evidence, but not fill the gap in your case' },
      { id: 'c', text: 'Treat the defendant as having admitted your version of the meeting' },
      { id: 'd', text: 'Strike out the defence' },
    ],
    correct: ['b'],
    explanation:
      'Jones v Dunkel (1959) 101 CLR 298 permits an inference that the absent witness would not have assisted the party who failed to call them, which may make the drawing of an inference otherwise open more comfortable. It does not convert absence into evidence, and it cannot fill a gap where no inference was available in the first place. You still have to have a case; the rule strengthens it rather than creating it.',
    whyItMatters:
      'It is regularly over-pleaded in submissions. A court asked to build a finding out of a Jones v Dunkel inference alone will refuse, and the submission costs you credibility on the points that were sound.',
    commonMisconception:
      'That not calling a witness proves what the witness would have said. It proves nothing; it only removes a reason to hesitate.',
    memoryTrick: 'It is a tailwind, not an engine.',
    concepts: ['onus-of-proof', 'relevance'],
    skills: ['evidence-analysis', 'argument-construction'],
    sourceReference: 'Jones v Dunkel (1959) 101 CLR 298',
  },
  {
    slug: 'adv-au-briginshaw',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'You act in a civil claim alleging that a director deliberately falsified accounts. Your opponent submits that you must prove it beyond reasonable doubt because it is an allegation of dishonesty.',
    stem: 'What is the correct position?',
    options: [
      { id: 'a', text: 'They are right; serious allegations require the criminal standard in civil proceedings' },
      { id: 'b', text: 'The standard remains the balance of probabilities, but the seriousness of the allegation bears on whether the court is actually satisfied' },
      { id: 'c', text: 'There is an intermediate standard of comfortable satisfaction' },
      { id: 'd', text: 'The standard shifts to the defendant to disprove dishonesty' },
    ],
    correct: ['b'],
    explanation:
      'Briginshaw v Briginshaw (1938) 60 CLR 336 does not create a third standard of proof. The civil standard remains the balance of probabilities. What Dixon J said is that the nature and gravity of what is alleged affects the quality of evidence a court will require before it is reasonably satisfied. Section 140(2) of the uniform Evidence Acts puts the same idea in statutory form.',
    whyItMatters:
      'Pleading fraud without evidence of a quality matching the allegation is a well-worn way to lose a case and attract an indemnity costs order.',
    commonMisconception:
      'That Briginshaw raises the standard. It does not raise the standard; it raises what it takes to meet it.',
    memoryTrick: 'Same bar, heavier weight to lift over it.',
    concepts: ['standard-of-proof', 'onus-of-proof'],
    skills: ['evidence-analysis', 'professional-judgment'],
    sourceReference: 'Briginshaw v Briginshaw (1938) 60 CLR 336; Evidence Act 1995 (Cth) s 140(2)',
  },
  {
    slug: 'adv-au-calderbank-vs-formal-offer',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 5,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'You want to put settlement pressure on the other side and are choosing between a formal offer of compromise under the court rules and a Calderbank letter.',
    stem: 'What is the key difference in costs consequences?',
    options: [
      { id: 'a', text: 'There is none; both produce indemnity costs if beaten' },
      { id: 'b', text: 'A formal offer engages the costs consequences the rules prescribe; a Calderbank offer founds a discretionary application in which you must show the refusal was unreasonable' },
      { id: 'c', text: 'A Calderbank offer is stronger because it can be made at any time' },
      { id: 'd', text: 'A formal offer must be accepted, so no costs question arises' },
    ],
    correct: ['b'],
    explanation:
      'A compliant offer of compromise under the rules attracts the costs consequences the rules set out, subject to any contrary order. A Calderbank offer, made without prejudice save as to costs, has no rules-based entitlement behind it: it is evidence going to the exercise of the costs discretion, and the applicant must persuade the court that rejecting the offer was unreasonable in the circumstances known at the time.',
    whyItMatters:
      'Practitioners often assume beating a Calderbank offer automatically produces indemnity costs. It does not, and an offer left open for an unreasonably short time is a common reason it fails.',
    commonMisconception:
      'That the two are interchangeable. They differ in formality, in timing requirements and in whether the consequence is prescribed or discretionary.',
    memoryTrick: 'The rules give you an entitlement. Calderbank gives you an argument.',
    concepts: ['costs', 'settlement-privilege'],
    skills: ['commercial-reasoning', 'strategic-reasoning'],
    sourceReference: 'Calderbank v Calderbank [1975] 3 All ER 333; and see the offer of compromise provisions in the relevant court rules',
  },
  {
    slug: 'adv-au-expert-reasoning-exposed',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 5,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'An expert engineer with impeccable qualifications states a conclusion about the cause of a collapse, but the report does not set out the facts assumed or the reasoning from those facts to the conclusion.',
    stem: 'What is the difficulty?',
    options: [
      { id: 'a', text: 'None, if the expert is properly qualified' },
      { id: 'b', text: 'It goes only to weight, not admissibility' },
      { id: 'c', text: 'The opinion may not be shown to be wholly or substantially based on specialised knowledge, which is what the exception to the opinion rule requires' },
      { id: 'd', text: 'The report must be sworn' },
    ],
    correct: ['c'],
    explanation:
      'Section 79 of the uniform Evidence Acts excepts from the opinion rule an opinion wholly or substantially based on specialised knowledge derived from training, study or experience. Dasreef Pty Ltd v Hawchar (2011) 243 CLR 588 makes the point that the connection must be demonstrated: the court must be able to see the facts assumed and the reasoning applied, otherwise it cannot tell whether the opinion is based on the expertise at all. Makita (Australia) Pty Ltd v Sprowles (2001) 52 NSWLR 705 puts the same requirement at length.',
    whyItMatters:
      'A bare conclusion from a distinguished expert is the most expensive kind of inadmissible evidence, because you usually discover the problem at trial.',
    commonMisconception:
      'That qualifications carry the opinion. They establish the expertise; the report has to show the opinion actually rests on it.',
    memoryTrick: 'Show the working, not just the qualification.',
    concepts: ['opinion-evidence'],
    skills: ['evidence-analysis', 'attention-to-detail'],
    sourceReference: 'Evidence Act 1995 (Cth) s 79; Dasreef Pty Ltd v Hawchar (2011) 243 CLR 588; Makita (Australia) Pty Ltd v Sprowles (2001) 52 NSWLR 705',
  },
  {
    slug: 'adv-au-security-for-costs-impecuniosity',
    domain: 'civil-procedure',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'You act for a defendant. The corporate plaintiff has no assets and would plainly be unable to pay your client’s costs if it lost.',
    stem: 'What follows for an application for security for costs?',
    options: [
      { id: 'a', text: 'Security must be ordered, because impecuniosity is established' },
      { id: 'b', text: 'Security cannot be ordered, because it would stifle the claim' },
      { id: 'c', text: 'The threshold is met, but the order remains discretionary and the court weighs matters including delay, the merits, whether the plaintiff’s impecuniosity was caused by the defendant, and stifling' },
      { id: 'd', text: 'Security is only available against individuals' },
    ],
    correct: ['c'],
    explanation:
      'Credible evidence that a corporate plaintiff will be unable to pay costs opens the jurisdiction, but does not compel an order. The discretion takes account of the promptness of the application, the strength of the claim, whether the defendant’s own conduct caused the impecuniosity, whether an order would stifle a genuine claim, and whether there are others standing behind the plaintiff who would benefit from success.',
    whyItMatters:
      'It is one of the few applications that can end a case commercially rather than legally, and delay in bringing it is the most common reason it fails.',
    commonMisconception:
      'That poverty of the plaintiff decides the application. It opens it.',
    memoryTrick: 'Impecuniosity is the key to the door, not the decision inside it.',
    concepts: ['costs', 'interlocutory-applications'],
    skills: ['strategic-reasoning', 'commercial-reasoning'],
    sourceReference: 'Corporations Act 2001 (Cth) s 1335, and the security for costs provisions of the relevant court rules',
  },
  {
    slug: 'adv-au-without-prejudice-exception',
    domain: 'evidence',
    type: 'multiple_choice',
    difficulty: 4,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'A letter headed "without prejudice" contains a threat to report the other side to a regulator unless they settle on the terms proposed.',
    stem: 'Is the letter protected from being put before the court?',
    options: [
      { id: 'a', text: 'Yes, the heading determines the position' },
      { id: 'b', text: 'Yes, provided it was written during a genuine dispute' },
      { id: 'c', text: 'Not necessarily; the protection attaches to genuine attempts to settle, and does not shield communications that go beyond that, such as ones amounting to improper pressure' },
      { id: 'd', text: 'No, because the letter mentions a regulator' },
    ],
    correct: ['c'],
    explanation:
      'The label is not decisive in either direction: an unlabelled letter may be protected if it is a genuine settlement communication, and a labelled one may not be if it is not. The protection exists to encourage settlement, and it has recognised limits where the communication is used for an improper purpose. Whether a particular threat crosses that line is fact-specific and depends on the applicable statutory provision as well as the common law.',
    whyItMatters:
      'People write things in settlement correspondence they would never put in an open letter, on the assumption the heading is a force field.',
    commonMisconception:
      'That writing "without prejudice" at the top makes a document inadmissible whatever it says.',
    memoryTrick: 'The protection follows the purpose, not the heading.',
    concepts: ['settlement-privilege'],
    skills: ['professional-judgment', 'written-communication'],
    sourceReference: 'Evidence Act 1995 (Cth) s 131 and its exceptions; and the general law on without prejudice communications',
  },
];
