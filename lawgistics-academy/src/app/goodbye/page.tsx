import type { Metadata } from 'next';
import { ButtonLink, Card } from '@/components/ui';

export const metadata: Metadata = { title: 'Account deleted' };

/**
 * Where somebody lands after deleting their own account (0043). Public and
 * outside the learner layout, because by now they are signed out, and not
 * one of the pages the middleware turns signed-in people away from, so it
 * cannot loop whatever state the cookies are in. It reads nothing.
 */
export default function GoodbyePage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-12 sm:px-8">
      <Card>
        <p className="eyebrow mb-2">Account deleted</p>
        <h1 className="text-2xl sm:text-3xl">Your account has been deleted.</h1>
        <p className="mt-3 text-slate">
          You have been signed out everywhere and cannot sign in to it again. What you answered and
          handed in stays with the firm as its training record, with nothing to say it was you.
        </p>
        <div className="mt-5">
          <ButtonLink href="/" variant="outline">
            Back to the front page
          </ButtonLink>
        </div>
      </Card>
    </main>
  );
}
