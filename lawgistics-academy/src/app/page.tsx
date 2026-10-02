import Link from 'next/link';
import { ButtonLink, Notice, Wordmark } from '@/components/ui';
import { ArrowIcon } from '@/components/icons';
import { intakeStatus } from '@/lib/intake/countdown';
import { getCurrentUser } from '@/lib/supabase/server';
import { publicEnv } from '@/lib/env';
import { brand } from '@/lib/brand';
import { PROGRAMME } from '@/content/programme';
import { redirect } from 'next/navigation';

/**
 * The front door, kept quiet on purpose.
 *
 * One line that says what this is, two ways in, three steps, and nothing
 * else. The earlier version had a section for every idea and read as busy
 * on a phone; this one says the same things with less on the screen.
 *
 * Intern then chooses Malaysia or Australia, because the two countries' law
 * is kept apart. Litigation Trainee is always Malaysia.
 */
const STEPS = [
  ['You get the problem', 'A short file on invented facts, and a clock.'],
  ['You work it out', 'Find the procedure, draft the advice, explain it out loud.'],
  ['You see how a lawyer does it', 'Then a lawyer marks your work.'],
] as const;

/** Reads the session in order to redirect signed-in learners to the dashboard. */
export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');
  const intake = intakeStatus(PROGRAMME.intakeStartsOn, PROGRAMME.intakeEndsOn, new Date());

  return (
    <div className="min-h-dvh">
      <section className="landing-hero">
        <div aria-hidden className="landing-light landing-light--a" />
        <div aria-hidden className="landing-light landing-light--b" />
        <div aria-hidden className="landing-grain" />

        <header className="fade-in mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
          <Wordmark light />
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center px-1 text-sm font-medium text-paper/85 hover:text-paper"
          >
            Sign in
          </Link>
        </header>

        <div className="mx-auto max-w-5xl px-5 pt-14 pb-20 sm:px-8 sm:pt-24 sm:pb-28">
          {!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey ? (
            <div className="mb-8">
              <Notice tone="warn">
                Supabase is not configured yet, so signing in will not work. Open{' '}
                <Link href="/setup" className="font-medium underline underline-offset-2">
                  /setup
                </Link>
                .
              </Notice>
            </div>
          ) : null}

          <h1 className="rise-up max-w-3xl text-[2.75rem] leading-[1.02] tracking-[-0.02em] sm:text-7xl">
            Law school gives you the law.{' '}
            <span className="italic text-[#f3c9bd]">We give you the practice.</span>
          </h1>
          <p className="rise-up delay-1 mt-6 max-w-xl text-lg text-paper/80">
            Practical litigation training in Malaysia and Australia.
          </p>

          <div className="rise-up delay-2 mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="#intern" size="lg" variant="light">
              I&rsquo;m an intern
            </ButtonLink>
            <ButtonLink
              href="/trainee"
              size="lg"
              variant="outline"
              className="border-paper/40 bg-transparent text-paper hover:bg-paper/10"
            >
              I&rsquo;m a litigation trainee
            </ButtonLink>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-5 sm:px-8">
        <section className="py-16 sm:py-24">
          <p className="eyebrow mb-8">How it works</p>
          <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map(([title, body], i) => (
              <li key={title}>
                <p className="font-serif text-4xl text-burgundy/30">{i + 1}</p>
                <h2 className="mt-2 text-2xl">{title}</h2>
                <p className="mt-2 text-slate">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="intern" className="scroll-mt-6 border-t border-rule py-16 sm:py-20">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <p className="eyebrow mb-3">Interns, pupils and students</p>
              <h2 className="text-3xl sm:text-4xl">Intern</h2>
              <p className="mt-3 text-slate">Choose where you will practise.</p>
              <div className="mt-6 space-y-3">
                {(
                  [
                    ['MY', 'Malaysia'],
                    ['AU', 'Australia'],
                  ] as const
                ).map(([code, name]) => (
                  <Link
                    key={code}
                    href={`/signup?country=${code}`}
                    className="group flex min-h-14 items-center justify-between rounded-xl border border-rule bg-paper-raised px-5 transition-colors hover:border-burgundy"
                  >
                    <span className="font-serif text-xl">{name}</span>
                    <ArrowIcon className="size-5 text-burgundy transition-transform group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow mb-3">{brand.firm} · Malaysia</p>
              <h2 className="text-3xl sm:text-4xl">Litigation Trainee</h2>
              <p className="mt-3 text-slate">
                A one-month programme with {brand.firm}, starting {PROGRAMME.nextIntake}.
                {intake ? ` ${intake}.` : ''}
              </p>
              <div className="mt-6">
                <Link
                  href="/trainee"
                  className="group flex min-h-14 items-center justify-between rounded-xl bg-burgundy px-5 text-paper transition-colors hover:bg-burgundy-soft"
                >
                  <span className="font-serif text-xl">See the programme</span>
                  <ArrowIcon className="size-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl border-t border-rule px-5 py-8 sm:px-8">
        <p className="text-xs text-muted">
          {brand.fullName} is a training tool. It is not legal advice. Its levels and its
          certificate are training records, not professional qualifications or titles.
        </p>
      </footer>
    </div>
  );
}
