import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from '@/components/app-link';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { getModuleProgress } from '@/lib/modules/service';
import { listFirmModulesForLearner } from '@/lib/firm/service';
import { ButtonLink, PageHeader, Pill, ProgressBar, SectionHeading, StatusBadge } from '@/components/ui';
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

  // Where somebody stands on each module, in the module's own unit:
  // questions answered right at least once (a module is complete when every
  // one has been).
  const status = (e: (typeof progress)[number]) =>
    e.total === 0 ? 'unavailable' : e.complete ? 'complete' : e.answered > 0 ? 'in-progress' : 'not-started';
  const action = { 'not-started': 'Start', 'in-progress': 'Continue', complete: 'Review', unavailable: null } as const;
  // The one to carry on with: the first begun and not finished, or else the
  // first required one not started.
  const resume =
    progress.find((e) => status(e) === 'in-progress') ??
    progress.find((e) => e.module.required && status(e) === 'not-started') ??
    null;
  const tools = [
    ...(courtMap
      ? [
          {
            href: '/courts',
            title: 'Which court does this go in?',
            text: 'The court hierarchy, and where an appeal goes.',
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
    {
      href: '/tutor',
      title: 'Tutor',
      text: 'Explain an idea back, or be tested on checked questions.',
      icon: 'talk' as const,
    },
    {
      href: '/reading',
      title: `The reading: ${PROGRAMME_BOOK.title}`,
      text: 'A few pages each working day.',
      icon: 'book' as const,
    },
    {
      href: '/studio',
      title: 'Advocacy Studio',
      text: 'Record a short submission and watch it back.',
      icon: 'mic' as const,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Learn"
        title="Modules and practice"
        description="Each module teaches for a few minutes, then asks. It is complete once every question has been answered right."
      />

      {resume ? (
        <section aria-labelledby="resume" className="flex flex-wrap items-center gap-4 rounded-xl border border-rule bg-paper-raised p-4 sm:flex-nowrap sm:p-5">
          <ModuleArt kind={artFor(resume.module.slug)} className="h-16 w-24 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1">
            <p className="eyebrow">{status(resume) === 'in-progress' ? 'Continue where you left off' : 'Start here'}</p>
            <h2 id="resume" className="mt-1 text-lg leading-snug">
              {resume.module.name}
            </h2>
            <ProgressBar
              className="mt-2 max-w-sm"
              value={resume.correctOnce}
              max={resume.total}
              label={`${resume.correctOnce} of ${resume.total} questions right`}
            />
          </div>
          <ButtonLink href={`/modules/${resume.module.slug}`} variant="accent" className="w-full sm:w-auto">
            {status(resume) === 'in-progress' ? 'Continue' : 'Start'}
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
                <Link
                  href={`/modules/firm/${module.slug}`}
                  className="pressable flex min-h-16 items-center gap-4 px-4 py-3 hover:bg-paper-sunk/60 sm:px-5"
                >
                  <ModuleArt kind="firm" className="h-12 w-16 shrink-0 rounded-md" />
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

      <section aria-labelledby="your-modules">
        <h2 id="your-modules" className="mb-3 text-xl">
          Your modules
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {progress.map((entry) => {
            const st = status(entry);
            return (
              <li key={entry.module.slug}>
                <Link
                  href={`/modules/${entry.module.slug}`}
                  className="pressable flex h-full flex-col overflow-hidden rounded-xl border border-rule bg-paper-raised hover:border-rule-strong"
                >
                  <ModuleArt kind={artFor(entry.module.slug)} className="aspect-[3/1] w-full" />
                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={st} />
                      {entry.module.required ? <Pill tone="accent">Required</Pill> : null}
                    </div>
                    <h3 className="font-sans text-base leading-snug font-semibold">{entry.module.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate">{entry.module.summary}</p>
                    <div className="mt-auto pt-4">
                      {entry.total > 0 ? (
                        <ProgressBar
                          value={entry.correctOnce}
                          max={entry.total}
                          label={`${entry.correctOnce} of ${entry.total} questions right`}
                        />
                      ) : (
                        <p className="text-xs text-muted">Questions appear once a lawyer has signed them off.</p>
                      )}
                      {action[st] ? (
                        <p className="mt-3 text-sm font-medium text-periwinkle-ink">{action[st]} ›</p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Practice and reference, as one compact group under the modules. The
          court map is offered only once a lawyer has signed off this
          country's map, so it never leads to a page with nothing on it. */}
      <section aria-labelledby="ways-to-practise">
        <h2 id="ways-to-practise" className="mb-3 text-xl">
          Practice and reference
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className="pressable flex h-full items-start gap-3 rounded-xl border border-rule bg-paper-raised p-4 hover:border-rule-strong"
              >
                <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-md bg-paper-sunk text-accent">
                  <ToolIcon kind={tool.icon} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.9375rem] font-semibold leading-snug">{tool.title}</span>
                  <span className="mt-0.5 block text-sm text-slate">{tool.text}</span>
                </span>
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
