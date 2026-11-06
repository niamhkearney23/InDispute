import { masteryBand } from '@/lib/learning/mastery';
import { MASTERY } from '@/lib/learning/config';

/**
 * The level a person is at, in a word, and what that word means (the owner,
 * November 2026: "have it clearer, like what skill level you're at, like
 * basic, like have it clearer what it means").
 *
 * It is the share of answers right, cut at the same lines as every score on
 * the page (masteryBand): so "Basic" and a weak area mean the same thing.
 * It describes these questions only, never a person's ability as a lawyer,
 * and the words say so. XP and its game levels are separate: they count
 * effort, not accuracy.
 */

export type SkillLevel = 'basic' | 'intermediate' | 'advanced';

export const SKILL_LEVELS: Record<SkillLevel, { name: string; range: string; meaning: string }> = {
  basic: {
    name: 'Basic',
    range: `Up to ${MASTERY.weaknessThreshold}% right`,
    meaning: 'You are building the foundations. Expect a good number of the daily questions to be new to you.',
  },
  intermediate: {
    name: 'Intermediate',
    range: `${MASTERY.weaknessThreshold + 1} to ${MASTERY.masteredThreshold - 1}% right`,
    meaning: 'You know a good part of the foundations, with gaps in some areas.',
  },
  advanced: {
    name: 'Advanced',
    range: `${MASTERY.masteredThreshold}% right or more`,
    meaning: 'You know most of what was asked. The daily questions keep it sharp.',
  },
};

export const SKILL_LEVEL_ORDER: SkillLevel[] = ['basic', 'intermediate', 'advanced'];

/** The level for a share of answers right, 0 to 100. */
export function skillLevelFor(percentRight: number): SkillLevel {
  const band = masteryBand(percentRight);
  return band === 'weak' ? 'basic' : band === 'developing' ? 'intermediate' : 'advanced';
}

/**
 * Fewer answers than this and a level would say more than it knows: the
 * diagnostic's thirty settle it, a handful does not.
 */
export const LEVEL_MIN_ANSWERS = 20;

/** The level from everything answered so far, or null while there are too few answers. */
export function currentSkillLevel(right: number, answered: number): SkillLevel | null {
  if (answered < LEVEL_MIN_ANSWERS) return null;
  return skillLevelFor(Math.round((right / answered) * 100));
}
