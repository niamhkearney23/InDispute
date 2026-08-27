import type { Metadata } from 'next';
import Link from 'next/link';
import { requireCoach } from '@/lib/admin/guard';
import { allSessions } from '@/lib/lessons/sessions';
import { ButtonLink, Card, EmptyState, Pill } from '@/components/ui';
import { COUNTRY_LABELS } from '@/lib/types';
import { PublishToggle } from './publish-toggle';

export const metadata: Metadata = { title: 'Sessions' };
export const dynamic = 'force-dynamic';

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default async function SessionsPage() {
  await requireCoach();
  const sessions = await allSessions();

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = sessions.filter((s) => s.airsOn && s.airsOn > today);
  const rest = sessions.filter((s) => !s.airsOn || s.airsOn <= today);

  return (
    <div className="space-y-6">
      <section>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow mb-2">Sessions</p>
            <h1 className="text-3xl">What you teach them</h1>
          </div>
          <ButtonLink href="/admin/sessions/new" variant="accent">
            New session
          </ButtonLink>
        </div>
        <p className="mt-3 max-w-2xl text-slate">
          Everything else in here was written months ago by somebody who is not in the
          room. This is the part that is yours. Record something, put it up, and it is
          there at seven the next morning. Nobody signs these off, because nobody else is
          standing behind them: your name is on them and that is the point.
        </p>
      </section>

      {sessions.length === 0 ? (
        <EmptyState
          title="Nothing up yet"
          description="Record something, put it on YouTube as unlisted, and paste the link. It takes about a minute."
        />
      ) : null}

      {upcoming.length > 0 ? (
        <section>
          <p className="eyebrow mb-3">Scheduled</p>
          <div className="space-y-3">
            {upcoming.map((s) => (
              <SessionRow key={s.id} session={s} />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            Dated ahead, so nobody sees these until the morning they belong to.
          </p>
        </section>
      ) : null}

      {rest.length > 0 ? (
        <section>
          {upcoming.length > 0 ? <p className="eyebrow mb-3">Up</p> : null}
          <div className="space-y-3">
            {rest.map((s) => (
              <SessionRow key={s.id} session={s} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SessionRow({
  session,
}: {
  session: Awaited<ReturnType<typeof allSessions>>[number];
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Pill tone={session.published ? 'correct' : 'neutral'}>
              {session.published ? 'Up' : 'Draft'}
            </Pill>
            <Pill>{session.country ? COUNTRY_LABELS[session.country] : 'Everybody'}</Pill>
            {session.airsOn ? <Pill>{longDate(session.airsOn)}</Pill> : null}
          </div>
          <h2 className="text-lg">{session.title}</h2>
          {session.summary ? (
            <p className="mt-1 max-w-2xl text-sm text-slate">{session.summary}</p>
          ) : null}
          {session.publishedByName ? (
            <p className="mt-1.5 text-xs text-muted">Put up by {session.publishedByName}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href={`/admin/sessions/${session.id}`}
            className="rounded-[5px] border border-rule-strong px-3 py-2 text-sm text-slate hover:bg-paper hover:text-ink"
          >
            Edit
          </Link>
          <PublishToggle id={session.id} published={session.published} />
        </div>
      </div>
    </Card>
  );
}
