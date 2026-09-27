import type { Metadata } from 'next';
import { AuthForm } from '../auth-form';
import { AuthFragmentHandler } from '../auth-fragment-handler';
import { asLinkFailure, LINK_FAILURES } from '@/lib/auth/link-failures';
import { safeNext } from '@/lib/safe-next';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; failed?: string; joined?: string }>;
}) {
  const { next, failed, joined } = await searchParams;
  const target = safeNext(next, '/dashboard');
  const reason = asLinkFailure(failed);

  return (
    <>
      <AuthFragmentHandler next={target} />
      <AuthForm
        mode="login"
        next={target}
        problem={reason ? LINK_FAILURES[reason] : undefined}
        // Sent here after joining when the automatic sign-in did not go
        // through. The account is made; they only need to sign in once.
        welcome={
          joined === '1'
            ? 'Your account is ready. Sign in with your email and the password you just chose.'
            : undefined
        }
      />
    </>
  );
}

/** Only ever redirect within this app, never to an attacker-supplied origin. */
