import Link from 'next/link';
import { ButtonLink, Notice, Wordmark } from '@/components/ui';
import { ArrowIcon, BookIcon, BriefcaseIcon, CheckIcon, SparkIcon } from '@/components/icons';
import { intakeStatus } from '@/lib/intake/countdown';
import { getCurrentUser } from '@/lib/supabase/server';
import { publicEnv } from '@/lib/env';
import { brand } from '@/lib/brand';
import { PROGRAMME } from '@/content/programme';
import { redirect } from 'next/navigation';

/**
 * The front door.
 *
 * It sells one idea: law school gives you the law, this gives you the
 * practice. Then it shows the system (draft, think, speak, get feedback),
 * the journey through a matter, an example file, and the two ways in:
 * Intern, who then chooses Malaysia or Australia because the two countries'
 * law is kept apart, and Litigation Trainee, which is always Malaysia.
 *
 * Every line says what the product does today. The example matter is one
 * of the training files, with invented facts, and its tasks are the tasks
 * a learner is actually given.
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

const PILLARS = [
  {
    n: '01',
    title: 'Draft',
    body: 'Advice to a client, written against the clock, and letters marked line by line.',
  },
  {
    n: '02',
    title: 'Think',
    body: 'Work out the procedure, the evidence and the deadline before you write a word.',
  },
  {
    n: '03',
    title: 'Speak',
    body: 'Record your advice out loud, in three minutes, as you would say it to the client.',
  },
  {
    n: '04',
    title: 'Get feedback',
    body: 'Follow-up questions about your own draft, then the lawyer’s approach, then a lawyer’s mark.',
  },
];

const JOURNEY = [
  'Choose a matter',
  'Read the file',
  'Find the procedure',
  'Draft your advice',
  'Explain it out loud',
  'Get questioned',
  'See the lawyer’s approach',
  'Get marked',
];

const EXAMPLE_TASKS = [
  'Identify the applicable procedure',
  'Draft a short advice',
  'Record a three-minute explanation',
  'Answer five follow-up questions about your draft',
];

const STRIP = ['Malaysia and Australia', 'Practical skills', 'Lawyer feedback', 'AI follow-up questions'];

/** Reads the session in order to redirect signed-in learners to the dashboard. */
export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');
  const intake = intakeStatus(PROGRAMME.intakeStartsOn, PROGRAMME.intakeEndsOn, new Date());

  return (
    <div className="min-h-dvh">
      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                */}
      {/* ------------------------------------------------------------------ */}
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

        <div className="mx-auto max-w-6xl px-5 pt-12 pb-14 sm:px-8 sm:pt-20 sm:pb-20">
          {!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey ? (
            <div className="mb-8">
              <Notice tone="warn">
                Supabase is not configured yet, so signing in will not work. Copy{' '}
                <code className="font-mono">.env.example</code> to{' '}
                <code className="font-mono">.env.local</code> and fill it in, then open{' '}
                <Link href="/setup" className="font-medium underline underline-offset-2">
                  /setup
                </Link>
                .
              </Notice>
            </div>
          ) : null}

          <p className="rise-up mb-6 text-[0.6875rem] font-semibold tracking-[0.24em] text-paper/70 uppercase">
            {brand.fullName}
          </p>
          <h1 className="rise-up delay-1 max-w-4xl text-[3rem] leading-[0.98] tracking-[-0.025em] sm:text-7xl lg:text-[5.5rem]">
            Law school gives you the law.{' '}
            <span className="italic text-[#f3c9bd]">We give you the practice.</span>
          </h1>
          <p className="rise-up delay-2 mt-7 max-w-2xl text-lg text-paper/85 sm:text-xl">
            Practical litigation training for law students, pupils, interns and junior lawyers
            in Malaysia and Australia. Work through real legal problems. Draft. Analyse.
            Speak. Get feedback.
          </p>

          <div className="rise-up delay-3 mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="#ways-in" size="lg" variant="light">
              Explore the Academy
            </ButtonLink>
            <ButtonLink
              href="/trainee"
              size="lg"
              variant="outline"
              className="border-paper/40 bg-transparent text-paper hover:bg-paper/10"
            >
              Apply for the trainee programme
            </ButtonLink>
          </div>

          <ul className="rise-up delay-4 mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-paper/20 pt-6 text-sm text-paper/75">
            {STRIP.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span aria-hidden className="size-1 rounded-full bg-paper/60" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <main>
        {/* ---------------------------------------------------------------- */}
        {/* The law / how to use it                                          */}
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2">
            <div className="bg-paper-sunk p-8 sm:p-12">
              <p className="eyebrow mb-4">What law school teaches you</p>
              <p className="font-serif text-5xl text-slate sm:text-7xl">The law.</p>
            </div>
            <div className="relative bg-paper-raised p-8 sm:p-12">
              <p className="eyebrow mb-4 text-burgundy">What the {brand.fullName} teaches you</p>
              <p className="font-serif text-5xl sm:text-7xl">
                How to <span className="italic text-burgundy">use it.</span>
              </p>
            </div>
          </div>

          <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <li key={p.n} className="group relative bg-paper-raised p-7 transition-colors hover:bg-burgundy-wash">
                <p className="font-mono text-sm text-burgundy">{p.n}</p>
                <h3 className="mt-6 text-3xl sm:text-4xl">{p.title}</h3>
                <p className="mt-3 text-sm text-slate">{p.body}</p>
                <span
                  aria-hidden
                  className="absolute bottom-0 left-0 h-0.5 w-0 bg-burgundy transition-[width] duration-500 group-hover:w-full"
                />
              </li>
            ))}
          </ol>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* The journey, and an example file                                 */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-y border-rule bg-paper-sunk">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <p className="eyebrow mb-3">How a matter works</p>
            <h2 className="max-w-2xl text-4xl sm:text-5xl">The problem first. Then the lawyer&rsquo;s way.</h2>

            <ol className="journey relative mt-12 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-8">
              <span aria-hidden className="journey-line absolute top-4 right-[7%] left-[6%] hidden h-px bg-burgundy/40 lg:block" />
              {JOURNEY.map((step, i) => (
                <li
                  key={step}
                  className="journey-step relative flex flex-col items-start lg:items-center lg:text-center"
                  style={{ animationDelay: `${200 + i * 140}ms` }}
                >
                  <span className="relative z-10 grid size-8 place-items-center rounded-full border border-burgundy bg-paper font-mono text-xs text-burgundy">
                    {i + 1}
                  </span>
                  <span className="mt-3 text-sm font-medium">{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-16 grid items-start gap-8 lg:grid-cols-[1.15fr_1fr]">
              {/* The example file, set like a document on a desk. */}
              <article className="relative rotate-[-0.6deg] overflow-hidden rounded-xl border border-rule bg-paper-raised shadow-raised">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule bg-paper-sunk px-6 py-3">
                  <span className="font-mono text-xs font-semibold tracking-wider text-burgundy">
                    Matter 01 · Companies and insolvency
                  </span>
                  <span className="rounded-full bg-burgundy px-2.5 py-0.5 font-mono text-[0.6875rem] text-paper">
                    45:00
                  </span>
                </div>
                <div className="case-paper px-6 py-6 sm:px-8">
                  <h3 className="text-2xl sm:text-3xl">A statutory demand</h3>
                  <p className="ruled mt-3 font-serif text-[1.0625rem]">
                    Your client has received a statutory demand for RM180,000. It says two of the
                    three invoices are for steel it rejected in writing. The managing director
                    wants to know whether the company is about to be wound up, and what to do this
                    week.
                  </p>
                  <p className="mt-4 font-mono text-[0.6875rem] tracking-wider text-muted uppercase">
                    Training file · invented facts
                  </p>
                </div>
              </article>

              <div>
                <p className="eyebrow mb-4">Your task</p>
                <ol className="space-y-3">
                  {EXAMPLE_TASKS.map((task, i) => (
                    <li key={task} className="flex items-start gap-3.5 rounded-xl border border-rule bg-paper-raised px-4 py-3.5">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-burgundy font-mono text-xs text-paper">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{task}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-5 text-sm text-slate">
                  Then you see how a lawyer would approach it, and a lawyer marks your work.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* More than lectures                                               */}
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow mb-3">Built for people who want more than lectures</p>
              <ul className="space-y-1 font-serif text-3xl text-muted sm:text-4xl">
                <li>Not another lecture.</li>
                <li>Not another set of notes.</li>
                <li>Not another reading list.</li>
              </ul>
            </div>
            <div className="border-l-2 border-burgundy pl-6 sm:pl-8">
              <ul className="space-y-4 font-serif text-3xl sm:text-4xl">
                <li>You are given the problem first.</li>
                <li>You work it out.</li>
                <li className="text-burgundy">Then you see how a lawyer would approach it.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* The two ways in                                                  */}
        {/* ---------------------------------------------------------------- */}
        <section id="ways-in" className="landing-hero scroll-mt-4">
          <div aria-hidden className="landing-grid" />
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <p className="mb-3 text-[0.6875rem] font-semibold tracking-[0.2em] text-paper/70 uppercase">
              Two ways in
            </p>
            <h2 className="max-w-2xl text-4xl sm:text-5xl">Where are you starting?</h2>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <div className="landing-tile landing-tile--static">
                <div className="flex h-full flex-col p-6 sm:p-8">
                  <p className="eyebrow mb-3">Students, pupils, paralegals and junior lawyers</p>
                  <h3 className="text-4xl leading-none sm:text-5xl">Intern</h3>
                  <ul className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['Matters', 'Practice files'],
                      ['Daily', 'Questions that adapt'],
                      ['Lawyer', 'Marking and feedback'],
                      ['Certificate', 'On completion'],
                    ].map(([big, small]) => (
                      <li key={big} className="rounded-lg border border-rule px-3 py-2.5">
                        <span className="block font-serif text-xl">{big}</span>
                        <span className="block text-xs text-slate">{small}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 text-sm text-slate">Choose where you will practise:</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
                    {INTERN_COUNTRIES.map((country) => (
                      <Link
                        key={country.key}
                        href={country.href}
                        className="group relative flex items-center gap-4 overflow-hidden rounded-xl border-2 border-rule bg-paper py-4 pr-4 pl-6 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-burgundy hover:shadow-raised focus-visible:border-burgundy"
                      >
                        <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: country.stripe }} />
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

              <Link href="/trainee" className="landing-tile landing-tile--featured">
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
                  <h3 className="text-4xl leading-none sm:text-5xl">Litigation Trainee</h3>
                  <p className="mt-3 text-paper/80">
                    A one-month intensive with {brand.firm}, {PROGRAMME.days}. The next intake
                    starts in {PROGRAMME.nextIntake}.
                  </p>
                  <ul className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['4 weeks', 'Monday to Friday'],
                      ['Live files', 'With our lawyers'],
                      ['Daily', 'A video from your coach'],
                      ['Certified', 'By your supervisor'],
                    ].map(([big, small]) => (
                      <li key={big} className="rounded-lg border border-paper/20 px-3 py-2.5">
                        <span className="block font-serif text-xl">{big}</span>
                        <span className="block text-xs text-paper/70">{small}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-7">
                    <span className="text-sm font-semibold text-paper">Apply for the programme</span>
                    <span className="landing-arrow grid size-11 shrink-0 place-items-center rounded-full bg-paper text-burgundy">
                      <ArrowIcon className="size-5" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* The record                                                       */}
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              [CheckIcon, 'Checked by lawyers', 'Questions and matters reach you only once a named lawyer has signed them off.'],
              [BookIcon, 'Your country’s law', 'Malaysian and Australian law are kept strictly apart. Every question records where it applies.'],
              [BriefcaseIcon, 'A record that holds', 'What you handed in stays exactly as you handed it in, with the mark and who gave it.'],
            ].map(([Icon, title, body]) => {
              const I = Icon as typeof CheckIcon;
              return (
                <div key={title as string}>
                  <span className="grid size-10 place-items-center rounded-full bg-burgundy-wash text-burgundy">
                    <I className="size-5" />
                  </span>
                  <h3 className="mt-4 text-xl">{title as string}</h3>
                  <p className="mt-1.5 text-sm text-slate">{body as string}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-16 flex flex-col items-start gap-4 border-t border-rule pt-10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl">Already training here?</h2>
              <p className="mt-2 text-slate">Pick up where you left off.</p>
            </div>
            <ButtonLink href="/login" size="lg" variant="accent">
              Sign in
              <SparkIcon className="ml-1 size-4" />
            </ButtonLink>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl border-t border-rule px-5 py-8 sm:px-8">
        <p className="text-xs text-muted">
          {brand.fullName} is a training tool. It is not legal advice. Its levels and its
          certificate are training records, not professional qualifications or titles.
        </p>
      </footer>
    </div>
  );
}
