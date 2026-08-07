import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { getModule } from '@/lib/modules/service';
import { ButtonLink, Card, Notice, Pill, ScoreBar } from '@/components/ui';
import { StartModuleButton } from '../start-module-button';

export const metadata: Metadata = { title: 'Module' };

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/login');

  const entry = await getModule(user.id, profile.country, slug);
  if (!entry) notFound();

  const { module: definition } = entry;
  const percent = entry.total === 0 ? 0 : Math.round((entry.correctOnce / entry.total) * 100);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <p className="eyebrow">Module</p>
          {definition.required ? <Pill tone="accent">Required</Pill> : null}
          {entry.complete ? <Pill tone="correct">Complete</Pill> : null}
        </div>
        <h1 className="text-3xl sm:text-4xl">{definition.name}</h1>
        <p className="mt-3 text-slate">{definition.rationale}</p>
      </section>

      {entry.total === 0 ? (
        <Notice tone="warn">
          None of this module has been published yet. Its questions are still waiting to be
          verified, and nothing unverified is served to learners.
        </Notice>
      ) : (
        <Card>
          <ScoreBar
            label="Answered correctly at least once"
            score={percent}
            band={entry.complete ? 'strong' : percent >= 50 ? 'developing' : 'weak'}
          />
          <p className="mt-4 border-t border-rule pt-4 text-sm text-slate">
            {entry.complete
              ? `Completed ${new Date(entry.completedAt!).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}. These concepts still come back in daily training, because covering something once is not the same as remembering it.`
              : `${entry.correctOnce} of ${entry.total} answered correctly so far. The module is complete when every question in it has been, which is a thing you do rather than a button you press.`}
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        {entry.total > 0 ? (
          <StartModuleButton
            slug={definition.slug}
            label={entry.complete ? 'Go through it again' : entry.correctOnce > 0 ? 'Continue' : 'Start'}
          />
        ) : null}
        <ButtonLink href="/modules" size="lg" variant="outline">
          All modules
        </ButtonLink>
      </div>
    </div>
  );
}
