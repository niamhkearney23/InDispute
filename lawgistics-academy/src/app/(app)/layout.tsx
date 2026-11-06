import Link from '@/components/app-link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { Wordmark } from '@/components/ui';
import { brand } from '@/lib/brand';
import { Avatar } from '@/components/avatar';
import { AccountMenu } from '@/components/account-menu';
import { NavLink } from '@/components/nav-link';
import { BottomNav } from '@/components/bottom-nav';
import { FirstPassword } from './account/password-form';
import { NextRoundClock } from '@/components/next-round-clock';
import { roundsToday } from '@/lib/training/rounds-service';
import { nextOpening, openRound } from '@/lib/training/rounds';
import { firstStepNow } from '@/lib/learning/first-steps-server';
import { FirstVisitShell } from '@/components/first-visit-shell';
import { hello } from '../fonts';

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

  // An account an administrator made, with a password they have seen. The
  // choice of a new one comes before anything else, whatever page was asked
  // for, and the moment it is made the old one stops working.
  if (profile?.mustChangePassword) {
    return (
      <div className="theme-paper flex min-h-dvh flex-col">
        <main className="mx-auto w-full max-w-md flex-1 px-4 py-10 sm:px-8">
          <FirstPassword />
          {/* A way out that is not choosing a password: somebody on a
              shared computer who opened this by mistake. */}
          <form action="/auth/sign-out" method="post" className="mt-6 text-center">
            <button
              type="submit"
              className="rounded-[5px] px-3 py-2.5 text-sm text-slate underline underline-offset-4 hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </main>
      </div>
    );
  }

  // The first visit (src/lib/learning/first-steps.ts): their first steps,
  // then the diagnostic while there are questions for it, with nothing else
  // open until each is done. Here only the plain shell is drawn; the pages
  // send people back to the step (requireAccess), because a redirect from a
  // layout loops while moving between pages.
  const staff = Boolean(profile?.isAdmin || profile?.isCoach || profile?.isFirmAdmin);
  const firstStep = await firstStepNow();
  if (firstStep && profile) {
    return (
      <div className={hello.variable}>
        <FirstVisitShell
          step={firstStep}
          menu={
            <AccountMenu
              minimal
              name={profile.displayName}
              tourHref="/dashboard"
              avatar={<Avatar url={profile.avatarUrl} cartoon={profile.cartoon} name={profile.displayName} size={28} />}
            />
          }
        >
          {children}
        </FirstVisitShell>
      </div>
    );
  }

  // A confirmed trainee on a working morning gets the corner clock: how long
  // the open round has left, or when the next one opens. Nothing for anyone
  // else, and nothing if the rounds cannot be read.
  const rounds =
    profile?.track === 'litigation_trainee' && profile.traineeConfirmed
      ? await roundsToday(user.id).catch(() => null)
      : null;
  let clock: { at: string; label: string } | null = null;
  if (rounds) {
    const open = openRound(rounds.rounds);
    const next = nextOpening(rounds.rounds);
    clock = open
      ? { at: open.closesAt.toISOString(), label: `Round ${open.number} closes` }
      : next
        ? { at: next.opensAt.toISOString(), label: `Round ${next.number} opens` }
        : null;
  }

  return (
    <div className={`theme-paper flex min-h-dvh flex-col ${hello.variable}`}>
      <header className="sticky top-0 z-20 border-b border-rule bg-paper print:hidden">
        {/* Compact: the wordmark, the learner's three places (Today, Learn,
            Coach), Admin set apart for staff, and the account menu, which
            holds Progress. On a phone the three live in the menu at the foot
            of the screen (BottomNav) and the header keeps Admin and the
            account menu. The court map is on Learn, not in the menu (the
            owner, November 2026: "why has it got its own little tab?").

            The wordmark does not shrink. It used to carry min-w-0, which let
            flex squash its box while the lettering inside stayed full width,
            so "Today" was printed on top of the last three letters on a
            360px Android. */}
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-1.5 sm:gap-4 sm:px-8">
          <Link
            href="/dashboard"
            className="-mx-1 flex min-h-11 shrink-0 items-center rounded-[5px] px-1 py-2 hover:bg-paper-sunk"
          >
            <Wordmark compact />
          </Link>

          <nav aria-label="Primary" className="flex items-center justify-end gap-0 text-[0.8125rem] sm:gap-0.5 sm:text-sm">
            <NavLink href="/dashboard" className="hidden hover:bg-paper-sunk sm:inline-flex">
              Today
            </NavLink>
            <NavLink href="/modules" className="hidden hover:bg-paper-sunk sm:inline-flex">
              Learn
            </NavLink>
            <NavLink href="/work" className="hidden hover:bg-paper-sunk sm:inline-flex">
              Coach
            </NavLink>
            {staff && profile ? (
              // Staff land on Admin Today. Set apart from the learner's own
              // places: a hairline before it and an outlined label, so it
              // reads as a different area, not a sixth tab.
              <span className="ml-1 flex items-center border-l border-rule pl-1.5 sm:ml-2 sm:pl-2.5">
                <Link
                  href="/admin/today"
                  className="inline-flex min-h-9 items-center rounded-full border border-rule-strong px-3 text-[0.8125rem] font-medium text-ink hover:border-ink hover:bg-paper-sunk"
                >
                  {profile.isAdmin || profile.isFirmAdmin ? 'Admin' : 'Marking'}
                </Link>
              </span>
            ) : null}
            {/* Progress, Account settings, the quick tour and Sign out, behind
                the person's picture. The 26px picture sits inside a 44px target. */}
            <span className="ml-1 sm:ml-2">
              <AccountMenu
                name={profile?.displayName ?? null}
                tourHref="/dashboard?tour=1"
                avatar={
                  <Avatar url={profile?.avatarUrl ?? null} cartoon={profile?.cartoon ?? null} name={profile?.displayName ?? null} size={28} />
                }
              />
            </span>
          </nav>
        </div>
      </header>

      {/* Not stretched to fill the screen: the footer follows the content,
          rather than a short page being padded out to push it down. */}
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-8">{children}</main>

      {clock ? <NextRoundClock at={clock.at} label={clock.label} /> : null}

      {/* Compact: the disclaimer, who the academy belongs to, and the firm's
          mark, readable and out of the way. The bottom padding on a phone is
          the height of the menu at the foot of the screen, not spacing. */}
      <footer
        className={`mx-auto w-full max-w-5xl px-4 sm:px-8 print:hidden ${clock ? 'pb-36 sm:pb-16' : 'pb-24 sm:pb-6'}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-rule pt-4 text-xs text-muted">
          <div className="max-w-xl space-y-1">
            <p>
              Training content only, not legal advice. Levels describe your answers here, not
              professional titles or qualifications. Always check the current rules of the relevant court
              before acting on a point of procedure.
            </p>
            {brand.parentLine ? <p>{brand.parentLine}</p> : null}
          </div>
          {brand.associationLogo ? (
            <p className="flex shrink-0 items-center gap-2.5">
              In association with
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={brand.associationLogo} alt={brand.firm} className="h-8 w-auto" />
            </p>
          ) : null}
        </div>
      </footer>
      <BottomNav />
    </div>
  );
}
