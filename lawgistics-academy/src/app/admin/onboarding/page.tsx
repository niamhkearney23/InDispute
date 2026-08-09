import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/guard';
import { getLearnerProfile } from '@/lib/learner-overview';
import { onboardingRoster, listStepsForAdmin } from '@/lib/onboarding/service';
import { daysUntil, shortDate } from '@/lib/onboarding/rules';
import { ButtonLink, Card, EmptyState, InlineLink, Pill, SectionHeading } from '@/components/ui';

export const metadata: Metadata = { title: 'Before they begin' };

export default async function OnboardingRosterPage() {
  const { userId: adminId } = await requireAdmin();
  const me = await getLearnerProfile(adminId);
  // The supervisor's own clock, so "starts soon" means soon where they are.
  const timezone = me?.timezone ?? 'Australia/Melbourne';

  const [roster, steps] = await Promise.all([onboardingRoster(), listStepsForAdmin()]);
  const published = steps.filter((s) => s.published);

  // The only genuinely urgent thing on this page: somebody starts within the
  // fortnight, is not cleared, and has items outstanding.
  const urgent = roster.filter(
    (p) => p.startsOn && !p.cleared && p.outstandingCount > 0 && daysUntil(p.startsOn, timezone) <= 14,
  );
  const waitingOnUs = roster.filter((p) => p.awaitingFirmCount > 0);

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow mb-2">Oversight</p>
            <h1 className="text-3xl">Before they begin</h1>
          </div>
          <ButtonLink href="/admin/onboarding/steps" variant="outline">
            The checklist
          </ButtonLink>
        </div>
        <p className="mt-3 max-w-2xl text-slate">
          Who has read what, who has signed what, and who is about to start work without
          having done either. Nothing here decides that somebody is ready: you do, and your
          name goes on it.
        </p>
      </section>

      {published.length === 0 ? (
        <EmptyState
          title="The checklist is empty"
          description="Add what a new joiner has to have read, signed or set up before their first day. Until something is published here, this page has nothing to check."
          action={
            <ButtonLink href="/admin/onboarding/steps/new" variant="accent">
              Add the first item
            </ButtonLink>
          }
        />
      ) : (
        <>
          {urgent.length > 0 ? (
            <Card className="border-burgundy/30 bg-burgundy-wash">
              <h2 className="text-lg">
                {urgent.length === 1
                  ? '1 person starts soon and is not ready'
                  : `${urgent.length} people start soon and are not ready`}
              </h2>
              <ul className="mt-2 space-y-1 text-slate">
                {urgent.map((p) => (
                  <li key={p.userId}>
                    <InlineLink href={`/admin/onboarding/${p.userId}`}>
                      {p.displayName ?? p.email ?? 'Unnamed'}
                    </InlineLink>{' '}
                    starts {shortDate(p.startsOn as string)}, {p.outstandingCount} outstanding
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {waitingOnUs.length > 0 ? (
            <Card>
              <h2 className="text-lg">Waiting on the firm</h2>
              <p className="mt-1 text-sm text-slate">
                These people have said they have done something that somebody here has to
                confirm. Until that happens it stays outstanding on their list, and they
                cannot do anything about it.
              </p>
              <ul className="mt-3 space-y-1 text-slate">
                {waitingOnUs.map((p) => (
                  <li key={p.userId}>
                    <InlineLink href={`/admin/onboarding/${p.userId}`}>
                      {p.displayName ?? p.email ?? 'Unnamed'}
                    </InlineLink>{' '}
                    · {p.awaitingFirmCount} to confirm
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <section>
            <SectionHeading title="Everyone" />
            <div className="space-y-3">
              {roster.map((person) => (
                <Card key={person.userId}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg">{person.displayName ?? 'Unnamed'}</h3>
                        {person.cleared ? (
                          <Pill tone="correct">Cleared</Pill>
                        ) : person.outstandingCount === 0 ? (
                          <Pill tone="warn">Ready, not cleared</Pill>
                        ) : (
                          <Pill tone="accent">{person.outstandingCount} outstanding</Pill>
                        )}
                        {person.awaitingFirmCount > 0 ? (
                          <Pill tone="warn">{person.awaitingFirmCount} to confirm</Pill>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-slate">{person.email ?? 'No email'}</p>
                      <p className="mt-2 text-xs text-muted">
                        {person.startsOn
                          ? `Begins ${shortDate(person.startsOn)}`
                          : 'No start date set'}
                        {' · '}
                        {person.doneCount} of {person.requiredCount} done
                        {person.decision && person.decision.decision === 'cleared' && person.decision.outstandingCount > 0
                          ? ` · cleared with ${person.decision.outstandingCount} outstanding`
                          : ''}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <ButtonLink
                        href={`/admin/onboarding/${person.userId}`}
                        variant="outline"
                        size="sm"
                      >
                        Open
                      </ButtonLink>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
