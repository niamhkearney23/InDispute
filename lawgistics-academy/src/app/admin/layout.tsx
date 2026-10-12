import Link from 'next/link';
import { requireCoach } from '@/lib/admin/guard';
import { Wordmark } from '@/components/ui';
import { AdminNav, type AdminNavGroup, type AdminNavItem } from '@/components/admin-nav';
import { SchemaBehind } from '@/components/schema-behind';

/** Auth-gated and per-request. Never prerender anything under /admin. */
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The floor for this whole area: a learner never gets past here. Which of the
  // two staff roles somebody has is decided by each page, because a coach may
  // open the review queue and the joiners list and nothing else.
  const { isAdmin, isFirmAdmin, isReviewer } = await requireCoach();

  // Each person is shown what they can actually use. The pages refuse them
  // anyway, so this is not the security boundary; it is not putting links in
  // front of somebody that lead to a redirect. A coach signs off and
  // supervises; a firm administrator runs the firm's people and setup; an
  // administrator also writes the content and decides who is staff. The
  // pages sit in four groups so the menu is a handful of words, not
  // seventeen; a group with nothing in it for this person is left out.
  const groups: AdminNavGroup[] = (
    [
      {
        label: 'People',
        items: [
          { href: '/admin/trainees', label: 'Trainees', shown: true },
          { href: '/admin/onboarding', label: 'Joining', shown: true },
          { href: '/admin/intake', label: 'Intake', shown: true },
          { href: '/admin/cohorts', label: 'Cohorts', shown: isFirmAdmin },
          { href: '/admin/access', label: 'Access codes', shown: true },
          { href: '/admin/people', label: 'Staff', shown: isAdmin },
        ],
      },
      {
        label: 'Teaching',
        items: [
          { href: '/admin/work', label: 'Work board', shown: true },
          { href: '/admin/sessions', label: 'Sessions', shown: true },
          { href: '/admin/certification', label: 'Certification', shown: isReviewer },
          { href: '/admin/tutor', label: 'Tutor chats', shown: isReviewer },
        ],
      },
      {
        label: 'Content',
        items: [
          { href: '/admin/review', label: 'Sign off', shown: isReviewer },
          { href: '/admin', label: 'Questions', shown: isAdmin, also: ['/admin/questions'] },
          { href: '/admin/lessons', label: 'Lessons', shown: isReviewer },
          { href: '/admin/matters', label: 'Matters', shown: isReviewer },
          { href: '/admin/facts', label: 'Daily brief', shown: isAdmin },
        ],
      },
      {
        label: 'Firm',
        items: [
          { href: '/admin/reports', label: 'Reports', shown: isFirmAdmin },
          { href: '/admin/firm', label: 'Documents', shown: isFirmAdmin },
        ],
      },
    ] as Array<{ label: string; items: Array<AdminNavItem & { shown: boolean }> }>
  )
    .map((g) => ({
      label: g.label,
      items: g.items.filter((i) => i.shown).map(({ href, label, also }) => ({ href, label, also })),
    }))
    .filter((g) => g.items.length > 0);
  const role = isAdmin ? 'Admin' : isFirmAdmin ? 'Firm admin' : 'Coach';

  return (
    <div className="theme-navy flex min-h-dvh flex-col">
      <header className="border-b border-rule bg-paper-sunk">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <div className="flex items-baseline gap-3">
            {/* Home is the first thing this person can actually open. Pointing a
                coach at /admin sends them to a redirect from the masthead. */}
            <Link href={groups[0].items[0].href} className="-mx-1 rounded-[5px] px-1 py-2">
              <Wordmark compact />
            </Link>
            <span className="eyebrow">{role}</span>
          </div>
          <AdminNav groups={groups} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8">
        {/* Only an administrator can run UPDATE.sql, so only they are told. */}
        {isAdmin ? <SchemaBehind /> : null}
        {children}
      </main>
    </div>
  );
}
