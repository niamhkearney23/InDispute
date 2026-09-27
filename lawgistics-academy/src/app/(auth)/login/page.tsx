import type { Metadata } from 'next';
import { AuthForm } from '../auth-form';
import { AuthFragmentHandler } from '../auth-fragment-handler';
import { asLinkFailure, LINK_FAILURES } from '@/lib/auth/link-failures';
import { safeNext } from '@/lib/safe-next';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; failed?: string }>;
}) {
  const { next, failed } = await searchParams;
  const target = safeNext(next, '/dashboard');
  const reason = asLinkFailure(failed);

  return (
    <>
      <AuthFragmentHandler next={target} />
      <AuthForm
        mode="login"
        next={target}
        problem={reason ? LINK_FAILURES[reason] : undefined}
      />
    </>
  );
}

/** Only ever redirect within this app, never to an attacker-supplied origin. */
