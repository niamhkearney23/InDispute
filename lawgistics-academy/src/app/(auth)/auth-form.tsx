'use client';

import { useState, type ReactNode } from 'react';
import { useHydrated } from '@/lib/client/use-hydrated';
import { useRouter } from 'next/navigation';
import Link from '@/components/app-link';
import { createClient } from '@/lib/supabase/client';
import { userFacingError } from '@/lib/env';
import { Wordmark, cn } from '@/components/ui';
import { brand } from '@/lib/brand';
import { RotatingMaxim, type MaximRule } from '@/components/rotating-maxim';
import {
  PRACTICE_CHOICES,
  practiceChoiceFor,
  type Country,
  type PracticeChoice,
} from '@/lib/types';
import { choicesFor, openCountryOr } from '@/lib/countries';

/**
 * What the page says once an email has gone. Either is worded so it is true
 * whether or not the address has an account: an address with one is told
 * nothing more, and its owner can sign in or reset the password.
 */
type Sent = 'check-inbox' | 'reset-link';
/** After a sign-up, whether the address was new or already had an account. */
const CHECK_INBOX: Sent = 'check-inbox';
/** After asking for a new password. */
const RESET_LINK: Sent = 'reset-link';

/** A link inside a sentence on the dark page. */
const inlineLink =
  '-my-2 inline-block py-2 font-medium text-paper underline decoration-paper/35 underline-offset-4 transition-colors hover:decoration-paper';

/** Sign-up problems in our words, by Supabase's error code, never its message. */
function signUpProblem(code: string | undefined): string {
  if (code === 'weak_password') {
    return 'That password is too easy to guess. Choose a longer one, at least 10 characters.';
  }
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') {
    return 'Too many attempts just now. Wait a few minutes and try again.';
  }
  if (code === 'email_address_invalid') return 'That email address cannot be used. Check it and try again.';
  return 'Your account could not be created just now. Please try again.';
}

/**
 * Sign-in problems in our words. A wrong password and an unknown address get
 * the same sentence, as Supabase itself intends, so the form cannot be used
 * to find out who has an account.
 */
function signInProblem(code: string | undefined): ReactNode {
  if (code === 'email_not_confirmed') {
    return 'Your email address is not confirmed yet. Open the link in the email we sent when you signed up.';
  }
  if (code === 'over_request_rate_limit') return 'Too many attempts just now. Wait a few minutes and try again.';
  return (
    <>
      That email and password do not match an account here. Check them, or{' '}
      <Link href="/forgot-password" className={inlineLink}>
        reset your password
      </Link>
      .
    </>
  );
}

/**
 * Sign in, sign up, the trainee sign-up and the forgotten password: one
 * centred column on a dark page, opening on "Hi." and arriving slowly, the
 * greeting first and the form after it (the owner, November 2026: "centered
 * and it slowly come onto the screen ... premium, maybe darker color and
 * the font to be a bit different"). No drifting lights, grid or boxes: the
 * type and the space do the work. Nothing here claims anything the product
 * does not do; the front page explains the product.
 */
