import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { Notice } from '@/components/ui';
import { ArrowIcon } from '@/components/icons';
import { FrontPageVideo } from '@/components/front-page-video';
import { intakeStatus } from '@/lib/intake/countdown';
import { getCurrentUser } from '@/lib/supabase/server';
import { publicEnv } from '@/lib/env';
import { brand } from '@/lib/brand';
import { PROGRAMME } from '@/content/programme';
import { paymentsOn } from '@/lib/access/service';
import { PRICES, formatPrice, traineeValue } from '@/lib/access/rules';

/**
 * The front door: navy and cream, product first.
 *
 * The page leads with a matter, because that is the thing the academy does
 * and nobody else does: a file lands, there is a clock, and four tasks. The
 * hero's video opens on that matter, works it and has it marked, then shows
 * the trainee mornings and the score; everything after it explains it. The serif is for the big editorial
 * headings only; everything a person reads to act on is in the sans.
 *
 * Everything shown is something the app does. The example matter in the
 * video is the first of the drafted Malaysian matters, with its real time limit and its
 * real four tasks; the training record is the real path to the certificate,
 * and its numbers are labelled as an example.
 */

const STEPS = [
  ['Receive the file', 'A realistic, invented client matter lands on your desk, with a clock.'],
  ['Do the work', 'Find the procedure, draft the advice and record yourself explaining it.'],
  ['Get reviewed', 'See how a lawyer would approach it, then a lawyer marks your work.'],
] as const;

const SKILLS = [
  ['Legal research', 'Find the answer when nobody tells you where to look.'],
  ['Drafting', 'Turn the law into advice, letters and court documents.'],
  ['Strategy', 'Decide what you would actually recommend to a client.'],
  ['Advocacy', 'Explain your position clearly, under time pressure.'],
] as const;

const RECORD = [
  ['Required modules', 'done'],
  ['Matters', 'now'],
  ['Lawyer review', 'now'],
  ['Certificate', 'next'],
] as const;

/** Empty on a firm's own deployment, which hides the university offer. */
const PARTNERS_EMAIL = brand.partnersEmail || null;

