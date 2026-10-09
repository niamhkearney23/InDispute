import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { Button, Card } from '@/components/ui';

export const metadata: Metadata = { title: 'Account not set up' };
export const dynamic = 'force-dynamic';

/**
 * Where a learner page sends somebody who is signed in but has no profile
 * row: an account made by hand in Supabase, a sign-up whose trigger failed,
 * or a profile that could not be read. Those pages used to send them to
 * /login, and the middleware sends anybody signed in away from /login to
 * /dashboard, which sent them back to /login: the browser gave up with too
 * many redirects and the person saw nothing they could act on.
 *
 * So this page sits outside the learner layout, is not one of the pages the
 * middleware turns signed-in people away from, and redirects nowhere a
 * signed-in person could be bounced from. It says what is wrong and offers
 * the one thing that always works, signing out.
 */
export default async function AccountProblemPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-12 sm:px-8">
      <Card>
        <p className="eyebrow mb-2">Account not set up</p>
        <h1 className="text-2xl sm:text-3xl">Your account is not ready yet.</h1>
        <p className="mt-3 text-slate">
          You are signed in{user.email ? ` as ${user.email}` : ''}, but the details that go
          with your account could not be found, so there is nothing to show you yet.
        </p>
        <p className="mt-3 text-slate">
          Try again in a minute. If it keeps happening, tell whoever runs the academy at your
          firm, or sign out and sign in with the address you joined with.
        </p>
        <form action="/auth/sign-out" method="post" className="mt-5">
          <Button type="submit" variant="accent">
            Sign out
          </Button>
        </form>
      </Card>
    </main>
  );
}