export function AuthForm({
  mode,
  next,
  problem,
  welcome,
  defaultCountry = 'MY',
  trainee = false,
  maxims = null,
}: {
  /** The twenty rules for the foot of the page, only once signed off; otherwise none. */
  maxims?: MaximRule[] | null;
  /** 'reset' is the forgotten-password form: an email, and a link sent to it. */
  mode: 'login' | 'signup' | 'reset';
  /**
   * The litigation trainees' own sign-up. No country question, because the
   * programme is Malaysian and the database would refuse anything else.
   */
  trainee?: boolean;
  next: string;
  /** Something that went wrong before this page loaded, such as a dead confirmation link. */
  problem?: string;
  /** A message to show on arrival that is not a problem. */
  welcome?: string;
  /**
   * Which country to start on. The marketing site knows the answer already,
   * because it asks before it sends anyone here, so it passes it rather than
   * making somebody choose twice. It is a starting point, not a decision:
   * the buttons are still there and still change it. Malaysia when nobody
   * says otherwise, because that is where most of the people using this are.
   */
  defaultCountry?: Country;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [choice, setChoice] = useState<PracticeChoice>(() =>
    practiceChoiceFor(trainee ? 'MY' : openCountryOr(defaultCountry), trainee ? 'litigation_trainee' : 'general'),
  );
  // Only countries this deployment offers (src/lib/countries.ts); with one,
  // nobody is asked.
  const countryChoices = choicesFor(PRACTICE_CHOICES.filter((c) => c.track === 'general'));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ReactNode>(problem ?? null);
  const [notice, setNotice] = useState<Sent | null>(null);
  const [greeting, setGreeting] = useState<string | null>(welcome ?? null);

  const isSignup = mode === 'signup';
  const isReset = mode === 'reset';
  // Signing in instead of signing up keeps where they were going. Without
  // it, somebody sent to sign up from a link to a work post who already had
  // an account landed on Today instead.
  const signInHref = isSignup ? `/login${next ? `?next=${encodeURIComponent(next)}` : ''}` : '/login';

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    setGreeting(null);

    try {
      await submitCredentials();
    } catch (caught) {
      // Without this the button would simply die: an exception thrown in an
      // async handler is swallowed, `pending` stays true, and the user is left
      // clicking a disabled button with no explanation. The likeliest cause is
      // a deployment built without the Supabase environment variables, since
      // NEXT_PUBLIC_ values are inlined at build time rather than read at boot.
      setError(userFacingError(caught, 'Something went wrong. Please try again.'));
      setPending(false);
    }
  }

  async function submitCredentials() {
    const supabase = createClient();

    if (isReset) {
      // The link comes back through the callback, which signs them in, and
      // lands them on the page where they choose a new password. The answer
      // is the same whether or not the address has an account, so this form
      // cannot be used to find out who is signed up.
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/account/password?reset=1')}`,
      });
      setNotice(RESET_LINK);
      setPending(false);
      return;
    }

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
            // The first screen after this asks what to call them.
            display_name: email.split('@')[0],
            country: choice.country,
            track: choice.track,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (signUpError) {
        // Supabase says "User already registered" when the address has an
        // account, which would let anybody find out who has one by trying
        // addresses here. That case gets the same words as a new sign-up
        // waiting on its email, and an address that already has an account
        // gets no email it did not ask for.
        if (signUpError.code === 'user_already_exists' || /already registered/i.test(signUpError.message)) {
          setNotice(CHECK_INBOX);
        } else {
          setError(signUpProblem(signUpError.code));
        }
        setPending(false);
        return;
      }

      // With "Confirm email" switched off in Supabase there is a session
      // already, and the person goes straight in below. With it switched on
      // there is not, and they are told the one thing they can do about it.
      if (!data.session) {
        setNotice(CHECK_INBOX);
        setPending(false);
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInProblem(signInError.code));
        setPending(false);
        return;
      }
    }

    router.replace(next);
    router.refresh();
  }

  const lead = trainee
    ? `Join the ${brand.traineeAcademy}. Your supervisor confirms you once you have signed up.`
    : isSignup
      ? 'Create your account to begin.'
      : isReset
        ? 'Forgotten your password? We will email you a link to choose a new one.'
        : 'Welcome back. Sign in to carry on.';

  return (
    <div className="auth-surface">
      <header className="auth-in flex justify-center px-5 pt-[max(1.75rem,env(safe-area-inset-top))]">
        <Link href="/" className="-mx-1 inline-block rounded-[5px] px-1 py-2">
          <Wordmark light />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12 sm:py-16">
        <div className="w-full max-w-[23.5rem]">
          {notice ? (
            <SentMessage
              key={notice}
              kind={notice}
              email={email}
              signInHref={signInHref}
              onAgain={() => setNotice(null)}
            />
          ) : (
            <>
              <div className="text-center">
                <h1 className="auth-hello auth-in auth-in--hello">Hi.</h1>
                <p className="auth-in auth-in--2 mx-auto mt-5 max-w-[21rem] text-[1.0625rem] leading-relaxed text-balance text-paper/65">
                  {lead}
                </p>
              </div>

              <form onSubmit={onSubmit} className="auth-in auth-in--3 mt-10 space-y-5">
                {isSignup && !trainee && countryChoices.length > 1 ? (
                  <fieldset>
                    <legend className="mb-2 block text-[0.8125rem] text-paper/70">
                      Which country do you plan to practise in?
                    </legend>
                    <div className="grid grid-cols-2 gap-2.5">
                      {countryChoices.map((option) => {
                        const on = choice.key === option.key;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setChoice(option)}
                            className={cn(
                              'rounded-[6px] border px-3.5 py-3 text-left transition-colors',
                              on
                                ? 'border-paper/70 bg-paper/[0.08]'
                                : 'border-paper/15 hover:border-paper/35',
                            )}
                          >
                            <span className="block text-[0.9375rem] font-medium text-paper">{option.label}</span>
                            <span className="mt-0.5 block text-xs text-paper/55">{option.detail}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-paper/45">
                      This decides which law you are trained on. You can change it later.
                    </p>
                  </fieldset>
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

                {isReset ? null : (
                  <Field
                    label="Password"
                    id="password"
                    type="password"
                    value={password}
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    required
                    // Ten for a new password, the same rule as joining by invitation.
                    // Not on sign-in, where it would lock out anybody whose older
                    // password is shorter.
                    minLength={isSignup ? 10 : undefined}
                    hint={isSignup ? 'At least 10 characters.' : undefined}
                    onChange={setPassword}
                    aside={
                      mode === 'login' ? (
                        <Link
                          href="/forgot-password"
                          className="-my-2 inline-block py-2 text-[0.8125rem] text-paper/60 transition-colors hover:text-paper"
                        >
                          Forgot your password?
                        </Link>
                      ) : null
                    }
                  />
                )}

                {greeting ? (
                  <p role="status" className="text-[0.9375rem] leading-relaxed text-paper/85">
                    {greeting}
                  </p>
                ) : null}
                {error ? (
                  <p role="alert" className="text-[0.9375rem] leading-relaxed text-[#f3b9ae]">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  // Until the page's code is running a press would reload the
                  // page and empty the form, which reads as the button not
                  // working. It is ready long before the form has faded in.
                  disabled={pending || !hydrated}
                  className="auth-button"
                >
                  {pending ? (
                    <span
                      aria-hidden
                      className="size-4 animate-spin rounded-full border-2 border-[#0c1520]/25 border-t-[#0c1520]"
                    />
                  ) : null}
                  {pending
                    ? isSignup
                      ? 'Creating your account…'
                      : isReset
                        ? 'Sending…'
                        : 'Signing you in…'
                    : isSignup
                      ? 'Create account'
                      : isReset
                        ? 'Send the link'
                        : 'Sign in'}
                </button>
              </form>

              <div className="auth-in auth-in--4 mt-9 space-y-2 text-center text-[0.9375rem] text-paper/55">
                <p>
                  {isSignup ? 'Already have an account? ' : isReset ? 'Remembered it? ' : 'No account yet? '}
                  <Link href={isSignup || isReset ? signInHref : '/signup'} className={inlineLink}>
                    {isSignup || isReset ? 'Sign in' : 'Create one'}
                  </Link>
                </p>
                {isSignup && !trainee ? (
                  <p>
                    On a firm&apos;s trainee programme?{' '}
                    <Link
                      href={`/trainee${next && next !== '/onboarding' ? `?next=${encodeURIComponent(next)}` : ''}`}
                      className={inlineLink}
                    >
                      Sign up here instead
                    </Link>
                  </p>
                ) : null}
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="auth-in auth-in--4 px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] text-center">
        {maxims && maxims.length > 0 ? (
          <RotatingMaxim className="mx-auto mb-6 hidden max-w-md md:block" rules={maxims} />
        ) : null}
        {brand.parentLine ? <p className="text-xs text-paper/35">{brand.parentLine}</p> : null}
      </footer>
    </div>
  );
}

/**
 * Once the email has gone: the form steps aside for one plain message, with
 * the address it went to, so a typing mistake is seen at once and can be put
 * right with "Use a different email".
 */
function SentMessage({
  kind,
  email,
  signInHref,
  onAgain,
}: {
  kind: Sent;
  email: string;
  signInHref: string;
  onAgain: () => void;
}) {
  const address = <span className="text-paper">{email}</span>;
  return (
    <div className="text-center" role="status">
      <h1 className="auth-hello auth-hello--small auth-in auth-in--hello">Check your email.</h1>
      {kind === 'check-inbox' ? (
        <p className="auth-in auth-in--2 mt-6 text-[1.0625rem] leading-relaxed text-paper/70">
          Nearly there. If {address} can be used, we have sent it an email: open it and press the link to
          finish signing up. If it has not arrived in a few minutes, check your junk folder.
        </p>
      ) : (
        <p className="auth-in auth-in--2 mt-6 text-[1.0625rem] leading-relaxed text-paper/70">
          If there is an account for {address}, we have sent it a link to choose a new password. Open it on
          this device. If it has not arrived in a few minutes, check your junk folder.
        </p>
      )}
      <div className="auth-in auth-in--3 mt-9 space-y-2 text-[0.9375rem] text-paper/55">
        {kind === 'check-inbox' ? (
          <p>
            Already have an account?{' '}
            <Link href={signInHref} className={inlineLink}>
              Sign in instead
            </Link>
            .
          </p>
        ) : (
          <p>
            <Link href="/login" className={inlineLink}>
              Back to sign in
            </Link>
          </p>
        )}
        <p>
          <button type="button" onClick={onAgain} className={cn(inlineLink, 'decoration-paper/20 text-paper/70')}>
            Use a different email
          </button>
        </p>
      </div>
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
  aside,
  ...rest
}: {
  label: string;
  id: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  /** Something small on the label's line, such as "Forgot your password?". */
  aside?: ReactNode;
} & Omit<React.ComponentProps<'input'>, 'onChange' | 'value' | 'type' | 'id'>) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[0.8125rem] text-paper/70">
          {label}
        </label>
        {aside}
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="auth-input"
        {...rest}
      />
      {hint ? <p className="mt-1.5 text-xs text-paper/45">{hint}</p> : null}
    </div>
  );
}
