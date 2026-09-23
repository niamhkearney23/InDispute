import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { Card } from '@/components/ui';
import { PasswordForm } from '../password-form';

export const metadata: Metadata = { title: 'Change your password' };

export default async function PasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/account/password');

  return (
    <div className="mx-auto max-w-md space-y-6">
      <section>
        <p className="eyebrow mb-2">Your account</p>
        <h1 className="text-3xl">Change your password</h1>
        <p className="mt-3 text-slate">
          You stay signed in here. Anywhere else you were signed in will ask for the new
          one.
        </p>
      </section>
      <Card>
        <PasswordForm submitLabel="Change it" />
      </Card>
    </div>
  );
}
