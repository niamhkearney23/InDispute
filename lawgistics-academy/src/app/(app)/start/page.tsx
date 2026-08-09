import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { beforeYouBegin, type LearnerStep } from '@/lib/onboarding/service';
import { countdown, longDate } from '@/lib/onboarding/rules';
import { brand } from '@/lib/brand';
import { ButtonLink, Card, EmptyState, Notice, Pill } from '@/components/ui';
import { DeclareForm } from './declare-form';

export const metadata: Metadata = { title: 'Before you begin' };

export default async function BeforeYouBeginPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/login');

  const { startsOn, steps, outstanding, decision, cleared } = await beforeYouBegin(
    user.id,
    profile.country,
  );

  const required = steps.filter((s) => s.required);
  const done = required.filter((s) => s.done).length;

  return (
    <div className="mx-auto max-w-2xl space-y-7">
      <section>
        <p className="eyebrow mb-2">{brand.name}</p>
        <h1 className="text-3xl sm:text-4xl">Before you begin</h1>
        <p className="mt-3 text-slate">
          {startsOn ? `${countdown(startsOn, profile.timezone)} ` : ''}
          Everything the firm needs you to have read, signed or set up is on this page.
        </p>
      </section>

      {steps.length === 0 ? (
        <EmptyState
          title="Nothing to do yet"
          description="The firm has not put anything on this list. When they do, it will appear here and you will see it on your dashboard."
          action={
            <ButtonLink href="/dashboard" variant="outline">
              Back to today
            </ButtonLink>
          }
        />
      ) : (
        <>
          {cleared ? (
            <Notice tone="good">
              <strong>You are cleared to begin.</strong>{' '}
              {decision?.decidedByName
                ? `${decision.decidedByName} confirmed this`
                : 'The firm confirmed this'}
              {decision ? ` on ${longDate(decision.decidedAt)}` : ''}.
              {decision && decision.outstandingCount > 0
                ? ` ${decision.outstandingCount} ${
                    decision.outstandingCount === 1 ? 'item was' : 'items were'
                  } still outstanding at the time, so please finish anything left below.`
                : ''}
            </Notice>
          ) : outstanding.length > 0 ? (
            <Notice tone="warn">
              <strong>
                {outstanding.length === 1
                  ? '1 thing left to do.'
                  : `${outstanding.length} things left to do.`}
              </strong>{' '}
              Somebody at the firm checks this list before your first day.
            </Notice>
          ) : (
            <Notice>
              <strong>You have done everything on the list.</strong> Somebody at the firm
              still has to look over it, so there is nothing more for you to do here.
            </Notice>
          )}

          <section>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-xl sm:text-2xl">Your list</h2>
              <p className="font-serif text-base tabular-nums text-slate">
                {done} of {required.length} done
              </p>
            </div>

            <ul className="space-y-3">
              {steps.map((step) => (
                <StepCard key={step.id} step={step} />
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function StepCard({ step }: { step: LearnerStep }) {
  return (
    <Card as="li">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg">{step.title}</h3>
        {step.done ? <Pill tone="correct">Done</Pill> : null}
        {!step.done && step.awaitingFirm ? <Pill tone="warn">With the firm</Pill> : null}
        {!step.done && !step.awaitingFirm && step.required ? <Pill tone="accent">Required</Pill> : null}
        {!step.required ? <Pill>Optional</Pill> : null}
      </div>

      {step.detail ? <p className="mt-2 text-slate">{step.detail}</p> : null}

      {step.done ? (
        <p className="mt-3 text-sm text-muted">
          {step.kind === 'read' && step.declaredAt
            ? `You confirmed you had read this on ${longDate(step.declaredAt)}.`
            : null}
          {step.kind !== 'read' && step.confirmedAt
            ? `You recorded this on ${longDate(step.declaredAt ?? step.confirmedAt)}, and the firm confirmed it on ${longDate(step.confirmedAt)}.`
            : null}
          {step.kind !== 'read' && !step.confirmedAt && step.declaredAt
            ? `You recorded this on ${longDate(step.declaredAt)}.`
            : null}
        </p>
      ) : step.awaitingFirm ? (
        <p className="mt-3 text-sm text-slate">
          You recorded this on {longDate(step.declaredAt as string)}. It stays here until
          somebody at the firm confirms it, which is not something you can do anything about.
        </p>
      ) : step.kind === 'read' ? (
        <div className="mt-4">
          <ButtonLink href={`/modules/firm/${step.moduleSlug}`} variant="accent">
            Read it
          </ButtonLink>
        </div>
      ) : (
        <DeclareForm slug={step.slug} kind={step.kind} needsFirmCheck={step.needsFirmCheck} />
      )}
    </Card>
  );
}
