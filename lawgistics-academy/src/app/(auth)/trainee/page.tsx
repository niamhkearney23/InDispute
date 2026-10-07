import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ButtonLink, Wordmark } from '@/components/ui';
import { ArrowIcon, BookIcon, BriefcaseIcon, CheckIcon, SparkIcon } from '@/components/icons';
import { getCurrentUser } from '@/lib/supabase/server';
import { brand } from '@/lib/brand';
import { PROGRAMME } from '@/content/programme';
import { trainingOpen } from '@/lib/training/service';
import { PROGRAMME_WEEKS, boxesForWeek } from '@/content/programme-plan';
import { paymentsOn } from '@/lib/access/service';
import { traineeValue } from '@/lib/access/rules';
import { FrontPageVideo } from '@/components/front-page-video';

const DESCRIPTION = `A one-month litigation trainee programme at ${brand.firm} in Malaysia. Live files with our lawyers, plus the ${brand.traineeAcademy} for homework and practice in your spare time.`;

/* Its own preview text, so a link to this page shared on WhatsApp or by
   email describes the Malaysian programme rather than the whole academy. */
export const metadata: Metadata = {
  title: brand.traineeAcademy,
  description: DESCRIPTION,
  openGraph: { title: `${brand.traineeAcademy} · ${brand.firm}`, description: DESCRIPTION },
};

/**
 * The programme's own front door.
 *
 * A trainee is not choosing a country or a course. They are joining a
 * month at a firm. This page says what that month is, in the firm's own
 * voice, and then offers the sign-up.
 */
const partsFor = (questionsOpen: boolean) => [
  {
    icon: CheckIcon,
    when: 'Day one',
    title: 'A quick diagnostic quiz',
    body: questionsOpen
      ? 'About thirty questions on courts, procedure, evidence, advocacy and drafting. There’s no pass mark. It just shows us where you’re starting from, so we know what to focus on.'
      : 'About thirty questions on courts, procedure, evidence, advocacy and drafting, once our lawyers have signed the questions off. There’s no pass mark. It just shows us where you’re starting from.',
  },
  {
    icon: SparkIcon,
    when: 'Every working morning',
    title: 'Four rounds of ten questions',
    body: questionsOpen
      ? 'At 7, 8, 9 and 10am, Kuala Lumpur time, on Malaysian procedure, evidence and drafting. Each round is open for its hour. Anything you get wrong comes back until you’ve got it. There’s also a short homework task each day about how the firm runs a file.'
      : 'At 7, 8, 9 and 10am, Kuala Lumpur time, on Malaysian procedure, evidence and drafting, once our lawyers have signed the questions off. Anything you get wrong comes back until you’ve got it. The short daily homework on how the firm runs a file starts on day one.',
  },
  {
    icon: BriefcaseIcon,
    when: 'From your supervisors',
    title: 'Extra work from our lawyers',
    body: 'Our lawyers post pieces of work you can pick up. Add your name, hand it in here, and they’ll tell you what they’d have done differently.',
  },
  {
    icon: BookIcon,
    when: 'From your coach',
    title: 'A video from your coach each day',
    body: 'What’s happening this week, and what to focus on. These are for trainees only.',
  },
];

