import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { Card, InlineLink } from '@/components/ui';
import { AvatarForm } from './avatar-form';
import { CartoonMaker } from './cartoon-maker';
import { LeaderboardForm } from './leaderboard-form';

export const metadata: Metadata = { title: 'Your account' };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/login');

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow mb-2">Your account</p>
        <h1 className="text-3xl sm:text-4xl">{profile.displayName ?? 'Your account'}</h1>
        <p className="mt-3 max-w-xl text-slate">
          Make a cartoon of yourself, or add a photo. Only you decide, and only you can change it.
        </p>
      </section>

      <Card>
        <section id="cartoon" className="scroll-mt-24">
          <p className="eyebrow mb-2">Your cartoon</p>
          <p className="mb-4 text-sm text-slate">
            Pick each part and watch it change. Your cartoon shows beside your name, instead of
            your photo, until you remove it.
          </p>
          <CartoonMaker saved={profile.cartoon} />
        </section>
      </Card>

      <Card>
        <AvatarForm displayName={profile.displayName} avatarUrl={profile.avatarUrl} />
      </Card>

      <Card>
        <p className="eyebrow mb-2">Leaderboard</p>
        <p className="mb-2 text-sm text-slate">
          If the firm shows a leaderboard, your first name and your XP for the last seven days appear on it.
          You can stay off it.
        </p>
        <LeaderboardForm optedOut={profile.leaderboardOptOut} />
      </Card>

      <Card>
        <p className="eyebrow mb-2">Your plan</p>
        <p className="text-sm text-slate">
          What you pay, or the code from your firm or university.{' '}
          <InlineLink href="/pricing">See your plan</InlineLink>
        </p>
      </Card>

      <Card>
        <p className="eyebrow mb-2">Password</p>
        <p className="text-sm text-slate">
          Signed in as {profile.email ?? 'you'}.{' '}
          <InlineLink href="/account/password">Change your password</InlineLink>
        </p>
      </Card>
    </div>
  );
}
