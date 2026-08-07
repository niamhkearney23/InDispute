import type { Jurisdiction } from '@/lib/types';

/**
 * Review triage.
 *
 * A hundred and twenty-eight items is more than anyone reviews in one sitting,
 * and they are not equally risky. A statement that the plaintiff bears the onus
 * of proof is hard to get wrong. A statement that a particular rule is numbered
 * 19.6, or that a limitation period is six years, or that a monetary limit sits
 * at a given figure, is easy to get wrong and expensive to get wrong.
 *
 * So the queue leads with the items most likely to contain an error. Someone
 * who gets through forty has then done the forty that mattered, rather than
 * forty alphabetically.
 *
 * These signals are about *checkability*, not about whether the content is
 * actually wrong. Nothing here is a substitute for a person reading it.
 */

export type RiskLevel = 'high' | 'medium' | 'low';

export interface ReviewRisk {
  level: RiskLevel;
  score: number;
  reasons: string[];
}

/** A pinpoint statutory reference: "s 63", "r 19.6", "O 42", "ss 118–119". */
const PROVISION = /\b(s|ss|r|rr|O|Pt|Div|reg)\s?\d+[A-Za-z]*(\.\d+)?\b/;
/** A reported case citation: "(2007) 230 CLR 89", "[1975] 3 All ER 333". */
const CASE_CITATION = /[([]\d{4}[)\]]\s*\d*\s*[A-Z]{2,}/;
/** A bare year, which usually means a commencement or amendment date. */
const YEAR = /\b(18|19|20)\d{2}\b/;
/** A period or count that has to be exactly right. */
const PERIOD = /\b(one|two|three|six|seven|twelve|\d+)\s?(year|month|day|week)s?\b/i;
/** A monetary figure. */
const MONEY = /\$[\d,]+/;

export interface TriageInput {
  text: string;
  jurisdiction: Jurisdiction;
  sourceReference?: string | null;
  sourceUrl?: string | null;
}

export function reviewRisk(input: TriageInput): ReviewRisk {
  const reasons: string[] = [];
  let score = 0;

  const haystack = `${input.text} ${input.sourceReference ?? ''}`;

  if (!input.sourceReference && !input.sourceUrl) {
    score += 4;
    reasons.push('No source recorded — cannot be checked as it stands');
  }

  if (PROVISION.test(haystack)) {
    score += 3;
    reasons.push('Cites a specific provision — check the number and that it is current');
  }

  if (MONEY.test(haystack)) {
    score += 3;
    reasons.push('States a monetary figure — these are adjusted periodically');
  }

  if (PERIOD.test(haystack)) {
    score += 2;
    reasons.push('States a period or count — check it exactly');
  }

  if (CASE_CITATION.test(haystack)) {
    score += 2;
    reasons.push('Cites a case — check the citation and that it has not been overruled');
  }

  if (input.jurisdiction !== 'AU_GENERAL') {
    score += 2;
    reasons.push('Jurisdiction-specific — confirm it is right for that jurisdiction only');
  }

  // Only count a bare year where nothing more specific already fired. Almost
  // every item that cites a provision or a case also carries a year, so
  // counting both just shifts the whole distribution up by one and separates
  // nothing -- which is the opposite of what a triage is for.
  const alreadySpecific = PROVISION.test(haystack) || CASE_CITATION.test(haystack);
  if (!alreadySpecific && YEAR.test(input.text)) {
    score += 1;
    reasons.push('States a date');
  }

  // Calibrated against the shipped bank so that "check closely" is a set
  // someone can actually get through in a sitting, rather than most of it.
  return {
    level: score >= 5 ? 'high' : score >= 3 ? 'medium' : 'low',
    score,
    reasons,
  };
}

export const RISK_LABEL: Record<RiskLevel, string> = {
  high: 'Check closely',
  medium: 'Worth checking',
  low: 'Lower risk',
};
