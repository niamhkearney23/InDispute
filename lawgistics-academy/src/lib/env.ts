/**
 * Public settings, in one place, with loud failures.
 *
 * This file reaches the browser: the Supabase browser client imports it. So
 * it holds only NEXT_PUBLIC_ values and nothing else. The service role key
 * and the AI keys live in `env-server.ts`, which carries `import 'server-only'`
 * so that a page importing it by mistake fails the build rather than shipping
 * the names, or worse, the values.
 */

/**
 * A setting the deployment is missing. Its message is written for the person
 * who has to fix it, so it is the one error whose words are shown as they
 * are; every other error reaching a page is replaced with a fixed sentence.
 */
export class MissingSettingError extends Error {
  constructor(name: string) {
    // This message is read by people who have never opened a terminal, on a
    // hosted deployment, at the moment a button fails. Name both places the
    // setting could live rather than assuming a local checkout.
    super(
      `The site is missing its ${name} setting. ` +
        'On a hosted deployment, add it under Settings, Environment Variables, ' +
        'then redeploy. Running locally, put it in .env.local. ' +
        'All three Supabase values are on the Supabase API settings page.',
    );
    this.name = 'MissingSettingError';
  }
}

export function required(name: string, value: string | undefined): string {
  if (!value) throw new MissingSettingError(name);
  return value;
}

/**
 * What a person is shown when something they pressed failed. The missing
 * setting message is kept because it is the fix; anything else (a database
 * error, a network error, a stack) is replaced with the fallback, because its
 * words are for whoever reads the logs, not the person at the button.
 */
export function userFacingError(caught: unknown, fallback: string): string {
  return caught instanceof MissingSettingError ? caught.message : fallback;
}

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
};

export function requirePublicEnv() {
  return {
    supabaseUrl: required('NEXT_PUBLIC_SUPABASE_URL', publicEnv.supabaseUrl),
    supabaseAnonKey: required('NEXT_PUBLIC_SUPABASE_ANON_KEY', publicEnv.supabaseAnonKey),
    siteUrl: publicEnv.siteUrl,
  };
}
