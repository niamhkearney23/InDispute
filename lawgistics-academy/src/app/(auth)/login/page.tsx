import type { Metadata } from 'next';
import { AuthForm } from '../auth-form';
import { AuthFragmentHandler } from '../auth-fragment-handler';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const target = safeNext(next);

  return (
    <>
      <AuthFragmentHandler next={target} />
      <AuthForm mode="login" next={target} problem={explain(error)} />
    </>
  );
}

/** Only ever redirect within this app — never to an attacker-supplied origin. */
function safeNext(next: string | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/dashboard';
  return next;
}

/**
 * A confirmation link that fails should say so. Previously this parameter was
 * ignored, so a broken link dropped the user on a blank sign-in page with no
 * indication that anything had gone wrong — indistinguishable from the link
 * simply doing nothing.
 */
function explain(error: string | undefined): string | undefined {
  if (!error) return undefined;

  const raw = error.replace(/\+/g, ' ').slice(0, 300);

  if (/expired|invalid|not found|already/i.test(raw)) {
    return `That confirmation link is no longer valid (${raw}). If you already confirmed, just sign in below.`;
  }

  return `${raw}. If your account is confirmed you can sign in below.`;
}
