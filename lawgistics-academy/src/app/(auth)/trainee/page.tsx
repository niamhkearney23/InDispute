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

export const metadata: Metadata = { title: 'The litigation trainee programme' };

/**
 * The programme's own front door.
 *
 * A trainee is not choosing a country or a course. They are joining a
 * month at a firm, and this app is the part of that month that lives on a
 * screen: the quiz on day one, the questions each day, the work their
 * supervisors hand them, and the sessions their coach records. This page
 * says exactly that, in that order, and then offers the sign-up.
 */
const partsFor = (questionsOpen: boolean) => [
  {
    icon: CheckIcon,
    when: 'Day one',
    title: 'A short diagnostic quiz',
    body: questionsOpen
      ? 'About thirty questions across the court system, procedure, evidence, advocacy and drafting. It is not a test you pass. It shows what you already know, and everything after it is built from that.'
      : 'About thirty questions across the court system, procedure, evidence, advocacy and drafting, once the firm’s lawyers have signed them off. It is not a test you pass. It shows what you already know, and everything after it is built from that.',
  },
  {
    icon: SparkIcon,
    when: 'Every day',
    title: 'Questions in your spare time',
    body: questionsOpen
      ? 'Five to twenty minutes on Malaysian procedure, evidence and drafting. Anything you get wrong comes back until it stops being wrong. Alongside it, one piece of homework for each working day on how the firm runs a file.'
      : 'Five to twenty minutes a day on Malaysian procedure, evidence and drafting, once the questions are signed off. Anything you get wrong comes back until it stops being wrong. From day one, one piece of homework for each working day on how the firm runs a file.',
  },
  {
    icon: BriefcaseIcon,
    when: 'From your supervisors',
    title: 'Real work, marked',
    body: 'A lawyer posts a piece of work, typed or as a voice memo. You put your name on it, do it, hand it in here, and they tell you what they would have done differently. Every piece has a place to message them.',
  },
  {
    icon: BookIcon,
    when: 'From your coach',
    title: 'Short sessions, on video',
    body: 'Your coach records a short session and it is waiting when you open the app in the morning, with anything to read attached.',
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
            Litigation trainee programme · {brand.firm}
          </p>
          <h1 className="rise-up delay-1 max-w-3xl text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-7xl">
            {PROGRAMME.length} of litigation, learned by doing.
          </h1>
          <p className="rise-up delay-2 mt-5 max-w-2xl text-lg text-paper/85 sm:text-xl">
            The next intake starts in {PROGRAMME.nextIntake}, {PROGRAMME.days}, at{' '}
            {brand.firm}. You work on real matters with the lawyers who supervise you, not
            from a textbook. This is the part of the month that lives on a screen: the
            training that goes with the work, and the work itself.
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
            Your supervisor confirms you once you have signed up, and the work opens from
            there.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        <section className="py-14 sm:py-20">
          <p className="eyebrow mb-3">What the month looks like here</p>
          <h2 className="mb-10 max-w-2xl text-2xl sm:text-3xl">
            Four things, and they all happen in the same place.
          </h2>
          <ol className="grid gap-4 sm:grid-cols-2">
            {PARTS.map((part, index) => (
              <li
                key={part.title}
                className="rounded-xl border border-rule bg-paper-raised p-6 shadow-card sm:p-7"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-burgundy-wash text-burgundy">
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
          <p className="eyebrow mb-3">The month, week by week</p>
          <h2 className="mb-3 max-w-2xl text-2xl sm:text-3xl">
            One file, from the first interview to the courtroom.
          </h2>
          <p className="mb-8 max-w-2xl text-slate">
            Each week produces pieces of real work on that file, and your supervisor grades
            them. Ten at the top grade, including the six required ones, is certification.
            Your supervisor may vary the plan.
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
                  Produces
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
              <h2 className="mb-3 text-2xl sm:text-3xl">Practical, not a textbook.</h2>
              <p className="text-slate">
                The programme is coaching. You learn a file by working on one, and a lawyer
                who has done it tells you what they would have done differently. The
                questions here are the other half of that: the rules you need to hold in
                your head, asked until you do.
              </p>
            </div>
            <div>
              <h2 className="mb-3 text-2xl sm:text-3xl">Nothing here is a client&rsquo;s.</h2>
              <p className="text-slate">
                This is a training tool, not the firm&rsquo;s document system. Work is
                handed in with your own declaration that nothing in it identifies a
                client, and the lawyers posting it take the names out first.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-rule py-12 sm:py-16">
          <div className="flex flex-col items-start gap-5 rounded-xl bg-burgundy-wash p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h2 className="text-2xl sm:text-3xl">Starting in {PROGRAMME.nextIntake}?</h2>
              <p className="mt-2 text-slate">
                {questionsOpen
                  ? 'Sign up now, sit the diagnostic quiz on your first day, and everything else follows.'
                  : 'Sign up now. Your supervisor confirms you, and the work and sessions open from there.'}
              </p>
            </div>
            <ButtonLink href="/trainee/signup" size="lg" variant="accent">
              Sign up for the programme
              <ArrowIcon className="ml-2 size-4" />
            </ButtonLink>
          </div>
          <p className="mt-6 text-sm text-slate">
            Not a trainee?{' '}
            <Link
              href="/"
              className="-my-2 inline-block py-2 font-medium text-burgundy underline underline-offset-4"
            >
              The academy for law students and junior lawyers is here.
            </Link>
          </p>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl border-t border-rule px-5 py-8 sm:px-8">
        <p className="text-xs text-muted">
          {brand.fullName} is a training tool. It is not legal advice, and progression
          levels within it are game levels, not professional qualifications or titles.
        </p>
      </footer>
    </div>
  );
}
