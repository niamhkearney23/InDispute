import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui';
import { PasswordForm } from '../password-form';

export const metadata: Metadata = { title: 'Change your password' };

/**
 * Changing a password, and where the forgotten-password email lands
 * (?reset=1). The link has already signed them in through the callback, so
 * this is the same form either way; only the words differ.
 */
export default async function PasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/account/password');
  const { reset } = await searchParams;
  const fromEmail = reset === '1';

  return (
    <div className="mx-auto max-w-md space-y-6">
      <section>
        <p className="eyebrow mb-2">Your account</p>
        <h1 className="text-3xl">{fromEmail ? 'Choose a new password' : 'Change your password'}</h1>
        <p className="mt-3 text-slate">
          {fromEmail
            ? 'You are signed in from the link in your email. Choose a new password to use from now on.'
            : 'You stay signed in here. Anywhere else you were signed in will ask for the new one.'}
        </p>
      </section>
      <Card>
        <PasswordForm submitLabel={fromEmail ? 'Save it' : 'Change it'} />
      </Card>
    </div>
  );
}
