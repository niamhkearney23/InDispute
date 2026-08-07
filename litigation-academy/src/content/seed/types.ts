import type { Jurisdiction, QuestionType } from '@/lib/types';

export interface SeedDomain {
  slug: string;
  name: string;
  description: string;
}

export interface SeedConcept {
  slug: string;
  domain: string;
  name: string;
  description: string;
}

export interface SeedSkill {
  slug: string;
  name: string;
  description: string;
}

export interface SeedQuestion {
  slug: string;
  domain: string;
  type: QuestionType;
  /** 1 (foundational) to 5 (genuinely hard) */
  difficulty: 1 | 2 | 3 | 4 | 5;
  jurisdiction: Jurisdiction;
  court?: string;

  scenario?: string;
  stem: string;
  options: Array<{ id: string; text: string }>;
  correct: string[];

  explanation: string;
  whyItMatters: string;
  commonMisconception?: string;
  memoryTrick?: string;

  concepts: string[];
  skills: string[];

  sourceReference?: string;
  sourceUrl?: string;
}

export const TRUE_FALSE_OPTIONS = [
  { id: 'true', text: 'True' },
  { id: 'false', text: 'False' },
];
