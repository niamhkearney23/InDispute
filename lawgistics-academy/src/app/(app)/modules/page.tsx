import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from '@/components/app-link';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { getModuleProgress } from '@/lib/modules/service';
import { listFirmModulesForLearner } from '@/lib/firm/service';
import { Card, Pill, SectionHeading } from '@/components/ui';
import { ModuleArt, artFor } from '@/components/module-art';
import { requireAccess } from '@/lib/access/service';
import { PROGRAMME_BOOK } from '@/content/seed/reading';
import { courtMapFor, viewerIsStaff } from '@/lib/content/service';

export const metadata: Metadata = { title: 'Modules' };

export default async function ModulesPage() {
  await requireAccess();
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/account-problem');

  const [progress, firmModules, courtMap] = await Promise.all([
    getModuleProgress(user.id, profile.country),
    listFirmModulesForLearner(user.id, profile.country),
    courtMapFor(profile.country, await viewerIsStaff(user.id)),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <p className="eyebrow mb-2">Learn</p>
        <h1 className="text-3xl sm:text-4xl">Lessons, then questions</h1>
        <p className="mt-3 max-w-xl text-slate">
          Each of these teaches for a few minutes and then asks. Daily training never
          finishes, which is right for staying sharp and no use for saying whether someone
          has covered something. A module has a finishing line.
        </p>
      </section>

      {/* Ways to practise, as one list rather than a box each: they are
          shortcuts for somebody who already knows what they want, not the main
          thing on this page. The court map is offered only once a lawyer has
          signed off this country's map, so it never leads a learner to a page
          with nothing on it. */}
      <section aria-labelledby="ways-to-practise">
        <h2 id="ways-to-practise" className="eyebrow mb-2">
          Ways to practise
        </h2>
        <ul className="divide-y divide-rule overflow-hidden rounded-lg border border-rule bg-paper-raised shadow-card">
          {[
            ...(courtMap
              ? [
                  {
                    href: '/courts',
                    title: 'Which court does this go in?',
                    text: 'Tap through the hierarchy and see where an appeal goes.',
                    icon: 'courts' as const,
                  },
                ]
              : []),
            {
              href: '/matters',
              title: 'Practise on a file',
              text: 'Matters: the problem first, against the clock, then how a lawyer would do it.',
              icon: 'file' as const,
            },
            {
              href: '/tutor',
              title: 'Talk it through',
              text: 'The tutor: explain an idea back, or be tested on what a lawyer has checked.',
              icon: 'talk' as const,
            },
            {
              href: '/reading',
              title: `The reading: ${PROGRAMME_BOOK.title}`,
              text: 'A few pages each working day, from the first day of the programme.',
              icon: 'book' as const,
            },
            {
              href: '/studio',
              title: 'Practise on your feet',
              text: 'The Advocacy Studio: record a short submission, watch it back, and see what to work on.',
              icon: 'mic' as const,
            },
          ].map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className="pressable flex min-h-16 items-center gap-4 px-4 py-3.5 hover:bg-paper-sunk/60 active:bg-paper-sunk sm:px-5"
              >
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-md bg-paper-sunk text-accent"
                >
                  <ToolIcon kind={tool.icon} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{tool.title}</span>
                  <span className="mt-0.5 block text-sm text-slate">{tool.text}</span>
                </span>
                <span aria-hidden className="text-muted">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* The firm's own content sits above ours on purpose. On somebody's first
          day, "what this firm allows you to put into a tool" outranks anything
          we can teach them about the law. */}
      {firmModules.length > 0 ? (
        <section>
          <SectionHeading eyebrow="From the firm" title="Read these first" />
          <div className="space-y-3">
            {firmModules.map((module) => (
              <Link key={module.id} href={`/modules/firm/${module.slug}`} className="block">
                <Card className="pressable hover:border-rule-strong hover:shadow-raised">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <ModuleArt kind="firm" className="h-16 w-20 shrink-0 rounded-md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg">{module.name}</h3>
                        {module.required ? <Pill tone="accent">Required</Pill> : null}
                        {module.acknowledgedAt ? <Pill tone="correct">Read</Pill> : null}
                      </div>
                      {module.summary ? (
                        <p className="mt-1 text-sm text-slate">{module.summary}</p>
                      ) : null}
                    </div>
                    {!module.acknowledgedAt ? (
                      <p className="shrink-0 text-sm text-muted">Not read yet</p>
                    ) : null}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <SectionHeading title="Your modules" />
        <div className="grid grid-cols-2 gap-3">
          {progress.map((entry) => (
            <Link
              key={entry.module.slug}
              href={`/modules/${entry.module.slug}`}
              className="block"
            >
              <div className="flex h-full flex-col justify-between overflow-hidden rounded-lg border border-rule bg-paper-raised shadow-card pressable hover:border-rule-strong hover:shadow-raised">
                <div>
                  <ModuleArt kind={artFor(entry.module.slug)} className="h-24 w-full sm:aspect-[2/1] sm:h-auto" />
                  <div className="px-4 pt-4 sm:px-5">
                  {entry.module.required || entry.complete ? (
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      {entry.module.required ? <Pill tone="accent">Required</Pill> : null}
                      {entry.complete ? <Pill tone="correct">Complete</Pill> : null}
                    </div>
                  ) : null}
                  <h3 className="text-base leading-snug sm:text-lg">{entry.module.name}</h3>
                  <p className="mt-1.5 text-sm text-slate">{entry.module.summary}</p>
                  </div>
                </div>
                <p className="px-4 pb-4 pt-3 text-sm tabular-nums text-muted sm:px-5 sm:pb-5">
                  {entry.total === 0
                    ? 'Not published yet'
                    : `${entry.correctOnce} of ${entry.total}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Small line icons for the ways to practise; decoration only. */
function ToolIcon({ kind }: { kind: 'courts' | 'file' | 'talk' | 'book' | 'mic' }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (kind) {
    case 'courts':
      return (
        <svg {...common}>
          <path d="M3 10h18M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18M12 3l9 5H3l9-5z" />
        </svg>
      );
    case 'file':
      return (
        <svg {...common}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
          <path d="M14 3v5h5M9 13h6M9 17h4" />
        </svg>
      );
    case 'talk':
      return (
        <svg {...common}>
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
        </svg>
      );
    case 'book':
      return (
        <svg {...common}>
          <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z" />
          <path d="M4 19a2 2 0 0 1 2-2h13" />
        </svg>
      );
    case 'mic':
      return (
        <svg {...common}>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      );
  }
}
