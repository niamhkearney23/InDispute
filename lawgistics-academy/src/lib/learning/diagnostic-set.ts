/**
 * The diagnostic's own questions (0055; the owner, November 2026: "can the
 * diagnostic questions be totally different from the learning and other
 * questions?").
 *
 * A question marked diagnostic-only is asked in the diagnostic and nowhere
 * else: never in daily training, a module or a review, and never counted
 * towards a module. The diagnostic draws on them alone once a country has
 * enough published to fill a paper; until then it draws on the whole bank,
 * as it always did, so nobody is held on a diagnostic that cannot be set.
 *
 * Pure, so the rule can be tested; the reading is in selection.ts.
 */

export interface MaybeDiagnostic {
  diagnosticOnly: boolean;
}

/** The questions training, modules and reviews may use. */
export function forTraining<Q extends MaybeDiagnostic>(bank: Q[]): Q[] {
  return bank.filter((q) => !q.diagnosticOnly);
}

/**
 * The questions the diagnostic draws on: the diagnostic-only ones when there
 * are at least a paper's worth, otherwise the whole bank.
 */
export function forDiagnostic<Q extends MaybeDiagnostic>(bank: Q[], paper: number): Q[] {
  const own = bank.filter((q) => q.diagnosticOnly);
  return own.length >= paper ? own : bank;
}

/**
 * A retake's questions. The diagnostic's own set is about a paper's worth,
 * so drawing on it again gave back nearly the paper the person had already
 * sat and seen explained, and the level rose on memory (the audit, November
 * 2026). A retake leaves out every question asked in an earlier diagnostic:
 * the unseen ones of the diagnostic's own when there are a paper's worth,
 * otherwise every unseen question in the bank. Only when not even that fills
 * a paper are repeats unavoidable, and then it is drawn as a first sitting.
 */
export function forRetake<Q extends MaybeDiagnostic & { questionId: string }>(
  bank: Q[],
  paper: number,
  askedBefore: ReadonlySet<string>,
): Q[] {
  const fresh = bank.filter((q) => !askedBefore.has(q.questionId));
  return fresh.length >= paper ? forDiagnostic(fresh, paper) : forDiagnostic(bank, paper);
}

/**
 * A database that has not had 0055 has no such column, and asking for it
 * fails the whole read. Its answer is then read again without the column,
 * and nothing counts as diagnostic-only, which is exactly how it behaved
 * before. Postgres says 42703 for a column that does not exist (PostgREST
 * PGRST204 for one missing from its cache), and the message names it.
 *
 * Only that case. The read again without the column treats every question
 * as an ordinary one, so taking any other failure for an old database would
 * hand the diagnostic set to daily training and modules (the audit,
 * November 2026). Anything else fails as a failure.
 */
export function missingFlag(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (error.code === '42703' || error.code === 'PGRST204') && /diagnostic_only/.test(error.message ?? '');
}
