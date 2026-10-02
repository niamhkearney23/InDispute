import type { Metadata } from 'next';
import { AuthForm } from '../auth-form';

export const metadata: Metadata = { title: 'Forgotten your password' };

export default function ForgotPasswordPage() {
  return <AuthForm mode="reset" next="/account/password?reset=1" />;
}
