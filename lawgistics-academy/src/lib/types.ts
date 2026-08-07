export type CareerStage =
  | 'law_student'
  | 'plt_student'
  | 'graduate'
  | 'junior_lawyer'
  | 'other';

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
  | 'NT';

export type QuestionType = 'multiple_choice' | 'true_false' | 'scenario';

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

export const JURISDICTION_LABELS: Record<Jurisdiction, string> = {
  AU_GENERAL: 'Australia — general principle',
  CTH: 'Commonwealth',
  NSW: 'New South Wales',
  VIC: 'Victoria',
  QLD: 'Queensland',
  WA: 'Western Australia',
  SA: 'South Australia',
  TAS: 'Tasmania',
  ACT: 'Australian Capital Territory',
  NT: 'Northern Territory',
};

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
