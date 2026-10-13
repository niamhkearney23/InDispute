import type { Metadata } from 'next';
import { signedMaxims } from '@/lib/content/service';
import { AuthForm } from '../auth-form';

export const metadata: Metadata = { title: 'Forgotten your password' };

export default async function ForgotPasswordPage() {
  return <AuthForm maxims={await signedMaxims()} mode="reset" next="/account/password?reset=1" />;
}
