import type { Metadata } from 'next';
import { AuthForm } from '../auth-form';

export const metadata: Metadata = { title: 'Join as a litigation trainee' };

/**
 * The litigation trainees' own way in. The same account, the same app and
 * the same sign-in afterwards; what differs is that nobody is asked a
 * country question they might answer wrongly, because the programme is
 * Malaysian and the account is made as a trainee from the start.
 */
export default async function TraineeSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthForm mode="signup" trainee next={safeNext(next)} />;
}

function safeNext(next: string | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/onboarding';
  return next;
}
