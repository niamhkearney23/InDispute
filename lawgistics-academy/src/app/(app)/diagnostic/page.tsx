import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { DIAGNOSTIC_QUESTION_COUNT } from '@/lib/learning/config';
import { ButtonLink, Card } from '@/components/ui';
import { BeginSessionButton } from '../begin-session-button';

export const metadata: Metadata = { title: 'Diagnostic' };

export default async function DiagnosticPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const profile = await getLearnerProfile(user.id);
  if (!profile) redirect('/login');
  if (!profile.onboardedAt) redirect('/onboarding');

  const retaking = Boolean(profile.diagnosticCompletedAt);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <p className="eyebrow mb-2">{retaking ? 'Retake' : 'Step two'}</p>
        <h1 className="text-3xl sm:text-4xl">The diagnostic</h1>
        <p className="mt-3 text-slate">
          About {DIAGNOSTIC_QUESTION_COUNT} questions spread evenly across the six
          foundation areas. It is not a test you pass — it produces the map your daily
          training is built from.
        </p>
      </section>

      <Card>
        <ul className="space-y-4 text-[0.9375rem]">
          <Point title="Answer honestly, including the confidence question.">
            Marking an answer as a guess costs you nothing. It makes the map accurate,
            which is the entire point.
          </Point>
          <Point title="Expect to get things wrong.">
            The questions span everything from court hierarchy to statutory
            interpretation. Nobody starting out knows all of it.
          </Point>
          <Point title="It takes about fifteen minutes.">
            You can leave partway through — your place is kept and you can pick it up
            later.
          </Point>
        </ul>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <BeginSessionButton
          kind="diagnostic"
          label={retaking ? 'Start a new diagnostic' : 'Begin the diagnostic'}
        />
        {retaking ? (
          <ButtonLink href="/dashboard" size="lg" variant="outline">
            Back to today
          </ButtonLink>
        ) : null}
      </div>
    </div>
  );
}

function Point({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li>
      <p className="font-medium">{title}</p>
      <p className="mt-0.5 text-sm text-slate">{children}</p>
    </li>
  );
}
