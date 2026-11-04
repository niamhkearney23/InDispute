import type { SeedFact } from './facts';

/**
 * One hundred Malaysian facts for the daily brief (the owner, November 2026:
 * "add in 100 facts for Malaysian law").
 *
 * DRAFTED BY AI AND NOT CHECKED BY ANYBODY. They load as `requires_review`,
 * like every fact, and no learner sees one until a lawyer has read it against
 * its source and signed it off at Admin, Daily brief. Some state a section or
 * an order and rule from memory of the statute rather than from the text in
 * front of the drafter; treat every citation as something to confirm, not a
 * reference already checked. Where the drafter was not sure of a section, the
 * fact names the Act only.
 *
 * Weighted to what the programme teaches first: the courts, the Rules of
 * Court 2012, pleadings and affidavits, evidence and the profession, with
 * some contract and constitutional law. Civil and commercial rather than
 * criminal.
 */
export const MALAYSIAN_FACTS: SeedFact[] = [
  // ---------------------------------------------------------------------------
  // The courts
  // ---------------------------------------------------------------------------
  {
    slug: 'my-fact-federal-court-apex',
    title: 'The Federal Court is the highest court in Malaysia.',
    body: 'Above it there is nothing: since civil appeals to the Privy Council ended in 1985, the Federal Court in Putrajaya has the last word on every civil and criminal appeal, and on the meaning of the Federal Constitution.',
    whyItMatters:
      'When two Malaysian authorities conflict, the first question is always which court decided each. A Federal Court decision binds every court below it.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'court-system',
    sourceReference: 'Federal Constitution, art 121(2)',
  },
  {
    slug: 'my-fact-two-high-courts',
    title: 'Malaysia has two High Courts, not one.',
    body: 'The High Court in Malaya and the High Court in Sabah and Sarawak are of coordinate jurisdiction and status. Each has its own Chief Judge, and neither is an appeal court for the other.',
    whyItMatters:
      'A decision of the High Court in Sabah and Sarawak is persuasive, not binding, in Kuala Lumpur, and the other way round.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'court-system',
    sourceReference: 'Federal Constitution, art 121(1)',
  },
  {
    slug: 'my-fact-court-of-appeal-1994',
    title: 'The Court of Appeal only dates from 1994.',
    body: 'Before 1994, appeals went straight from the High Court to the Supreme Court (now the Federal Court). The constitutional amendments of 1994 created the Court of Appeal as the intermediate appellate court and renamed the Supreme Court the Federal Court.',
    whyItMatters:
      'Older reports cite the "Supreme Court". Its decisions carry the weight of the apex court of their day, not of a Court of Appeal.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'court-system',
    sourceReference: 'Constitution (Amendment) Act 1994',
  },
  {
    slug: 'my-fact-privy-council-end',
    title: 'Civil appeals to the Privy Council in London ended on 1 January 1985.',
    body: 'Appeals in criminal and constitutional matters were abolished first, in 1978. Civil appeals followed from the start of 1985, after which the highest Malaysian court became the final court for everything.',
    whyItMatters:
      'Privy Council decisions on appeal from Malaysia before 1985 are part of Malaysian law and still turn up in submissions.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'court-system',
    sourceReference: 'Courts of Judicature (Amendment) Act 1984',
  },
  {
    slug: 'my-fact-lord-president',
    title: 'The head of the judiciary used to be called the Lord President.',
    body: 'The title of the head of the Malaysian judiciary was Lord President of the Supreme Court until 1994, when it became Chief Justice of the Federal Court, which it remains.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'court-system',
    sourceReference: 'Federal Constitution, art 122',
  },
  {
    slug: 'my-fact-subordinate-courts',
    title: 'Below the High Court sit the Sessions Courts and the Magistrates’ Courts.',
    body: 'Together they are the subordinate courts, set up under the Subordinate Courts Act 1948 rather than the Federal Constitution. Most civil claims of modest value begin and end there.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'court-system',
    sourceReference: 'Subordinate Courts Act 1948',
  },
  {
    slug: 'my-fact-sessions-court-limit',
    title: 'A Sessions Court can hear civil claims up to RM1 million.',
    body: 'Above that figure a claim belongs in the High Court. The limit was raised to RM1 million by amendments that took effect in 2012.',
    whyItMatters:
      'Choosing the right court by the value of the claim is one of the first decisions on a new file, and getting it wrong costs time and money.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'court-system',
    sourceReference: 'Subordinate Courts Act 1948, s 65',
  },
  {
    slug: 'my-fact-sessions-court-unlimited',
    title: 'For some claims a Sessions Court has no money limit at all.',
    body: 'Claims arising from motor vehicle accidents, disputes between landlord and tenant, and distress can be heard in the Sessions Court whatever the amount.',
    whyItMatters:
      'A large road accident claim does not have to go to the High Court because of its size.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'court-system',
    sourceReference: 'Subordinate Courts Act 1948, s 65',
  },
  {
    slug: 'my-fact-magistrates-limit',
    title: 'A First Class Magistrate can hear civil claims up to RM100,000.',
    body: 'Claims of a modest value begin in the Magistrates’ Court. Above RM100,000 they go to the Sessions Court, and above RM1 million to the High Court.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'court-system',
    sourceReference: 'Subordinate Courts Act 1948, s 90',
  },
  {
    slug: 'my-fact-small-claims',
    title: 'In a small claim, lawyers may not appear.',
    body: 'Claims of up to RM5,000 can be brought under the small claims procedure in the Magistrates’ Court, where the parties present their own cases without advocates.',
    whyItMatters:
      'Clients sometimes ask a firm to "handle" a small claim. The firm can advise behind the scenes, but cannot stand up for them.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'court-system',
    sourceReference: 'Rules of Court 2012, O 93',
  },
  {
    slug: 'my-fact-court-of-appeal-leave-threshold',
    title: 'Some appeals to the Court of Appeal need leave first.',
    body: 'Where the amount or value of the subject matter of a civil claim, leaving out interest, is less than RM250,000, there is no appeal to the Court of Appeal without its leave.',
    whyItMatters:
      'Before advising a client that they can appeal, check the value. A smaller claim may need an application for leave, with its own time limit.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'court-system',
    sourceReference: 'Courts of Judicature Act 1964, s 68(1)(a)',
  },
  {
    slug: 'my-fact-federal-court-leave',
    title: 'There is no appeal to the Federal Court in a civil case without leave.',
    body: 'A party who loses in the Court of Appeal must first obtain leave from the Federal Court, usually by showing a question of general principle decided for the first time, or of importance to the public.',
    whyItMatters:
      'Most civil cases end in the Court of Appeal. Telling a client that a further appeal is "automatic" would be wrong.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'court-system',
    sourceReference: 'Courts of Judicature Act 1964, s 96',
  },
  {
    slug: 'my-fact-art-121-1a',
    title: 'The civil courts do not decide matters within the jurisdiction of the Syariah courts.',
    body: 'An amendment to the Federal Constitution in 1988 added clause (1A) to article 121, which says the High Courts and the subordinate courts have no jurisdiction in respect of any matter within the jurisdiction of the Syariah courts.',
    whyItMatters:
      'Where a dispute touches Islamic personal law, the first question may be which court system it belongs to at all.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'court-system',
    sourceReference: 'Federal Constitution, art 121(1A)',
  },
  {
    slug: 'my-fact-special-court',
    title: 'There is a Special Court for cases by or against the Rulers.',
    body: 'Since 1993, proceedings by or against a Ruler in his personal capacity are heard by the Special Court, chaired by the Chief Justice of the Federal Court.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'court-system',
    sourceReference: 'Federal Constitution, art 182',
  },
  {
    slug: 'my-fact-native-courts',
    title: 'Sabah and Sarawak have their own Native Courts.',
    body: 'Native Courts deal with native law and custom in each state, alongside the civil courts and the Syariah courts. There is no equivalent in Peninsular Malaysia.',
    jurisdiction: 'MY_SABAH_SARAWAK',
    domain: 'court-system',
  },
  {
    slug: 'my-fact-national-language',
    title: 'Court proceedings are conducted in the national language.',
    body: 'Malay is the language of the courts. The court may allow English to be used, in whole or in part, in the interests of justice, and in practice many commercial cases run in English.',
    whyItMatters:
      'Filings, translations and the language of the hearing are decisions to make early, not on the morning of trial.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'court-system',
    sourceReference: 'National Language Acts 1963/67, s 8',
  },
  {
    slug: 'my-fact-judicial-commissioner',
    title: 'A Judicial Commissioner sits with the full powers of a High Court judge.',
    body: 'Judicial Commissioners are appointed for a fixed term and may later be appointed judges. While in office, an order of a Judicial Commissioner is an order of the High Court.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'court-system',
    sourceReference: 'Federal Constitution, art 122AB',
  },
  {
    slug: 'my-fact-jac',
    title: 'Judges are recommended by the Judicial Appointments Commission.',
    body: 'Since 2009, the Judicial Appointments Commission selects and recommends candidates for appointment to the superior courts. Appointment itself remains with the Yang di-Pertuan Agong.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'court-system',
    sourceReference: 'Judicial Appointments Commission Act 2009',
  },
  {
    slug: 'my-fact-art-128',
    title: 'Only the Federal Court decides whether a law is invalid for lack of legislative power.',
    body: 'Whether Parliament or a State Legislature had power to make a law is a question for the Federal Court. Another court faced with a constitutional question may refer it to the Federal Court.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'court-system',
    sourceReference: 'Federal Constitution, art 128',
  },
  {
    slug: 'my-fact-constitution-supreme',
    title: 'The Federal Constitution is the supreme law of the Federation.',
    body: 'Any law passed after Merdeka Day that is inconsistent with the Constitution is void to the extent of the inconsistency.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'legal-reasoning',
    sourceReference: 'Federal Constitution, art 4(1)',
  },

  // ---------------------------------------------------------------------------
  // The Rules of Court 2012
  // ---------------------------------------------------------------------------
  {
    slug: 'my-fact-roc-2012',
    title: 'One set of rules governs civil procedure in every civil court below the appellate courts.',
    body: 'The Rules of Court 2012 came into force on 1 August 2012. They replaced both the Rules of the High Court 1980 and the Subordinate Courts Rules 1980, so the High Court, Sessions Courts and Magistrates’ Courts now follow the same rules.',
    whyItMatters:
      'Pre-2012 cases on the old rules are still cited. Check the old rule matches the new one before relying on them.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012',
  },
  {
    slug: 'my-fact-two-originating-processes',
    title: 'A civil action begins in one of two ways: a writ or an originating summons.',
    body: 'A writ suits a claim where the facts are likely to be in dispute and will need a trial. An originating summons suits a question of law or the construction of a document, decided on affidavit evidence.',
    whyItMatters:
      'Choosing the wrong one does not usually end the case, but it costs time while the court converts it.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 5',
  },
  {
    slug: 'my-fact-writ-validity',
    title: 'A writ must be served within six months of being issued.',
    body: 'A writ is valid for service for six months from the date it is issued. If it cannot be served in that time, the plaintiff can apply to extend its validity.',
    whyItMatters:
      'Diary the expiry the day the writ is issued. An unserved writ that lapses can be fatal where the limitation period has also run.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 6 r 7',
  },
  {
    slug: 'my-fact-appearance-14-days',
    title: 'A defendant has 14 days after service to enter appearance.',
    body: 'Entering appearance means filing a memorandum of appearance, which tells the court and the plaintiff that the defendant intends to take part.',
    whyItMatters:
      'Miss it, and the plaintiff may be able to enter judgment in default without a hearing.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 12 r 4',
  },
  {
    slug: 'my-fact-defence-14-days',
    title: 'The defence is due 14 days after the time for entering appearance.',
    body: 'Unless the court extends time or the parties agree, a defendant who has entered appearance must serve the defence within 14 days after the time limited for appearance, or after the statement of claim is served if that is later.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 18 r 2',
  },
  {
    slug: 'my-fact-reply-14-days',
    title: 'A reply is due 14 days after the defence is served.',
    body: 'A plaintiff who wants to answer new matters raised in the defence, or who must defend a counterclaim, serves a reply, and a defence to the counterclaim, within 14 days after service of the defence.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 18 r 3',
  },
  {
    slug: 'my-fact-close-of-pleadings',
    title: 'Pleadings close on their own, 14 days after the last pleading is due.',
    body: 'Pleadings are deemed closed 14 days after service of the reply or defence to counterclaim, or, if there is none, 14 days after the defence is served. No one has to apply for it.',
    whyItMatters:
      'Close of pleadings starts other clocks, so it is worth working out the date as soon as the last pleading arrives.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 18 r 20',
  },
  {
    slug: 'my-fact-material-facts-only',
    title: 'A pleading states facts, not evidence.',
    body: 'Every pleading must contain a statement in summary form of the material facts relied on, and not the evidence by which those facts are to be proved.',
    whyItMatters:
      'A statement of claim that tells the story of every meeting and email is usually a pleading that has not decided what its case is.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'drafting',
    sourceReference: 'Rules of Court 2012, O 18 r 7',
  },
  {
    slug: 'my-fact-specific-pleading',
    title: 'Some defences must be pleaded expressly, or they cannot be run.',
    body: 'A party must specifically plead any matter, such as performance, release, limitation, fraud or any fact showing illegality, that would take the other side by surprise if not raised in the pleading.',
    whyItMatters:
      'A good point that is not in the defence may never get argued. Check the list before the defence goes out.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'drafting',
    sourceReference: 'Rules of Court 2012, O 18 r 8',
  },
  {
    slug: 'my-fact-particulars-fraud',
    title: 'Fraud must be pleaded with particulars.',
    body: 'Where a party relies on misrepresentation, fraud, breach of trust, wilful default or undue influence, the pleading must give particulars, with dates where they are needed.',
    whyItMatters:
      'An allegation of fraud without particulars invites an application to strike it out, and a court will not let it be run at trial.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'drafting',
    sourceReference: 'Rules of Court 2012, O 18 r 12',
  },
  {
    slug: 'my-fact-non-traverse',
    title: 'What a defence does not deny, it admits.',
    body: 'An allegation of fact in a pleading that is not traversed in the next pleading is taken as admitted, unless the rules say otherwise.',
    whyItMatters:
      'Go through the statement of claim paragraph by paragraph and make sure each one is admitted, denied or not admitted on purpose.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'drafting',
    sourceReference: 'Rules of Court 2012, O 18 r 13',
  },
  {
    slug: 'my-fact-striking-out-grounds',
    title: 'A pleading can be struck out on four grounds.',
    body: 'The court may strike out a pleading, or part of it, if it discloses no reasonable cause of action or defence, is scandalous, frivolous or vexatious, may prejudice, embarrass or delay the fair trial, or is otherwise an abuse of the process of the court.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 18 r 19(1)',
  },
  {
    slug: 'my-fact-striking-out-no-evidence',
    title: 'On the first ground for striking out, no evidence is allowed.',
    body: 'An application to strike out because a pleading discloses no reasonable cause of action or defence is decided on the pleading alone. No affidavit evidence is admissible on that ground.',
    whyItMatters:
      'If the argument depends on facts outside the pleading, it belongs under one of the other grounds, or in a different application.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 18 r 19(2)',
  },
  {
    slug: 'my-fact-further-particulars',
    title: 'You can ask the court to order further and better particulars.',
    body: 'Where a pleading is too vague to answer, the other party can request particulars and, if they are not given, apply for an order that they be served.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'drafting',
    sourceReference: 'Rules of Court 2012, O 18 r 12',
  },
  {
    slug: 'my-fact-amendment',
    title: 'Amendments to pleadings are usually allowed if they cause no injustice.',
    body: 'The court may allow a party to amend at any stage. Leave is generally given where the amendment is made in good faith and any prejudice to the other side can be compensated by costs.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'drafting',
    sourceReference: 'Rules of Court 2012, O 20 r 5',
  },
  {
    slug: 'my-fact-summary-judgment',
    title: 'Summary judgment is for cases with no real defence.',
    body: 'After the defendant has entered appearance, a plaintiff may apply for judgment without a trial on the ground that the defendant has no defence. The defendant avoids it by showing a triable issue.',
    whyItMatters:
      'It is the quickest route to a judgment where the debt is clear, and the first thing a defendant’s lawyer must answer with real evidence.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 14',
  },
  {
    slug: 'my-fact-default-judgment',
    title: 'Judgment in default can come from two different failures.',
    body: 'A plaintiff may enter judgment in default where the defendant fails to enter appearance, and separately where the defendant enters appearance but fails to serve a defence in time.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 13 and O 19',
  },
  {
    slug: 'my-fact-setting-aside-default',
    title: 'A default judgment can be set aside.',
    body: 'A judgment entered irregularly is set aside as of right. A regular judgment may be set aside at the court’s discretion, usually where the defendant shows a defence on the merits.',
    whyItMatters:
      'The first thing to check on a default judgment against a client is whether it was entered correctly.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 13 r 8 and O 19 r 9',
  },
  {
    slug: 'my-fact-third-party',
    title: 'A defendant can bring in a third party.',
    body: 'A defendant who claims a contribution or an indemnity from someone not yet a party, or a remedy connected with the plaintiff’s claim, may issue a third party notice against them.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 16',
  },
  {
    slug: 'my-fact-discovery',
    title: 'Discovery under the 2012 Rules is narrower than it used to be.',
    body: 'A party gives discovery of the documents it relies on, and those that could adversely affect its own case or another party’s, or support another party’s case. It is no longer every document that might lead to a train of inquiry.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 24',
  },
  {
    slug: 'my-fact-interrogatories',
    title: 'Interrogatories are written questions answered on oath.',
    body: 'With leave, a party may serve written questions on the other side about matters in question in the action, which must be answered by affidavit.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 26',
  },
  {
    slug: 'my-fact-case-management',
    title: 'The court, not the parties, manages the timetable to trial.',
    body: 'Pre-trial case management lets the court give directions to bring a case to trial quickly and fairly. A party who fails to attend or comply can find the action dismissed or judgment entered.',
    whyItMatters:
      'Case management dates are not optional. Missing one is one of the commonest avoidable disasters on a file.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 34',
  },
  {
    slug: 'my-fact-offer-to-settle',
    title: 'An offer to settle can change who pays the costs.',
    body: 'A party may make an offer to settle under the Rules. If the other side does not accept it and does no better at trial, the court can take that into account when deciding costs.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 22B',
  },
  {
    slug: 'my-fact-payment-into-court',
    title: 'Money paid into court is a sealed offer the judge does not see.',
    body: 'A defendant may pay money into court in satisfaction of the claim. The fact of payment is not disclosed to the trial judge until liability and the amount have been decided.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 22',
  },
  {
    slug: 'my-fact-security-for-costs',
    title: 'A plaintiff living abroad may have to give security for costs.',
    body: 'The court may order a plaintiff ordinarily resident out of the jurisdiction to give security for the defendant’s costs, so that a successful defendant is not left chasing a costs order overseas.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 23',
  },
  {
    slug: 'my-fact-interlocutory-injunction',
    title: 'Malaysian courts follow American Cyanamid on interlocutory injunctions.',
    body: 'The court asks whether there is a serious question to be tried, then where the balance of convenience lies, including whether damages would be an adequate remedy.',
    whyItMatters:
      'Structure an injunction affidavit and submission around those questions, in that order.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference:
      'Keet Gerald Francis Noel John v Mohd Noor @ Harun bin Abdullah [1995] 1 MLJ 193 (CA)',
  },
  {
    slug: 'my-fact-ex-parte-disclosure',
    title: 'Without notice, you owe the court full and frank disclosure.',
    body: 'A party applying without notice to the other side must put all material facts before the court, including those that hurt its case. An injunction obtained without that disclosure is liable to be set aside.',
    jurisdiction: 'MY_GENERAL',
    domain: 'ethics-and-ai',
  },
  {
    slug: 'my-fact-os-affidavits',
    title: 'An originating summons is decided on affidavits.',
    body: 'In proceedings begun by originating summons the evidence is usually given by affidavit, without oral evidence, unless the court orders otherwise.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 28',
  },
  {
    slug: 'my-fact-service-out',
    title: 'Serving a writ outside Malaysia needs the court’s leave.',
    body: 'A writ may be served out of the jurisdiction only with the leave of the court, in the classes of case the Rules allow.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 11',
  },
  {
    slug: 'my-fact-o1a',
    title: 'The 2012 Rules tell the court to prefer justice over technicality.',
    body: 'In administering the Rules, the court must have regard to the overriding interest of justice and not only to technical non-compliance. A failure to comply with the Rules is an irregularity and does not by itself nullify the proceedings.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 1A and O 2 r 1',
  },
  {
    slug: 'my-fact-inherent-powers',
    title: 'The Rules do not limit the court’s inherent powers.',
    body: 'Nothing in the Rules is taken to limit the inherent powers of the court to make any order necessary to prevent injustice or an abuse of its process.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 92 r 4',
  },
  {
    slug: 'my-fact-costs-follow-event',
    title: 'Costs usually follow the event.',
    body: 'The general rule is that the losing party pays the winning party’s costs, though the court keeps a wide discretion to order otherwise.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 59',
  },
  {
    slug: 'my-fact-seizure-and-sale',
    title: 'A judgment is enforced by separate steps, each with its own rules.',
    body: 'Winning does not pay the client. A judgment creditor chooses how to enforce: a writ of seizure and sale against property, garnishee proceedings against money owed to the debtor, or a judgment debtor summons to examine the debtor’s means.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 47, O 48 and O 49',
  },
  {
    slug: 'my-fact-insolvency-act',
    title: 'The Bankruptcy Act is now called the Insolvency Act.',
    body: 'The Bankruptcy Act 1967 was renamed the Insolvency Act 1967 in 2020, and the minimum debt for a bankruptcy petition was raised to RM100,000.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Bankruptcy (Amendment) Act 2020',
  },

  // ---------------------------------------------------------------------------
  // Affidavits
  // ---------------------------------------------------------------------------
  {
    slug: 'my-fact-affidavit-first-person',
    title: 'An affidavit is written in the first person.',
    body: 'It must be framed in the first person and state the deponent’s description and address. It is the deponent’s own evidence, not the lawyer’s summary of it.',
    whyItMatters:
      'Draft it in words the deponent would actually use and can defend in cross-examination.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'drafting',
    sourceReference: 'Rules of Court 2012, O 41 r 1',
  },
  {
    slug: 'my-fact-affidavit-information-belief',
    title: 'Information and belief belongs only in interlocutory affidavits.',
    body: 'An affidavit may contain only facts the deponent can prove from their own knowledge, except that in interlocutory proceedings it may contain statements of information or belief with their sources and grounds.',
    whyItMatters:
      'Leave out the source and the statement is worth little, and may be struck out.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'drafting',
    sourceReference: 'Rules of Court 2012, O 41 r 5',
  },
  {
    slug: 'my-fact-affidavit-scandalous',
    title: 'The court can strike out parts of an affidavit.',
    body: 'Matter in an affidavit that is scandalous, irrelevant or otherwise oppressive may be struck out by the court.',
    whyItMatters:
      'Argument and abuse in an affidavit do not help the client and can cost them.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'drafting',
    sourceReference: 'Rules of Court 2012, O 41 r 6',
  },
  {
    slug: 'my-fact-affidavit-exhibits',
    title: 'Documents go with an affidavit as exhibits, each identified.',
    body: 'A document referred to in an affidavit is exhibited to it and marked so that it can be identified, with the exhibit mark referred to in the paragraph that relies on it.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'drafting',
    sourceReference: 'Rules of Court 2012, O 41',
  },
  {
    slug: 'my-fact-commissioner-for-oaths',
    title: 'Affidavits are usually sworn before a Commissioner for Oaths.',
    body: 'The deponent swears or affirms the affidavit before a Commissioner for Oaths, who signs the jurat at the end recording where and when it was sworn.',
    whyItMatters:
      'A missing or defective jurat is an avoidable reason for an affidavit to be challenged.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'drafting',
  },
  {
    slug: 'my-fact-statutory-declaration',
    title: 'A statutory declaration is not an affidavit.',
    body: 'A statutory declaration is made under the Statutory Declarations Act 1960, outside court proceedings, for purposes such as confirming facts to an authority. An affidavit is evidence in proceedings.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'drafting',
    sourceReference: 'Statutory Declarations Act 1960',
  },

  // ---------------------------------------------------------------------------
  // Limitation
  // ---------------------------------------------------------------------------
  {
    slug: 'my-fact-limitation-six-years',
    title: 'Claims in contract and tort must be brought within six years.',
    body: 'In Peninsular Malaysia, an action founded on a contract or on tort cannot be brought after six years from the date the cause of action accrued.',
    whyItMatters:
      'Work out the limitation date on every new matter, before anything else.',
    jurisdiction: 'MY_MALAYA',
    domain: 'civil-procedure',
    sourceReference: 'Limitation Act 1953, s 6(1)(a)',
  },
  {
    slug: 'my-fact-latent-damage',
    title: 'Negligence claims for latent damage have their own time limit.',
    body: 'Since 2019, a negligence claim for latent damage, other than personal injury, can be brought within three years from when the claimant knew, or ought to have known, of the damage, subject to a longstop of 15 years.',
    jurisdiction: 'MY_MALAYA',
    domain: 'civil-procedure',
    sourceReference: 'Limitation Act 1953, s 6A',
  },
  {
    slug: 'my-fact-limitation-judgment',
    title: 'A judgment can be enforced for twelve years.',
    body: 'An action on a judgment cannot be brought after twelve years from the date the judgment became enforceable.',
    jurisdiction: 'MY_MALAYA',
    domain: 'civil-procedure',
    sourceReference: 'Limitation Act 1953, s 6(3)',
  },
  {
    slug: 'my-fact-limitation-land',
    title: 'An action to recover land has twelve years.',
    body: 'No action to recover land may be brought after twelve years from the date the right of action accrued.',
    jurisdiction: 'MY_MALAYA',
    domain: 'civil-procedure',
    sourceReference: 'Limitation Act 1953, s 9',
  },
  {
    slug: 'my-fact-public-authorities',
    title: 'Claims against public authorities have a shorter time limit.',
    body: 'An action against a person for an act done in pursuance of a public duty or authority must generally be brought within 36 months of the act, neglect or default complained of.',
    whyItMatters:
      'A client suing a government body may have much less time than they think.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Public Authorities Protection Act 1948, s 2',
  },
  {
    slug: 'my-fact-limitation-pleaded',
    title: 'Limitation is not raised by the court on its own.',
    body: 'The Limitation Act does not bar a claim unless it is specifically pleaded as a defence.',
    whyItMatters:
      'A defendant who forgets to plead limitation may lose a complete answer to the claim.',
    jurisdiction: 'MY_MALAYA',
    domain: 'drafting',
    sourceReference: 'Limitation Act 1953, s 4',
  },
  {
    slug: 'my-fact-limitation-sabah-sarawak',
    title: 'The Limitation Act 1953 does not apply in Sabah and Sarawak.',
    body: 'Each of Sabah and Sarawak has its own Limitation Ordinance, with periods that do not always match those in Peninsular Malaysia.',
    whyItMatters:
      'On an East Malaysian matter, check the Ordinance, not the Act.',
    jurisdiction: 'MY_SABAH_SARAWAK',
    domain: 'civil-procedure',
  },

  // ---------------------------------------------------------------------------
  // Evidence
  // ---------------------------------------------------------------------------
  {
    slug: 'my-fact-evidence-act-origin',
    title: 'The Evidence Act 1950 comes from India.',
    body: 'It is closely modelled on the Indian Evidence Act 1872, drafted by Sir James Fitzjames Stephen. Indian decisions on the matching sections are often persuasive in Malaysia.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'evidence',
    sourceReference: 'Evidence Act 1950',
  },
  {
    slug: 'my-fact-burden-of-proof',
    title: 'Whoever asserts a fact must prove it.',
    body: 'Whoever wants the court to give judgment on the existence of facts they assert must prove that those facts exist.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'evidence',
    sourceReference: 'Evidence Act 1950, s 101',
  },
  {
    slug: 'my-fact-adverse-inference',
    title: 'Evidence a party could produce but does not may be held against them.',
    body: 'The court may presume that evidence which could be produced, and is not, would be unfavourable to the person who withholds it.',
    whyItMatters:
      'If a key witness or document is not called, expect the other side to ask for this inference.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'evidence',
    sourceReference: 'Evidence Act 1950, s 114(g)',
  },
  {
    slug: 'my-fact-computer-documents',
    title: 'Computer-produced documents can be admitted with a certificate.',
    body: 'A document produced by a computer is admissible as evidence, and a certificate signed by a person responsible for the computer can be used to show it was produced in its ordinary course of use.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'evidence',
    sourceReference: 'Evidence Act 1950, s 90A',
  },
  {
    slug: 'my-fact-presumption-publication',
    title: 'The law presumes who published something online.',
    body: 'Since 2012, a person whose name or picture appears on a publication, or who controls the account or network it came from, is presumed to have published it unless the contrary is proved.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'evidence',
    sourceReference: 'Evidence Act 1950, s 114A',
  },
  {
    slug: 'my-fact-parol-evidence',
    title: 'Oral evidence cannot usually vary a written contract.',
    body: 'Where the terms of a contract have been reduced to writing, the document itself is the evidence of them, and oral evidence of an agreement contradicting, varying or adding to those terms is generally excluded.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'evidence',
    sourceReference: 'Evidence Act 1950, ss 91 and 92',
  },
  {
    slug: 'my-fact-legal-privilege',
    title: 'Advocate and client communications are privileged.',
    body: 'An advocate may not disclose communications made in the course of and for the purpose of their professional employment, without the client’s express consent, subject to exceptions such as communications in furtherance of an illegal purpose.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'evidence',
    sourceReference: 'Evidence Act 1950, s 126',
  },
  {
    slug: 'my-fact-order-of-examination',
    title: 'Witnesses are examined in chief, cross-examined, then re-examined.',
    body: 'Witnesses are first examined in chief, then, if the adverse party wishes, cross-examined, then, if the party calling them wishes, re-examined. Re-examination is confined to matters raised in cross-examination.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'advocacy',
    sourceReference: 'Evidence Act 1950, s 138',
  },
  {
    slug: 'my-fact-leading-questions',
    title: 'Leading questions are not allowed in chief if objected to.',
    body: 'A leading question suggests the answer. It must not be asked in examination-in-chief or re-examination if objected to, except on introductory or undisputed matters, but may be asked in cross-examination.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'advocacy',
    sourceReference: 'Evidence Act 1950, ss 141 to 143',
  },
  {
    slug: 'my-fact-judge-questions',
    title: 'The judge may ask a witness any question.',
    body: 'To discover or obtain proper proof of relevant facts, the judge may ask any question, in any form, at any time, of any witness or party.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'advocacy',
    sourceReference: 'Evidence Act 1950, s 165',
  },
  {
    slug: 'my-fact-expert-opinion',
    title: 'Expert opinion is admissible on matters of science or art.',
    body: 'When the court has to form an opinion on foreign law, science, art, or the identity of handwriting or finger impressions, the opinions of persons specially skilled in those matters are relevant facts.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'evidence',
    sourceReference: 'Evidence Act 1950, s 45',
  },
  {
    slug: 'my-fact-oral-evidence-direct',
    title: 'Oral evidence must be direct.',
    body: 'A witness speaks to what they saw, heard or perceived themselves. Evidence of what someone else told them is generally not admissible to prove the truth of it.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'evidence',
    sourceReference: 'Evidence Act 1950, s 60',
  },
  {
    slug: 'my-fact-unstamped',
    title: 'An unstamped document may not be admitted in evidence.',
    body: 'An instrument chargeable with stamp duty that is not duly stamped is not admissible in evidence until the duty, and any penalty, has been paid.',
    whyItMatters:
      'Check the stamping of key agreements early, not when the document is being tendered at trial.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'evidence',
    sourceReference: 'Stamp Act 1949, s 52',
  },
  {
    slug: 'my-fact-impeaching-credit',
    title: 'A witness’s credit can be impeached in set ways.',
    body: 'The credit of a witness may be impeached by evidence that they are unworthy of credit, have been bribed, or have made former statements inconsistent with their evidence.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'advocacy',
    sourceReference: 'Evidence Act 1950, s 155',
  },
  {
    slug: 'my-fact-previous-statements',
    title: 'Before contradicting a witness with their own writing, show it to them.',
    body: 'A witness may be cross-examined on previous statements made in writing, but if the writing is to be used to contradict them, their attention must first be called to the parts relied on.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'advocacy',
    sourceReference: 'Evidence Act 1950, s 145',
  },

  // ---------------------------------------------------------------------------
  // The profession and the courtroom
  // ---------------------------------------------------------------------------
  {
    slug: 'my-fact-fused-profession',
    title: 'In Malaysia, lawyers are admitted as advocates and solicitors.',
    body: 'The profession is fused. The same person may advise, draft and appear in court, unlike the divided barrister and solicitor professions in England.',
    jurisdiction: 'MY_MALAYA',
    domain: 'ethics-and-ai',
    sourceReference: 'Legal Profession Act 1976',
  },
  {
    slug: 'my-fact-pupillage',
    title: 'Pupillage, or chambering, lasts nine months.',
    body: 'A qualified person must serve a period of pupillage in the chambers of an advocate and solicitor of at least seven years’ standing before being admitted. In Peninsular Malaysia the period is nine months.',
    jurisdiction: 'MY_MALAYA',
    domain: 'ethics-and-ai',
    sourceReference: 'Legal Profession Act 1976, s 12',
  },
  {
    slug: 'my-fact-long-call',
    title: 'Admission to the Bar is called the "long call".',
    body: 'A pupil who has completed chambering petitions the High Court for admission as an advocate and solicitor. The ceremony at which they are admitted is known as the long call.',
    jurisdiction: 'MY_MALAYA',
    domain: 'ethics-and-ai',
    sourceReference: 'Legal Profession Act 1976',
  },
  {
    slug: 'my-fact-separate-bars',
    title: 'Sabah and Sarawak have their own Bars.',
    body: 'Advocates in Sabah and Sarawak are admitted under each state’s Advocates Ordinance, not the Legal Profession Act 1976. A Peninsular advocate needs ad hoc admission to appear in a case there.',
    whyItMatters:
      'A firm in Kuala Lumpur cannot simply send a lawyer to court in Kota Kinabalu or Kuching.',
    jurisdiction: 'MY_SABAH_SARAWAK',
    domain: 'ethics-and-ai',
  },
  {
    slug: 'my-fact-clp',
    title: 'The CLP is the qualifying examination for some law graduates.',
    body: 'Graduates whose law degree is not one recognised as a qualification on its own sit the Certificate in Legal Practice, set by the Legal Profession Qualifying Board, before they can be called.',
    jurisdiction: 'MY_MALAYA',
    domain: 'ethics-and-ai',
    sourceReference: 'Legal Profession Act 1976',
  },
  {
    slug: 'my-fact-practice-etiquette',
    title: 'Conduct at the Bar is governed by the Practice and Etiquette Rules.',
    body: 'The Legal Profession (Practice and Etiquette) Rules 1978 set out an advocate’s duties to the court, to clients and to other advocates, from appearing in robes to dealing with the other side’s client.',
    jurisdiction: 'MY_MALAYA',
    domain: 'ethics-and-ai',
    sourceReference: 'Legal Profession (Practice and Etiquette) Rules 1978',
  },
  {
    slug: 'my-fact-duty-to-court',
    title: 'An advocate must never mislead the court.',
    body: 'However strongly an advocate presses a client’s case, they must not knowingly mislead the court on the facts or the law, including by failing to cite a binding authority against them.',
    whyItMatters:
      'It is the duty that survives every other instruction a client gives.',
    jurisdiction: 'MY_GENERAL',
    domain: 'ethics-and-ai',
  },
  {
    slug: 'my-fact-yang-arif',
    title: 'Judges of the superior courts are addressed as "Yang Arif".',
    body: 'In the High Court, the Court of Appeal and the Federal Court, judges are addressed as "Yang Arif", or "My Lord" and "My Lady" in English. Practice differs in the subordinate courts, so check before your first appearance there.',
    jurisdiction: 'MY_GENERAL',
    domain: 'advocacy',
  },
  {
    slug: 'my-fact-contempt-act',
    title: 'Contempt of court now has its own Act.',
    body: 'The Contempt of Court Act 2023 sets out what counts as contempt and the punishment for it, replacing much of what was previously left to the courts’ inherent powers and the common law.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'ethics-and-ai',
    sourceReference: 'Contempt of Court Act 2023',
  },

  // ---------------------------------------------------------------------------
  // Arbitration and mediation
  // ---------------------------------------------------------------------------
  {
    slug: 'my-fact-arbitration-act',
    title: 'The Arbitration Act 2005 is based on the UNCITRAL Model Law.',
    body: 'It replaced the Arbitration Act 1952 and brought Malaysian arbitration law in line with the international model used in many trading countries.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Arbitration Act 2005',
  },
  {
    slug: 'my-fact-arbitration-intervention',
    title: 'Courts may intervene in an arbitration only where the Act allows.',
    body: 'In matters governed by the Arbitration Act 2005, no court may intervene except where the Act provides.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Arbitration Act 2005, s 8',
  },
  {
    slug: 'my-fact-arbitration-stay',
    title: 'Sue in breach of an arbitration clause, and the court will usually stay the action.',
    body: 'Where proceedings are brought in a matter covered by an arbitration agreement, the court must, on a party’s application, stay them and refer the parties to arbitration, unless the agreement is null and void, inoperative or incapable of being performed.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Arbitration Act 2005, s 10',
  },
  {
    slug: 'my-fact-aiac',
    title: 'The Kuala Lumpur Regional Centre for Arbitration has a new name.',
    body: 'Since 2018 it has been the Asian International Arbitration Centre (AIAC), administering arbitrations, adjudications and mediations from Kuala Lumpur.',
    jurisdiction: 'MY_GENERAL',
    domain: 'court-system',
  },
  {
    slug: 'my-fact-mediation-act',
    title: 'Mediation has its own Act.',
    body: 'The Mediation Act 2012 provides a framework for mediation outside the courts, including the confidentiality of what is said in a mediation.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Mediation Act 2012',
  },
  {
    slug: 'my-fact-cipaa',
    title: 'Construction payment disputes have a fast-track adjudication.',
    body: 'The Construction Industry Payment and Adjudication Act 2012 lets a party to a construction contract refer a payment dispute to adjudication, with a decision that binds until the dispute is finally decided.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Construction Industry Payment and Adjudication Act 2012',
  },

  // ---------------------------------------------------------------------------
  // Contract and general law
  // ---------------------------------------------------------------------------
  {
    slug: 'my-fact-civil-law-act-dates',
    title: 'English law applies in Malaysia only up to a fixed date.',
    body: 'Where there is no written law, the courts apply the common law of England and the rules of equity as administered in England on 7 April 1956 for Peninsular Malaysia, on 1 December 1951 for Sabah and on 12 December 1949 for Sarawak, so far as local circumstances permit.',
    whyItMatters:
      'English cases decided after those dates are persuasive only, not binding.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'legal-reasoning',
    sourceReference: 'Civil Law Act 1956, s 3(1)',
  },
  {
    slug: 'my-fact-contracts-act-origin',
    title: 'The Contracts Act 1950 comes from India too.',
    body: 'Like the Evidence Act, it is modelled on an Indian statute, the Indian Contract Act 1872. Where the Act speaks, it prevails over English common law.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'legal-reasoning',
    sourceReference: 'Contracts Act 1950',
  },
  {
    slug: 'my-fact-restraint-of-trade',
    title: 'Restraint of trade clauses are void in Malaysia, with narrow exceptions.',
    body: 'Every agreement by which anyone is restrained from exercising a lawful profession, trade or business is void to that extent, subject to limited statutory exceptions such as the sale of goodwill. There is no general test of reasonableness as there is in England.',
    whyItMatters:
      'An English-style non-compete clause in an employment contract may not do what the client expects here.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'legal-reasoning',
    sourceReference: 'Contracts Act 1950, s 28',
  },
  {
    slug: 'my-fact-liquidated-damages',
    title: 'Liquidated damages: the burden is on the party saying the sum is unreasonable.',
    body: 'The Federal Court has held that a plaintiff relying on a liquidated damages clause need not prove its actual loss. The defendant who says the sum is unreasonable compensation bears the burden of showing it.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'legal-reasoning',
    sourceReference:
      'Contracts Act 1950, s 75; Cubic Electronics Sdn Bhd v Mars Telecommunications Sdn Bhd [2019] 6 MLJ 15 (FC)',
  },
  {
    slug: 'my-fact-damages-s74',
    title: 'Damages for breach of contract are limited to natural or contemplated loss.',
    body: 'Compensation is for loss that naturally arose in the usual course of things from the breach, or that the parties knew, when they made the contract, would be likely to result. Remote and indirect loss is not recoverable.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'legal-reasoning',
    sourceReference: 'Contracts Act 1950, s 74',
  },
  {
    slug: 'my-fact-age-of-majority',
    title: 'The age of majority in Malaysia is 18.',
    body: 'A person reaches full age at 18. Below that age, a person generally lacks capacity to make a binding contract.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'legal-reasoning',
    sourceReference: 'Age of Majority Act 1971',
  },
  {
    slug: 'my-fact-specific-relief',
    title: 'Specific performance and injunctions come from a 1950 Act.',
    body: 'The Specific Relief Act 1950 governs the court’s power to order a party to perform a contract, and to grant injunctions, including when such relief will be refused.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'legal-reasoning',
    sourceReference: 'Specific Relief Act 1950',
  },
  {
    slug: 'my-fact-companies-act-2016',
    title: 'Companies are now governed by the Companies Act 2016.',
    body: 'It replaced the Companies Act 1965. Older cases on the 1965 Act are still cited, but the section numbers changed, so match the provisions before relying on them.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'legal-research',
    sourceReference: 'Companies Act 2016',
  },
  {
    slug: 'my-fact-pdpa',
    title: 'Personal data in commercial transactions is protected by statute.',
    body: 'The Personal Data Protection Act 2010 governs how personal data is processed in commercial transactions, including by law firms handling clients’ and witnesses’ information.',
    whyItMatters:
      'Client files contain personal data. How a firm stores and shares them is a legal duty, not only good practice.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'ethics-and-ai',
    sourceReference: 'Personal Data Protection Act 2010',
  },

  // ---------------------------------------------------------------------------
  // Research and reasoning
  // ---------------------------------------------------------------------------
  {
    slug: 'my-fact-mlj',
    title: 'The Malayan Law Journal is the leading series of law reports.',
    body: 'Cited as MLJ, it reports decisions of the Malaysian superior courts. Other series include the Current Law Journal (CLJ) and the All Malaysia Reports (AMR).',
    whyItMatters:
      'The same case is often reported in more than one series. Check which report the court prefers before filing a bundle of authorities.',
    jurisdiction: 'MY_GENERAL',
    domain: 'legal-research',
  },
  {
    slug: 'my-fact-stare-decisis',
    title: 'Lower courts are bound by the decisions of higher courts.',
    body: 'A decision of the Federal Court binds the Court of Appeal, the High Courts and the subordinate courts. A Court of Appeal decision binds the High Courts and the courts below them.',
    jurisdiction: 'MY_GENERAL',
    domain: 'legal-reasoning',
  },
  {
    slug: 'my-fact-indian-authorities',
    title: 'Indian cases can be persuasive on Malaysian statutes.',
    body: 'Because several Malaysian statutes, including the Contracts Act and the Evidence Act, follow Indian legislation, decisions of Indian courts on the equivalent sections are often cited as persuasive authority.',
    jurisdiction: 'MY_GENERAL',
    domain: 'legal-research',
  },
  {
    slug: 'my-fact-interpretation-acts',
    title: 'The Interpretation Acts explain words used across all federal laws.',
    body: 'The Interpretation Acts 1948 and 1967 set out what common words and expressions mean in federal written law, and rules such as how time periods are counted, unless a particular law says otherwise.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'legal-research',
    sourceReference: 'Interpretation Acts 1948 and 1967',
  },
  {
    slug: 'my-fact-practice-directions',
    title: 'Practice Directions from the Chief Justice change how cases run.',
    body: 'Beyond the Rules of Court, the Chief Justice and the Chief Judges issue Practice Directions on matters such as e-filing, remote hearings and case management. They are worth reading alongside the Rules.',
    jurisdiction: 'MY_GENERAL',
    domain: 'legal-research',
  },
  {
    slug: 'my-fact-art-5-liberty',
    title: 'No one may be deprived of life or personal liberty save in accordance with law.',
    body: 'Article 5 of the Federal Constitution protects life and personal liberty. A person arrested must be told the grounds of arrest as soon as may be, and allowed to consult a lawyer of their choice.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'legal-reasoning',
    sourceReference: 'Federal Constitution, art 5',
  },
  {
    slug: 'my-fact-art-8-equality',
    title: 'All persons are equal before the law.',
    body: 'Article 8 of the Federal Constitution guarantees equality before the law and equal protection of the law, subject to the exceptions the Constitution itself makes.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'legal-reasoning',
    sourceReference: 'Federal Constitution, art 8',
  },
  {
    slug: 'my-fact-art-160-law',
    title: 'In the Constitution, "law" includes the common law.',
    body: 'Article 160 defines "law" to include written law, the common law so far as it is in operation in the Federation, and any custom or usage having the force of law.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'legal-reasoning',
    sourceReference: 'Federal Constitution, art 160(2)',
  },
  {
    slug: 'my-fact-judicial-review-o53',
    title: 'Judicial review of public decisions needs leave first.',
    body: 'An application for judicial review of a decision of a public authority is made under Order 53, and the applicant must first obtain the leave of the High Court.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 53',
  },
  {
    slug: 'my-fact-judicial-review-time',
    title: 'Judicial review must be brought promptly.',
    body: 'An application for leave for judicial review must be made promptly and in any event within three months from the date the grounds for the application first arose, unless the court extends time.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 53 r 3(6)',
  },
  {
    slug: 'my-fact-garnishee',
    title: 'Garnishee proceedings reach money other people owe the debtor.',
    body: 'A judgment creditor can obtain an order that a third party who owes money to the judgment debtor, such as a bank holding the debtor’s account, pays it to the creditor instead.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'civil-procedure',
    sourceReference: 'Rules of Court 2012, O 49',
  },
  {
    slug: 'my-fact-without-prejudice',
    title: '"Without prejudice" protects genuine attempts to settle.',
    body: 'Communications made in a genuine attempt to settle a dispute are generally not admissible as evidence of an admission. Labelling a letter "without prejudice" does not protect it if it is not part of a real attempt to settle.',
    jurisdiction: 'MY_GENERAL',
    domain: 'drafting',
  },
  {
    slug: 'my-fact-letter-of-demand',
    title: 'A letter of demand usually comes before a writ.',
    body: 'Before issuing proceedings, a claimant’s solicitors normally send a letter of demand setting out the claim and a deadline to pay or respond. It frames the dispute and can matter later on costs.',
    whyItMatters:
      'It is often the first document on a file a junior is asked to draft, and the other side’s first impression of the firm.',
    jurisdiction: 'MY_GENERAL',
    domain: 'drafting',
  },
  {
    slug: 'my-fact-cause-papers-bm',
    title: 'Court documents can be filed in Malay or English.',
    body: 'Documents may be in the national language or in English, and a document in English may need to be accompanied by a translation in the national language where the court requires it.',
    jurisdiction: 'MY_FEDERAL',
    domain: 'drafting',
    sourceReference: 'Rules of Court 2012, O 92 r 1',
  },
  {
    slug: 'my-fact-efiling',
    title: 'Court documents in the superior courts are filed electronically.',
    body: 'Documents are filed through the courts’ electronic filing system rather than at a counter, and many applications are case managed online.',
    jurisdiction: 'MY_GENERAL',
    domain: 'court-system',
  },
];
