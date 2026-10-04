import type { Metadata } from 'next';
import Link from 'next/link';
import { requireCoach } from '@/lib/admin/guard';
import { MODES } from '@/lib/tutor/rules';
import { recentConversations } from '@/lib/tutor/service';

export const metadata: Metadata = { title: 'Tutor conversations' };

/**
 * What learners have been working through with the tutor, newest first. For
 * coaches and administrators, read only: it shows where people are stuck,
 * and learners are told before their first message that coaches can see it.
 */
export default async function AdminTutorPage() {
  await requireCoach();
  const rows = await recentConversations(60);
  const when = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow mb-2">Tutor</p>
        <h1 className="text-3xl">What people are working through</h1>
        <p className="mt-3 max-w-2xl text-slate">
          Learners&rsquo; conversations with the tutor, newest first. They are told coaches can read
          these. Nothing here can be changed.
        </p>
      </section>

      {rows.length === 0 ? (
        <p className="text-slate">Nobody has used the tutor yet.</p>
      ) : (
        <ul className="divide-y divide-rule rounded-lg border border-rule bg-paper-raised">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/admin/tutor/${r.id}`}
                className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 hover:bg-paper-sunk"
              >
                <span className="min-w-0">
                  <span className="block font-medium">{r.name}</span>
                  <span className="text-sm text-slate">
                    {MODES[r.mode].name}: {r.topic}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {r.messageCount} messages · {when(r.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
