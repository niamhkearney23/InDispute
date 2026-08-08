import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/guard';
import { listFirmModulesForAdmin } from '@/lib/firm/service';
import { ButtonLink, Card, EmptyState, InlineLink, Pill, SectionHeading } from '@/components/ui';

export const metadata: Metadata = { title: 'Firm induction' };

export default async function FirmModulesPage() {
  await requireAdmin();
  const modules = await listFirmModulesForAdmin();

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow mb-2">Firm induction</p>
            <h1 className="text-3xl">The firm’s own content</h1>
          </div>
          <ButtonLink href="/admin/firm/new" variant="accent">
            Write one
          </ButtonLink>
        </div>
        <p className="mt-3 max-w-2xl text-slate">
          A welcome, an AI policy, anything the firm wants read before the first week. These
          are the firm’s words: nothing here goes through verification, because that queue is
          for statements of law we are answerable for, and none of it enters daily training.
        </p>
      </section>

      <section>
        <SectionHeading title="Modules" />
        {modules.length === 0 ? (
          <EmptyState
            title="Nothing written yet"
            description="Start with the AI policy. It is the one a junior is most likely to break without realising, and the one a firm most wants to be able to show somebody has read."
            action={<ButtonLink href="/admin/firm/new" variant="accent">Write the first one</ButtonLink>}
          />
        ) : (
          <div className="space-y-3">
            {modules.map((module) => (
              <Card key={module.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg">{module.name}</h3>
                      {module.published ? (
                        <Pill tone="correct">Published</Pill>
                      ) : (
                        <Pill>Draft</Pill>
                      )}
                      {module.required ? <Pill tone="accent">Required</Pill> : null}
                    </div>
                    <p className="mt-1 text-sm text-slate">
                      {module.summary || 'No summary.'}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      {module.version ? `Version ${module.version}` : 'No content yet'}
                      {' · '}
                      {module.country === null
                        ? 'Everyone'
                        : module.country === 'AU'
                          ? 'Australian accounts'
                          : 'Malaysian accounts'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <ButtonLink href={`/admin/firm/${module.id}`} variant="outline" size="sm">
                      Edit
                    </ButtonLink>
                    <ButtonLink
                      href={`/admin/firm/${module.id}/record`}
                      variant="ghost"
                      size="sm"
                    >
                      Who has read it
                    </ButtonLink>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-rule pt-6">
        <p className="max-w-2xl text-sm text-slate">
          Changing the words of a published module supersedes it and asks everyone again. That
          is deliberate: an acknowledgement records what a named person read, so it cannot
          quietly come to mean something they never saw. Editing a title or a summary does not
          do that.{' '}
          <InlineLink href="/modules">See what a learner sees</InlineLink>
          .
        </p>
      </section>
    </div>
  );
}
