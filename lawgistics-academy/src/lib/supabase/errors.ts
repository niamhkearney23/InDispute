/**
 * Whether an RPC failed because the function does not exist on this
 * database (it predates the migration that adds it), as opposed to failing
 * for any other reason. PostgREST says PGRST202 when its schema cache has no
 * such function; Postgres itself says 42883. Only that case may fall back to
 * an older way of working the figure out: a timeout or a missing key is not
 * a reason to show a different number.
 */
export function functionMissing(
  error: { code?: string; message?: string } | null | undefined,
): boolean {
  if (!error) return false;
  if (error.code === 'PGRST202' || error.code === '42883') return true;
  const message = (error.message ?? '').toLowerCase();
  return (
    message.includes('could not find the function') ||
    (message.includes('function') &&
      (message.includes('not found') || message.includes('does not exist')))
  );
}
