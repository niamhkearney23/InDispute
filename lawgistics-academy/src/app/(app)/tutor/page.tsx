import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { requireAccess } from '@/lib/access/service';
import { aiCompany } from '@/lib/ai/provider';
import { modulesFor } from '@/content/seed/modules';
import { Card, Notice } from '@/components/ui';
import { MODES, tutorNotice } from '@/lib/tutor/rules';
import { conversationsFor, isSupervised, testableModules } from '@/lib/tutor/service';
import { StartExplainForm, StartTestForm } from './forms';

export const metadata: Metadata = { title: 'Tutor' };

/** The tutor's front page: two ways to practise, and what you did before. */
export default async function TutorPage() {
  await requireAccess();
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/tutor');
  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/account-problem');
  if (!profile.onboardedAt) redirect('/onboarding');

  const [modules, recent, supervised] = await Promise.all([
    testableModules(profile.country),
    conversationsFor(user.id, 10),
    isSupervised(user.id),
  ]);
  const provider = aiCompany();
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow mb-2">Tutor</p>
        <h1 className="text-3xl sm:text-4xl">Talk it through</h1>
        <p className="mt-3 max-w-xl text-slate">
          Two ways to find out what you really know. The tutor asks; it does not lecture.
        </p>
      </section>

      <Notice tone="neutral">{tutorNotice({ supervised, provider })}</Notice>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="font-sans text-xl font-semibold">{MODES.explain.name}</h2>
          <p className="mt-1 mb-4 text-sm text-slate">{MODES.explain.line}</p>
          {provider ? (
            <StartExplainForm suggestions={modulesFor(profile.country).map((m) => m.name)} />
          ) : (
            <p className="text-sm text-slate">
              This needs the AI, which is not switched on for this site yet.
            </p>
          )}
        </Card>
        <Card>
          <h2 className="font-sans text-xl font-semibold">{MODES.test.name}</h2>
          <p className="mt-1 mb-4 text-sm text-slate">{MODES.test.line}</p>
          <StartTestForm modules={modules} />
        </Card>
      </div>

      {recent.length ? (
        <section>
          <h2 className="mb-3 text-xl">Earlier</h2>
          <ul className="divide-y divide-rule rounded-lg border border-rule bg-paper-raised">
            {recent.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/tutor/${c.id}`}
                  className="flex min-h-12 items-center justify-between gap-3 px-4 py-2 hover:bg-paper-sunk"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{c.topic}</span>
                    <span className="text-xs text-slate">{MODES[c.mode].name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">{day(c.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
