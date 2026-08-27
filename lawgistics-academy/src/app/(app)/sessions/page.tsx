import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { sessionsForLearner } from '@/lib/lessons/sessions';
import { Card, EmptyState, Pill } from '@/components/ui';

export const metadata: Metadata = { title: 'Sessions' };
export const dynamic = 'force-dynamic';

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

/**
 * Everything the coach has put up, newest morning first.
 *
 * Somebody who missed Tuesday should be able to catch up on Tuesday, and
 * somebody who wants to watch the one about affidavits again should not have to
 * remember which morning it was on.
 *
 * Sessions dated ahead are not here. `sessionsForLearner` returns them, because
 * the coach may schedule a week at a time, and this page filters them out for
 * the same reason the dashboard does: a session scheduled for Friday appearing
 * on Wednesday gives away the wrong morning's work.
 */
export default async function LearnerSessionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/sessions');

  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/login');

  const all = await sessionsForLearner(profile.country);

  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: profile.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const sessions = all.filter((s) => !s.airsOn || s.airsOn <= today);

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow mb-2">Sessions</p>
        <h1 className="text-3xl">From your coach</h1>
        <p className="mt-3 max-w-2xl text-slate">
          Everything that has been put up, most recent first. Missing a morning is not the
          end of anything; it is all still here.
        </p>
      </section>

      {sessions.length === 0 ? (
        <EmptyState
          title="Nothing up yet"
          description="When your coach records something it will appear here, and on your dashboard on the morning it is for."
        />
      ) : null}

      {sessions.map((session) => (
        <Card key={session.id}>
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            {session.airsOn ? <Pill>{longDate(session.airsOn)}</Pill> : null}
            {session.publishedByName ? (
              <span className="text-xs text-muted">from {session.publishedByName}</span>
            ) : null}
          </div>

          <h2 className="text-xl">{session.title}</h2>
          {session.summary ? (
            <p className="mt-1.5 max-w-2xl text-sm text-slate">{session.summary}</p>
          ) : null}

          <div className="mt-4 aspect-video w-full overflow-hidden rounded-md border border-rule bg-paper-sunk">
            <iframe
              src={session.url}
              title={session.title}
              allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="size-full"
            />
          </div>
        </Card>
      ))}
    </div>
  );
}
