'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Notice, Wordmark, cn } from '@/components/ui';
import { brand } from '@/lib/brand';
import { AccentSurface } from '@/components/accent-surface';
import { ArrowIcon, CheckIcon } from '@/components/icons';
import { PRACTICE_CHOICES, practiceChoiceFor, type Country, type PracticeChoice } from '@/lib/types';

export function AuthForm({
  mode,
  next,
  problem,
  defaultCountry = 'MY',
  trainee = false,
}: {
  mode: 'login' | 'signup';
  /**
   * The litigation trainees' own sign-up. No country question, because the
   * programme is Malaysian and the database would refuse anything else, and
   * a panel that speaks to a trainee rather than to every learner.
   */
  trainee?: boolean;
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
    practiceChoiceFor(trainee ? 'MY' : defaultCountry, trainee ? 'litigation_trainee' : 'general'),
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
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <BrandPanel isSignup={isSignup} trainee={trainee} />

      <main className="flex items-start justify-center px-5 pt-8 pb-12 sm:px-10 lg:items-center lg:py-16">
        <div className="rise-in w-full max-w-md">
          <h2 className="mb-2 text-3xl sm:text-4xl">
            {trainee ? 'Join as a trainee' : isSignup ? 'Create your account' : 'Sign in'}
          </h2>
          <p className="mb-8 text-slate">
            {trainee
              ? 'Your name, your email and a password. Your programme is set up from there.'
              : isSignup
                ? 'A few questions, then a diagnostic, and about fifteen minutes to a full skill map.'
                : 'Pick up where you left off.'}
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            {isSignup && !trainee ? (
              <fieldset>
                <legend className="mb-2 block text-sm font-semibold">
                  Which country do you plan to practice in?
                </legend>
                <div className="grid grid-cols-2 gap-2.5">
                  {PRACTICE_CHOICES.filter((c) => c.track === 'general').map((option) => {
                    const on = choice.key === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setChoice(option)}
                        className={cn(
                          'relative rounded-lg border-2 px-3.5 py-3 text-left transition-all duration-150',
                          on
                            ? 'border-burgundy bg-burgundy-wash shadow-card'
                            : 'border-rule bg-paper-raised hover:-translate-y-px hover:border-rule-strong hover:shadow-card',
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            'absolute top-2.5 right-2.5 grid size-5 place-items-center rounded-full border-2 transition-colors',
                            on ? 'border-burgundy bg-burgundy text-paper' : 'border-rule-strong',
                          )}
                        >
                          {on ? <CheckIcon className="size-3" /> : null}
                        </span>
                        <span className="block pr-6 text-[0.9375rem] font-semibold">
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate">{option.detail}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted">
                  This decides which law you are trained on. You can change it later.
                </p>
                <p className="mt-3 rounded-lg bg-burgundy-wash px-3.5 py-2.5 text-sm">
                  On a firm&apos;s litigation trainee programme?{' '}
                  <Link
                    href={`/trainee${next && next !== '/onboarding' ? `?next=${encodeURIComponent(next)}` : ''}`}
                    className="-my-2 inline-block py-2 font-semibold text-burgundy underline underline-offset-4"
                  >
                    Sign up here instead
                  </Link>
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
              placeholder="you@example.com"
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

            <Button
              type="submit"
              size="lg"
              variant="accent"
              disabled={pending}
              className="h-14 w-full rounded-lg text-[1.0625rem] sm:w-full"
            >
              {pending ? 'One moment…' : isSignup ? 'Create account' : 'Sign in'}
              {pending ? null : <ArrowIcon className="size-4" />}
            </Button>
          </form>

          {trainee ? (
            <p className="mt-6 text-sm text-slate">
              Not a trainee?{' '}
              <Link
                href="/signup"
                className="-my-2 inline-block rounded-[5px] px-1 py-2 font-semibold text-burgundy underline underline-offset-4"
              >
                Sign up as a law student or junior lawyer
              </Link>
            </p>
          ) : null}

          <p className="mt-8 border-t border-rule pt-6 text-sm text-slate">
            {isSignup ? 'Already have an account? ' : 'No account yet? '}
            <Link
              href={isSignup ? '/login' : '/signup'}
              // Negative margin keeps the sentence on one line while the padding
              // grows the tap target to something a thumb can actually hit.
              className="-my-2 inline-block rounded-[5px] px-1 py-2 font-semibold text-burgundy underline underline-offset-4"
            >
              {isSignup ? 'Sign in' : 'Create one'}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

/**
 * The coloured half. On a wide screen it stands beside the form and says, in
 * three lines, what somebody is signing up to; on a phone it shrinks to a
 * band above the form with the name and the headline, so the form is still
 * the first thing a thumb reaches.
 *
 * Every line in it is something the product does today. Nothing here says
 * the questions are verified, because the review queue has not been through
 * a lawyer yet, and a sign-up page is the worst place to overstate that.
 */
function BrandPanel({ isSignup, trainee }: { isSignup: boolean; trainee: boolean }) {
  const points: Array<[string, string]> = trainee
    ? [
        ['A task every working day', 'Twenty days of homework that walk you through how the firm works.'],
        ['Work from your supervisor', 'Real pieces of work to put your name on, marked with notes.'],
        ['Mornings with your coach', 'Short sessions your coach records, waiting when you open the app.'],
      ]
    : [
        ['Know where you stand', 'A short diagnostic maps what you know, then training fills the gaps.'],
        ['Your country’s law', 'Australian and Malaysian procedure, kept strictly apart.'],
        ['Real work, real feedback', 'Tasks set by the lawyers who supervise you, marked with notes.'],
      ];

  return (
    <AccentSurface as="aside">
      <div className="flex h-full flex-col px-5 pt-6 pb-8 sm:px-10 lg:justify-between lg:p-14">
        <Link href="/" className="-mx-1 inline-block self-start rounded-[5px] px-1 py-2">
          <Wordmark light />
        </Link>

        <div className="mt-6 lg:mt-0">
          <p className="mb-3 text-[0.6875rem] font-semibold tracking-[0.16em] text-paper/70 uppercase">
            {trainee ? 'Litigation trainee programme' : isSignup ? 'Start here' : 'Welcome back'}
          </p>
          <h1 className="max-w-md text-[2.25rem] leading-[1.05] sm:text-5xl lg:text-6xl">
            {trainee
              ? 'Your traineeship starts here.'
              : isSignup
                ? 'Train like a litigator.'
                : 'Good to see you again.'}
          </h1>

          <ul className="mt-10 hidden max-w-md space-y-5 lg:block">
            {points.map(([title, body]) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-paper/15 ring-1 ring-paper/25">
                  <CheckIcon className="size-3.5" />
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-paper/75">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-10 hidden text-sm text-paper/60 lg:block">{brand.tagline}</p>
      </div>
    </AccentSurface>
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
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-13 w-full rounded-lg border-2 border-rule bg-paper-raised px-4 text-base transition-[border-color,box-shadow] outline-none placeholder:text-muted/70 hover:border-rule-strong focus:border-burgundy focus:ring-4 focus:ring-burgundy/15"
        {...rest}
      />
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
