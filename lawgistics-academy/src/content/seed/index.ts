import { CONCEPTS, DOMAINS, SKILLS } from './taxonomy';
import { COURT_SYSTEM_QUESTIONS } from './questions/court-system';
import { CIVIL_PROCEDURE_QUESTIONS } from './questions/civil-procedure';
import { EVIDENCE_QUESTIONS } from './questions/evidence';
import { ADVOCACY_QUESTIONS } from './questions/advocacy';
import { DRAFTING_QUESTIONS } from './questions/drafting';
import { LEGAL_REASONING_QUESTIONS } from './questions/legal-reasoning';
import { FACTS } from './facts';
import type { SeedQuestion } from './types';

export const QUESTIONS: SeedQuestion[] = [
  ...COURT_SYSTEM_QUESTIONS,
  ...CIVIL_PROCEDURE_QUESTIONS,
  ...EVIDENCE_QUESTIONS,
  ...ADVOCACY_QUESTIONS,
  ...DRAFTING_QUESTIONS,
  ...LEGAL_REASONING_QUESTIONS,
];

export { CONCEPTS, DOMAINS, SKILLS, FACTS };
export * from './types';
export type { SeedFact } from './facts';

/**
 * Structural checks on the seed content. These catch the errors that would
 * otherwise surface as a broken session: a question pointing at a concept that
 * does not exist, an answer key referring to an option that was renamed, a
 * duplicate slug quietly overwriting an earlier question.
 *
 * Legal accuracy is a separate question and is not something a script can
 * check. That is what the admin verification workflow is for.
 */
export function validateSeed(): string[] {
  const errors: string[] = [];

  const domainSlugs = new Set(DOMAINS.map((d) => d.slug));
  const conceptSlugs = new Set(CONCEPTS.map((c) => c.slug));
  const skillSlugs = new Set(SKILLS.map((s) => s.slug));
  const seenQuestionSlugs = new Set<string>();

  for (const concept of CONCEPTS) {
    if (!domainSlugs.has(concept.domain)) {
      errors.push(`Concept "${concept.slug}" references unknown domain "${concept.domain}"`);
    }
  }

  for (const question of QUESTIONS) {
    const where = `Question "${question.slug}"`;

    if (seenQuestionSlugs.has(question.slug)) {
      errors.push(`${where} has a duplicate slug`);
    }
    seenQuestionSlugs.add(question.slug);

    if (!domainSlugs.has(question.domain)) {
      errors.push(`${where} references unknown domain "${question.domain}"`);
    }

    const optionIds = new Set(question.options.map((o) => o.id));
    if (optionIds.size !== question.options.length) {
      errors.push(`${where} has duplicate option ids`);
    }
    if (question.options.length < 2) {
      errors.push(`${where} has fewer than two options`);
    }
    if (question.correct.length === 0) {
      errors.push(`${where} has no correct answer`);
    }
    for (const id of question.correct) {
      if (!optionIds.has(id)) {
        errors.push(`${where} marks unknown option "${id}" as correct`);
      }
    }
    if (question.correct.length === question.options.length) {
      errors.push(`${where} marks every option as correct`);
    }

    if (question.concepts.length === 0) {
      errors.push(`${where} is not linked to any concept — it cannot drive mastery`);
    }
    for (const slug of question.concepts) {
      if (!conceptSlugs.has(slug)) {
        errors.push(`${where} references unknown concept "${slug}"`);
      }
    }

    if (question.skills.length === 0) {
      errors.push(`${where} is not linked to any skill`);
    }
    for (const slug of question.skills) {
      if (!skillSlugs.has(slug)) {
        errors.push(`${where} references unknown skill "${slug}"`);
      }
    }
  }

  const seenFactSlugs = new Set<string>();
  for (const fact of FACTS) {
    const where = `Fact "${fact.slug}"`;

    if (seenFactSlugs.has(fact.slug)) errors.push(`${where} has a duplicate slug`);
    seenFactSlugs.add(fact.slug);

    if (fact.domain && !domainSlugs.has(fact.domain)) {
      errors.push(`${where} references unknown domain "${fact.domain}"`);
    }
    if (fact.title.length < 10) errors.push(`${where} has no real title`);
    if (fact.body.length < 60) errors.push(`${where} has a thin body`);
  }

  // The diagnostic spreads round-robin across domains, so a domain with too
  // few questions produces a lopsided paper.
  for (const domain of DOMAINS) {
    const count = QUESTIONS.filter((q) => q.domain === domain.slug).length;
    if (count < 5) {
      errors.push(
        `Domain "${domain.slug}" has only ${count} questions — the diagnostic needs at least 5 per domain`,
      );
    }
  }

  return errors;
}
