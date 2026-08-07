export type CareerStage =
  | 'law_student'
  | 'plt_student'
  | 'graduate'
  | 'junior_lawyer'
  | 'other';

/**
 * Which legal system a learner is training in.
 *
 * This is not a preference or a display setting. Australian civil procedure and
 * Malaysian civil procedure are different bodies of law, and a question about
 * one is not merely less relevant to the other, it is wrong. So country decides
 * what a learner is ever shown, and it is the first thing onboarding asks.
 */
export type Country = 'AU' | 'MY';

export type Jurisdiction =
  | 'AU_GENERAL'
  | 'CTH'
  | 'NSW'
  | 'VIC'
  | 'QLD'
  | 'WA'
  | 'SA'
  | 'TAS'
  | 'ACT'
  | 'NT'
  | 'MY_GENERAL'
  | 'MY_FEDERAL'
  | 'MY_MALAYA'
  | 'MY_SABAH_SARAWAK';

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'scenario'
  /** Drawn as the court hierarchy; the options are courts. */
  | 'court_hierarchy';

export type QuestionStatus =
  | 'draft'
  | 'requires_review'
  | 'verified'
  | 'published'
  | 'superseded'
  | 'retired';

export type VerificationStatus =
  | 'unverified'
  | 'ai_drafted'
  | 'requires_review'
  | 'human_verified';

export type ConfidenceLevel = 'guess' | 'somewhat_sure' | 'certain';

export type SessionKind = 'diagnostic' | 'daily' | 'review' | 'practice';

export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

export type SelectionReason =
  | 'weakness'
  | 'due_review'
  | 'new_material'
  | 'reinforcement'
  | 'diagnostic_spread';

export type XpKind =
  | 'correct_answer'
  | 'hard_question_bonus'
  | 'session_complete'
  | 'perfect_session'
  | 'streak_bonus'
  | 'diagnostic_complete';

export interface QuestionOption {
  id: string;
  text: string;
}

/** Exactly what the browser is allowed to hold before an answer is submitted. */
export interface DeliveredQuestion {
  questionId: string;
  questionVersionId: string;
  position: number;
  questionType: QuestionType;
  scenario: string | null;
  stem: string;
  options: QuestionOption[];
  difficulty: number;
  jurisdiction: Jurisdiction;
  court: string | null;
  domainName: string;
  domainSlug: string;
}

/** What comes back after grading. */
export interface AnswerFeedback {
  isCorrect: boolean;
  correctOptionIds: string[];
  selectedOptionIds: string[];
  explanation: string;
  whyItMatters: string | null;
  commonMisconception: string | null;
  memoryTrick: string | null;
  jurisdiction: Jurisdiction;
  court: string | null;
  sourceReference: string | null;
  sourceUrl: string | null;
  xpAwarded: number;
  nextReviewLabel: string | null;
  /** Present only when the optional AI coach is configured and succeeds. */
  coachNote: string | null;
}

export interface SkillMapEntry {
  slug: string;
  name: string;
  score: number;
  attempts: number;
}

export const CAREER_STAGE_LABELS: Record<CareerStage, string> = {
  law_student: 'Law student',
  plt_student: 'PLT student',
  graduate: 'Graduate',
  junior_lawyer: 'Junior lawyer',
  other: 'Other',
};

export const COUNTRY_LABELS: Record<Country, string> = {
  AU: 'Australia',
  MY: 'Malaysia',
};

export const COUNTRIES: Country[] = ['AU', 'MY'];

export const JURISDICTION_LABELS: Record<Jurisdiction, string> = {
  AU_GENERAL: 'Australia, general principle',
  CTH: 'Commonwealth',
  NSW: 'New South Wales',
  VIC: 'Victoria',
  QLD: 'Queensland',
  WA: 'Western Australia',
  SA: 'South Australia',
  TAS: 'Tasmania',
  ACT: 'Australian Capital Territory',
  NT: 'Northern Territory',
  MY_GENERAL: 'Malaysia, general principle',
  MY_FEDERAL: 'Malaysia, federal',
  MY_MALAYA: 'Peninsular Malaysia',
  MY_SABAH_SARAWAK: 'Sabah and Sarawak',
};

