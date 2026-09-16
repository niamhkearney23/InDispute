/**
 * The certification boxes, as data.
 *
 * Fifteen work products, designed by the coach running this program rather
 * than by this codebase, for trainees on real Malaysian lower court files.
 * Fixed content, not something a coach edits day to day: the same reason
 * court-hierarchies.ts is code rather than a database table. If the program
 * itself changes, this file changes with it.
 *
 * Certification is ten boxes at Level 3, and the ten must include every box
 * in the spine (1 to 6) plus at least one advocacy box (11 to 15). See
 * computeCertificationStatus in src/lib/certification/service.ts for exactly
 * how that rule is applied.
 */

export interface CertificationBox {
  number: number;
  cluster: string;
  workProduct: string;
  tickCriteria: string;
  /** Boxes 1 to 6: the investigation-to-chronology spine, all required. */
  isSpine: boolean;
  /** Boxes 11 to 15: at least one is required. */
  isAdvocacy: boolean;
}

export const CERTIFICATION_BOXES: CertificationBox[] = [
  {
    number: 1,
    cluster: 'Fact Investigation',
    workProduct: 'Client Interview & Instructions Record',
    tickCriteria:
      'Produce a same-day attendance note: parties and capacity, the client’s account by topic not by narration, the elements of each cause of action or charge the facts must satisfy, admissions and prior inconsistent statements flagged, documentary list, limitation and notice dates, and a written list of unanswered questions and next steps.',
    isSpine: true,
    isAdvocacy: false,
  },
  {
    number: 2,
    cluster: 'Fact Investigation',
    workProduct: 'Fact Investigation / Evidence Plan',
    tickCriteria:
      'Map every factual element to its proposed proof (witness, document, expert, locus, CCTV, SSM, land, bank, PDRM or medical records), identify what is missing, and issue a request list with owner and deadline.',
    isSpine: true,
    isAdvocacy: false,
  },
  {
    number: 3,
    cluster: 'Fact Investigation',
    workProduct: 'Witness Interview Note & Reliability Assessment',
    tickCriteria:
      'Record what the witness proves, denies or cannot recall; assess credibility, hostility and relationship to parties; and state whether a statement or subpoena is needed.',
    isSpine: true,
    isAdvocacy: false,
  },
  {
    number: 4,
    cluster: 'Law Investigation',
    workProduct: 'Legal Research & Case Theory Memorandum',
    tickCriteria:
      'List every ingredient of the cause of action, charge or defence with statutory basis and at least two or three local authorities, including the adverse authority; state limitation period, burden and standard of proof, quantum or plea or sentence range; and give one reasoned strategy recommendation with candid weaknesses.',
    isSpine: true,
    isAdvocacy: false,
  },
  {
    number: 5,
    cluster: 'Chronology & Case Management',
    workProduct: 'Master Chronology of Facts',
    tickCriteria:
      'Date every entry with its source (document page or witness) and pleading cross-reference; label each entry undisputed, disputed or to be investigated; and identify the pivotal dates and the limitation cut-off.',
    isSpine: true,
    isAdvocacy: false,
  },
  {
    number: 6,
    cluster: 'Chronology & Case Management',
    workProduct: 'Procedural Chronology & Case Management Plan',
    tickCriteria:
      'Mirror the real procedural history (cause papers, service, defence, case management dates, discovery, witness statements, hearing dates, appeal window) and forward-plan every remaining step with owner, deadline and contingency.',
    isSpine: true,
    isAdvocacy: false,
  },
  {
    number: 7,
    cluster: 'Pleadings & Interlocutory Process',
    workProduct: 'Originating Process + Statement of Claim (or Defence / Counterclaim / Reply)',
    tickCriteria:
      'Plead material facts and not evidence; correct particulars and prayers; jurisdiction and limitation addressed; the draft survives the coach’s strike-out test (O 18 r 19 ROC 2012).',
    isSpine: false,
    isAdvocacy: false,
  },
  {
    number: 8,
    cluster: 'Pleadings & Interlocutory Process',
    workProduct: 'Further & Better Particulars / Interrogatories / Discovery Request',
    tickCriteria:
      'Tie every request to a pleaded issue; targeted, not fishing; correct form of request.',
    isSpine: false,
    isAdvocacy: false,
  },
  {
    number: 9,
    cluster: 'Pleadings & Interlocutory Process',
    workProduct:
      'Notice of Application + Affidavit in Support (e.g. O 14 summary judgment, striking out, injunction, discovery, substituted service)',
    tickCriteria:
      'Invoke the correct rule; precise prayers; exhibits annexed and referenced in the body; deponent competent and personally acquainted with the facts.',
    isSpine: false,
    isAdvocacy: false,
  },
  {
    number: 10,
    cluster: 'Evidence Documents',
    workProduct: 'Witness Statement (examination-in-chief)',
    tickCriteria:
      'First-person, admissible, sequenced to the chronology and the elements, no argument or law; anticipates cross-examination; exhibit list appended.',
    isSpine: false,
    isAdvocacy: false,
  },
  {
    number: 11,
    cluster: 'Evidence Documents',
    workProduct: 'Bundle of Documents / Agreed Bundle + Index',
    tickCriteria:
      'Paginated and indexed; admissibility and authenticity issues noted in advance (marking, objections); gaps in the chain identified.',
    isSpine: false,
    isAdvocacy: true,
  },
  {
    number: 12,
    cluster: 'Evidence Documents',
    workProduct: 'Written Submissions (final)',
    tickCriteria:
      'Frame the issues; apply law to proved facts; meet the opponent’s strongest point head-on; correct burden and standard; remedies or sentence sought; authorities cited with pinpoint and proposition.',
    isSpine: false,
    isAdvocacy: true,
  },
  {
    number: 13,
    cluster: 'Electives',
    workProduct: 'Affidavit in Reply / Affidavit of Service',
    tickCriteria: 'Answer point-by-point; no hearsay, submission or opinion (O 41 r 5 ROC 2012).',
    isSpine: false,
    isAdvocacy: true,
  },
  {
    number: 14,
    cluster: 'Electives',
    workProduct: 'Skeleton Argument / Oral Submission Note',
    tickCriteria: 'Two pages, hierarchical points, time estimate, answers to foreseen questions.',
    isSpine: false,
    isAdvocacy: true,
  },
  {
    number: 15,
    cluster: 'Electives',
    workProduct:
      'Enforcement or Appeal Step: WSS + Judgment Debtor Summons, or Notice of Appeal, or assessment of damages / bill of costs',
    tickCriteria:
      'Correct mode and timelines; registry filing requirements (fees, copies, service) checked off.',
    isSpine: false,
    isAdvocacy: true,
  },
];

export const SPINE_BOX_NUMBERS = CERTIFICATION_BOXES.filter((b) => b.isSpine).map(
  (b) => b.number,
);

export const CERTIFICATION_BOXES_REQUIRED_COUNT = 10;

export function certificationBox(number: number): CertificationBox | undefined {
  return CERTIFICATION_BOXES.find((b) => b.number === number);
}
