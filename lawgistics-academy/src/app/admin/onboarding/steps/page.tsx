import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/guard';
import { listStepsForAdmin } from '@/lib/onboarding/service';
import { listFirmModulesForAdmin } from '@/lib/firm/service';
import { ButtonLink, Card, EmptyState, InlineLink, Pill, SectionHeading } from '@/components/ui';

export const metadata: Metadata = { title: 'The checklist' };

export default async function StepsPage() {
  await requireAdmin();

  const [steps, modules] = await Promise.all([listStepsForAdmin(), listFirmModulesForAdmin()]);
  const moduleById = new Map(modules.map((m) => [m.id, m]));

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow mb-2">Oversight</p>
            <h1 className="text-3xl">The checklist</h1>
          </div>
          <ButtonLink href="/admin/onboarding/steps/new" variant="accent">
            Add an item
          </ButtonLink>
        </div>
        <p className="mt-3 max-w-2xl text-slate">
          What everybody has to have read, signed or set up before their first day. Three
          kinds of item, and the difference between them is who can honestly say it is done.
        </p>
      </section>

      <section>
        <SectionHeading title="Items" />
        {steps.length === 0 ? (
          <EmptyState
            title="Nothing on the list"
            description="Start with the things that are already true: the ethics policy, the handbook, the NDA. Anything a partner would be unhappy to find somebody had not done in their first week belongs here."
            action={
              <ButtonLink href="/admin/onboarding/steps/new" variant="accent">
                Add the first item
              </ButtonLink>
            }
          />
        ) : (
          <div className="space-y-3">
            {steps.map((step) => {
              const linked = step.firmModuleId ? moduleById.get(step.firmModuleId) : undefined;
              const broken = step.kind === 'read' && (!linked || !linked.published || !linked.body.trim());

              return (
                <Card key={step.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg">{step.title}</h3>
                        {step.published ? <Pill tone="correct">Published</Pill> : <Pill>Draft</Pill>}
                        {step.required ? <Pill tone="accent">Required</Pill> : null}
                        {step.needsFirmCheck ? <Pill tone="warn">Firm confirms</Pill> : null}
                      </div>
                      <p className="mt-1 text-sm text-slate">{step.detail || 'No instructions.'}</p>
                      <p className="mt-2 text-xs text-muted">
                        {step.kind === 'read'
                          ? `Reading: ${linked?.name ?? 'nothing selected'}`
                          : step.kind === 'sign'
                            ? 'Sign and return'
                            : 'Set up or done'}
                        {' · '}
                        {step.country === null
                          ? 'Everyone'
                          : step.country === 'AU'
                            ? 'Australian accounts'
                            : 'Malaysian accounts'}
                      </p>
                      {broken ? (
                        <p className="mt-2 text-sm text-burgundy">
                          This points at a document that is missing, unpublished or empty, so
                          nobody will see the item at all. Fix it under{' '}
                          <InlineLink href="/admin/firm">Firm</InlineLink>.
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0">
                      <ButtonLink
                        href={`/admin/onboarding/steps/${step.id}`}
                        variant="outline"
                        size="sm"
                      >
                        Edit
                      </ButtonLink>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="border-t border-rule pt-6">
        <p className="max-w-2xl text-sm text-slate">
          A reading step is finished by the person reading the document and confirming, which
          records which version they read. A signing step and a task are finished by them
          saying so, and, where the firm can actually observe it, by somebody here confirming
          as well. Nothing on this list clears anybody to begin: that is a decision a person
          makes on{' '}
          <InlineLink href="/admin/onboarding">the oversight page</InlineLink>.
        </p>
      </section>
    </div>
  );
}
