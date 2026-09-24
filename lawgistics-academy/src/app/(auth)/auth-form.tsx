'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Notice, Wordmark, cn } from '@/components/ui';
import { PRACTICE_CHOICES, practiceChoiceFor, type Country, type PracticeChoice } from '@/lib/types';

export function AuthForm({
  mode,
  next,
  problem,
  defaultCountry = 'MY',
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
   *
   * Malaysia when nobody says otherwise, because that is where most of the
   * people using this are. A default is a guess, and it should be the guess
   * that is right most often.
   */
  defaultCountry?: Country;
}) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [choice, setChoice] = useState<PracticeChoice>(() =>
    practiceChoiceFor(defaultCountry, 'general'),
  );
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
          // Read by the profile trigger, which narrows both: anything that is
          // not exactly 'MY' becomes 'AU' and anything that is not exactly a
          // trainee is general, because these values are written by the
          // browser and are therefore whatever the browser felt like sending.
          data: {
            display_name: displayName || email.split('@')[0],
            country: choice.country,
            track: choice.track,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setPending(false);
        return;
      }

      // With "Confirm email" switched off in Supabase there is a session
      // already, and the person goes straight in below. With it switched on
      // there is not, and they are told the one thing they can do about it.
      // What an administrator can do when the email never arrives lives in
      // the setup notes, not here: somebody signing up cannot act on it.
      if (!data.session) {
        setNotice(
          'Nearly there. We have sent you an email: open it and press the link to finish ' +
            'signing up. If it has not arrived in a few minutes, check your junk folder.',
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
      <Link href="/" className="mb-6 -mx-1 inline-block self-start rounded-[5px] px-1 py-2">
        <Wordmark />
      </Link>

      <div className="rounded-lg border border-rule bg-paper-raised p-6 shadow-raised sm:p-8">
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
                Which country do you plan to practice in?
              </legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {PRACTICE_CHOICES.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={choice.key === option.key}
                    onClick={() => setChoice(option)}
                    className={cn(
                      'rounded-[5px] border px-3 py-2.5 text-left transition-colors',
                      choice.key === option.key
                        ? 'border-ink bg-paper-sunk'
                        : 'border-rule-strong hover:bg-paper-sunk',
                    )}
                  >
                    <span className="block text-[0.9375rem] font-medium">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-muted">{option.detail}</span>
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
      </div>

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
        className="h-11 w-full rounded-[5px] border border-rule-strong bg-paper px-3.5 text-base shadow-[inset_0_1px_2px_rgba(20,17,15,0.04)] transition-[border-color,box-shadow] outline-none focus:border-burgundy focus:ring-4 focus:ring-burgundy/10"
        {...rest}
      />
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
