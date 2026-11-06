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
 * A database that has not had 0055 has no such column, and asking for it
 * fails the whole read. Its answer is then read again without the column,
 * and nothing counts as diagnostic-only, which is exactly how it behaved
 * before. Postgres says 42703 for a column that does not exist.
 */
export function missingFlag(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return error.code === '42703' || /diagnostic_only/.test(error.message ?? '');
}