/**
 * Which country each jurisdiction belongs to. Everything that decides what a
 * learner sees reads this, so a new jurisdiction cannot be added without
 * saying where it belongs: the type will not compile until it is listed.
 */
export const JURISDICTION_COUNTRY: Record<Jurisdiction, Country> = {
  AU_GENERAL: 'AU',
  CTH: 'AU',
  NSW: 'AU',
  VIC: 'AU',
  QLD: 'AU',
  WA: 'AU',
  SA: 'AU',
  TAS: 'AU',
  ACT: 'AU',
  NT: 'AU',
  MY_GENERAL: 'MY',
  MY_FEDERAL: 'MY',
  MY_MALAYA: 'MY',
  MY_SABAH_SARAWAK: 'MY',
};

export const JURISDICTIONS_BY_COUNTRY: Record<Country, Jurisdiction[]> = {
  AU: (Object.keys(JURISDICTION_COUNTRY) as Jurisdiction[]).filter(
    (j) => JURISDICTION_COUNTRY[j] === 'AU',
  ),
  MY: (Object.keys(JURISDICTION_COUNTRY) as Jurisdiction[]).filter(
    (j) => JURISDICTION_COUNTRY[j] === 'MY',
  ),
};

/** The jurisdiction a learner is given before they say anything more specific. */
export const DEFAULT_JURISDICTION: Record<Country, Jurisdiction> = {
  AU: 'AU_GENERAL',
  MY: 'MY_GENERAL',
};

/**
 * Every jurisdiction, as a tuple, for validation schemas.
 *
 * Three server actions were each carrying their own hand-written copy of this
 * list. Adding Malaysia left all three still listing only the Australian
 * values, so an administrator could pick a Malaysian jurisdiction in a form
 * that would then reject it. One list, derived from the map that the type
 * already forces to be complete.
 */
export const JURISDICTION_VALUES = Object.keys(JURISDICTION_COUNTRY) as [
  Jurisdiction,
  ...Jurisdiction[],
];

export function asCountry(value: string | null | undefined): Country {
  return value === 'MY' ? 'MY' : 'AU';
}

export const JURISDICTION_SHORT: Record<Jurisdiction, string> = {
  AU_GENERAL: 'AU',
  CTH: 'Cth',
  NSW: 'NSW',
  VIC: 'Vic',
  QLD: 'Qld',
  WA: 'WA',
  SA: 'SA',
  TAS: 'Tas',
  ACT: 'ACT',
  NT: 'NT',
  MY_GENERAL: 'MY',
  MY_FEDERAL: 'Fed',
  MY_MALAYA: 'Malaya',
  MY_SABAH_SARAWAK: 'Sabah/Swk',
};

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  guess: 'Guess',
  somewhat_sure: 'Somewhat sure',
  certain: 'Certain',
};

export const IMPROVEMENT_GOALS = [
  { slug: 'litigation_knowledge', label: 'Litigation knowledge' },
  { slug: 'court_procedure', label: 'Court procedure' },
  { slug: 'advocacy', label: 'Advocacy' },
  { slug: 'legal_reasoning', label: 'Legal reasoning' },
  { slug: 'drafting', label: 'Drafting' },
  { slug: 'general_confidence', label: 'General legal confidence' },
] as const;

/** Maps an onboarding goal onto the domains it should bias selection towards. */
export const GOAL_TO_DOMAIN_SLUGS: Record<string, string[]> = {
  litigation_knowledge: ['court-system', 'civil-procedure', 'evidence'],
  court_procedure: ['civil-procedure', 'court-system'],
  advocacy: ['advocacy'],
  legal_reasoning: ['legal-reasoning'],
  drafting: ['drafting'],
  general_confidence: ['court-system', 'legal-reasoning'],
};
