import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/supabase/server';
import { getSetupStatus } from '@/lib/setup/status';
import { ButtonLink, Card, Notice, Wordmark } from '@/components/ui';
import { SetupForm } from './setup-form';

export const metadata: Metadata = { title: 'Set up' };
export const dynamic = 'force-dynamic';

/**
 * First run.
 *
 * Everything that would otherwise be a terminal command — loading the content,
 * creating the first administrator — happens here, so getting from a fresh
 * deployment to a working app needs no command line at all.
 */
export default async function SetupPage() {
  const [user, status] = await Promise.all([getCurrentUser(), getSetupStatus()]);

  const steps = [
    {
      done: status.envConfigured && status.serviceKeyConfigured,
      title: 'Connect Supabase',
      body: status.envConfigured
        ? status.serviceKeyConfigured
          ? 'Connected.'
          : 'The two public keys are set, but SUPABASE_SERVICE_ROLE_KEY is missing. Add it and redeploy — note that it must not have a NEXT_PUBLIC_ prefix.'
        : 'Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY, then redeploy. These are read at build time, so a redeploy is required — restarting is not enough.',
    },
    {
      done: status.schemaReady,
      title: 'Create the tables',
      body: status.schemaReady
        ? 'All tables present.'
        : `Open the Supabase SQL editor and run the three files in supabase/migrations in order: 0001_init.sql, 0002_daily_facts.sql, 0003_review_workflow.sql.${
            status.schemaError ? ` (${status.schemaError})` : ''
          }`,
    },
    {
      done: Boolean(user),
      title: 'Create your account',
      body: user
        ? `Signed in as ${user.email}.`
        : 'Sign up, then come back here. If nothing happens when you sign up, email confirmation is on without a mail provider configured — turn it off under Authentication → Sign In / Providers → Email.',
    },
    {
      done: status.contentLoaded && status.adminExists,
      title: 'Load the content and claim admin',
      body: status.adminExists
        ? 'Done — this installation already has an administrator.'
        : 'One button, below.',
    },
  ];

  const ready = status.envConfigured && status.serviceKeyConfigured && status.schemaReady;
  const finished = status.contentLoaded && status.adminExists;

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-5 py-12 sm:px-8">
      <Link href="/" className="mb-10 inline-block">
        <Wordmark />
      </Link>

      <p className="eyebrow mb-2">First run</p>
      <h1 className="mb-3 text-3xl sm:text-4xl">Set up</h1>
      <p className="mb-8 text-slate">
        Four steps. This page checks each one for you, and closes itself once an
        administrator exists.
      </p>

      <ol className="mb-8 space-y-3">
        {steps.map((step, index) => (
          <li key={step.title}>
            <Card className={step.done ? 'border-verdict-correct/30 bg-verdict-correct-wash' : ''}>
              <div className="flex gap-3">
                <span
                  className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    step.done
                      ? 'bg-verdict-correct text-paper'
                      : 'border border-rule-strong text-muted'
                  }`}
                  aria-hidden
                >
                  {step.done ? '✓' : index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{step.title}</p>
                  <p className="mt-1 text-sm text-slate">{step.body}</p>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      {finished ? (
        <>
          <Notice tone="neutral">
            Setup is complete. {status.publishedQuestions} questions and{' '}
            {status.publishedFacts} daily facts are loaded, and{' '}
            {status.reviewOutstanding} still need to be verified by a person.
          </Notice>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/dashboard" size="lg" variant="accent">
              Go to the app
            </ButtonLink>
            <ButtonLink href="/admin/review" size="lg" variant="outline">
              Start verifying the content
            </ButtonLink>
          </div>
        </>
      ) : null}

      {!finished && ready && user ? (
        <SetupForm tokenRequired={Boolean(process.env.SETUP_TOKEN)} />
      ) : null}

      {!finished && ready && !user ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/signup?next=/setup" size="lg" variant="accent">
            Create your account
          </ButtonLink>
          <ButtonLink href="/login?next=/setup" size="lg" variant="outline">
            I already have one
          </ButtonLink>
        </div>
      ) : null}

      {!ready ? (
        <Notice tone="warn">
          Finish the steps above, then reload this page. Nothing here will work until
          Supabase is connected and the tables exist.
        </Notice>
      ) : null}

      <p className="mt-10 border-t border-rule pt-5 text-xs text-muted">
        This page grants administrator rights, so it closes permanently once one
        administrator exists. Between deploying and signing up for the first time, anyone
        who reaches this URL could claim it — if your deployment is publicly reachable, set
        a <code className="font-mono">SETUP_TOKEN</code> environment variable and this page
        will ask for it.
      </p>
    </div>
  );
}
