/**
 * Streak milestones.
 *
 * Three of them, and nothing in between. The point of a streak here is that
 * turning up regularly is how spaced repetition works at all, so it is worth
 * marking when somebody has. What it is not worth doing is reminding them every
 * day that they have something to lose. That is the mechanic that makes people
 * anxious about an app while a partner is waiting on a bundle, and a firm that
 * notices will switch it off.
 *
 * So: said once, when it happens, and never mentioned again until the next one.
 */
export const STREAK_MILESTONES = [7, 30, 100] as const;

export function streakMilestoneLine(streak: number): string {
  if (streak >= 100) {
    return 'A hundred days. Whatever you have been doing, it is working, and the spacing has had long enough to do its part.';
  }
  if (streak >= 30) {
    return 'A month of turning up. This is the point where the questions you got wrong in week one start coming back and feeling easy.';
  }
  return 'A week. Long enough for the first round of things you got wrong to come back around.';
}
