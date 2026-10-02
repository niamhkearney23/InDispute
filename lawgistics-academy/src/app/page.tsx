import Link from 'next/link';
import { ButtonLink, Notice, Wordmark } from '@/components/ui';
import {
  ArrowIcon,
  CheckIcon,
  FlameIcon,
  LevelIcon,
  RepeatIcon,
  SparkIcon,
} from '@/components/icons';
import { intakeStatus } from '@/lib/intake/countdown';
import { getCurrentUser } from '@/lib/supabase/server';
import { publicEnv } from '@/lib/env';
import { brand } from '@/lib/brand';
import { PROGRAMME } from '@/content/programme';
import { redirect } from 'next/navigation';

/**
 * The front door opens on one question: which way in. Two doors, because
 * two different people arrive. An intern (a student, pupil, paralegal or
 * junior lawyer) then chooses their country, which decides every question
 * they are ever shown, because Malaysian and Australian law are kept
 * strictly apart. A litigation trainee is joining a month at the firm in
 * Malaysia, so their door leads to the programme's own page and asks no
 * country at all.
 */
const INTERN_COUNTRIES = [
  {
    key: 'MY',
    href: '/signup?country=MY',
    name: 'Malaysia',
    stripe: 'linear-gradient(180deg, #010066 0 33%, #cc0001 33% 66%, #ffcc00 66% 100%)',
    who: 'Rules of Court 2012, drafting, research and AI ethics.',
  },
  {
    key: 'AU',
    href: '/signup?country=AU',
    name: 'Australia',
    stripe: 'linear-gradient(180deg, #00247d 0 50%, #cf142b 50% 100%)',
    who: 'Court hierarchy, procedure, evidence and drafting, State by State.',
  },
] as const;

const TRAINEE_COVERS = [
  'Live files with our lawyers',
  'A video from your coach each day',
  'Practice questions and homework',
];

const LOOP = [
  {
    icon: CheckIcon,
    step: 'Diagnostic',
    body: 'Around thirty questions across court system, procedure, evidence, advocacy, drafting and reasoning. Not a score, a map.',
  },
  {
    icon: LevelIcon,
    step: 'Skill map',
    body: 'Where you are strong, where you are not, and the three areas worth your next hour.',
  },
  {
    icon: FlameIcon,
    step: 'Daily training',
    body: 'Five to twenty minutes. Weighted towards your weakest concepts and whatever is due for review.',
  },
  {
    icon: SparkIcon,
    step: 'Feedback',
    body: 'Why the right answer is right, what you may have confused it with, and what it means in practice.',
  },
  {
    icon: RepeatIcon,
    step: 'Spaced retesting',
    body: 'Everything you get wrong comes back tomorrow. Everything you know comes back later, but it does come back.',
  },
];

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
            Where are you starting?
          </h1>
          <p className="rise-up delay-2 mt-5 max-w-xl text-lg text-paper/80 sm:text-xl">
            Two ways in. Interns train on their own country&rsquo;s law. Litigation
            trainees join the programme at {brand.firm} in Malaysia.
          </p>

          <div className="mt-10 grid gap-4 sm:mt-14 md:grid-cols-2 md:gap-6">
            <div className="landing-tile landing-tile--static rise-up delay-3">
              <div className="flex h-full flex-col p-6 sm:p-8">
                <p className="eyebrow mb-3">Students, pupils, paralegals and junior lawyers</p>
                <h2 className="text-4xl leading-none sm:text-5xl">Intern</h2>
                <p className="mt-3 text-slate">
                  Practice questions, a skill map and daily training. Choose where you will
                  practise: the two countries&rsquo; law is kept strictly apart.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                  {INTERN_COUNTRIES.map((country) => (
                    <Link
                      key={country.key}
                      href={country.href}
                      className="country-door group relative flex items-center gap-4 overflow-hidden rounded-xl border-2 border-rule bg-paper py-4 pr-4 pl-6 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-burgundy hover:shadow-raised focus-visible:border-burgundy"
                    >
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-1.5"
                        style={{ background: country.stripe }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-serif text-2xl leading-tight">{country.name}</span>
                        <span className="mt-1 block text-xs text-slate">{country.who}</span>
                      </span>
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-burgundy text-paper transition-transform duration-200 group-hover:translate-x-1">
                        <ArrowIcon className="size-4" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link href="/trainee" className="landing-tile landing-tile--featured rise-up delay-4">
              <div className="flex h-full flex-col p-6 sm:p-8">
                <div className="mb-3 flex min-h-7 flex-wrap items-center justify-between gap-2">
                  <p className="eyebrow text-paper/70">{brand.firm} · Malaysia</p>
                  {intake ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-paper/12 px-3 py-1 text-xs font-semibold text-paper ring-1 ring-paper/25">
                      <span aria-hidden className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-300 opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-amber-300" />
                      </span>
                      {intake}
                    </span>
                  ) : null}
                </div>
                <h2 className="text-4xl leading-none sm:text-5xl">Litigation Trainee</h2>
                <p className="mt-3 text-paper/80">
                  {PROGRAMME.length} at {brand.firm}, {PROGRAMME.days}. The next intake
                  starts in {PROGRAMME.nextIntake}.
                </p>
                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {TRAINEE_COVERS.map((line) => (
                    <li
                      key={line}
                      className="rounded-full bg-paper/10 px-3 py-1 text-xs text-paper/90 ring-1 ring-paper/20"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-center justify-between gap-3 pt-7">
                  <span className="text-sm font-semibold text-paper">See the programme</span>
                  <span className="landing-arrow grid size-11 shrink-0 place-items-center rounded-full bg-paper text-burgundy">
                    <ArrowIcon className="size-5" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        <section className="py-14 sm:py-20">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="mb-10 text-2xl sm:text-3xl">One loop, done properly.</h2>
          <ol className="relative grid gap-6 lg:grid-cols-5 lg:gap-4">
            <span
              aria-hidden
              className="absolute top-6 right-[10%] left-[10%] hidden h-0.5 bg-gradient-to-r from-burgundy/10 via-burgundy/40 to-burgundy/10 lg:block"
            />
            {LOOP.map((item, index) => (
              <li key={item.step} className="relative flex gap-4 lg:flex-col lg:items-center lg:text-center">
                <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-full bg-burgundy text-paper shadow-raised ring-4 ring-paper">
                  <item.icon className="size-5" />
                </span>
                <span>
                  <span className="eyebrow block">{String(index + 1).padStart(2, '0')}</span>
                  <span className="mt-1 block font-serif text-xl">{item.step}</span>
                  <span className="mt-1.5 block text-sm text-slate">{item.body}</span>
                </span>
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
