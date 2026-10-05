/**
 * Whether the right answer gives itself away by being the long one.
 *
 * Question writers tend to make the right answer the careful, qualified one,
 * and so the longest: in this bank it was the longest in nearly four of every
 * five questions. A learner who notices can score without knowing the law,
 * and shuffling the order does not help, because length travels with the
 * answer. The fix is in the wording, so it is the reviewer's to make: this
 * only points at the questions that need it, on the screen where they are
 * signed off.
 *
 * Flagged when there is one right answer and it is at least 30% longer than
 * the longest of the others.
 */
export function longAnswerCue(
  options: Array<{ id: string; text: string }>,
  correctOptionIds: string[],
): boolean {
  if (correctOptionIds.length !== 1 || options.length < 3) return false;
  const right = options.find((o) => o.id === correctOptionIds[0]);
  if (!right) return false;
  const longestOther = Math.max(
    ...options.filter((o) => o.id !== right.id).map((o) => o.text.trim().length),
  );
  return right.text.trim().length >= 1.3 * longestOther;
}
