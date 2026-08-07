import { TRUE_FALSE_OPTIONS, type SeedQuestion } from '../types';

export const COURT_SYSTEM_QUESTIONS: SeedQuestion[] = [
  {
    slug: 'cs-final-court-of-appeal',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    stem: 'Which court is the final court of appeal for all Australian courts, both federal and State?',
    options: [
      { id: 'a', text: 'The Federal Court of Australia' },
      { id: 'b', text: 'The High Court of Australia' },
      { id: 'c', text: 'The Supreme Court of each State' },
      { id: 'd', text: 'The Judicial Committee of the Privy Council' },
    ],
    correct: ['b'],
    explanation:
      'The High Court of Australia sits at the apex of a single, unified Australian judicial hierarchy. It hears appeals from the Federal Court, from the Supreme Courts of the States and Territories, and from any other court exercising federal jurisdiction. Appeals from Australian courts to the Privy Council were progressively removed and were finally ended by the Australia Acts in 1986.',
    whyItMatters:
      'It tells you where an argument ultimately has to be able to survive. If the High Court has spoken on a point, no Australian court below it can decide otherwise, which is why the first question on any research task is whether the High Court has dealt with it.',
    commonMisconception:
      'The Federal Court is sometimes assumed to sit above the State Supreme Courts. It does not. They are parallel hierarchies that meet only at the High Court.',
    memoryTrick:
      'One country, one common law, one court at the top. Everything else runs in parallel until it reaches Canberra.',
    concepts: ['court-hierarchy', 'appellate-structure'],
    skills: ['procedural-sequencing', 'argument-construction'],
    sourceReference: 'Constitution s 73; Australia Act 1986 (Cth) s 11',
    sourceUrl: 'https://www.hcourt.gov.au/about/role-of-the-high-court',
  },
  {
    slug: 'cs-special-leave',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    court: 'High Court of Australia',
    stem: 'A client wants to appeal an intermediate appellate court decision to the High Court of Australia. What must generally be obtained first?',
    options: [
      { id: 'a', text: 'A certificate from the trial judge' },
      { id: 'b', text: 'Consent from the other party' },
      { id: 'c', text: 'A grant of special leave to appeal' },
      { id: 'd', text: 'Nothing; an appeal lies as of right' },
    ],
    correct: ['c'],
    explanation:
      'An appeal to the High Court is not available as of right. The applicant must first persuade the Court to grant special leave. Special leave is discretionary and is generally reserved for matters of public importance, questions on which appellate courts differ, or where the interests of the administration of justice require the Court to intervene. Most applications are refused.',
    whyItMatters:
      'It is the difference between advising a client that they have "an appeal" and advising them they have a discretionary application with a low success rate, significant cost, and a real prospect of ending at the special leave stage. Getting that advice wrong is a negligence risk.',
    commonMisconception:
      'That an appeal to the High Court is simply the next rung on the ladder. It is a filtered jurisdiction, not an automatic one.',
    memoryTrick:
      'Special leave is a door, not a corridor. You have to be let through.',
    concepts: ['appellate-structure', 'court-hierarchy'],
    skills: ['procedural-sequencing', 'commercial-reasoning'],
    sourceReference: 'Judiciary Act 1903 (Cth) s 35A',
    sourceUrl: 'https://www.hcourt.gov.au/cases/special-leave-applications',
  },
  {
    slug: 'cs-vic-intermediate-court',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'VIC',
    stem: 'Which court is the intermediate court in the Victorian hierarchy, sitting between the Magistrates’ Court and the Supreme Court?',
    options: [
      { id: 'a', text: 'The District Court of Victoria' },
      { id: 'b', text: 'The County Court of Victoria' },
      { id: 'c', text: 'The Victorian Civil and Administrative Tribunal' },
      { id: 'd', text: 'The Federal Circuit and Family Court of Australia' },
    ],
    correct: ['b'],
    explanation:
      'Victoria’s intermediate court is the County Court of Victoria. Most other States call the equivalent court the District Court: New South Wales, Queensland, South Australia and Western Australia all use that name. Victoria is the exception.',
    whyItMatters:
      'Naming the wrong court in correspondence or on a draft originating process is the kind of error that reads as inexperience immediately. It also matters practically: the County Court has its own rules, practice notes and listing procedures.',
    commonMisconception:
      'Assuming "District Court" is the national term. In Victoria there is no District Court.',
    memoryTrick:
      'Victoria goes its own way: County, not District.',
    concepts: ['court-hierarchy'],
    skills: ['attention-to-detail', 'procedural-sequencing'],
    sourceReference: 'County Court Act 1958 (Vic)',
    sourceUrl: 'https://www.countycourt.vic.gov.au/',
  },
  {
    slug: 'cs-nsw-intermediate-court',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'NSW',
    stem: 'In New South Wales, which court sits between the Local Court and the Supreme Court?',
    options: [
      { id: 'a', text: 'The County Court of New South Wales' },
      { id: 'b', text: 'The Magistrates’ Court of New South Wales' },
      { id: 'c', text: 'The District Court of New South Wales' },
      { id: 'd', text: 'The NSW Civil and Administrative Tribunal' },
    ],
    correct: ['c'],
    explanation:
      'New South Wales has the Local Court at the base, the District Court as its intermediate court, and the Supreme Court above that. Note also that the court of summary jurisdiction in NSW is the Local Court, not a "Magistrates’ Court", although the judicial officers who sit in it are Magistrates.',
    whyItMatters:
      'Practitioners moving between States get this wrong constantly, and it shows. If you are briefing agents interstate or drafting for a NSW proceeding, the court names have to be right.',
    commonMisconception:
      'Calling the NSW Local Court the "Magistrates’ Court". The officers are Magistrates; the court is the Local Court.',
    concepts: ['court-hierarchy', 'court-terminology'],
    skills: ['attention-to-detail'],
    sourceReference: 'District Court Act 1973 (NSW); Local Court Act 2007 (NSW)',
    sourceUrl: 'https://districtcourt.nsw.gov.au/',
  },
  {
    slug: 'cs-act-no-intermediate',
    domain: 'court-system',
    type: 'true_false',
    difficulty: 2,
    jurisdiction: 'ACT',
    stem: 'True or false: the Australian Capital Territory has an intermediate court sitting between its Magistrates Court and its Supreme Court.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['false'],
    explanation:
      'False. The ACT has a two-tier court structure: the Magistrates Court and the Supreme Court. There is no intermediate court. Tasmania and the Northern Territory are also two-tier jurisdictions. Only the larger States maintain a District or County Court in the middle.',
    whyItMatters:
      'It changes where a matter is issued and what the appeal path looks like. In a two-tier jurisdiction, a matter that would sit in the County Court in Victoria goes to the Supreme Court instead.',
    commonMisconception:
      'Assuming every Australian jurisdiction has three tiers. Three of them do not.',
    memoryTrick:
      'Small jurisdictions, small hierarchies: ACT, NT and Tasmania skip the middle.',
    concepts: ['court-hierarchy'],
    skills: ['attention-to-detail', 'procedural-sequencing'],
    sourceReference: 'Supreme Court Act 1933 (ACT); Magistrates Court Act 1930 (ACT)',
    sourceUrl: 'https://www.courts.act.gov.au/',
  },
  {
    slug: 'cs-vic-appeal-from-county',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'VIC',
    stem: 'A civil proceeding is determined at trial in the County Court of Victoria. Where does an appeal from that judgment ordinarily go?',
    options: [
      { id: 'a', text: 'The Trial Division of the Supreme Court of Victoria' },
      { id: 'b', text: 'The Court of Appeal of the Supreme Court of Victoria' },
      { id: 'c', text: 'The Federal Court of Australia' },
      { id: 'd', text: 'Directly to the High Court of Australia' },
    ],
    correct: ['b'],
    explanation:
      'Appeals from a final civil judgment of the County Court go to the Court of Appeal, which is a division of the Supreme Court of Victoria. The Trial Division hears matters at first instance and appeals from the Magistrates’ Court on questions of law; it does not hear appeals from the County Court.',
    whyItMatters:
      'Filing an appeal in the wrong court wastes time you usually do not have; appeal periods are short and unforgiving.',
    commonMisconception:
      'Treating "the Supreme Court" as one undifferentiated destination. Trial Division and Court of Appeal do quite different work.',
    concepts: ['appellate-structure', 'court-hierarchy'],
    skills: ['procedural-sequencing', 'attention-to-detail'],
    sourceReference: 'Supreme Court Act 1986 (Vic) Pt 3',
    sourceUrl: 'https://www.supremecourt.vic.gov.au/law-and-practice/court-of-appeal',
  },
  {
    slug: 'cs-fcfcoa',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'CTH',
    stem: 'In September 2021, the Federal Circuit Court of Australia and the Family Court of Australia were merged. What is the resulting court called?',
    options: [
      { id: 'a', text: 'The Federal Magistrates Court of Australia' },
      { id: 'b', text: 'The Federal Circuit and Family Court of Australia' },
      { id: 'c', text: 'The Family Division of the Federal Court of Australia' },
      { id: 'd', text: 'The Commonwealth Family Court' },
    ],
    correct: ['b'],
    explanation:
      'The Federal Circuit and Family Court of Australia (FCFCOA) commenced on 1 September 2021. It operates in two divisions: Division 1, a continuation of the former Family Court, and Division 2, a continuation of the former Federal Circuit Court. Division 2 retains the broader general federal law jurisdiction, migration, bankruptcy, consumer law and so on, alongside family law.',
    whyItMatters:
      'Older precedents, textbooks and templates still refer to the former courts. Knowing what became what is how you read pre-2021 authorities and correspondence without confusion.',
    commonMisconception:
      'That the merger folded family law into the Federal Court of Australia. It did not; the FCFCOA is a separate court.',
    concepts: ['federal-jurisdiction', 'court-hierarchy'],
    skills: ['attention-to-detail', 'procedural-sequencing'],
    sourceReference: 'Federal Circuit and Family Court of Australia Act 2021 (Cth)',
    sourceUrl: 'https://www.fcfcoa.gov.au/',
  },
  {
    slug: 'cs-mode-of-address-judge',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    stem: 'You are appearing before a judge of a State Supreme Court. How should you address the judge in court?',
    options: [
      { id: 'a', text: 'Your Worship' },
      { id: 'b', text: 'Your Honour' },
      { id: 'c', text: 'My Lord' },
      { id: 'd', text: 'Sir or Madam' },
    ],
    correct: ['b'],
    explanation:
      '"Your Honour" is the correct form of address for judges of Australian courts, and in contemporary practice for magistrates as well. "Your Worship" is a historical form that has been abandoned in Australian courts. "My Lord" belongs to the English tradition and is not used here.',
    whyItMatters:
      'It is the first thing anyone in the courtroom hears from you. Getting it wrong marks you out before you have made a single submission.',
    commonMisconception:
      'That magistrates are still addressed as "Your Worship". Australian practice has moved to "Your Honour" across the board.',
    memoryTrick:
      'Australian courts: everyone on the bench is "Your Honour".',
    concepts: ['courtroom-conduct', 'court-terminology'],
    skills: ['oral-communication', 'professional-judgment'],
    sourceUrl: 'https://www.supremecourt.vic.gov.au/',
  },
  {
    slug: 'cs-tribunal-not-court',
    domain: 'court-system',
    type: 'true_false',
    difficulty: 3,
    jurisdiction: 'VIC',
    court: 'Victorian Civil and Administrative Tribunal',
    stem: 'True or false: the Victorian Civil and Administrative Tribunal (VCAT) is a court of the State of Victoria.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['false'],
    explanation:
      'False. VCAT is a tribunal, not a court. That distinction has real consequences: because a tribunal that is not a "court of a State" cannot be invested with federal jurisdiction, VCAT cannot determine a matter that attracts federal jurisdiction, for example, a dispute between residents of different States. Such a matter has to be dealt with by a court instead.',
    whyItMatters:
      'If your client is in one State and the other party is in another, a tribunal may simply have no power to decide the dispute, however convenient and cheap it looked. The proceeding has to be brought somewhere else.',
    commonMisconception:
      'Treating "tribunal" as just a cheaper word for a small claims court. The constitutional difference is real and it defeats otherwise perfectly good cases.',
    memoryTrick:
      'Tribunals are creatures of statute with limited reach. Federal jurisdiction needs a court.',
    concepts: ['tribunals', 'federal-jurisdiction'],
    skills: ['strategic-reasoning', 'procedural-sequencing'],
    sourceReference:
      'Victorian Civil and Administrative Tribunal Act 1998 (Vic); Burns v Corbett (2018) 265 CLR 304',
    sourceUrl: 'https://www.vcat.vic.gov.au/',
  },
  {
    slug: 'cs-leave-interlocutory-appeal',
    domain: 'court-system',
    type: 'true_false',
    difficulty: 3,
    jurisdiction: 'AU_GENERAL',
    stem: 'True or false: in most Australian jurisdictions, an appeal against an interlocutory decision generally requires leave to appeal.',
    options: TRUE_FALSE_OPTIONS,
    correct: ['true'],
    explanation:
      'True. Appeals from interlocutory orders, orders that do not finally determine the rights of the parties, generally require leave. The rationale is to prevent proceedings being fragmented by appeals against every procedural ruling along the way. Appeals from final judgments more often lie as of right, subject to the particular court’s legislation and rules.',
    whyItMatters:
      'It changes the advice entirely. An adverse interlocutory ruling usually means an application for leave with its own hurdles and costs risk, not an automatic right of appeal.',
    commonMisconception:
      'That any adverse ruling can be appealed. Most cannot be, at least not immediately, and the usual answer is that the point is preserved for any appeal from the final judgment.',
    memoryTrick:
      'Final orders open a door; interlocutory orders make you knock.',
    concepts: ['appellate-structure', 'interlocutory-applications'],
    skills: ['procedural-sequencing', 'strategic-reasoning'],
  },
  {
    slug: 'cs-first-instance',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 1,
    jurisdiction: 'AU_GENERAL',
    stem: 'A judgment is described as having been given "at first instance". What does that mean?',
    options: [
      { id: 'a', text: 'It was the first judgment ever delivered on that legal question' },
      { id: 'b', text: 'It was given by the court that originally heard the matter, rather than on appeal' },
      { id: 'c', text: 'It was delivered immediately after the hearing, without reserving' },
      { id: 'd', text: 'It was given by a single judge rather than a full bench' },
    ],
    correct: ['b'],
    explanation:
      '"At first instance" identifies the original hearing of a matter, as distinct from any appeal. A judge sitting at first instance finds the facts and applies the law to them for the first time. Judgments delivered immediately are given "ex tempore"; judgments delivered later are "reserved". Those are separate concepts.',
    whyItMatters:
      'Reading case law fluently requires knowing which layer of the case you are looking at. The primary judge’s findings of fact, and the appellate court’s treatment of them, do quite different work in an argument.',
    commonMisconception:
      'Confusing "first instance" with "ex tempore". One is about which court; the other is about when reasons were given.',
    concepts: ['court-terminology', 'appellate-structure'],
    skills: ['argument-construction', 'attention-to-detail'],
  },
  {
    slug: 'cs-parties-terminology',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 2,
    jurisdiction: 'AU_GENERAL',
    stem: 'A proceeding is commenced by originating application rather than by statement of claim. What are the parties ordinarily called?',
    options: [
      { id: 'a', text: 'Plaintiff and defendant' },
      { id: 'b', text: 'Applicant and respondent' },
      { id: 'c', text: 'Appellant and respondent' },
      { id: 'd', text: 'Complainant and accused' },
    ],
    correct: ['b'],
    explanation:
      'Where a proceeding begins by originating application or summons, the parties are usually the applicant and the respondent. Where it begins by writ or statement of claim, they are the plaintiff and the defendant. On appeal they become the appellant and respondent. "Complainant" and "accused" belong to criminal proceedings.',
    whyItMatters:
      'Party descriptions appear on every document you draft and every time you announce your appearance. Using the wrong pair signals that you have not understood how the proceeding was commenced.',
    commonMisconception:
      'Using "plaintiff" universally in civil matters. The label follows the form of originating process.',
    memoryTrick:
      'Claim → plaintiff. Application → applicant. Appeal → appellant.',
    concepts: ['court-terminology', 'originating-process'],
    skills: ['attention-to-detail', 'written-communication'],
  },
  {
    slug: 'cs-vic-magistrates-jurisdictional-limit',
    domain: 'court-system',
    type: 'multiple_choice',
    difficulty: 3,
    jurisdiction: 'VIC',
    court: 'Magistrates’ Court of Victoria',
    scenario:
      'Your client has a contractual claim for damages of approximately $240,000 against a Melbourne supplier. Both parties are Victorian.',
    stem: 'Considering only the monetary value of the claim, which Victorian court has jurisdiction to hear it?',
    options: [
      { id: 'a', text: 'The Magistrates’ Court of Victoria only' },
      { id: 'b', text: 'The County Court or the Supreme Court of Victoria' },
      { id: 'c', text: 'The Supreme Court of Victoria only' },
      { id: 'd', text: 'The Federal Court of Australia' },
    ],
    correct: ['b'],
    explanation:
      'The Magistrates’ Court of Victoria has a monetary jurisdictional limit; claims above it must go elsewhere. A claim of around $240,000 exceeds that limit, so it belongs in the County Court, which has unlimited civil jurisdiction in Victoria, or in the Supreme Court. Both are available; which one you choose is a matter of judgment about cost, complexity and listing times rather than power.',
    whyItMatters:
      'Choosing the court is one of the first real decisions in a matter, and it drives cost exposure for the entire proceeding. Issuing a modest claim in the Supreme Court can attract adverse costs consequences even if you win.',
    commonMisconception:
      'Assuming the highest court is always the safest choice. Courts can and do penalise a party in costs for using a court more expensive than the claim warranted.',
    memoryTrick:
      'Match the forum to the figure. Bigger is not better; it is just dearer.',
    concepts: ['monetary-jurisdiction', 'court-hierarchy'],
    skills: ['commercial-reasoning', 'strategic-reasoning'],
    sourceReference: 'Magistrates’ Court Act 1989 (Vic); County Court Act 1958 (Vic)',
    sourceUrl: 'https://www.mcv.vic.gov.au/',
  },
];
