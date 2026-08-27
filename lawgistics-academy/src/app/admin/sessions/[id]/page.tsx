import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireCoach } from '@/lib/admin/guard';
import { allSessions } from '@/lib/lessons/sessions';
import { saveSession } from '../actions';
import { SessionForm } from '../session-form';

export const metadata: Metadata = { title: 'Edit session' };
export const dynamic = 'force-dynamic';

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCoach();
  const { id } = await params;

  const session = (await allSessions()).find((s) => s.id === id);
  if (!session) notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">Editing</p>
        <h1 className="text-3xl">{session.title}</h1>
        <p className="mt-2 max-w-2xl text-slate">
          Changing this changes what anybody who opens it from now on sees. Nobody is
          notified, so if the point of the change is that the old one was wrong, say so in
          the next session rather than quietly swapping it.
        </p>
      </div>

      <SessionForm
        action={saveSession}
        submitLabel="Save"
        initial={{
          id: session.id,
          title: session.title,
          summary: session.summary,
          url: session.url,
          country: session.country ?? 'ALL',
          airsOn: session.airsOn ?? '',
          published: session.published,
        }}
      />
    </div>
  );
}
