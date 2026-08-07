import type { Jurisdiction } from '@/lib/types';

/**
 * The daily brief.
 *
 * One verified fact a day. Same discipline as the question bank: every fact
 * carries a jurisdiction, a source where one exists, and ships as
 * `requires_review` until a person signs it off.
 *
 * These are chosen to be the kind of thing a lawyer is glad to know and slightly
 * embarrassed not to: origins, distinctions, and the rules everyone assumes
 * they already understand.
 */

export interface SeedFact {
  slug: string;
  title: string;
  body: string;
  whyItMatters?: string;
  jurisdiction: Jurisdiction;
  court?: string;
  domain?: string;
  sourceReference?: string;
  sourceUrl?: string;
}

export const FACTS: SeedFact[] = [
  {
    slug: 'fact-privy-council',
    title: 'Australia only became fully independent of British courts in 1986.',
    body: 'Appeals from Australian courts to the Judicial Committee of the Privy Council in London were removed in stages across the twentieth century, and the last routes were closed by the Australia Acts in 1986. Before that, an Australian litigant could in some circumstances go over the head of the High Court to a court on the other side of the world.',
    whyItMatters:
      'Privy Council decisions still appear in older Australian judgments. Knowing when the link was severed tells you how much weight a pre-1986 English authority actually carries.',
    jurisdiction: 'AU_GENERAL',
    domain: 'court-system',
    sourceReference: 'Australia Act 1986 (Cth) s 11',
  },
  {
    slug: 'fact-subpoena-etymology',
    title: '“Subpoena” literally means “under penalty”.',
    body: 'From the Latin sub poena, the opening words of the original writ, which commanded a person to attend court under penalty of a stated sum. The name survived; the threatened fine did not. What remains is that non-compliance without lawful excuse is a contempt of court.',
    whyItMatters:
      'It is a reminder of what you are actually doing when you issue one. A subpoena is a court order directed at someone who has no stake in your dispute, and courts expect it to be used with corresponding care.',
    jurisdiction: 'AU_GENERAL',
    domain: 'civil-procedure',
  },
  {
    slug: 'fact-affidavit-etymology',
    title: '“Affidavit” is a complete Latin sentence: “he has declared on oath”.',
    body: 'It is medieval Latin, third person singular perfect, a statement about the deponent rather than a noun for a document. Which is exactly why an affidavit is written in the first person and sworn by the person who made it, and why a solicitor cannot swear one on a client’s behalf.',
    jurisdiction: 'AU_GENERAL',
    domain: 'drafting',
  },
  {
    slug: 'fact-affirmation-equal',
    title: 'An affirmation carries exactly the same weight as an oath.',
    body: 'A deponent or witness who prefers not to swear a religious oath may affirm instead. There is no legal difference in effect, no adverse inference to be drawn, and no requirement to explain the choice.',
    whyItMatters:
      'Clients occasionally worry that affirming looks evasive. It does not, and telling them so is a small kindness that removes an unnecessary anxiety before a hearing.',
    jurisdiction: 'AU_GENERAL',
    domain: 'drafting',
  },
  {
    slug: 'fact-county-court-victoria',
    title: 'Victoria is the only Australian state without a District Court.',
    body: 'New South Wales, Queensland, South Australia and Western Australia all call their intermediate court the District Court. Victoria calls its equivalent the County Court. Tasmania, the ACT and the Northern Territory have no intermediate court at all.',
    jurisdiction: 'AU_GENERAL',
    domain: 'court-system',
  },
  {
    slug: 'fact-uniform-evidence-six',
    title: 'The “uniform” Evidence Acts cover only six of Australia’s nine jurisdictions.',
    body: 'The uniform scheme operates in the Commonwealth, New South Wales, Victoria, Tasmania, the ACT and the Northern Territory. Queensland, Western Australia and South Australia retain their own evidence legislation together with the common law.',
    whyItMatters:
      'Citing “section 59” to a Queensland court is a straightforward error. The rules genuinely differ in places, not merely their numbering.',
    jurisdiction: 'AU_GENERAL',
    domain: 'evidence',
    sourceReference: 'Evidence Act 1995 (Cth); Evidence Act 1977 (Qld)',
  },
  {
    slug: 'fact-browne-v-dunn-1893',
    title: 'The most enforced rule in Australian cross-examination comes from an 1893 case that was never fully reported.',
    body: 'Browne v Dunn (1893) 6 R 67 is a House of Lords decision recorded in an obscure series. It holds that if you intend to contradict a witness or impugn their credit, you must put that case to them so they can answer it. It is cited in Australian courts constantly, more than a century later.',
    whyItMatters:
      'Breach it and you may lose the very submission your case was built around, or find the witness recalled at your client’s expense.',
    jurisdiction: 'AU_GENERAL',
    domain: 'advocacy',
    sourceReference: 'Browne v Dunn (1893) 6 R 67',
  },
  {
    slug: 'fact-adverse-authority',
    title: 'You must tell the court about a binding case that destroys your argument.',
    body: 'An advocate must inform the court of any binding authority, and of relevant legislation, that they know of and that is against their client, even where the opponent has not found it. Disclosure is not surrender: you may still argue the authority is distinguishable.',
    whyItMatters:
      'The adversarial system leaves each side to find its own facts. It does not leave each side to find the law that governs the case.',
    jurisdiction: 'AU_GENERAL',
    domain: 'advocacy',
    sourceReference: 'Australian Solicitors’ Conduct Rules r 19.6',
  },
  {
    slug: 'fact-duty-paramount',
    title: 'Your duty to the court outranks your duty to your client. Always.',
    body: 'It is the first substantive rule in the Australian Solicitors’ Conduct Rules, and it is not a balancing exercise. Where the duty to the court and the administration of justice conflicts with any other duty, the duty to the court prevails to the extent of the inconsistency.',
    whyItMatters:
      'This is the rule that decides what you do when a client asks you to mislead a court. It is also what makes a lawyer something other than a well-spoken agent.',
    jurisdiction: 'AU_GENERAL',
    domain: 'advocacy',
    sourceReference: 'Australian Solicitors’ Conduct Rules r 3',
  },
  {
    slug: 'fact-calderbank',
    title: 'The Calderbank offer is named after a divorce case about a house.',
    body: 'Calderbank v Calderbank [1975] 3 All ER 333 gave its name to an offer expressed to be without prejudice save as to costs. The offer stays out of the court’s hands while it decides the case, then comes out afterwards on the costs argument.',
    whyItMatters:
      'A well-timed Calderbank creates real costs pressure. An unreasonable refusal of one is among the most common routes to an indemnity costs order.',
    jurisdiction: 'AU_GENERAL',
    domain: 'civil-procedure',
    sourceReference: 'Calderbank v Calderbank [1975] 3 All ER 333',
  },
  {
    slug: 'fact-without-prejudice-label',
    title: 'Writing “without prejudice” on a letter does nothing by itself.',
    body: 'The protection attaches to communications forming part of a genuine attempt to settle. It is the substance that earns it, not the heading. A letter marked without prejudice that makes no settlement proposal is simply a letter.',
    whyItMatters:
      'Juniors mark correspondence reflexively and are surprised when it is tendered. Ask whether the letter is really part of a negotiation before you rely on the label.',
    jurisdiction: 'AU_GENERAL',
    domain: 'evidence',
    sourceReference: 'Evidence Act 1995 (Cth) s 131',
  },
  {
    slug: 'fact-briginshaw',
    title: 'Briginshaw does not raise the standard of proof.',
    body: 'It is one of the most misdescribed principles in Australian law. The standard stays the balance of probabilities. What Briginshaw recognises is that reasonable satisfaction is not produced by inexact proofs, and that the seriousness of an allegation and the gravity of its consequences bear on whether a court is actually persuaded.',
    whyItMatters:
      'Pleading fraud commits you to persuading a court that will look hard at your evidence, and there are conduct consequences for pleading it without foundation.',
    jurisdiction: 'AU_GENERAL',
    domain: 'evidence',
    sourceReference: 'Briginshaw v Briginshaw (1938) 60 CLR 336',
  },
  {
    slug: 'fact-headnote-no-authority',
    title: 'A headnote has no legal authority whatsoever.',
    body: 'It is a summary written by the law reporter, not by the court. It is a research aid and nothing more. Only the ratio decidendi, the principle necessary to the decision on the facts found, binds a later court.',
    whyItMatters:
      'Quoting a headnote to a judge as though it were the judgment is a memorable way to lose credibility early.',
    jurisdiction: 'AU_GENERAL',
    domain: 'legal-reasoning',
  },
  {
    slug: 'fact-single-common-law',
    title: 'There is one common law of Australia, not one per state.',
    body: 'Unlike the United States, Australia has a single common law administered across all its jurisdictions. That is why an intermediate appellate court in one state should not depart from another state’s appellate decision on a common law point unless convinced it is plainly wrong.',
    whyItMatters:
      'It vastly expands the authority worth citing. Confining your research to your own state leaves the strongest case on the shelf.',
    jurisdiction: 'AU_GENERAL',
    domain: 'legal-reasoning',
    sourceReference:
      'Lipohar v The Queen (1999) 200 CLR 485; Farah Constructions Pty Ltd v Say-Dee Pty Ltd (2007) 230 CLR 89',
  },
  {
    slug: 'fact-dissent-later-law',
    title: 'A dissent binds nobody, and sometimes becomes the law anyway.',
    body: 'A dissenting judgment is not part of the court’s decision and is not authority for the proposition it advances. But dissents are sometimes preferred by a later court free to reconsider the question, which is why a well-reasoned one can be worth reading closely even when it lost.',
    whyItMatters:
      'Always check whether the judge you are quoting was in the majority. Citing a dissent without saying so is a failure of candour as well as of research.',
    jurisdiction: 'AU_GENERAL',
    domain: 'legal-reasoning',
  },
  {
    slug: 'fact-purposive-statutory-command',
    title: 'Purposive interpretation is not a fallback. It is a statutory instruction.',
    body: 'Section 15AA of the Acts Interpretation Act 1901 (Cth), and its equivalent in every state and territory, requires that the interpretation best achieving the purpose of the Act be preferred to any other. It is not reached only after a literal reading fails.',
    jurisdiction: 'CTH',
    domain: 'legal-reasoning',
    sourceReference: 'Acts Interpretation Act 1901 (Cth) s 15AA',
  },
  {
    slug: 'fact-mabo',
    title: 'Mabo overturned a legal fiction that had stood for two centuries.',
    body: 'Mabo v Queensland (No 2) (1992) 175 CLR 1 rejected the proposition that Australia was terra nullius (land belonging to no one) at the time of European settlement, and recognised native title at common law. The Native Title Act 1993 (Cth) followed the next year.',
    whyItMatters:
      'It is the clearest modern demonstration that the common law can correct itself, and of how much turns on a single foundational premise.',
    jurisdiction: 'AU_GENERAL',
    domain: 'legal-reasoning',
    sourceReference: 'Mabo v Queensland (No 2) (1992) 175 CLR 1',
  },
  {
    slug: 'fact-engineers-case',
    title: 'A dispute about Western Australian sawmills reshaped the Australian Constitution.',
    body: 'The Engineers case (1920) 28 CLR 129 arose from an industrial claim against state sawmills. The High Court used it to sweep away the doctrines of implied immunities and reserved state powers, and to establish that the Constitution should be read according to the ordinary meaning of its text.',
    whyItMatters:
      'Nearly all modern Commonwealth legislative power is built on the reading Engineers established.',
    jurisdiction: 'AU_GENERAL',
    domain: 'legal-reasoning',
    sourceReference:
      'Amalgamated Society of Engineers v Adelaide Steamship Co Ltd (1920) 28 CLR 129',
  },
  {
    slug: 'fact-tribunal-not-court',
    title: 'A state tribunal cannot decide a dispute between residents of different states.',
    body: 'Because a tribunal that is not a “court of a State” cannot be invested with federal jurisdiction, a matter that attracts federal jurisdiction, including a dispute between residents of different states, falls outside its power. The High Court confirmed the point in Burns v Corbett.',
    whyItMatters:
      'A cheap, quick tribunal proceeding can turn out to have been beyond power all along. Check where the parties actually reside before filing.',
    jurisdiction: 'AU_GENERAL',
    domain: 'court-system',
    sourceReference: 'Burns v Corbett (2018) 265 CLR 304',
  },
  {
    slug: 'fact-filing-not-service',
    title: 'Filing a proceeding does not put the defendant on notice.',
    body: 'Filing commences the proceeding; service brings the defendant into it. Originating process also has a limited life under the rules; if it is not served in time it may need to be renewed before it can be served at all.',
    whyItMatters:
      'A claim issued just inside a limitation period but never served in time can be worth nothing. Filing is the start of the task, not the end of it.',
    jurisdiction: 'AU_GENERAL',
    domain: 'civil-procedure',
  },
  {
    slug: 'fact-limitation-negligence-claims',
    title: 'Missed limitation periods are the single most common negligence claim against solicitors.',
    body: 'Not lost arguments, not bad drafting. Missed dates. For simple contract the period runs from breach, not from when the client noticed the problem, which is precisely how they get missed.',
    whyItMatters:
      'Diarise the limitation date at the first client meeting, before you do anything else on the file.',
    jurisdiction: 'AU_GENERAL',
    domain: 'civil-procedure',
  },
  {
    slug: 'fact-costs-shortfall',
    title: 'Winning your case does not mean your legal costs are covered.',
    body: 'Costs follow the event, so the losing party ordinarily pays. But an order on the standard basis typically recovers well short of what a client has actually been billed. The gap is real and it is the client’s to bear.',
    whyItMatters:
      'A client who believes winning is free will be angry at the end of a case they won. Have the conversation at the beginning.',
    jurisdiction: 'AU_GENERAL',
    domain: 'civil-procedure',
  },
  {
    slug: 'fact-possession-custody-power',
    title: 'Discovery reaches documents your client does not physically hold.',
    body: 'The formula is “possession, custody or power”. Power captures documents a party has a presently enforceable right to obtain: records held by their own accountant, or by a company they control. The medium is irrelevant; electronic documents are documents.',
    whyItMatters:
      'Clients say “I don’t have those” when they mean “they’re with my bookkeeper”. Those are still discoverable.',
    jurisdiction: 'AU_GENERAL',
    domain: 'civil-procedure',
  },
  {
    slug: 'fact-pleadings-facts-not-evidence',
    title: 'A pleading states facts. Not evidence, and not law.',
    body: 'A statement of claim pleads the material facts which, if proved, establish the cause of action. The documents and testimony that will prove them belong at trial. The legal argument belongs in submissions.',
    whyItMatters:
      'Clients want the pleading to tell the whole story of how badly they were treated. An overloaded pleading is vulnerable to strike out and hands the other side a map of your evidence.',
    jurisdiction: 'AU_GENERAL',
    domain: 'civil-procedure',
  },
  {
    slug: 'fact-leading-questions-split',
    title: 'The same question is forbidden in chief and standard in cross-examination.',
    body: 'Leading questions (those suggesting the answer, or assuming a disputed fact) are generally not permitted when examining your own witness, and are the ordinary tool when examining the other side’s. Your witness tells the story; their witness answers your propositions.',
    jurisdiction: 'AU_GENERAL',
    domain: 'advocacy',
    sourceReference: 'Evidence Act 1995 (Cth) ss 37, 42',
  },
  {
    slug: 'fact-conduct-money',
    title: 'A subpoena served without conduct money is generally unenforceable.',
    body: 'Conduct money is an amount provided to the recipient, sufficient to meet the reasonable expenses of complying: travel, or locating and copying documents. It must be provided a reasonable time before the date for compliance.',
    whyItMatters:
      'Forget it and the documents may simply not arrive on the return date. That is an adjournment, a wasted appearance, and an awkward call to the client.',
    jurisdiction: 'AU_GENERAL',
    domain: 'civil-procedure',
  },
  {
    slug: 'fact-fishing-expedition',
    title: 'A subpoena proves a case. It does not go looking for one.',
    body: 'A subpoena must identify documents with apparent relevance to the issues on the pleadings, and the issuing party must be able to articulate a legitimate forensic purpose. One framed broadly enough to discover whether a case exists is a fishing expedition and an abuse of process.',
    jurisdiction: 'AU_GENERAL',
    domain: 'civil-procedure',
  },
  {
    slug: 'fact-dominant-purpose',
    title: 'Privilege turns on one question: why did this document come into existence?',
    body: 'Both advice privilege and litigation privilege apply a dominant purpose test. Other purposes may coexist so long as they are subordinate. A report commissioned principally for safety improvement is not privileged; the same report commissioned principally for legal advice on anticipated proceedings generally is.',
    whyItMatters:
      'The advice given in the hours after an incident (who commissions the report, and why) determines whether it is discoverable a year later. That call is often taken by a junior.',
    jurisdiction: 'CTH',
    domain: 'evidence',
    sourceReference: 'Evidence Act 1995 (Cth) ss 118–119',
  },
  {
    slug: 'fact-high-court-seven',
    title: 'The Constitution never fixed the number of High Court justices.',
    body: 'Section 71 requires a Chief Justice and at least two other justices, leaving the rest to Parliament. The Court began with three in 1903 and has had seven since 1946, now fixed by the High Court of Australia Act 1979.',
    jurisdiction: 'AU_GENERAL',
    court: 'High Court of Australia',
    domain: 'court-system',
    sourceReference: 'Constitution s 71; High Court of Australia Act 1979 (Cth)',
  },
  {
    slug: 'fact-high-court-canberra',
    title: 'The High Court had no permanent home for its first 77 years.',
    body: 'Established in 1903, it sat in borrowed courtrooms in Melbourne and Sydney and travelled to hear appeals. Its building on the shore of Lake Burley Griffin in Canberra opened in 1980.',
    jurisdiction: 'AU_GENERAL',
    court: 'High Court of Australia',
    domain: 'court-system',
    sourceUrl: 'https://www.hcourt.gov.au/',
  },
  {
    slug: 'fact-special-leave-filter',
    title: 'An appeal to the High Court is a filtered jurisdiction, not the next rung.',
    body: 'Special leave must be granted first, and it is discretionary, reserved broadly for questions of public importance, points on which appellate courts differ, and cases where the administration of justice requires intervention. Most applications are refused.',
    whyItMatters:
      'Telling a client they “have an appeal” to the High Court, when what they have is a discretionary application with a low success rate, is a negligence risk.',
    jurisdiction: 'AU_GENERAL',
    court: 'High Court of Australia',
    domain: 'court-system',
    sourceReference: 'Judiciary Act 1903 (Cth) s 35A',
  },
  {
    slug: 'fact-your-worship-gone',
    title: '“Your Worship” has been retired from Australian courts.',
    body: 'It was once the form of address for magistrates. Contemporary Australian practice is “Your Honour” for judges and magistrates alike. “My Lord” belongs to the English tradition and is not used here.',
    jurisdiction: 'AU_GENERAL',
    domain: 'court-system',
  },
  {
    slug: 'fact-high-court-wigs',
    title: 'The High Court stopped wearing wigs in 1988.',
    body: 'The Court abandoned the traditional horsehair wig, and counsel appearing before it followed. Practice varies elsewhere: some Australian courts have retained wigs, others have removed them, and several leave it to the presiding judge.',
    whyItMatters:
      'Court dress requirements differ by court and sometimes by list. Check the practice note before your first appearance rather than after it.',
    jurisdiction: 'AU_GENERAL',
    court: 'High Court of Australia',
    domain: 'court-system',
  },
  {
    slug: 'fact-open-justice',
    title: 'Courts sit in public as a matter of principle, not convenience.',
    body: 'Open justice is a fundamental attribute of a court: proceedings are held in open court, evidence is given publicly, and judgments are delivered publicly. Departures (suppression orders, closed courts, pseudonyms) are exceptions requiring justification, not discretionary courtesies.',
    whyItMatters:
      'A client who assumes their dispute will stay private needs to be told otherwise early, because that assumption sometimes changes whether they want to litigate at all.',
    jurisdiction: 'AU_GENERAL',
    domain: 'court-system',
    sourceReference: 'Scott v Scott [1913] AC 417; Russell v Russell (1976) 134 CLR 495',
  },
  {
    slug: 'fact-model-litigant',
    title: 'Government parties are held to a higher standard than everyone else.',
    body: 'Commonwealth and state model litigant obligations require government parties to act honestly and fairly, not to take purely technical points, to keep costs to a minimum, and not to rely on a limitation defence without proper consideration.',
    whyItMatters:
      'If you act against a government party, these obligations are a legitimate part of your armoury. If you act for one, they constrain what you may do on instructions.',
    jurisdiction: 'CTH',
    domain: 'civil-procedure',
    sourceReference: 'Legal Services Directions 2017 (Cth) Appendix B',
  },
  {
    slug: 'fact-civil-juries-rare',
    title: 'Most Australian civil trials are decided by a judge alone.',
    body: 'Civil juries have been narrowed substantially across Australian jurisdictions, and availability now varies considerably between them, defamation being the most familiar surviving example in some states. The default expectation in a commercial dispute is a judge sitting alone.',
    jurisdiction: 'AU_GENERAL',
    domain: 'court-system',
  },
  {
    slug: 'fact-ex-tempore',
    title: '“At first instance”, “ex tempore” and “reserved” describe three different things.',
    body: 'First instance identifies the original hearing rather than an appeal. Ex tempore means reasons delivered immediately, without adjourning. Reserved means the judge took the matter away to write. A judgment can be any combination of these.',
    whyItMatters:
      'Reading case law fluently means knowing which layer of a case you are looking at, and how much weight the reasons were given time to bear.',
    jurisdiction: 'AU_GENERAL',
    domain: 'court-system',
  },
  {
    slug: 'fact-interlocutory-leave',
    title: 'Most procedural rulings cannot simply be appealed.',
    body: 'Appeals against interlocutory decisions (those not finally determining the parties’ rights) generally require leave. The point is to stop proceedings being fragmented by an appeal against every ruling along the way. Usually the point is preserved for any appeal from the final judgment instead.',
    jurisdiction: 'AU_GENERAL',
    domain: 'court-system',
  },
  {
    slug: 'fact-summary-judgment-victoria',
    title: 'Victoria deliberately lowered the bar for summary judgment.',
    body: 'The Civil Procedure Act 2010 (Vic) allows summary judgment where a claim or defence has “no real prospect of success”. That was a considered legislative departure from the older common law test, which required a case to be so obviously untenable it could not possibly succeed.',
    whyItMatters:
      'Applying the old common law formula in Victoria understates your client’s prospects. Always advise on the test in the jurisdiction you are actually in.',
    jurisdiction: 'VIC',
    domain: 'civil-procedure',
    sourceReference: 'Civil Procedure Act 2010 (Vic) s 63',
  },
  {
    slug: 'fact-witness-preparation-line',
    title: 'You may prepare a witness. You may not tell them what their evidence is.',
    body: 'Explaining the process, taking a witness through the documents, testing their recollection against the material: all proper, and expected. Suggesting the content of their answers is coaching, and it is misconduct.',
    whyItMatters:
      'Witness preparation is delegated to juniors constantly. Crossing this line usually emerges in cross-examination, and it destroys the client’s case along with your career.',
    jurisdiction: 'AU_GENERAL',
    domain: 'advocacy',
    sourceReference: 'Australian Solicitors’ Conduct Rules r 24',
  },
  {
    slug: 'fact-no-personal-opinion',
    title: 'An advocate may not tell a court they believe their own client.',
    body: 'Expressing a personal opinion on the merits or on a witness’s credibility confuses the advocate’s role with the witness’s. The correct form is “the court would accept this evidence because…”, never “I believe my client”.',
    whyItMatters:
      'It reads instantly as inexperience, and it puts your own credibility in issue when your credibility was never the point.',
    jurisdiction: 'AU_GENERAL',
    domain: 'advocacy',
    sourceReference: 'Australian Solicitors’ Conduct Rules r 17',
  },
  {
    slug: 'fact-concession-currency',
    title: 'A well-made concession is worth more than the point it costs.',
    body: 'Judges give weight to counsel who tell them when a point is against them. An advocate who fights an obviously bad position invites doubt about their judgment across the whole of the argument.',
    whyItMatters:
      'Credibility is an advocate’s working capital, and it is spent or earned in exactly these moments.',
    jurisdiction: 'AU_GENERAL',
    domain: 'advocacy',
  },
  {
    slug: 'fact-judicial-question-signal',
    title: 'An interruption from the bench is the best information you will get all day.',
    body: 'A judge’s question tells you what is actually worrying them, which matters more than your outline. Answer it directly, ideally beginning with yes or no, then give the reason, then return to your structure.',
    whyItMatters:
      'Deferring a question until you “reach that part” reads as evasion, and wastes the one clear signal you were given about what will decide the case.',
    jurisdiction: 'AU_GENERAL',
    domain: 'advocacy',
  },
  {
    slug: 'fact-particulars-cannot-expand',
    title: 'Particulars explain a case. They cannot enlarge one.',
    body: 'Particulars give detail of an allegation already pleaded: dates, representations, the respects in which conduct is said to have been negligent. A party cannot use them to introduce a cause of action that was never pleaded.',
    whyItMatters:
      'A request for further and better particulars is often the cheapest effective move against a thin pleading. What the other side commits to is frequently narrower than the pleading suggested.',
    jurisdiction: 'AU_GENERAL',
    domain: 'civil-procedure',
  },
  {
    slug: 'fact-relief-first',
    title: 'Draft the orders you want before you draft anything else.',
    body: 'A court will generally not grant relief that has not been sought. Writing the relief claimed first forces you to be precise about the outcome you are pursuing, and everything else in the document then works backwards from it.',
    jurisdiction: 'AU_GENERAL',
    domain: 'drafting',
  },
  {
    slug: 'fact-business-records-limit',
    title: 'The business records exception stops at the moment a dispute starts.',
    body: 'Section 69 of the uniform Evidence Acts lets records kept in the course of a business in as an exception to hearsay. But it does not apply to a representation prepared in connection with, or in contemplation of, a proceeding.',
    whyItMatters:
      'The file note written once a dispute was on foot is exactly the document you most want in, and exactly the one the exception was drafted to keep out.',
    jurisdiction: 'CTH',
    domain: 'evidence',
    sourceReference: 'Evidence Act 1995 (Cth) s 69',
  },
  {
    slug: 'fact-relevance-low-bar',
    title: 'The relevance threshold is far lower than most people object as though it were.',
    body: 'Evidence is relevant if, were it accepted, it could rationally affect the assessment of the probability of a fact in issue. It need not prove anything by itself, and the court assumes for this purpose that it would be accepted.',
    whyItMatters:
      'Objections framed as “that’s not relevant” usually fail. The real objection is almost always a specific exclusionary rule; name it.',
    jurisdiction: 'CTH',
    domain: 'evidence',
    sourceReference: 'Evidence Act 1995 (Cth) ss 55–56',
  },
  {
    slug: 'fact-hearsay-purpose',
    title: 'Whether something is hearsay depends on why you are leading it.',
    body: 'The rule excludes a previous representation only where it is tendered to prove a fact the person intended to assert. The same words led to prove that they were spoken (that a manager was put on notice, say) are not caught at all.',
    whyItMatters:
      'The non-hearsay purpose regularly gets in material an opponent assumed was inadmissible. It works both ways, so you need to spot it being used against you.',
    jurisdiction: 'CTH',
    domain: 'evidence',
    sourceReference: 'Evidence Act 1995 (Cth) s 59',
  },
  {
    slug: 'fact-expert-not-qualification',
    title: 'Expertise is not the same thing as a qualification.',
    body: 'The specialised knowledge exception asks whether the witness has knowledge based on training, study or experience, and whether the opinion is wholly or substantially based on that knowledge. A degree is evidence of the first and says nothing about the second.',
    whyItMatters:
      'Expert reports are most often vulnerable because they never expose the reasoning connecting the expertise to the conclusion. That is where to read, and what to avoid in your own expert’s report.',
    jurisdiction: 'CTH',
    domain: 'evidence',
    sourceReference: 'Evidence Act 1995 (Cth) ss 76, 79',
  },
  {
    slug: 'fact-take-instructions',
    title: 'Asking the court for a moment to take instructions never counts against you.',
    body: 'Courts grant short adjournments for this routinely and think nothing of it. Agreeing to something outside your instructions exposes both you and the client; refusing outright when the client might well have agreed serves them no better.',
    whyItMatters:
      'Juniors avoid asking because they fear looking unprepared. It looks careful. Committing a client to something you were never authorised to agree does not.',
    jurisdiction: 'AU_GENERAL',
    domain: 'advocacy',
  },
];
