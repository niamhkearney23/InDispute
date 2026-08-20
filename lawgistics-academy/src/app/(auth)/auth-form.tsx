'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Notice, Wordmark, cn } from '@/components/ui';
import { COUNTRIES, COUNTRY_LABELS, type Country } from '@/lib/types';

export function AuthForm({
  mode,
  next,
  problem,
  defaultCountry = 'AU',
}: {
  mode: 'login' | 'signup';
  next: string;
  /** Something that went wrong before this page loaded, such as a dead confirmation link. */
  problem?: string;
  /**
   * Which country to start on. The marketing site knows the answer already,
   * because it asks before it sends anyone here, so it passes it rather than
   * making somebody choose twice and land on the wrong body of law if they do
   * not notice. It is a starting point, not a decision: the buttons are still
   * there and still change it.
   */
  defaultCountry?: Country;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState<Country>(defaultCountry);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(problem ?? null);
  const [notice, setNotice] = useState<string | null>(null);

  const isSignup = mode === 'signup';

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);

    try {
      await submitCredentials();
    } catch (caught) {
      // Without this the button would simply die: an exception thrown in an
      // async handler is swallowed, `pending` stays true, and the user is left
      // clicking a disabled button with no explanation. The likeliest cause is
      // a deployment built without the Supabase environment variables, since
      // NEXT_PUBLIC_ values are inlined at build time rather than read at boot.
      setError(
        caught instanceof Error
          ? caught.message
          : 'Something went wrong. Please try again.',
      );
      setPending(false);
    }
  }

  async function submitCredentials() {
    const supabase = createClient();

    if (isSignup) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Read by the profile trigger, which narrows it: anything that is
          // not exactly 'MY' becomes 'AU', because this value is written by the
          // browser and is therefore whatever the browser felt like sending.
          data: { display_name: displayName || email.split('@')[0], country },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setPending(false);
        return;
      }

      // With email confirmation switched on, there is no session yet.
      if (!data.session) {
        setNotice(
          'Check your email to confirm your address, then sign in. If the email never ' +
            'arrives, or the link in it fails, an administrator can confirm the account ' +
            'directly in Supabase under Authentication → Users, or switch off "Confirm ' +
            'email" under Authentication → Sign In / Providers → Email.',
        );
        setPending(false);
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setPending(false);
        return;
      }
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-12">
      <Link href="/" className="mb-10 -mx-1 inline-block rounded-[5px] px-1 py-2">
        <Wordmark />
      </Link>

      <h1 className="mb-2 text-3xl">{isSignup ? 'Create your account' : 'Welcome back'}</h1>
      <p className="mb-8 text-slate">
        {isSignup
          ? 'Australian and Malaysian litigation. A few questions, then a diagnostic, and about fifteen minutes to a full skill map.'
          : 'Pick up where you left off.'}
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        {isSignup ? (
          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium">
              Which country are you training in?
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {COUNTRIES.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={country === value}
                  onClick={() => setCountry(value)}
                  className={cn(
                    'h-11 rounded-[5px] border text-[0.9375rem] transition-colors',
                    country === value
                      ? 'border-ink bg-paper-sunk font-medium'
                      : 'border-rule-strong hover:bg-paper-sunk',
                  )}
                >
                  {COUNTRY_LABELS[value]}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted">
              Australian and Malaysian law are different. This decides which questions
              you are shown, and you can change it later.
            </p>
          </fieldset>
        ) : null}

        {isSignup ? (
          <Field
            label="Name"
            id="displayName"
            type="text"
            value={displayName}
            autoComplete="name"
            onChange={setDisplayName}
            placeholder="How should we greet you?"
          />
        ) : null}

        <Field
          label="Email"
          id="email"
          type="email"
          value={email}
          autoComplete="email"
          required
          onChange={setEmail}
        />

        <Field
          label="Password"
          id="password"
          type="password"
          value={password}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          required
          minLength={8}
          hint={isSignup ? 'At least 8 characters.' : undefined}
          onChange={setPassword}
        />

        {error ? <Notice tone="error">{error}</Notice> : null}
        {notice ? <Notice tone="warn">{notice}</Notice> : null}

        <Button type="submit" size="lg" variant="accent" disabled={pending} className="w-full">
          {pending ? 'One moment…' : isSignup ? 'Create account' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate">
        {isSignup ? 'Already have an account? ' : 'No account yet? '}
        <Link
          href={isSignup ? '/login' : '/signup'}
          // Negative margin keeps the sentence on one line while the padding
          // grows the tap target to something a thumb can actually hit.
          className="-my-2 inline-block rounded-[5px] px-1 py-2 font-medium text-burgundy underline underline-offset-4"
        >
          {isSignup ? 'Sign in' : 'Create one'}
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  id,
  type,
  value,
  onChange,
  hint,
  ...rest
}: {
  label: string;
  id: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
} & Omit<React.ComponentProps<'input'>, 'onChange' | 'value' | 'type' | 'id'>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper-raised px-3.5 text-base outline-none focus:border-burgundy"
        {...rest}
      />
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
