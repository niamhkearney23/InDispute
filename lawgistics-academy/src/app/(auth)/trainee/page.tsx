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
    when: 'Every day',
    title: 'A few minutes of questions',
    body: questionsOpen
      ? 'Five to twenty minutes on Malaysian procedure, evidence and drafting, whenever suits you. Anything you get wrong comes back until you’ve got it. There’s also a short homework task each day about how the firm runs a file.'
      : 'Five to twenty minutes on Malaysian procedure, evidence and drafting, as soon as the questions are signed off. Anything you get wrong comes back until you’ve got it. The short daily homework on how the firm runs a file starts on day one.',
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

  return (
    <div className="min-h-dvh">
      <section className="landing-hero">
        <div aria-hidden className="landing-light landing-light--a" />
        <div aria-hidden className="landing-light landing-light--b" />
        <div aria-hidden className="landing-light landing-light--c" />
        <div aria-hidden className="landing-grid" />
        <div aria-hidden className="landing-grain" />

        <header className="fade-in mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="-mx-1 rounded-[5px] px-1 py-2">
            <Wordmark light />
          </Link>
          <ButtonLink href="/login" variant="light" size="sm">
            Sign in
          </ButtonLink>
        </header>

        <div className="mx-auto max-w-6xl px-5 pt-10 pb-16 sm:px-8 sm:pt-16 sm:pb-24">
          <p className="rise-up mb-4 text-[0.6875rem] font-semibold tracking-[0.18em] text-paper/70 uppercase">
            {brand.traineeAcademy} · {brand.firm}
          </p>
          <h1 className="rise-up delay-1 max-w-3xl text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-7xl">
            {PROGRAMME.length} of litigation, learned by doing.
          </h1>
          <p className="rise-up delay-2 mt-5 max-w-2xl text-lg text-paper/85 sm:text-xl">
            Our next intake starts in {PROGRAMME.nextIntake}. For four weeks, {PROGRAMME.days},
            you’ll work on live files with the lawyers at {brand.firm}. That’s the main part,
            and it happens in the office.
          </p>
          <p className="rise-up delay-2 mt-4 max-w-2xl text-lg text-paper/85 sm:text-xl">
            Alongside it, you get the {brand.traineeAcademy}: your homework and practice for the
            month, for your spare time.
          </p>

          <div className="rise-up delay-3 mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/trainee/signup" size="lg" variant="light">
              Sign up for the programme
            </ButtonLink>
            <ButtonLink
              href="/login"
              size="lg"
              variant="outline"
              className="border-paper/40 bg-transparent text-paper hover:bg-paper/10"
            >
              Already signed up? Sign in
            </ButtonLink>
          </div>
          <p className="rise-up delay-4 mt-5 text-sm text-paper/70">
            Sign up, and your supervisor will confirm your place.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        <section className="py-14 sm:py-20">
          <p className="eyebrow mb-3">Your {brand.traineeAcademy}</p>
          <h2 className="mb-10 max-w-2xl text-2xl sm:text-3xl">
            The homework side of the month.
          </h2>
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
            Each week focuses on a different stage of a case. Your supervisor grades the work
            you produce. Ten pieces at the top grade, including the six core pieces, earns your
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
                You learn by working on live files, with lawyers who have done it many times
                showing you how. The Academy covers the rest at your own pace: the rules you
                need to know by heart.
              </p>
            </div>
            <div>
              <h2 className="mb-3 text-2xl sm:text-3xl">Client confidentiality</h2>
              <p className="text-slate">
                Nothing here belongs to a client. Our lawyers take out any names before they
                post work, and everything you hand in comes with your confirmation that it
                doesn’t identify anyone.
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
                  : 'Sign up now, and we’ll see you on your first day.'}
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
          {brand.fullName} is a training tool. It is not legal advice, and progression
          levels within it are game levels, not professional qualifications or titles.
        </p>
        {brand.parentLine ? <p className="mt-2 text-xs text-muted">{brand.parentLine}</p> : null}
      </footer>
    </div>
  );
}