export default async function TraineeProgrammePage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  // The Malaysian questions publish only when a lawyer signs them off. Until
  // then this page must not promise a quiz on day one and questions every
  // day, because the person who signs up on the strength of that arrives to
  // a dashboard saying none have been published yet.
  const questionsOpen = await trainingOpen('MY');
  const PARTS = partsFor(questionsOpen);
  const payments = paymentsOn();
  const value = traineeValue(payments);

  return (
    <div className="min-h-dvh">
      <section className="relative overflow-hidden bg-navy text-cream">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#f5f1e8_1px,transparent_1px),linear-gradient(to_bottom,#f5f1e8_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]"
        />

        <header className="fade-in relative mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
          <Link href="/" className="-mx-1 rounded-[5px] px-1 py-2">
            <Wordmark light />
          </Link>
          <ButtonLink href="/login" variant="light" size="sm">
            Sign in
          </ButtonLink>
        </header>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-8 pb-16 sm:px-8 sm:pt-14 md:grid-cols-[1.15fr_1fr] md:pb-24 lg:gap-16">
          <div>
            <p className="rise-up mb-4 flex items-center gap-3 text-[0.6875rem] font-semibold tracking-[0.18em] text-mist uppercase">
              <span aria-hidden className="h-px w-8 bg-wine" />
              {brand.traineeAcademy} · {brand.firm}
            </p>
            <h1 className="rise-up delay-1 text-[2.5rem] leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-[3.3rem]">
              <span className="block">{PROGRAMME.length} of litigation,</span>{' '}
              <span className="block text-mist">learned by doing.</span>
            </h1>
            <p className="rise-up delay-2 mt-6 max-w-xl text-lg leading-relaxed text-cream/80">
              Our next intake starts in {PROGRAMME.nextIntake}. For four weeks, {PROGRAMME.days},
              you’ll work on live files with the lawyers at {brand.firm}. That’s the main part, and it
              happens in the office.
            </p>
            <p className="rise-up delay-2 mt-4 max-w-xl text-lg leading-relaxed text-cream/80">
              Alongside it, you get the {brand.traineeAcademy}: the morning rounds, your homework and
              practice for the month.
            </p>

            <div className="rise-up delay-3 mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/trainee/signup"
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-cream px-6 font-semibold text-navy transition-colors hover:bg-white"
              >
                Sign up for the programme
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-cream/30 px-6 font-medium text-cream transition-colors hover:border-cream/70"
              >
                Already signed up? Sign in
              </Link>
            </div>
            <p className="rise-up delay-4 mt-5 text-sm text-cream/70">
              Sign up, and your supervisor will confirm your place.
            </p>

            <div className="rise-up delay-4 mt-9 inline-flex max-w-xl flex-col gap-1 rounded-xl border border-cream/15 bg-cream/[0.06] px-5 py-4">
              <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-cream/60 uppercase">
                Included with your place
              </p>
              <p className="flex items-baseline gap-3">
                <span
                  className={
                    payments
                      ? 'font-serif text-2xl text-cream/50 line-through decoration-1'
                      : 'font-serif text-2xl text-cream/60'
                  }
                >
                  {value.price} a year
                </span>
                <span className="font-serif text-3xl text-cream">Free</span>
              </p>
              <p className="text-sm text-cream/70">{value.line}</p>
            </div>
          </div>

          {/* The same explainer as the front page: it opens on a matter like
              the ones trainees get and shows the morning rounds. */}
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

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        <section className="py-14 sm:py-20">
          <p className="eyebrow mb-3">Your {brand.traineeAcademy}</p>
          <h2 className="mb-10 max-w-2xl text-2xl sm:text-3xl">The homework side of the month.</h2>
          <ol className="grid gap-4 sm:grid-cols-2">
            {PARTS.map((part, index) => (
              <li
                key={part.title}
                className="rounded-xl border border-rule bg-paper-raised p-6 shadow-card sm:p-7"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-wash text-accent">
                    <part.icon className="size-5" />
                  </span>
                  <span className="eyebrow">
                    {String(index + 1).padStart(2, '0')} · {part.when}
                  </span>
                </div>
                <h3 className="text-xl">{part.title}</h3>
                <p className="mt-2 text-slate">{part.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-rule py-12 sm:py-16">
          <p className="eyebrow mb-3">Week by week</p>
          <h2 className="mb-3 max-w-2xl text-2xl sm:text-3xl">
            From the first interview to the courtroom.
          </h2>
          <p className="mb-8 max-w-2xl text-slate">
            Each week focuses on a different stage of a case. Your supervisor grades the work you
            produce. Ten pieces at the top grade, including the six core pieces, earns your
            certification. Your supervisor may adjust the plan as you go.
          </p>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROGRAMME_WEEKS.map((week) => (
              <li
                key={week.number}
                className="rounded-xl border border-rule bg-paper-raised p-5 shadow-card"
              >
                <p className="eyebrow">Week {week.number}</p>
                <h3 className="mt-1 text-xl">{week.title}</h3>
                <p className="mt-2 text-sm text-slate">{week.theme}</p>
                <p className="mt-3 text-xs font-semibold tracking-wide text-muted uppercase">
                  You’ll produce
                </p>
                <ul className="mt-1 space-y-1 text-sm">
                  {boxesForWeek(week).map((box) => (
                    <li key={box.number}>{box.workProduct.split(' (')[0].split(' / ')[0]}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-rule py-12 sm:py-16">
          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <h2 className="mb-3 text-2xl sm:text-3xl">Learning by doing</h2>
              <p className="text-slate">
                You learn by working on live files, with lawyers who have done it many times showing
                you how. The Academy covers the rest at your own pace: the rules you need to know by
                heart.
              </p>
            </div>
            <div>
              <h2 className="mb-3 text-2xl sm:text-3xl">Client confidentiality</h2>
              <p className="text-slate">
                Nothing here belongs to a client. Our lawyers take out any names before they post
                work, and everything you hand in comes with your confirmation that it doesn’t
                identify anyone.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-rule py-12 sm:py-16">
          <div className="flex flex-col items-start gap-5 rounded-xl bg-accent-wash p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h2 className="text-2xl sm:text-3xl">Joining us in {PROGRAMME.nextIntake}?</h2>
              <p className="mt-2 text-slate">
                {questionsOpen
                  ? 'Sign up now, and you’ll start with the diagnostic quiz on your first day.'
                  : 'Sign up now, and we’ll see you on your first day.'}{' '}
                The Academy is included free with your place.
              </p>
            </div>
            <ButtonLink href="/trainee/signup" size="lg" variant="accent">
              Sign up for the programme
              <ArrowIcon className="ml-2 size-4" />
            </ButtonLink>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl border-t border-rule px-5 py-8 sm:px-8">
        <p className="text-xs text-muted">
          {brand.fullName} is a training tool. It is not legal advice, and progression levels within
          it are game levels, not professional qualifications or titles.
        </p>
        {brand.parentLine ? <p className="mt-2 text-xs text-muted">{brand.parentLine}</p> : null}
      </footer>
    </div>
  );
}
