import { ButtonLink, Notice, Wordmark } from '@/components/ui';
import { getCurrentUser } from '@/lib/supabase/server';
import { publicEnv } from '@/lib/env';
import { redirect } from 'next/navigation';

const LOOP = [
  {
    step: 'Diagnostic',
    body: 'Around thirty questions across court system, procedure, evidence, advocacy, drafting and reasoning. Not a score — a map.',
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
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <Wordmark />
        <nav className="flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Sign in
          </ButtonLink>
          <ButtonLink href="/signup" variant="primary" size="sm">
            Get started
          </ButtonLink>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-5 sm:px-8">
        {!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey ? (
          <div className="mb-6">
            <Notice tone="warn">
              Supabase is not configured, so signing in will not work yet. Copy{' '}
              <code className="font-mono">.env.example</code> to{' '}
              <code className="font-mono">.env.local</code>, apply the migration in{' '}
              <code className="font-mono">supabase/migrations</code>, then run{' '}
              <code className="font-mono">npm run seed</code>. Full steps are in the
              README.
            </Notice>
          </div>
        ) : null}

        <section className="border-t border-rule py-14 sm:py-20">
          <p className="eyebrow mb-5">Australian litigation training</p>
          <h1 className="max-w-3xl text-[2.5rem] leading-[1.05] sm:text-6xl">
            Train like a lawyer.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate">
            Lawgistics Litigation Academy works out what you don’t know, teaches it
            properly, and remembers to test you again. Built for Australian law students,
            PLT students, graduates and junior lawyers.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/signup" size="lg" variant="accent">
              Start the diagnostic
            </ButtonLink>
            <ButtonLink href="/login" size="lg" variant="outline">
              I already have an account
            </ButtonLink>
          </div>
        </section>

        <section className="border-t border-rule py-12 sm:py-16">
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
                relevant, its source, and when that source was last checked — and no
                question reaches a learner until a person has verified it.
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
      </main>

      <footer className="mx-auto max-w-5xl border-t border-rule px-5 py-8 sm:px-8">
        <p className="text-xs text-muted">
          Lawgistics Litigation Academy is a training tool. It is not legal advice, and
          progression levels within it are game levels — not professional qualifications
          or titles.
        </p>
      </footer>
    </div>
  );
}
