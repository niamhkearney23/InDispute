import type { Metadata } from 'next';
import { requireCoach } from '@/lib/admin/guard';
import { saveSession } from '../actions';
import { SessionForm } from '../session-form';

export const metadata: Metadata = { title: 'New session' };
export const dynamic = 'force-dynamic';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The intake page links here with the day's title, summary and date in
 * the address, so putting up a day's video is pasting one link. Nothing
 * from the address is trusted: it only fills in fields the coach can see
 * and change, and the save action validates everything as usual.
 */
export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string; summary?: string; airsOn?: string; country?: string }>;
}) {
  await requireCoach();
  const q = await searchParams;
  const country = q.country === 'MY' || q.country === 'AU' ? q.country : 'ALL';

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">New</p>
        <h1 className="text-3xl">Put a session up</h1>
      </div>

      <SessionForm
        action={saveSession}
        submitLabel="Save"
        initial={{
          title: (q.title ?? '').slice(0, 200),
          summary: (q.summary ?? '').slice(0, 1000),
          url: '',
          country,
          airsOn: q.airsOn && DAY_RE.test(q.airsOn) ? q.airsOn : '',
          // A video pre-filled from the plan is meant to go out on its day,
          // so it starts ticked; it still only shows from that morning.
          published: Boolean(q.title),
        }}
      />
    </div>
  );
}
