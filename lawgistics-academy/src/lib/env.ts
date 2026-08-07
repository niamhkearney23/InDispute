/**
 * Environment access, in one place, with loud failures.
 *
 * Anything named `SERVER_*` or containing a secret must only ever be read from
 * modules that carry `import 'server-only'`.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
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

export function requireServiceRoleKey(): string {
  return required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * The AI coach is strictly additive. V1 must work with every one of these unset.
 */
export const aiEnv = {
  provider: (process.env.AI_PROVIDER ?? 'none') as 'none' | 'anthropic' | 'openai',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  model: process.env.AI_MODEL,
};
