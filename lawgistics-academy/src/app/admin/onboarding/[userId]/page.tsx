import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/guard';
import { getLearnerProfile } from '@/lib/learner-overview';
import { onboardingForPerson, decisionHistory } from '@/lib/onboarding/service';
import { longDate } from '@/lib/onboarding/rules';
import { ButtonLink, Card, Notice, Pill, SectionHeading } from '@/components/ui';
import { ConfirmButton, DecisionForm, StartDateForm } from './oversight-forms';

export const metadata: Metadata = { title: 'Before they begin' };

export default async function PersonOnboardingPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { userId: adminId } = await requireAdmin();

  const [person, history, me] = await Promise.all([
    onboardingForPerson(userId),
    decisionHistory(userId),
    getLearnerProfile(adminId),
  ]);

  if (!person) notFound();

  const { state } = person;
  const required = state.steps.filter((s) => s.required);
  const doneCount = required.filter((s) => s.done).length;
  const name = person.displayName ?? person.email ?? 'This person';

  return (
    <div className="space-y-8">
      <section>
        <p className="eyebrow mb-2">Oversight</p>
        <h1 className="text-3xl">{person.displayName ?? 'Unnamed'}</h1>
        <p className="mt-2 text-slate">{person.email ?? 'No email'}</p>
      </section>

      <Card>
        <StartDateForm userId={userId} startsOn={state.startsOn} />
        <p className="mt-3 text-xs text-muted">
          Only an administrator can set this. It is the firm’s fact about somebody, not a
          setting they get to move, and the database refuses the change if they try.
        </p>
      </Card>

      {state.cleared ? (
        <Notice tone="good">
          <strong>Cleared to begin.</strong>{' '}
          {state.decision?.decidedByName ?? 'An administrator'} recorded this on{' '}
          {state.decision ? longDate(state.decision.decidedAt) : ''}
          {state.decision && state.decision.outstandingCount > 0
            ? `, with ${state.decision.outstandingCount} ${
                state.decision.outstandingCount === 1 ? 'item' : 'items'
              } outstanding at the time`
            : ''}
          .
        </Notice>
      ) : state.outstanding.length === 0 && required.length > 0 ? (
        <Notice tone="warn">
          <strong>Everything on the list is done.</strong> Nobody has cleared {name} yet, and
          that is a decision a person has to make rather than something this page concludes.
        </Notice>
      ) : null}

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-xl sm:text-2xl">Their list</h2>
          <p className="font-serif text-base tabular-nums text-slate">
            {doneCount} of {required.length} done
          </p>
        </div>

        {state.steps.length === 0 ? (
          <Card>
            <p className="text-slate">
              Nothing is published to this person. Either the checklist is empty or every item
              on it is scoped to the other country.
            </p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {state.steps.map((step) => (
              <Card as="li" key={step.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg">{step.title}</h3>
                  {step.done ? <Pill tone="correct">Done</Pill> : null}
                  {step.awaitingFirm ? <Pill tone="warn">Waiting on us</Pill> : null}
                  {!step.done && !step.awaitingFirm && step.required ? (
                    <Pill tone="accent">Outstanding</Pill>
                  ) : null}
                  {!step.required ? <Pill>Optional</Pill> : null}
                </div>

                <p className="mt-2 text-sm text-muted">
                  {step.kind === 'read'
                    ? `Reading: ${step.moduleName ?? 'a firm document'}`
                    : step.kind === 'sign'
                      ? 'A document to sign and return'
                      : 'Something to be set up or done'}
                </p>

                {step.declaredAt ? (
                  <p className="mt-2 text-sm text-slate">
                    {step.kind === 'read'
                      ? `Read and acknowledged on ${longDate(step.declaredAt)}.`
                      : `They recorded this on ${longDate(step.declaredAt)}.`}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-slate">
                    {step.kind === 'read'
                      ? 'Not read yet.'
                      : 'They have not recorded this yet.'}
                  </p>
                )}

                {step.confirmedAt ? (
                  <p className="mt-1 text-sm text-slate">
                    The firm confirmed it on {longDate(step.confirmedAt)}.
                  </p>
                ) : null}

                {step.awaitingFirm ? (
                  <ConfirmButton
                    userId={userId}
                    stepId={step.id}
                    label={
                      step.kind === 'sign' ? 'We have the signed document' : 'Confirm this is done'
                    }
                  />
                ) : null}
              </Card>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeading
          eyebrow="The decision"
          title={state.cleared ? 'Withdraw the clearance' : 'Clear them to begin'}
        />
        <Card>
          <DecisionForm
            userId={userId}
            cleared={state.cleared}
            outstandingCount={state.outstanding.length}
            supervisorName={me?.displayName ?? 'your name'}
          />
        </Card>
      </section>

      {history.length > 0 ? (
        <section>
          <SectionHeading title="What has been decided" />
          <div className="space-y-3">
            {history.map((entry) => (
              <Card key={`${entry.decidedAt}-${entry.decision}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base">
                    {entry.decision === 'cleared' ? 'Cleared to begin' : 'Clearance withdrawn'}
                  </h3>
                  {entry.outstandingCount > 0 ? (
                    <Pill tone="warn">{entry.outstandingCount} outstanding at the time</Pill>
                  ) : (
                    <Pill tone="correct">Nothing outstanding</Pill>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate">
                  {entry.decidedByName ?? 'An administrator'} · {longDate(entry.decidedAt)}
                </p>
                {entry.note ? <p className="mt-2 text-slate">{entry.note}</p> : null}
              </Card>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Nothing in this list can be edited or removed, by anybody. That is what makes it
            worth reading.
          </p>
        </section>
      ) : null}

      <div>
        <ButtonLink href="/admin/onboarding" variant="outline">
          Back to everyone
        </ButtonLink>
      </div>
    </div>
  );
}
