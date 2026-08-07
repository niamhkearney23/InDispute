import { MASTERY } from './config';
import type { ConfidenceLevel } from '@/lib/types';

/**
 * Mastery is an exponentially-weighted running score in [0, 100], nudged by how
 * hard the question was and how sure the learner said they were.
 *
 * Pure functions only, the persistence layer lives in the training service.
 */

export interface MasteryState {
  mastery: number;
  attempts: number;
  correct: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  confidentAndWrong: number;
}

export interface MasteryInput {
  isCorrect: boolean;
  confidence: ConfidenceLevel | null;
  /** 1–5 */
  difficulty: number;
  /** Relative weight of this concept within the question, from the graph. */
  weight?: number;
}

export function initialMasteryState(): MasteryState {
  return {
    mastery: MASTERY.initial,
    attempts: 0,
    correct: 0,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    confidentAndWrong: 0,
  };
}

function confidenceMultiplier(isCorrect: boolean, confidence: ConfidenceLevel | null): number {
  const table = isCorrect
    ? MASTERY.confidenceWeight.correct
    : MASTERY.confidenceWeight.incorrect;
  if (!confidence) return 1;
  return table[confidence];
}

function difficultyMultiplier(difficulty: number): number {
  const index = Math.min(Math.max(Math.round(difficulty), 1), 5) - 1;
  return MASTERY.difficultyWeight[index];
}

export function applyAttempt(state: MasteryState, input: MasteryInput): MasteryState {
  const weight = input.weight ?? 1;
  const target = input.isCorrect ? 100 : 0;

  const rate =
    MASTERY.learningRate *
    confidenceMultiplier(input.isCorrect, input.confidence) *
    difficultyMultiplier(input.difficulty) *
    weight;

  const bounded = Math.min(rate, 0.85);
  const mastery = Math.round(
    Math.min(100, Math.max(0, state.mastery + (target - state.mastery) * bounded)),
  );

  return {
    mastery,
    attempts: state.attempts + 1,
    correct: state.correct + (input.isCorrect ? 1 : 0),
    consecutiveCorrect: input.isCorrect ? state.consecutiveCorrect + 1 : 0,
    consecutiveIncorrect: input.isCorrect ? 0 : state.consecutiveIncorrect + 1,
    confidentAndWrong:
      state.confidentAndWrong + (!input.isCorrect && input.confidence === 'certain' ? 1 : 0),
  };
}

/**
 * A score is only worth showing once there is enough evidence behind it.
 * Below the threshold we damp towards zero rather than let two lucky answers
 * read as "84, Evidence".
 */
export function displayScore(mastery: number, attempts: number): number {
  if (attempts === 0) return 0;
  if (attempts >= MASTERY.minAttemptsForConfidence) return Math.round(mastery);
  return Math.round(mastery * (attempts / MASTERY.minAttemptsForConfidence));
}

export function masteryBand(score: number): 'weak' | 'developing' | 'strong' {
  if (score <= MASTERY.weaknessThreshold) return 'weak';
  if (score < MASTERY.masteredThreshold) return 'developing';
  return 'strong';
}
