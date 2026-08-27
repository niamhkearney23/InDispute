import Link from 'next/link';
import { requireCoach } from '@/lib/admin/guard';
import { Wordmark } from '@/components/ui';

/** Auth-gated and per-request. Never prerender anything under /admin. */
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The floor for this whole area: a learner never gets past here. Which of the
  // two staff roles somebody has is decided by each page, because a coach may
  // open the review queue and the joiners list and nothing else.
  const { isAdmin } = await requireCoach();

  // A coach is shown the two things they can actually use. The pages refuse
  // them anyway, so this is not the security boundary; it is not putting five
  // links in front of somebody when four of them lead to a redirect.
  const links: Array<[string, string]> = isAdmin
    ? [
        ['/admin', 'Questions'],
        ['/admin/review', 'Verify'],
        ['/admin/facts', 'Daily brief'],
        ['/admin/firm', 'Firm'],
        ['/admin/onboarding', 'Joiners'],
      ]
    : [
        ['/admin/review', 'Verify'],
        ['/admin/onboarding', 'Joiners'],
      ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-rule bg-paper-sunk">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <div className="flex items-baseline gap-3">
            {/* Home is the first thing this person can actually open. Pointing a
                coach at /admin sends them to a redirect from the masthead. */}
            <Link href={links[0][0]} className="-mx-1 rounded-[5px] px-1 py-2">
              <Wordmark compact />
            </Link>
            <span className="eyebrow">{isAdmin ? 'Admin' : 'Coach'}</span>
          </div>
          <nav className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-[5px] px-2.5 py-2 whitespace-nowrap text-slate hover:bg-paper hover:text-ink"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className="rounded-[5px] px-2.5 py-2 whitespace-nowrap text-slate hover:bg-paper hover:text-ink"
            >
              Back to app
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