/** Reads the session in order to redirect signed-in learners to the dashboard. */
export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');
  const payments = paymentsOn();
  const intake = intakeStatus(PROGRAMME.intakeStartsOn, PROGRAMME.intakeEndsOn, new Date());

  return (
    <div className="min-h-dvh bg-cream text-ink">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-cream">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#f5f1e8_1px,transparent_1px),linear-gradient(to_bottom,#f5f1e8_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]"
        />

        <header className="relative mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-5 sm:px-8">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2.5">
            <span aria-hidden className="h-5 w-1 rounded-full bg-wine" />
            <span className="text-sm font-semibold tracking-[0.2em] uppercase">
              {brand.name}
              {brand.suffix ? (
                <span className="ml-2 font-normal text-mist">{brand.suffix}</span>
              ) : null}
            </span>
          </Link>
          <nav aria-label="Front page" className="flex items-center gap-1 text-sm sm:gap-6">
            <a
              href="#how"
              className="hidden min-h-11 items-center text-cream/75 hover:text-cream md:inline-flex"
            >
              How it works
            </a>
            <a
              href="#pathways"
              className="hidden min-h-11 items-center text-cream/75 hover:text-cream md:inline-flex"
            >
              Programmes
            </a>
            {PARTNERS_EMAIL ? (
              <a
                href="#universities"
                className="hidden min-h-11 items-center text-cream/75 hover:text-cream md:inline-flex"
              >
                For universities
              </a>
            ) : null}
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-md border border-cream/25 px-4 font-medium hover:border-cream/60"
            >
              Sign in
            </Link>
          </nav>
        </header>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-20 sm:px-8 sm:pt-16 md:grid-cols-[1.15fr_1fr] md:pb-28 lg:gap-16">
          <div>
            {!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey ? (
              <div className="mb-8 text-ink">
                <Notice tone="warn">
                  Supabase is not configured yet, so signing in will not work. Open{' '}
                  <Link href="/setup" className="font-medium underline underline-offset-2">
                    /setup
                  </Link>
                  .
                </Notice>
              </div>
            ) : null}

            <h1 className="rise-up text-[2.5rem] leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-[3.3rem]">
              <span className="block">Learn to practise law</span>{' '}
              <span className="block text-mist">before you have to practise it.</span>
            </h1>
            <p className="rise-up delay-1 mt-6 max-w-lg text-lg leading-relaxed text-cream/80">
              Work through realistic legal matters. Draft the documents. Make the call. Explain your
              reasoning. Get reviewed by lawyers.
            </p>
            <div className="rise-up delay-2 mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#pathways"
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-cream px-6 font-semibold text-navy transition-colors hover:bg-white"
              >
                Start training
              </a>
              <a
                href="#how"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-cream/30 px-6 font-medium text-cream transition-colors hover:border-cream/70"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* The explainer: the example matter worked, marked, then the
              mornings and the score. It starts on the same matter the card
              here used to show, so the page still leads with a matter. */}
          <div className="rise-up delay-2 relative">
            <div
              aria-hidden
              className="absolute -inset-3 rounded-2xl bg-cream/5 ring-1 ring-cream/10"
            />
            <div className="relative overflow-hidden rounded-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
              <FrontPageVideo />
            </div>
          </div>
        </div>
      </section>

      <main>
        {/* How it works */}
        <section id="how" className="scroll-mt-4 mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
          <p className="text-xs font-semibold tracking-[0.18em] text-wine uppercase">
            How it works
          </p>
          <h2 className="mt-3 max-w-xl text-4xl sm:text-5xl">
            Like a real matter, start to finish.
          </h2>
          <ol className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            <span
              aria-hidden
              className="absolute top-[9px] bottom-2 left-[9px] w-px bg-rule-strong md:top-[9px] md:right-[33%] md:bottom-auto md:left-0 md:h-px md:w-auto"
            />
            {STEPS.map(([title, body], i) => (
              <li key={title} className="relative pl-10 md:pl-0">
                <span
                  aria-hidden
                  className="absolute top-0 left-0 grid size-[19px] place-items-center rounded-full border border-rule-strong bg-cream md:relative"
                >
                  <span className="size-[7px] rounded-full bg-wine" />
                </span>
                <p className="text-sm font-semibold tabular-nums text-mist md:mt-6">0{i + 1}</p>
                <h3 className="mt-1 font-sans text-sm font-semibold tracking-[0.14em] uppercase">
                  {title}
                </h3>
                <p className="mt-2 max-w-xs text-slate">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Not a lecture */}
        <section className="bg-navy text-cream">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
            <p className="text-xs font-semibold tracking-[0.18em] text-mist uppercase">
              This isn&rsquo;t another law lecture
            </p>
            <h2 className="mt-3 max-w-2xl text-4xl leading-[1.08] sm:text-5xl">
              You already learn the law.{' '}
              <span className="text-mist">Here, you learn the work.</span>
            </h2>
            <ul className="mt-12 grid gap-px overflow-hidden rounded-xl bg-cream/10 sm:grid-cols-2 lg:grid-cols-4">
              {SKILLS.map(([title, body]) => (
                <li key={title} className="bg-navy-raised p-6">
                  <span aria-hidden className="block h-0.5 w-6 bg-wine" />
                  <h3 className="mt-5 font-sans text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Pathways */}
        <section
          id="pathways"
          className="scroll-mt-4 mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28"
        >
          <p className="text-xs font-semibold tracking-[0.18em] text-wine uppercase">Pathways</p>
          <h2 className="mt-3 text-4xl sm:text-5xl">Choose your pathway</h2>
          <div
            className={`mt-12 grid gap-5 ${PARTNERS_EMAIL ? 'lg:grid-cols-3' : 'md:grid-cols-2'}`}
          >
            <div className="flex flex-col rounded-xl border border-rule bg-white p-6 sm:p-7">
              <p className="text-[0.6875rem] font-semibold tracking-[0.18em] text-mist uppercase">
                Academy
              </p>
              <h3 className="mt-2 font-sans text-2xl font-semibold tracking-tight">Student</h3>
              <p className="mt-2 text-slate">
                Practical training on your own, for law students, interns and pupils.
              </p>
              {payments ? (
                <p className="mt-3 text-sm text-slate">
                  {formatPrice(PRICES.MY.month)} a month in Malaysia, {formatPrice(PRICES.AU.month)} in
                  Australia. Free with a code from your firm or university.
                </p>
              ) : null}
              <p className="mt-6 text-xs font-medium text-slate">Where will you practise?</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(
                  [
                    ['MY', 'Malaysia'],
                    ['AU', 'Australia'],
                  ] as const
                ).map(([code, name]) => (
                  <Link
                    key={code}
                    href={`/signup?country=${code}`}
                    className="group inline-flex min-h-12 items-center justify-between rounded-md border border-rule-strong px-4 text-sm font-semibold transition-colors hover:border-navy hover:bg-navy hover:text-cream"
                  >
                    {name}
                    <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col rounded-xl bg-navy p-6 text-cream sm:p-7">
              <p className="text-[0.6875rem] font-semibold tracking-[0.18em] text-mist uppercase">
                Programme · Malaysia
              </p>
              <h3 className="mt-2 font-sans text-2xl font-semibold tracking-tight">
                Litigation Trainee
              </h3>
              <p className="mt-2 text-cream/75">
                A structured one-month litigation programme with practising lawyers at {brand.firm}.
              </p>
              <Link
                href="/trainee"
                className="group mt-auto inline-flex min-h-12 items-center justify-between rounded-md bg-cream px-4 pt-0 text-sm font-semibold text-navy transition-colors hover:bg-white max-lg:mt-6"
              >
                See the programme
                <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {PARTNERS_EMAIL ? (
              <div
                id="universities"
                className="flex scroll-mt-4 flex-col rounded-xl border border-rule bg-white p-6 sm:p-7"
              >
                <p className="text-[0.6875rem] font-semibold tracking-[0.18em] text-mist uppercase">
                  Universities
                </p>
                <h3 className="mt-2 font-sans text-2xl font-semibold tracking-tight">
                  University partner
                </h3>
                <p className="mt-2 text-slate">
                  Give your students practical legal experience alongside their degree.
                </p>
                <a
                  href={`mailto:${PARTNERS_EMAIL}?subject=University%20partnership`}
                  className="group mt-auto inline-flex min-h-12 items-center justify-between rounded-md border border-rule-strong px-4 text-sm font-semibold transition-colors hover:border-navy max-lg:mt-6"
                >
                  Talk to us
                  <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            ) : null}
          </div>
        </section>

        {/* The cohort */}
        <section className="relative bg-navy text-cream">
          <div className="mx-auto max-w-6xl">
            <div className="relative z-10 px-4 py-20 sm:px-8 sm:py-24 md:w-1/2">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-semibold tracking-[0.18em] text-mist uppercase">
                  {PROGRAMME.nextIntake} cohort
                </p>
                {intake ? (
                  <p className="rounded-full border border-cream/20 px-3 py-1 text-xs font-medium">
                    <span
                      aria-hidden
                      className="mr-1.5 inline-block size-1.5 rounded-full bg-wine align-middle"
                    />
                    {intake}
                  </p>
                ) : null}
              </div>
              <h2 className="mt-4 text-4xl leading-[1.08] sm:text-5xl">{brand.traineeAcademy}</h2>
              <p className="mt-3 text-mist">With {brand.firm}, Malaysia</p>
              <p className="mt-8 text-lg text-cream/90">
                One month. Realistic matters. Lawyer feedback.
              </p>
              <p className="mt-2 text-sm text-mist">{traineeValue(payments).line}</p>
              <ul className="mt-5 flex flex-wrap gap-2 text-sm">
                {['Research', 'Drafting', 'Procedure', 'Oral advocacy'].map((s) => (
                  <li
                    key={s}
                    className="rounded-md bg-cream/[0.07] px-3 py-1.5 text-cream/85 ring-1 ring-cream/10"
                  >
                    {s}
                  </li>
                ))}
              </ul>
              <Link
                href="/trainee"
                className="group mt-10 inline-flex min-h-12 items-center gap-2 rounded-md bg-cream px-6 font-semibold text-navy transition-colors hover:bg-white"
              >
                View programme
                <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="relative min-h-72 md:absolute md:inset-y-0 md:right-0 md:w-1/2">
              <Image
                src="/academy/court.webp"
                alt=""
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover grayscale"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-r from-navy via-navy/30 to-navy/10 max-md:bg-gradient-to-b"
              />
              <div aria-hidden className="absolute inset-0 bg-wine/15 mix-blend-multiply" />
            </div>
          </div>
        </section>

        {/* Progression */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
          <div className="grid gap-12 md:grid-cols-[1fr_1.2fr] md:items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-wine uppercase">
                Progress
              </p>
              <h2 className="mt-3 text-4xl sm:text-5xl">Your training record</h2>
              <p className="mt-4 max-w-md text-slate">
                Every matter you hand in, every review and every module you finish goes on one
                record. Finish the required modules and five matters marked Good by a lawyer, and
                you earn the certificate.
              </p>
            </div>

            <div className="rounded-xl border border-rule bg-white p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Training record</p>
                <p className="rounded-full bg-cream px-2.5 py-0.5 text-[0.6875rem] font-medium text-slate">
                  Example
                </p>
              </div>
              <ol className="mt-6 grid grid-cols-4 gap-2">
                {RECORD.map(([step, state], i) => (
                  <li key={step}>
                    <span
                      aria-hidden
                      className={
                        state === 'done'
                          ? 'block h-1.5 rounded-full bg-navy'
                          : state === 'now'
                            ? 'block h-1.5 rounded-full bg-gradient-to-r from-navy to-rule'
                            : 'block h-1.5 rounded-full bg-rule'
                      }
                    />
                    <p className="mt-2 text-[0.6875rem] font-semibold tabular-nums text-mist">
                      0{i + 1}
                    </p>
                    <p className="text-xs font-medium leading-snug sm:text-sm">{step}</p>
                  </li>
                ))}
              </ol>
              <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-rule pt-6">
                {(
                  [
                    ['5', 'matters handed in'],
                    ['3', 'marked Good by a lawyer'],
                    ['5', 'spoken explanations'],
                  ] as const
                ).map(([n, label]) => (
                  <div key={label}>
                    <dt className="sr-only">{label}</dt>
                    <dd className="font-serif text-4xl text-navy tabular-nums">{n}</dd>
                    <dd className="mt-1 text-xs leading-snug text-slate">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
          <p className="text-xs text-slate">
            {brand.fullName} is a training tool. It is not legal advice. Its levels and its
            certificate are training records, not professional qualifications or titles.
          </p>
          {brand.parentLine ? <p className="mt-2 text-xs text-slate">{brand.parentLine}</p> : null}
        </div>
      </footer>
    </div>
  );
}
