import type { Metadata } from 'next';
import { ButtonLink, Card } from '@/components/ui';

export const metadata: Metadata = { title: 'Not found' };

/**
 * An address that does not exist, or a page that said so (a post taken away,
 * a matter that is not up). Plain words and two ways on. It says nothing
 * about why, because "that exists but is not yours" is itself an answer.
 */
export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-12 sm:px-8">
      <Card>
        <p className="eyebrow mb-2">Not found</p>
        <h1 className="text-2xl sm:text-3xl">There is nothing at this address.</h1>
        <p className="mt-3 text-slate">
          The link may be old, or what it pointed to may have been taken down. If somebody sent
          it to you, ask them for it again.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink href="/dashboard" variant="accent">
            Go to today
          </ButtonLink>
          <ButtonLink href="/" variant="outline">
            Go to the front page
          </ButtonLink>
        </div>
      </Card>
    </main>
  );
}
