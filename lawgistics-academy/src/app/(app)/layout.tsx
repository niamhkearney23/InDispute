import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { Wordmark } from '@/components/ui';

/**
 * Every page under this layout is per-learner and auth-gated. Say so explicitly
 * rather than relying on Next inferring it from a `cookies()` call. If the app
 * is ever built without Supabase configured, that call does not happen and these
 * pages would be prerendered and served to everyone.
 */
export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const profile = await getLearnerProfile(user.id);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-rule bg-paper/95 backdrop-blur-sm">
        {/* Tight on a 360px Android: labels are kept on one line and the
            spacing tightens rather than letting the nav wrap to two rows. */}
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-2.5 sm:gap-4 sm:px-8 sm:py-3.5">
          <Link
            href="/dashboard"
            className="-mx-1 min-w-0 rounded-[5px] px-1 py-2 hover:bg-paper-sunk"
          >
            <Wordmark compact />
          </Link>

          <nav className="flex items-center gap-0 text-[0.8125rem] sm:gap-1 sm:text-sm">
            <NavLink href="/dashboard">Today</NavLink>
            <NavLink href="/skills">Skills</NavLink>
            {profile?.isAdmin ? <NavLink href="/admin">Admin</NavLink> : null}
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="rounded-[5px] px-2 py-2 whitespace-nowrap text-slate hover:bg-paper-sunk hover:text-ink sm:px-2.5"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-7 sm:px-8 sm:py-10">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-4xl px-5 pb-8 sm:px-8">
        <p className="border-t border-rule pt-5 text-xs text-muted">
          Training content only, not legal advice. Levels are game levels, not
          professional titles or qualifications. Always check the current rules of the
          relevant court before acting on a point of procedure.
        </p>
      </footer>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-[5px] px-2 py-2 whitespace-nowrap text-slate hover:bg-paper-sunk hover:text-ink sm:px-2.5"
    >
      {children}
    </Link>
  );
}
