import { TRUE_FALSE_OPTIONS, type SeedQuestion } from '../types';

/**
 * The absolute basics of the court system, Malaysia.
 *
 * For someone who has never been in a court and has not done the subject.
 * Everything else in the Malaysian bank assumes you already know what an appeal
 * is and what it means for a decision to bind; these assume nothing.
 *
 * Most of this is the same everywhere, because the ideas are inherited from the
 * same tradition. Where that is true the question says the same thing as its
 * Australian counterpart rather than inventing a difference. Where Malaysia
 * genuinely differs, and it does in two places worth knowing early, the
 * question is about the difference: two High Courts of equal standing, and a
 * separate Syariah jurisdiction that is not a lower rung.
 *
 * NOT VERIFIED.
 */
export const BASICS_MY_QUESTIONS: SeedQuestion[] = [
  {
    slug: 'my-bas-what-is-a-hierarchy',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'MY_GENERAL',
    stem: 'Why are courts arranged with some above others?',
    options: [
      { id: 'a', text: 'So a decision can be reviewed by a higher court, and so the law stays consistent' },
      { id: 'b', text: 'Because higher courts are in bigger buildings' },
      { id: 'c', text: 'To divide the work by state' },
      { id: 'd', text: 'So judges are promoted in order' },
    ],
    correct: ['a'],
    explanation:
      'A hierarchy does two things. It lets a party who says a decision was wrong have it reviewed by a court above, which is what an appeal is. And it keeps the law consistent, because courts below must follow what courts above have decided. Without that the same question could be answered differently in two courtrooms on the same street.',
    whyItMatters:
      'Nearly everything about procedure follows from it: where you start, where an appeal goes, and which decisions you can rely on.',
    memoryTrick: 'Higher courts correct, and higher courts set the rule.',
    concepts: ['court-hierarchy', 'my-court-structure'],
    skills: ['procedural-sequencing'],
  },
  {
    slug: 'my-bas-what-is-an-appeal',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'MY_GENERAL',
    stem: 'What is an appeal?',
    options: [
      { id: 'a', text: 'A fresh trial before a new judge' },
      { id: 'b', text: 'An application to a higher court to review a decision said to be wrong' },
      { id: 'c', text: 'A request to the same judge to reconsider' },
      { id: 'd', text: 'A complaint about a judge’s conduct' },
    ],
    correct: ['b'],
    explanation:
      'An appeal asks a higher court to review a decision because something went wrong, usually an error of law. It is not a second attempt at the case. The appellate court works from the record of what happened below rather than hearing the witnesses again, which is why "the judge did not believe my client" is rarely enough on its own.',
    whyItMatters:
      'Clients almost always assume an appeal means running the case again. Correcting that early is one of the more useful things a junior does.',
    commonMisconception:
      'That you appeal because you lost. You appeal because something went wrong, and losing is not by itself something going wrong.',
    concepts: ['appellate-structure', 'my-court-structure'],
    skills: ['procedural-sequencing', 'professional-judgment'],
  },
  {
    slug: 'my-bas-binding',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'MY_GENERAL',
    stem: 'What does it mean to say a decision is binding on a court?',
    options: [
      { id: 'a', text: 'The court must follow it, even if it thinks it is wrong' },
      { id: 'b', text: 'The court should consider it carefully' },
      { id: 'c', text: 'The court must mention it in its grounds' },
      { id: 'd', text: 'The parties have agreed to it' },
    ],
    correct: ['a'],
    explanation:
      'Binding means obliged to follow, not persuaded by. A judge who thinks a decision of a court above them is wrong must still apply it; disagreeing is what an appeal is for. Decisions that are not binding may still be persuasive, meaning the court may follow them if it finds the reasoning convincing, and that is a genuinely different thing.',
    whyItMatters:
      'It decides which authorities settle an argument and which merely support it, which is the difference between a submission that wins and one that sounds good.',
    memoryTrick: 'Binding means must. Persuasive means may.',
    concepts: ['stare-decisis', 'court-hierarchy'],
    skills: ['argument-construction'],
  },
  {
    slug: 'my-bas-two-high-courts-basic',
    domain: 'court-system',
    type: 'true_false',
    difficulty: 1,
    jurisdiction: 'MY_GENERAL',
    stem: 'True or false: the High Court in Malaya is senior to the High Court in Sabah and Sarawak.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['false'],
    explanation:
      'False. Malaysia has two High Courts of equal standing, and neither is above the other. What separates them is territory, not seniority: the High Court in Malaya covers Peninsular Malaysia and the High Court in Sabah and Sarawak covers those states. So a decision of one is persuasive on the other rather than binding.',
    whyItMatters:
      'It is one of the first things that surprises someone arriving from a country with a single national High Court, and it decides where a proceeding is properly started.',
    memoryTrick: 'Side by side, not stacked.',
    concepts: ['my-court-structure', 'court-hierarchy'],
    skills: ['procedural-sequencing', 'attention-to-detail'],
    sourceReference: 'Federal Constitution art 121(1)',
  },
  {
    slug: 'my-bas-syariah-basic',
    domain: 'court-system',
    type: 'true_false',
    difficulty: 1,
    jurisdiction: 'MY_GENERAL',
    stem: 'True or false: the Syariah courts sit below the civil High Courts in the same hierarchy.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['false'],
    explanation:
      'False. The Syariah courts are State courts with jurisdiction over Muslims in the matters listed in the State List, and they sit outside the civil hierarchy rather than beneath it. Article 121(1A) of the Federal Constitution provides that the civil High Courts have no jurisdiction in matters within the Syariah courts’ jurisdiction. It is a division of subject matter, not a ranking.',
    whyItMatters:
      'Civil courts generally do not determine the merits of matters validly within Syariah Court jurisdiction; however, constitutional and jurisdictional questions may still fall within the civil courts’ supervisory role. Pressing the merits in the wrong forum loses time on an argument you cannot win.',
    memoryTrick: 'A different ladder, not a lower rung.',
    concepts: ['syariah-courts', 'my-court-structure'],
    skills: ['procedural-sequencing', 'professional-judgment'],
    sourceReference: 'Federal Constitution art 121(1A)',
  },
  {
    slug: 'my-bas-jurisdiction',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'MY_GENERAL',
    stem: 'What does it mean to say a court has jurisdiction?',
    options: [
      { id: 'a', text: 'That the court has the legal power to decide that kind of case' },
      { id: 'b', text: 'That the court is nearby' },
      { id: 'c', text: 'That the court has room in its list' },
      { id: 'd', text: 'That both parties want to be there' },
    ],
    correct: ['a'],
    explanation:
      'Jurisdiction is legal power, not convenience. A court without jurisdiction cannot decide a matter however sensible it would be for it to do so, and however much both sides would like it to. The power comes from statute or the Constitution, and it can be limited by subject matter, by the amount in dispute, or by territory.',
    whyItMatters:
      'It is the first thing to check on a new matter. A proceeding started in a court with no power to hear it has to be started again, and the limitation clock does not pause while that is sorted out.',
    memoryTrick: 'Jurisdiction is can this court, not should this court.',
    concepts: ['my-court-structure', 'my-monetary-jurisdiction'],
    skills: ['procedural-sequencing'],
  },
  {
    slug: 'my-bas-first-instance',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'MY_GENERAL',
    stem: 'A case is heard "at first instance". What does that mean?',
    options: [
      { id: 'a', text: 'It is being heard for the first time, rather than on appeal' },
      { id: 'b', text: 'It is the first case of its kind' },
      { id: 'c', text: 'It is urgent' },
      { id: 'd', text: 'It is the first matter listed that day' },
    ],
    correct: ['a'],
    explanation:
      'First instance means the original hearing, where evidence is heard and the matter is decided for the first time. The High Court sits both ways: it hears matters at first instance, and it hears appeals from the subordinate courts. So knowing a case was "in the High Court" does not tell you which it was.',
    whyItMatters:
      'When you read a judgment, whether it was at first instance or on appeal changes how much weight it carries and what the court was actually deciding.',
    concepts: ['court-terminology', 'appellate-structure'],
    skills: ['attention-to-detail'],
  },
  {
    slug: 'my-bas-parties',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'MY_GENERAL',
    stem: 'In a civil action commenced by writ, what are the two main parties usually called?',
    options: [
      { id: 'a', text: 'The plaintiff and the defendant' },
      { id: 'b', text: 'The prosecutor and the accused' },
      { id: 'c', text: 'The appellant and the respondent' },
      { id: 'd', text: 'The applicant and the objector' },
    ],
    correct: ['a'],
    explanation:
      'In an action begun by writ the party starting it is the plaintiff and the party defending is the defendant. Proceedings begun by originating summons use applicant and respondent, and on appeal the parties become appellant and respondent. Prosecutor and accused belong to criminal proceedings.',
    whyItMatters:
      'Using the wrong label in cause papers signals immediately that the drafter is unfamiliar with the court, before anyone reads the substance.',
    concepts: ['court-terminology', 'originating-process'],
    skills: ['written-communication', 'attention-to-detail'],
  },
];
