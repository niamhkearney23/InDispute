import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from '@/components/app-link';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { getModuleProgress } from '@/lib/modules/service';
import { listFirmModulesForLearner } from '@/lib/firm/service';
import { ButtonLink, PageHeader, Pill, ProgressBar, SectionHeading, StatusBadge } from '@/components/ui';
import { requireAccess } from '@/lib/access/service';
import { PROGRAMME_BOOK } from '@/content/seed/reading';
import { courtMapFor, viewerIsStaff } from '@/lib/content/service';
import { TUTOR_SHOWN } from '@/lib/tutor/shown';

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

  // Where somebody stands on each module, in the module's own unit:
  // questions answered right at least once (a module is complete when every
  // one has been).
  // In progress once something is right, not merely answered: a question
  // met in the diagnostic or daily training counts as answered, and "Continue
  // where you left off" on 0 of 19 read as a module they had never opened.
  const status = (e: (typeof progress)[number]) =>
    e.total === 0 ? 'unavailable' : e.complete ? 'complete' : e.correctOnce > 0 ? 'in-progress' : 'not-started';
  const action = { 'not-started': 'Start', 'in-progress': 'Continue', complete: 'Review', unavailable: null } as const;
  // The one to carry on with, only when one is begun and not finished.
  const resume = progress.find((e) => status(e) === 'in-progress') ?? null;
  const tools = [
    ...(courtMap
      ? [
          {
            href: '/courts',
            title: 'Courts',
            text: 'Which court a matter starts in, and where an appeal goes.',
            icon: 'courts' as const,
          },
        ]
      : []),
    {
      href: '/matters',
      title: 'Practice files',
      text: 'A problem against the clock, then how a lawyer would do it.',
      icon: 'file' as const,
    },
    // Hidden for now (src/lib/tutor/shown.ts).
    ...(TUTOR_SHOWN
      ? [
          {
            href: '/tutor',
            title: 'Tutor',
            text: 'Explain an idea back, or be tested on checked questions.',
            icon: 'talk' as const,
          },
        ]
      : []),
    {
      href: '/reading',
      title: 'Each week’s reading',
      text: `One reading a week, from ${PROGRAMME_BOOK.title}.`,
      icon: 'book' as const,
    },
    {
      href: '/studio',
      title: 'Advocacy Studio',
      text: 'Record a short submission and watch it back.',
      icon: 'mic' as const,
    },
  ];

  const row = 'pressable flex items-center gap-4 px-4 py-4 hover:bg-paper-sunk/60 sm:px-5';
  return (
    <div className="space-y-9">
      <PageHeader
        title="Learn"
        description="Optional, at your own pace: modules, practice and reference. What your coach sets you is on Today."
      />

      {resume ? (
        <section aria-labelledby="resume" className="flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-rule py-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">Carry on</p>
            <h2 id="resume" className="mt-0.5 font-sans text-[0.9375rem] font-semibold">
              {resume.module.name}
            </h2>
            <ProgressBar
              className="mt-2 max-w-xs"
              value={resume.correctOnce}
              max={resume.total}
              label={`${resume.correctOnce} of ${resume.total} questions right`}
            />
          </div>
          <ButtonLink href={`/modules/${resume.module.slug}`} variant="accent" className="w-full sm:w-auto">
            Continue
          </ButtonLink>
        </section>
      ) : null}

      {/* The firm's own content sits above ours on purpose. On somebody's first
          day, "what this firm allows you to put into a tool" outranks anything
          we can teach them about the law. */}
      {firmModules.length > 0 ? (
        <section aria-labelledby="from-the-firm">
          <SectionHeading eyebrow="From the firm" title="Read these first" />
          <ul className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-paper-raised">
            {firmModules.map((module) => (
              <li key={module.id}>
                <Link href={`/modules/firm/${module.slug}`} className={row}>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{module.name}</span>
                      {module.required ? <Pill tone="accent">Required</Pill> : null}
                    </span>
                    {module.summary ? <span className="mt-0.5 block text-sm text-slate">{module.summary}</span> : null}
                  </span>
                  {module.acknowledgedAt ? (
                    <StatusBadge status="complete" />
                  ) : (
                    <span className="shrink-0 text-sm font-medium text-periwinkle-ink">Read ›</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* The modules as a contents page: a number, the name, one line, and
          how far along, in one list. No pictures: the owner found the
          illustrated cards "very AI". */}
      <section aria-labelledby="your-modules">
        <h2 id="your-modules" className="mb-3 text-xl">
          Modules
        </h2>
        <ol className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-paper-raised">
          {progress.map((entry, i) => {
            const st = status(entry);
            return (
              <li key={entry.module.slug}>
                <Link href={`/modules/${entry.module.slug}`} className={`${row} items-start`}>
                  <span aria-hidden className="w-7 shrink-0 pt-0.5 font-serif text-lg leading-none text-muted tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[0.9375rem] font-semibold leading-snug">{entry.module.name}</span>
                      {entry.module.required ? <Pill tone="accent">Required</Pill> : null}
                      {st === 'complete' ? <StatusBadge status="complete" /> : null}
                    </span>
                    <span className="mt-0.5 block text-sm text-slate">{entry.module.summary}</span>
                    {entry.total > 0 ? (
                      <ProgressBar
                        className="mt-2.5 max-w-xs"
                        value={entry.correctOnce}
                        max={entry.total}
                        label={`${entry.correctOnce} of ${entry.total} questions right`}
                      />
                    ) : (
                      <span className="mt-1.5 block text-xs text-muted">
                        Questions appear once a lawyer has signed them off.
                      </span>
                    )}
                  </span>
                  {action[st] ? (
                    <span className="hidden shrink-0 self-center text-sm font-medium text-periwinkle-ink sm:inline">
                      {action[st]} ›
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Practice and reference, one list of rows. The court map is offered
          only once a lawyer has signed off this country's map, so it never
          leads to a page with nothing on it; it is here rather than in the
          menu. */}
      <section aria-labelledby="ways-to-practise">
        <h2 id="ways-to-practise" className="mb-3 text-xl">
          Practice and reference
        </h2>
        <ul className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-paper-raised">
          {tools.map((tool) => (
            <li key={tool.href}>
              <Link href={tool.href} className={row}>
                <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-md bg-paper-sunk text-accent">
                  <ToolIcon kind={tool.icon} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.9375rem] font-semibold leading-snug">{tool.title}</span>
                  <span className="mt-0.5 block text-sm text-slate">{tool.text}</span>
                </span>
                <span aria-hidden className="shrink-0 text-muted">›</span>
              </Link>
            </li>
          ))}
        </ul>
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
