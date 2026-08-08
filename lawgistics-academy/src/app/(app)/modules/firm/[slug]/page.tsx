import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { getFirmModuleForLearner } from '@/lib/firm/service';
import { readingMinutes } from '@/lib/firm/content';
import { FirmBody } from '@/components/firm-body';
import { ButtonLink, Card, Notice, Pill } from '@/components/ui';
import { AcknowledgeForm } from './acknowledge-form';

export const metadata: Metadata = { title: 'Firm induction' };

export default async function FirmModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/login');

  const definition = await getFirmModuleForLearner(user.id, profile.country, slug);
  if (!definition) notFound();

  const minutes = readingMinutes(definition.body);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <p className="eyebrow">The firm</p>
          {definition.required ? <Pill tone="accent">Required</Pill> : null}
          {definition.acknowledgedAt ? <Pill tone="correct">Read</Pill> : null}
        </div>
        <h1 className="text-3xl sm:text-4xl">{definition.name}</h1>
        <p className="mt-3 text-slate">
          {definition.summary ? `${definition.summary} ` : ''}
          About {minutes} {minutes === 1 ? 'minute' : 'minutes'}.
        </p>
      </section>

      <Card>
        <FirmBody body={definition.body} />
      </Card>

      {definition.acknowledgedAt ? (
        <Notice>
          You said you had read this on{' '}
          {new Date(definition.acknowledgedAt).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
          . If the firm changes it, you will be asked again, because what you agreed to will no
          longer be what it says.
        </Notice>
      ) : (
        <AcknowledgeForm
          slug={definition.slug}
          label={
            definition.kind === 'policy'
              ? 'I have read this policy'
              : 'I have read this'
          }
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/modules" size="lg" variant="outline">
          All modules
        </ButtonLink>
      </div>
    </div>
  );
}
