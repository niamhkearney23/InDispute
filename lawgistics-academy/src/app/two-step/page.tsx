import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { verifiedAal } from '@/lib/auth/two-step-server';
import { codePathFor, returnPath, verifiedFactors } from '@/lib/auth/two-step';
import { Card, Wordmark } from '@/components/ui';
import { CodeForm } from './code-form';

export const metadata: Metadata = { title: 'Type your code' };

/** Per person and per request. */
export const dynamic = 'force-dynamic';

/**
 * The second step of signing in, for anybody with an authenticator app: the
 * password has been accepted, and today's code turns the session into one
 * that may open the staff pages (and, for a learner who chose this, any page).
 *
 * Outside the academy's layout on purpose. That layout draws the menu, and a
 * menu here would be a row of links that all lead straight back to this page.
 * Drawn in the academy's navy, the same way the first-password screen is.
 */
export default async function TwoStepPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = returnPath(next);

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(codePathFor(target))}`);

  // Nothing to type without a device: carry on. A staff member with none is
  // sent to add one by the staff pages themselves.
  const devices = verifiedFactors(user.factors);
  if (devices.length === 0) redirect(target);

  if ((await verifiedAal(user.id)) === 'aal2') redirect(target);

  return (
    <div className="theme-paper flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10 sm:px-8">
        <div className="space-y-6">
          <Wordmark />
          <Card className="shadow-raised">
            <p className="eyebrow mb-2">Two-step sign-in</p>
            <h1 className="text-2xl">Type the code from your phone</h1>
            <p className="mt-2 mb-5 text-sm text-slate">
              Open the authenticator app you set up for this account and type the six numbers it
              shows for {user.email ?? 'this account'}. They change every 30 seconds.
            </p>
            <CodeForm
              next={target}
              devices={devices.map((d) => ({
                id: d.id,
                name: d.friendly_name || 'Authenticator app',
              }))}
            />
          </Card>

          <div className="space-y-3 text-sm text-slate">
            <p>
              Lost the phone? Ask your administrator to remove the device from your account. You
              then sign in with your password and set up the new phone.
            </p>
            {/* A way out for somebody on the wrong account, or a shared
                computer, who cannot type a code they do not have. */}
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="min-h-11 rounded-[5px] px-3 py-2.5 underline underline-offset-4 hover:text-ink"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
