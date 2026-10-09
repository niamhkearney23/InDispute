import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireFirmAdmin } from '@/lib/admin/guard';
import { Card } from '@/components/ui';
import { createServiceClient } from '@/lib/supabase/service';
import { getCohort, listCohorts } from '@/lib/training/cohorts';
import { writeHolidays } from '@/lib/training/schedule';
import { CohortForm, MembersForm, type PersonRow } from '../forms';

export const metadata: Metadata = { title: 'Cohort' };

type Person = {
  id: string;
  display_name: string | null;
  email: string | null;
  cohort_id?: string | null;
  starts_on: string | null;
};

/** One cohort: its settings, who is in it, and the confirmed trainees who could be. */
export default async function CohortPage({ params }: { params: Promise<{ id: string }> }) {
  await requireFirmAdmin();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const [cohort, all] = await Promise.all([getCohort(id), listCohorts()]);
  if (!cohort) notFound();

  const { data } = await createServiceClient()
    .from('profiles')
    .select('*')
    .eq('track', 'litigation_trainee')
    .not('trainee_approved_at', 'is', null)
    .order('display_name')
    .limit(1000);
  const people = (data ?? []) as Person[];
  const names = new Map(all.map((c) => [c.id, c.name]));
  const row = (p: Person, note: string): PersonRow => ({
    id: p.id,
    name: p.display_name ?? p.email ?? 'Unnamed',
    email: p.email,
    note,
  });
  const inIt = people.filter((p) => p.cohort_id === id).map((p) => row(p, 'in this cohort'));
  const others = people
    .filter((p) => p.cohort_id !== id)
    .map((p) =>
      row(
        p,
        p.cohort_id
          ? `now in ${names.get(p.cohort_id) ?? 'another cohort'}`
          : p.starts_on
            ? `no cohort, starts ${p.starts_on}`
            : 'no cohort, no dates yet',
      ),
    );

  return (
    <div className="space-y-8">
      <section>
        <p className="eyebrow mb-2">
          <Link href="/admin/cohorts" className="underline-offset-4 hover:underline">
            Cohorts
          </Link>
        </p>
        <h1 className="text-3xl break-words">{cohort.name}</h1>
      </section>

      <Card>
        <h2 className="text-lg">Settings</h2>
        <p className="mt-1 mb-5 text-sm text-slate">
          Changing the dates moves everybody in this cohort to the new dates.
        </p>
        <CohortForm
          values={{
            id: cohort.id,
            name: cohort.name,
            startsOn: cohort.startsOn,
            endsOn: cohort.endsOn,
            timezone: cohort.schedule.timezone,
            roundHours: cohort.schedule.roundHours,
            holidays: writeHolidays(cohort.schedule.holidays),
          }}
        />
      </Card>

      <Card>
        <h2 className="text-lg">In this cohort</h2>
        <div className="mt-3">
          <MembersForm
            cohortId={cohort.id}
            rows={inIt}
            action="remove"
            label="Take them out"
            empty="Nobody yet. Put confirmed trainees in from the list below."
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg">Put trainees in</h2>
        <p className="mt-1 mb-3 text-sm text-slate">
          Confirmed trainees only. They take this cohort’s dates, and leave any cohort they were in.
        </p>
        <MembersForm
          cohortId={cohort.id}
          rows={others}
          action="add"
          label="Put them in this cohort"
          empty="Every confirmed trainee is already in this cohort."
        />
      </Card>
    </div>
  );
}
