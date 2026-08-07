import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { getModuleProgress } from '@/lib/modules/service';
import { Card, Pill, SectionHeading } from '@/components/ui';

export const metadata: Metadata = { title: 'Modules' };

export default async function ModulesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/login');

  const progress = await getModuleProgress(user.id, profile.country);

  return (
    <div className="space-y-8">
      <section>
        <p className="eyebrow mb-2">Learn</p>
        <h1 className="text-3xl sm:text-4xl">Lessons, then questions</h1>
        <p className="mt-3 max-w-xl text-slate">
          Each of these teaches for a few minutes and then asks. Daily training never
          finishes, which is right for staying sharp and no use for saying whether someone
          has covered something. A module has a finishing line.
        </p>
      </section>

      <section>
        <SectionHeading title="Your modules" />
        <div className="space-y-3">
          {progress.map((entry) => (
            <Link key={entry.module.slug} href={`/modules/${entry.module.slug}`} className="block">
              <Card className="transition-colors hover:bg-paper-sunk">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg">{entry.module.name}</h3>
                      {entry.module.required ? <Pill tone="accent">Required</Pill> : null}
                      {entry.complete ? <Pill tone="correct">Complete</Pill> : null}
                    </div>
                    <p className="mt-1 text-sm text-slate">{entry.module.summary}</p>
                  </div>
                  <p className="shrink-0 text-sm tabular-nums text-muted">
                    {entry.total === 0
                      ? 'Not published yet'
                      : `${entry.correctOnce} of ${entry.total}`}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
