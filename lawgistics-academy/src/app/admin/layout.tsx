import Link from 'next/link';
import { requireCoach } from '@/lib/admin/guard';
import { Wordmark } from '@/components/ui';
import { NavLink } from '@/components/nav-link';

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
  // administrator also writes the content and decides who is staff.
  const all: Array<[string, string, boolean]> = [
    ['/admin', 'Questions', isAdmin],
    ['/admin/intake', 'Intake', true],
    ['/admin/cohorts', 'Cohorts', isFirmAdmin],
    ['/admin/trainees', 'Trainees', true],
    ['/admin/review', 'Verify', isReviewer],
    ['/admin/lessons', 'Lessons', isReviewer],
    ['/admin/matters', 'Matters', isReviewer],
    ['/admin/sessions', 'Sessions', true],
    ['/admin/work', 'Work', true],
    ['/admin/certification', 'Certification', isReviewer],
    ['/admin/facts', 'Daily brief', isAdmin],
    ['/admin/firm', 'Firm', isFirmAdmin],
    ['/admin/onboarding', 'Joiners', true],
    ['/admin/access', 'Access', true],
    ['/admin/people', 'Staff', isAdmin],
    ['/admin/tutor', 'Tutor', isReviewer],
  ];
  const links = all.filter(([, , shown]) => shown).map(([href, label]) => [href, label]);
  const role = isAdmin ? 'Admin' : isFirmAdmin ? 'Firm admin' : 'Coach';

  return (
    <div className="theme-navy flex min-h-dvh flex-col">
      <header className="border-b border-rule bg-paper-sunk">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <div className="flex items-baseline gap-3">
            {/* Home is the first thing this person can actually open. Pointing a
                coach at /admin sends them to a redirect from the masthead. */}
            <Link href={links[0][0]} className="-mx-1 rounded-[5px] px-1 py-2">
              <Wordmark compact />
            </Link>
            <span className="eyebrow">{role}</span>
          </div>
          <nav className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm">
            {links.map(([href, label]) => (
              // /admin is the questions page and also the prefix of every other
              // admin address, so it alone matches exactly.
              <NavLink key={href} href={href} exact={href === '/admin'} className="hover:bg-paper">
                {label}
              </NavLink>
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
