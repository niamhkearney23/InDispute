/**
 * Says so when the website's server runs in a different place from the one
 * this firm's copy is set up for.
 *
 * Each firm's database sits near the firm (Singapore for a Malaysian firm,
 * Sydney for an Australian one), and the server that reads it should sit in
 * the same place: for speed, and because every request otherwise carries the
 * firm's people's details to another country and back. The region is a
 * setting on each firm's Vercel project, not in the code, because one code
 * base serves both countries. EXPECTED_FUNCTION_REGION names the one this
 * copy should run in (sin1 or syd1); Vercel tells the server where it is
 * actually running (VERCEL_REGION).
 */
export function regionProblem(env: Record<string, string | undefined> = process.env): string | null {
  if (env.VERCEL !== '1') return null;
  const expected = env.EXPECTED_FUNCTION_REGION?.trim();
  const actual = env.VERCEL_REGION?.trim();
  if (!expected) {
    return 'This copy has not been told which region its server should run in. Set EXPECTED_FUNCTION_REGION in Vercel (sin1 for a Malaysian firm, syd1 for an Australian one).';
  }
  if (actual && actual !== expected) {
    return `The server is running in ${actual}, but this firm's copy should run in ${expected}. In Vercel, open the project, Settings, Functions, and set the Function Region to ${expected}, then redeploy.`;
  }
  return null;
}
