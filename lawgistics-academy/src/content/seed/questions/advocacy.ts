import { TRUE_FALSE_OPTIONS, type SeedQuestion } from '../types';

export const ADVOCACY_QUESTIONS: SeedQuestion[] = [
  {
    slug: 'ad-browne-v-dunn',
    domain: 'advocacy',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    stem: 'What does the rule in Browne v Dunn require of an advocate?',
    options: [
      { id: 'a', text: 'That every witness be cross-examined' },
      { id: 'b', text: 'That where you intend to contradict a witness’s evidence, or impugn their credit, you put that case to the witness in cross-examination so they have an opportunity to respond' },
      { id: 'c', text: 'That leading questions be avoided in cross-examination' },
      { id: 'd', text: 'That an advocate disclose their client’s instructions to the court' },
    ],
    correct: ['b'],
    explanation:
      'The rule is one of fairness. If you intend to submit that a witness is lying, mistaken, or that events happened differently, you must put that proposition to the witness while they are in the box so they can answer it. A failure to comply can lead to the witness being recalled, to an adverse comment, to a direction to the tribunal of fact, or to your submission simply not being open to you.',
    whyItMatters:
      'It is the most commonly enforced advocacy rule in Australian courts, and breaching it can cost you the very submission the whole case was built around. It also disciplines your preparation: you cannot put a case you have not worked out in advance.',
    commonMisconception:
      'Thinking the rule requires you to cross-examine every witness. It requires you to put your case to the witnesses whose evidence you intend to contradict.',
    memoryTrick:
      'If you are going to say it in closing, you have to have said it to their face.',
    concepts: ['browne-v-dunn', 'cross-examination'],
    skills: ['oral-communication', 'professional-judgment', 'strategic-reasoning'],
    sourceReference: 'Browne v Dunn (1893) 6 R 67',
  },
  {
    slug: 'ad-cross-leading-permitted',
    domain: 'advocacy',
    type: 'true_false',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    stem: 'True or false: leading questions are generally permitted in cross-examination.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['true'],
    explanation:
      'True. Cross-examination is where leading questions belong. The advocate puts propositions and the witness agrees or disagrees. There remain limits; the court may disallow improper questions, including those that are misleading, confusing, unduly harassing, or put in an offensive manner, and particular protections apply to vulnerable witnesses.',
    whyItMatters:
      'Effective cross-examination is a series of short, closed propositions the witness can only accept or deny. Open questions in cross hand the witness the floor, which is almost always a mistake.',
    commonMisconception:
      'Believing "leading questions are not allowed" is a general rule of advocacy. It is a rule about examination in chief.',
    memoryTrick:
      'In chief you ask. In cross you tell, and wait for the answer.',
    concepts: ['cross-examination', 'questioning-rules'],
    skills: ['oral-communication'],
    sourceReference: 'Evidence Act 1995 (Cth) ss 41–42',
  },
  {
    slug: 'ad-re-examination-scope',
    domain: 'advocacy',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    stem: 'What is the permissible scope of re-examination?',
    options: [
      { id: 'a', text: 'Any topic the advocate wishes to revisit' },
      { id: 'b', text: 'Matters arising out of cross-examination, in order to clarify or explain them' },
      { id: 'c', text: 'Only matters that were covered in examination in chief' },
      { id: 'd', text: 'Anything, provided leading questions are used' },
    ],
    correct: ['b'],
    explanation:
      'Re-examination is confined to matters arising out of cross-examination. Its purpose is to allow a witness to explain or qualify evidence given in cross that would otherwise leave a misleading impression. New matters may only be raised with leave of the court, and leading questions are no more permitted in re-examination than they are in chief.',
    whyItMatters:
      'Juniors often want to use re-examination to repair everything that went badly. It cannot do that, and attempting it draws an objection. Deciding whether to re-examine at all, and on what single point, is a real judgment call.',
    commonMisconception:
      'Treating re-examination as a second examination in chief. It is a narrow, responsive exercise.',
    memoryTrick:
      'Re-examination answers cross-examination. Nothing else.',
    concepts: ['re-examination'],
    skills: ['oral-communication', 'strategic-reasoning'],
    sourceReference: 'Evidence Act 1995 (Cth) s 39',
  },
  {
    slug: 'ad-paramount-duty',
    domain: 'advocacy',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    stem: 'Where a solicitor’s duty to the court conflicts with their duty to the client, which prevails?',
    options: [
      { id: 'a', text: 'The duty to the client, because of the retainer' },
      { id: 'b', text: 'The duty to the court, which is paramount' },
      { id: 'c', text: 'Whichever the client instructs' },
      { id: 'd', text: 'Neither; the solicitor must cease to act immediately' },
    ],
    correct: ['b'],
    explanation:
      'The duty to the court and to the administration of justice is paramount and prevails to the extent of any inconsistency with any other duty, including the duty to the client. It is the first substantive rule in the Australian Solicitors’ Conduct Rules, and it is what distinguishes a lawyer from an agent. Ceasing to act may sometimes be the appropriate course, but it is a consequence of applying the rule, not the rule itself.',
    whyItMatters:
      'This is the rule that decides what you do when a client asks you to mislead the court, or when you discover a document that hurts your case. Getting it wrong ends careers.',
    commonMisconception:
      'Framing it as a balance between competing duties. It is not a balance; the duty to the court wins.',
    memoryTrick:
      'Paramount means exactly that. Nothing sits above it.',
    concepts: ['duty-to-court'],
    skills: ['professional-judgment'],
    sourceReference: 'Australian Solicitors’ Conduct Rules r 3; Giannarelli v Wraith (1988) 165 CLR 543',
    sourceUrl: 'https://www.lawcouncil.au/policy-agenda/regulation-of-the-profession-and-ethics/australian-solicitors-conduct-rules',
  },
  {
    slug: 'ad-adverse-authority',
    domain: 'advocacy',
    type: 'scenario',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'The night before a hearing you find a recent Court of Appeal decision, binding on the court you are appearing in, that is squarely against the argument you intend to run. Your opponent has not cited it and appears unaware of it.',
    stem: 'What must you do?',
    options: [
      { id: 'a', text: 'Say nothing; it is the opponent’s job to find their own authorities' },
      { id: 'b', text: 'Inform the court of the authority, and then make whatever submissions are properly open about its application' },
      { id: 'c', text: 'Abandon the argument and consent to judgment' },
      { id: 'd', text: 'Disclose it to your opponent but not to the court' },
    ],
    correct: ['b'],
    explanation:
      'An advocate must inform the court of any binding authority, and of relevant legislation, that they are aware of and that is against their client’s case, even where the opponent has not raised it. Disclosure is not surrender: you may still submit that the authority is distinguishable, that it does not govern the facts, or that it should be understood in a particular way. Withholding it is a breach of the paramount duty to the court.',
    whyItMatters:
      'It comes up more often than juniors expect, usually late at night with a hearing the next morning. The instinct to stay quiet is exactly the instinct the rule exists to override, and the professional consequences of a court discovering the omission are severe.',
    commonMisconception:
      'Believing the adversarial system means each side finds its own authorities. That is true of the facts; it is not true of binding law against you.',
    memoryTrick:
      'Disclose the authority. Then argue about it.',
    concepts: ['candour-and-disclosure', 'duty-to-court'],
    skills: ['professional-judgment', 'argument-construction'],
    sourceReference: 'Australian Solicitors’ Conduct Rules r 19.6',
  },
  {
    slug: 'ad-no-personal-opinion',
    domain: 'advocacy',
    type: 'true_false',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    stem: 'True or false: an advocate should tell the court that they personally believe their client’s evidence.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['false'],
    explanation:
      'False. An advocate must not express a personal opinion on the merits of the case or on the credibility of a witness. Your belief is not evidence, and offering it confuses the advocate’s role with the witness’s. The correct form is to submit what the court should find and why the evidence supports it: "the court would accept this evidence because…", not "I believe my client".',
    whyItMatters:
      'It is a habit that reads instantly as inexperience, and it can put your own credibility in issue. Argument drawn from evidence is persuasive; personal endorsement is not.',
    commonMisconception:
      'Thinking that showing conviction helps. Conviction is conveyed through the strength of the argument, not through assertions of personal belief.',
    memoryTrick:
      '"I submit", never "I believe".',
    concepts: ['candour-and-disclosure', 'oral-submissions'],
    skills: ['oral-communication', 'professional-judgment'],
    sourceReference: 'Australian Solicitors’ Conduct Rules r 17',
  },
  {
    slug: 'ad-objection-ground',
    domain: 'advocacy',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    stem: 'Your opponent asks a witness a question you consider objectionable. What is the correct approach?',
    options: [
      { id: 'a', text: 'Interrupt the witness mid-answer and explain at length why the question is unfair' },
      { id: 'b', text: 'Rise, say "I object", and state the ground shortly, waiting for the court before developing the point' },
      { id: 'c', text: 'Note the objection quietly and raise it in closing submissions' },
      { id: 'd', text: 'Ask the witness not to answer' },
    ],
    correct: ['b'],
    explanation:
      'An objection should be taken before the answer is given, briefly, and on a stated ground: leading, hearsay, opinion, relevance, form of the question. The advocate rises, identifies the ground in a sentence, and stops. If the court wants argument it will ask for it. Objections are directed to the court, never to the witness, and an objection saved for closing is generally too late to keep the evidence out.',
    whyItMatters:
      'Timing is everything: once the answer is out, the damage is done. Equally, an advocate who objects at length and often loses the court’s patience and their own credibility.',
    commonMisconception:
      'Arguing the objection before the judge has invited argument. State the ground, then wait.',
    memoryTrick:
      'Stand, name the ground, sit down. Argue only if invited.',
    concepts: ['objections'],
    skills: ['oral-communication', 'evidence-analysis'],
  },
  {
    slug: 'ad-opening-purpose',
    domain: 'advocacy',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    stem: 'What is the primary purpose of an opening address in a civil trial?',
    options: [
      { id: 'a', text: 'To give evidence of the facts on the client’s behalf' },
      { id: 'b', text: 'To outline the issues, the case to be presented and the evidence the court will hear, so the court can follow what comes next' },
      { id: 'c', text: 'To argue the case in full before any evidence is called' },
      { id: 'd', text: 'To attack the credibility of the other side’s witnesses' },
    ],
    correct: ['b'],
    explanation:
      'An opening is a map, not the journey. It identifies the issues the court has to decide, outlines the evidence that will be called and explains how that evidence bears on those issues. It is not evidence, it is not the place for full argument, and it is certainly not the place to attack witnesses who have not yet given evidence.',
    whyItMatters:
      'A judge who understands the shape of the case from the outset follows the evidence far better. A confused opening means a trial spent trying to recover the court’s understanding.',
    commonMisconception:
      'Using the opening to make closing submissions. Save the argument for when there is evidence to argue from.',
    memoryTrick:
      'Opening gives the court the map. Closing tells them where you have arrived.',
    concepts: ['oral-submissions'],
    skills: ['oral-communication', 'argument-construction'],
  },
  {
    slug: 'ad-answering-judicial-question',
    domain: 'advocacy',
    type: 'scenario',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'You are two minutes into your oral submissions when the judge interrupts with a question about a point you had planned to reach later.',
    stem: 'What is the best response?',
    options: [
      { id: 'a', text: 'Ask the judge to hold the question until you reach that part of your outline' },
      { id: 'b', text: 'Answer the question directly and immediately, then return to your structure' },
      { id: 'c', text: 'Answer at length, abandoning your outline entirely' },
      { id: 'd', text: 'Refer the judge to your written submissions and continue' },
    ],
    correct: ['b'],
    explanation:
      'A question from the bench tells you what the court is actually worried about, which is more important than your outline. Answer it directly, ideally beginning with "yes" or "no", then give the reason, then return to your structure. Deferring the question, or referring the court to written submissions instead of answering, both read as evasion.',
    whyItMatters:
      'Judicial questions are the single best signal you will get about what will decide the case. An advocate who welcomes them and answers cleanly is far more persuasive than one who protects a script.',
    commonMisconception:
      'Treating an interruption as a derailment. It is the court telling you where to spend your time.',
    memoryTrick:
      'The bench sets the agenda. Answer first, structure second.',
    concepts: ['oral-submissions'],
    skills: ['oral-communication', 'strategic-reasoning'],
  },
  {
    slug: 'ad-concession',
    domain: 'advocacy',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    stem: 'During submissions the court puts to you a point that is plainly correct and adverse to part of your argument. What should you do?',
    options: [
      { id: 'a', text: 'Dispute it, since conceding weakens the client’s case' },
      { id: 'b', text: 'Concede the point clearly, and explain why your client should still succeed on the remaining issues' },
      { id: 'c', text: 'Avoid answering and move to a stronger topic' },
      { id: 'd', text: 'Seek an adjournment to consider the point' },
    ],
    correct: ['b'],
    explanation:
      'A well-made concession costs a point and buys credibility on everything else. An advocate who fights an obviously bad position invites the court to doubt their judgment across the whole of the argument. Concede what must be conceded, plainly and early, then direct the court to the issues on which the case actually turns.',
    whyItMatters:
      'Credibility is an advocate’s working capital. Judges give weight to counsel who they know will tell them when a point is against them.',
    commonMisconception:
      'Equating advocacy with never giving ground. Selective concession is a technique, not a weakness.',
    memoryTrick:
      'Give the point. Keep the case.',
    concepts: ['oral-submissions', 'duty-to-court'],
    skills: ['oral-communication', 'professional-judgment', 'strategic-reasoning'],
  },
  {
    slug: 'ad-taking-instructions',
    domain: 'advocacy',
    type: 'scenario',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    scenario:
      'Mid-hearing, the judge asks whether your client would agree to a timetable that differs from the one in your instructions. Your instructing solicitor is present with the client.',
    stem: 'What is the appropriate course?',
    options: [
      { id: 'a', text: 'Agree on the client’s behalf; timetabling is a procedural matter' },
      { id: 'b', text: 'Ask the court for a short adjournment, or a moment, to take instructions' },
      { id: 'c', text: 'Decline the proposal, since it departs from your instructions' },
      { id: 'd', text: 'Tell the court you have no instructions and cannot assist' },
    ],
    correct: ['b'],
    explanation:
      'Where a proposal falls outside your instructions, the correct step is to ask for a short adjournment or a moment to take instructions. Courts grant these routinely and think nothing of it. Agreeing without authority exposes the client and you; refusing outright when the client might well have agreed is equally a failure to serve their interests.',
    whyItMatters:
      'Juniors are often reluctant to ask, fearing it looks unprepared. It does not; it looks careful. Committing a client to something you were never authorised to agree is the outcome that causes real problems.',
    commonMisconception:
      'Assuming procedural matters do not require instructions. Timetables carry cost and risk consequences for the client.',
    memoryTrick:
      'When in doubt, ask for a moment. It is always granted, and it is never held against you.',
    concepts: ['oral-submissions', 'duty-to-court'],
    skills: ['professional-judgment', 'oral-communication'],
  },
  {
    slug: 'ad-cross-purpose',
    domain: 'advocacy',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    stem: 'Which best describes the two principal purposes of cross-examination?',
    options: [
      { id: 'a', text: 'To discredit the witness personally, and to prolong the hearing' },
      { id: 'b', text: 'To obtain evidence helpful to your case, and to test or undermine evidence that is adverse to it' },
      { id: 'c', text: 'To allow the witness to explain their evidence more fully' },
      { id: 'd', text: 'To place your client’s version before the court through submissions' },
    ],
    correct: ['b'],
    explanation:
      'Cross-examination does two things: it extracts concessions that help your case, and it tests evidence that hurts it, by exposing inconsistency, improbability, faulty recollection or lack of a proper basis. Allowing a witness to explain themselves more fully is generally the opposite of what you want, and cross-examination is not the vehicle for your own client’s account.',
    whyItMatters:
      'Cross-examination without a defined purpose for each topic is where hearings are lost. Before every line of questioning, you should be able to say what finding it is aimed at.',
    commonMisconception:
      'Treating cross-examination as an opportunity to attack the witness as a person. Attacks without a forensic purpose alienate the court.',
    memoryTrick:
      'Get what you need, and test what hurts. Nothing else.',
    concepts: ['cross-examination'],
    skills: ['strategic-reasoning', 'oral-communication', 'evidence-analysis'],
  },
  {
    slug: 'ad-witness-preparation-limit',
    domain: 'advocacy',
    type: 'true_false',
    difficulty: 4,
    jurisdiction: 'AU_GENERAL',
    stem: 'True or false: a solicitor may properly suggest to a witness what their evidence should be.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['false'],
    explanation:
      'False. A lawyer must not coach a witness by advising them what evidence they should give, or by suggesting the content of their answers. What is permitted is quite different and quite broad: explaining the process, taking the witness through the documents, testing their recollection against the material, and explaining the difference between what they actually recall and what they have inferred. The line is between preparing a witness to give their evidence and telling them what their evidence is.',
    whyItMatters:
      'Witness preparation is delegated to juniors constantly. Crossing this line is professional misconduct and can destroy the client’s case if it emerges in cross-examination, as it usually does.',
    commonMisconception:
      'Believing that any preparation is improper. Proper preparation is not only permitted but expected; suggesting content is not.',
    memoryTrick:
      'Prepare the witness. Never supply the evidence.',
    concepts: ['candour-and-disclosure', 'examination-in-chief'],
    skills: ['professional-judgment'],
    sourceReference: 'Australian Solicitors’ Conduct Rules r 24',
  },
];
