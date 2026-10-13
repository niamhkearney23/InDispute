import type { Metadata } from 'next';
import { ButtonLink, Card } from '@/components/ui';
import { goodbyeCopy, parsePending } from '@/lib/account/erasure-rules';

export const metadata: Metadata = { title: 'Account deleted' };

/**
 * Where somebody lands after deleting their own account (0043, 0045). Public
 * and outside the learner layout, because by now they are signed out, and
 * not one of the pages the middleware turns signed-in people away from, so it
 * cannot loop whatever state the cookies are in. It reads nothing but its
 * own address.
 *
 * It says "deleted" only when every step finished. When something is still
 * outstanding (closing sign-in at the auth server, or deleting stored files),
 * the address names it and the page says so: signed out, unable to use the
 * account, details removed from the database, and the firm finishing the
 * rest. Anybody can type the address, and all it changes is which of those
 * true sentences are shown.
 */
export default async function GoodbyePage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string | string[] }>;
}) {
  const pending = parsePending((await searchParams).pending);
  const copy = goodbyeCopy(pending);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-12 sm:px-8">
      <Card>
        <p className="eyebrow mb-2">{pending.length === 0 ? 'Account deleted' : 'Signed out'}</p>
        <h1 className="text-2xl sm:text-3xl">{copy.heading}</h1>
        {copy.body.map((paragraph) => (
          <p key={paragraph} className="mt-3 text-slate">
            {paragraph}
          </p>
        ))}
        <div className="mt-5">
          <ButtonLink href="/" variant="outline">
            Back to the front page
          </ButtonLink>
        </div>
      </Card>
    </main>
  );
}
