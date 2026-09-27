import type { Metadata } from 'next';
import { AuthForm } from '../auth-form';
import { COUNTRIES, type Country } from '@/lib/types';
import { safeNext } from '@/lib/safe-next';

export const metadata: Metadata = { title: 'Create your account' };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; country?: string }>;
}) {
  const { next, country } = await searchParams;
  return <AuthForm mode="signup" next={safeNext(next, '/onboarding')} defaultCountry={safeCountry(country)} />;
}

/**
 * The marketing site asks which country somebody is training in before it
 * sends them here, and passes the answer along. Anything that is not one of
 * the countries we actually have is ignored rather than trusted, and the form
 * falls back to its own default. This only decides which button starts
 * pressed: the person can still change it, and the profile is written from
 * what the form submits, never from the address.
 */
function safeCountry(country: string | undefined): Country | undefined {
  const upper = String(country ?? '').toUpperCase();
  return (COUNTRIES as string[]).includes(upper) ? (upper as Country) : undefined;
}
