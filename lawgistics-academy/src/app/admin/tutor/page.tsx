import type { Metadata } from 'next';
import Link from 'next/link';
import { requireCoach } from '@/lib/admin/guard';
import { MODES } from '@/lib/tutor/rules';
import { recentConversations } from '@/lib/tutor/service';

export const metadata: Metadata = { title: 'Tutor conversations' };

/**
 * What learners have been working through with the tutor, newest first, a
 * page at a time. A coach sees the people the firm supervises, who are told
 * so before their first message; an administrator sees everybody, to
 * remove anything that should not have been typed.
 */
export default async function AdminTutorPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { isAdmin } = await requireCoach();
  const asked = Number.parseInt((await searchParams).page ?? '0', 10);
  const page = Number.isFinite(asked) && asked > 0 ? Math.min(asked, 1000) : 0;
  const { rows, more } = await recentConversations({ page, isAdmin });
  const when = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow mb-2">Tutor</p>
        <h1 className="text-3xl">What people are working through</h1>
        <p className="mt-3 max-w-2xl text-slate">
          {isAdmin
            ? 'Everybody\u2019s conversations with the tutor, newest first. Coaches see only the people the firm supervises.'
            : 'Conversations with the tutor from the people the firm supervises, newest first. They are told their coaches can read these.'}
          {isAdmin
            ? ' Open one to remove a message that names a client or should not be there.'
            : ' Nothing here can be changed.'}
        </p>
      </section>

      {rows.length === 0 ? (
        <p className="text-slate">{page > 0 ? 'No more conversations.' : 'Nobody has used the tutor yet.'}</p>
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
                  {r.sent === 0 ? 'Not started' : `${r.sent} sent`} · {when(r.createdAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {page > 0 || more ? (
        <nav className="flex justify-between text-sm" aria-label="Pages">
          {page > 0 ? (
            <Link
              href={page === 1 ? '/admin/tutor' : `/admin/tutor?page=${page - 1}`}
              className="-my-2 py-2 font-medium text-accent underline underline-offset-2"
            >
              Newer
            </Link>
          ) : (
            <span />
          )}
          {more ? (
            <Link
              href={`/admin/tutor?page=${page + 1}`}
              className="-my-2 py-2 font-medium text-accent underline underline-offset-2"
            >
              Older
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
