import { TRUE_FALSE_OPTIONS, type SeedQuestion } from '../types';

/**
 * The absolute basics of the court system, Australia.
 *
 * Written for someone who has never been in a court and has not done the
 * subject: a first year student, a paralegal without a law degree, a graduate
 * from another jurisdiction. Everything else in the bank assumes you already
 * know what an appeal is and what it means for a decision to bind. These are
 * the questions that assume nothing.
 *
 * The hard part of writing at this level is resisting precision that costs
 * clarity. Every one of these has an exception and none of them mentions it,
 * because a beginner who learns the rule can be taught the exception, and a
 * beginner taught both at once learns neither.
 *
 * NOT VERIFIED.
 */
export const BASICS_QUESTIONS: SeedQuestion[] = [
  {
    slug: 'bas-what-is-a-hierarchy',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    stem: 'Why are courts arranged with some above others?',
    options: [
      { id: 'a', text: 'So that a decision can be reviewed by a higher court, and so the law stays consistent' },
      { id: 'b', text: 'Because higher courts are in bigger buildings' },
      { id: 'c', text: 'To divide the work by geography' },
      { id: 'd', text: 'So that judges are promoted in order' },
    ],
    correct: ['a'],
    explanation:
      'A hierarchy does two things. It allows a party who says a decision was wrong to have it looked at by a court above, which is what an appeal is. And it keeps the law consistent, because the courts below have to follow what the courts above have decided. Without that, the same question could be answered differently in two courtrooms on the same street.',
    whyItMatters:
      'Almost everything about procedure follows from this: which court you start in, where an appeal goes, and which decisions you can rely on.',
    memoryTrick: 'Higher courts correct, and higher courts set the rule.',
    concepts: ['court-hierarchy'],
    skills: ['procedural-sequencing'],
  },
  {
    slug: 'bas-what-is-an-appeal',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    stem: 'What is an appeal?',
    options: [
      { id: 'a', text: 'A fresh trial in front of a new judge' },
      { id: 'b', text: 'An application to a higher court to review a decision said to be wrong' },
      { id: 'c', text: 'A request for the same judge to reconsider' },
      { id: 'd', text: 'A complaint about how a judge behaved' },
    ],
    correct: ['b'],
    explanation:
      'An appeal asks a higher court to review a decision on the basis that something went wrong: usually an error of law, sometimes a finding no reasonable judge could have made. It is not a second go. The appeal court is generally working from the record of what happened below rather than hearing the witnesses again, which is why "the judge did not believe my client" is rarely enough on its own.',
    whyItMatters:
      'Clients almost always assume an appeal means running the case again. Explaining early that it does not is one of the more useful things a junior can do.',
    commonMisconception:
      'That you appeal because you lost. You appeal because something went wrong, and losing is not by itself something going wrong.',
    concepts: ['appellate-structure', 'court-hierarchy'],
    skills: ['procedural-sequencing', 'professional-judgment'],
  },
  {
    slug: 'bas-what-binding-means',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    stem: 'What does it mean to say a decision is binding on a court?',
    options: [
      { id: 'a', text: 'The court must follow it, even if it thinks it is wrong' },
      { id: 'b', text: 'The court should consider it carefully' },
      { id: 'c', text: 'The court must mention it in its reasons' },
      { id: 'd', text: 'The parties have agreed to it' },
    ],
    correct: ['a'],
    explanation:
      'Binding means obliged to follow, not persuaded by. A judge who thinks a decision of a court above them is wrong must still apply it; disagreeing is what appeals are for. Decisions that are not binding may still be persuasive, meaning the court can follow them if it finds the reasoning convincing, and that is a genuinely different thing.',
    whyItMatters:
      'It decides which authorities actually settle an argument and which merely support it, and that is the difference between a submission that wins and one that sounds good.',
    memoryTrick: 'Binding means must. Persuasive means may.',
    concepts: ['stare-decisis', 'court-hierarchy'],
    skills: ['argument-construction'],
  },
  {
    slug: 'bas-trial-vs-appeal-court',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    stem: 'What is the main difference between a trial court and an appeal court?',
    options: [
      { id: 'a', text: 'A trial court hears the evidence and finds the facts; an appeal court reviews the decision for error' },
      { id: 'b', text: 'A trial court is for civil cases and an appeal court for criminal cases' },
      { id: 'c', text: 'A trial court has one judge and an appeal court has a jury' },
      { id: 'd', text: 'There is no real difference' },
    ],
    correct: ['a'],
    explanation:
      'The trial court is where witnesses give evidence, documents are tendered and the facts are found. The appeal court usually has none of that in front of it: it has the transcript, the judgment and the arguments. That is why appeal courts are reluctant to disturb findings about which witness was telling the truth, and much readier to correct a mistake about what the law required.',
    whyItMatters:
      'It shapes what is worth arguing where. An argument about the law belongs on appeal. An argument about who to believe belongs at trial, and is very hard to revive later.',
    concepts: ['court-hierarchy', 'appellate-structure'],
    skills: ['strategic-reasoning', 'procedural-sequencing'],
  },
  {
    slug: 'bas-what-is-jurisdiction',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    stem: 'What does it mean to say a court has jurisdiction?',
    options: [
      { id: 'a', text: 'That the court has the legal power to decide that kind of case' },
      { id: 'b', text: 'That the court is nearby' },
      { id: 'c', text: 'That the court has time in its list' },
      { id: 'd', text: 'That both parties want to be there' },
    ],
    correct: ['a'],
    explanation:
      'Jurisdiction is legal power, not convenience or availability. A court without jurisdiction over a matter cannot decide it, however sensible it would be for that court to hear it, and however much both sides would like it to. Power usually comes from a statute, and it can be limited by subject matter, by the amount in dispute, or by geography.',
    whyItMatters:
      'It is the first thing to check on any new matter. A proceeding started in a court that has no power to hear it has to be started again, and the limitation clock does not stop while you sort it out.',
    memoryTrick: 'Jurisdiction is can this court, not should this court.',
    concepts: ['court-hierarchy', 'monetary-jurisdiction'],
    skills: ['procedural-sequencing'],
  },
  {
    slug: 'bas-first-instance',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    stem: 'A case is heard "at first instance". What does that mean?',
    options: [
      { id: 'a', text: 'It is being heard for the first time, rather than on appeal' },
      { id: 'b', text: 'It is the first case of its kind' },
      { id: 'c', text: 'It is urgent' },
      { id: 'd', text: 'It is the first hearing of the day' },
    ],
    correct: ['a'],
    explanation:
      'First instance means the original hearing, where the evidence is heard and the case is decided for the first time. The same court can sit both ways: a Supreme Court judge may hear a matter at first instance, and the Court of Appeal within that same Supreme Court hears appeals from it. So knowing a case was "in the Supreme Court" does not tell you which it was.',
    whyItMatters:
      'When you read a case, whether it was at first instance or on appeal changes how much weight it carries and what the court was actually deciding.',
    concepts: ['court-terminology', 'appellate-structure'],
    skills: ['attention-to-detail'],
  },
  {
    slug: 'bas-who-decides-facts',
    domain: 'court-system',
    type: 'true_false',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    stem: 'True or false: in a civil trial without a jury, the judge decides both what happened and what the law requires.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['true'],
    explanation:
      'True. Most Australian civil trials are heard by a judge alone, and that judge does two separate jobs: finding the facts, which means deciding what happened and who to believe, and applying the law to those facts. Where there is a jury the roles split, with the jury finding the facts and the judge directing them on the law.',
    whyItMatters:
      'It explains why so much preparation goes into evidence rather than argument. Persuading the judge what happened usually matters more than persuading them what the rule is.',
    concepts: ['court-terminology', 'court-hierarchy'],
    skills: ['strategic-reasoning'],
  },
  {
    slug: 'bas-parties-names',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    stem: 'In a civil case, what are the two main parties usually called?',
    options: [
      { id: 'a', text: 'The plaintiff and the defendant' },
      { id: 'b', text: 'The prosecutor and the accused' },
      { id: 'c', text: 'The applicant and the respondent, always' },
      { id: 'd', text: 'The claimant and the appellant' },
    ],
    correct: ['a'],
    explanation:
      'In a civil proceeding the party who starts it is usually the plaintiff and the party defending is the defendant. Some courts and some kinds of proceeding use applicant and respondent instead, and on appeal they become appellant and respondent. Prosecutor and accused belong to criminal proceedings, which is a different jurisdiction entirely.',
    whyItMatters:
      'Using the wrong label in a document signals immediately that the drafter is not familiar with the court, before anyone has read the substance.',
    concepts: ['court-terminology'],
    skills: ['written-communication', 'attention-to-detail'],
  },
];
