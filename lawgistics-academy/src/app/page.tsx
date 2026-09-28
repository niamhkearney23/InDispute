import Link from 'next/link';
import { ButtonLink, Notice, Wordmark } from '@/components/ui';
import { ArrowIcon } from '@/components/icons';
import { getCurrentUser } from '@/lib/supabase/server';
import { publicEnv } from '@/lib/env';
import { brand } from '@/lib/brand';
import { redirect } from 'next/navigation';

/**
 * The front door opens on one question: which country. Australian and
 * Malaysian law are different bodies of law, and the answer decides every
 * question a person is ever shown, so it is asked before anything else, on
 * a page that is otherwise the answer to "what is this".
 */
const COUNTRIES = [
  {
    code: 'AU',
    name: 'Australia',
    stripe: 'linear-gradient(90deg, #00247d 0 50%, #cf142b 50% 100%)',
    who: 'Law students, PLT students, graduates and junior lawyers.',
    covers: ['Court hierarchy and procedure', 'Evidence and drafting', 'Legal research and AI ethics'],
  },
  {
    code: 'MY',
    name: 'Malaysia',
    stripe: 'linear-gradient(90deg, #010066 0 33%, #cc0001 33% 66%, #ffcc00 66% 100%)',
    who: 'Law students, pupils in chambering, interns and paralegals.',
    covers: ['Rules of Court 2012 and procedure', 'Litigation support and drafting', 'Legal research and AI ethics'],
  },
] as const;

const LOOP = [
  {
    step: 'Diagnostic',
    body: 'Around thirty questions across court system, procedure, evidence, advocacy, drafting and reasoning. Not a score, a map.',
  },
  {
    step: 'Skill map',
    body: 'Where you are strong, where you are not, and the three areas worth your next hour.',
  },
  {
    step: 'Daily training',
    body: 'Five to twenty minutes. Weighted towards your weakest concepts and whatever is due for review.',
  },
  {
    step: 'Feedback',
    body: 'Why the right answer is right, what you may have confused it with, and what it means in practice.',
  },
  {
    step: 'Spaced retesting',
    body: 'Everything you get wrong comes back tomorrow. Everything you know comes back later, but it does come back.',
  },
];

/** Reads the session in order to redirect signed-in learners to the dashboard. */
export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-dvh">
      <section className="landing-hero">
        <div aria-hidden className="landing-light landing-light--a" />
        <div aria-hidden className="landing-light landing-light--b" />
        <div aria-hidden className="landing-light landing-light--c" />
        <div aria-hidden className="landing-grid" />
        <div aria-hidden className="landing-grain" />

        <header className="fade-in mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Wordmark light />
          <ButtonLink href="/login" variant="light" size="sm">
            Sign in
          </ButtonLink>
        </header>

        <div className="mx-auto max-w-6xl px-5 pt-10 pb-16 sm:px-8 sm:pt-16 sm:pb-24">
          {!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey ? (
            <div className="mb-8">
              <Notice tone="warn">
                Supabase is not configured yet, so signing in will not work. Copy{' '}
                <code className="font-mono">.env.example</code> to{' '}
                <code className="font-mono">.env.local</code> and fill it in, then open{' '}
                <Link href="/setup" className="font-medium underline underline-offset-2">
                  /setup
                </Link>
                . It walks through the rest and tells you what is still missing.
              </Notice>
            </div>
          ) : null}

          <p className="rise-up mb-4 text-[0.6875rem] font-semibold tracking-[0.18em] text-paper/70 uppercase">
            {brand.tagline}
          </p>
          <h1 className="rise-up delay-1 max-w-3xl text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-7xl">
            Where are you training?
          </h1>
          <p className="rise-up delay-2 mt-5 max-w-xl text-lg text-paper/80 sm:text-xl">
            Australian and Malaysian law are kept strictly apart here. Choose yours, and
            every question you are shown belongs to it.
          </p>

          <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-6">
            {COUNTRIES.map((country, index) => (
              <Link
                key={country.code}
                href={`/signup?country=${country.code}`}
                className={`landing-tile rise-up ${index === 0 ? 'delay-3' : 'delay-4'}`}
                style={{ '--stripe': country.stripe } as React.CSSProperties}
              >
                <div aria-hidden className="landing-stripe" />
                <div className="p-6 sm:p-8">
                  <p className="eyebrow mb-3">Train in</p>
                  <div className="flex items-end justify-between gap-4">
                    <h2 className="text-4xl leading-none sm:text-5xl">{country.name}</h2>
                    <span className="landing-arrow grid size-11 shrink-0 place-items-center rounded-full bg-burgundy text-paper">
                      <ArrowIcon className="size-5" />
                    </span>
                  </div>
                  <p className="mt-4 text-slate">{country.who}</p>
                  <ul className="mt-5 space-y-1.5 text-sm text-slate">
                    {country.covers.map((line) => (
                      <li key={line} className="flex gap-2.5">
                        <span aria-hidden className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-burgundy" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            ))}
          </div>

          <p className="rise-up delay-5 mt-8 text-sm text-paper/75">
            On a Malaysian firm&apos;s litigation trainee programme?{' '}
            <Link
              href="/trainee"
              className="-my-2 inline-block py-2 font-semibold text-paper underline underline-offset-4"
            >
              Join as a trainee
            </Link>
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        <section className="py-14 sm:py-20">
          <h2 className="mb-8 text-2xl sm:text-3xl">One loop, done properly.</h2>
          <ol className="grid gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
            {LOOP.map((item, index) => (
              <li key={item.step} className="bg-paper-raised p-6">
                <p className="eyebrow mb-3">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="mb-2 text-lg">{item.step}</h3>
                <p className="text-sm text-slate">{item.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-rule py-12 sm:py-16">
          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <h2 className="mb-3 text-2xl sm:text-3xl">
                Every question knows its jurisdiction.
              </h2>
              <p className="text-slate">
                A Victorian procedural rule is never served as though it were an ACT rule.
                Each question records the jurisdiction it belongs to, the court where
                relevant, its source, and when that source was last checked. Starter
                questions go live unchecked so a new installation is not empty, and the
                review queue shows every one of them until a person has signed it off.
                Malaysian questions go live only once somebody has.
              </p>
            </div>
            <div>
              <h2 className="mb-3 text-2xl sm:text-3xl">Your record doesn’t move.</h2>
              <p className="text-slate">
                Questions are versioned. If a rule changes and a question is rewritten,
                what you answered last month stays exactly as you answered it. Your
                mastery evolves; your history does not get quietly rewritten underneath
                you.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-rule py-12 sm:py-16">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl">Already training here?</h2>
              <p className="mt-2 text-slate">Pick up where you left off.</p>
            </div>
            <ButtonLink href="/login" size="lg" variant="accent">
              Sign in
            </ButtonLink>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl border-t border-rule px-5 py-8 sm:px-8">
        <p className="text-xs text-muted">
          {brand.fullName} is a training tool. It is not legal advice, and
          progression levels within it are game levels, not professional qualifications
          or titles.
        </p>
      </footer>
    </div>
  );
}
