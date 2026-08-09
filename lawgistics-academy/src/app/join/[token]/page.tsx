import type { Metadata } from 'next';
import Link from 'next/link';
import { findInvitation, problemMessage } from '@/lib/onboarding/invitations';
import { brand } from '@/lib/brand';
import { longDate } from '@/lib/onboarding/rules';
import { ButtonLink, Notice, Wordmark } from '@/components/ui';
import { JoinForm } from './join-form';

export const metadata: Metadata = { title: 'Join' };

/** The token is a credential. Nothing about this page may be cached or prerendered. */
export const dynamic = 'force-dynamic';

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const found = await findInvitation(token);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <Link href="/" className="mb-10 -mx-1 inline-block rounded-[5px] px-1 py-2">
        <Wordmark />
      </Link>

      {found.error ? (
        <>
          <h1 className="mb-2 text-3xl">This link will not work</h1>
          <p className="mb-6 text-slate">{problemMessage(found.error)}</p>
          <ButtonLink href="/login" size="lg" variant="outline">
            Go to sign in
          </ButtonLink>
        </>
      ) : (
        <>
          <h1 className="mb-2 text-3xl">
            {found.invitation.displayName
              ? `Welcome, ${found.invitation.displayName}`
              : 'Welcome'}
          </h1>
          <p className="mb-6 text-slate">
            {found.invitation.invitedByName
              ? `${found.invitation.invitedByName} has invited you to join through ${brand.fullName}.`
              : `You have been invited to join through ${brand.fullName}.`}{' '}
            {found.invitation.startsOn
              ? `You begin on ${longDate(found.invitation.startsOn)}.`
              : ''}{' '}
            Set a password and you will go straight to the list of what to do before your
            first day.
          </p>

          <JoinForm token={token} email={found.invitation.email} />

          <div className="mt-8 border-t border-rule pt-5">
            <Notice>
              This link is for you and works once. If somebody else has sent it on to you,
              tell the firm rather than using it.
            </Notice>
          </div>
        </>
      )}
    </div>
  );
}
