import type { Metadata } from 'next';
import Link from 'next/link';
import { requireFirmAdmin } from '@/lib/admin/guard';
import { Card } from '@/components/ui';
import { createServiceClient } from '@/lib/supabase/service';
import { listCohorts } from '@/lib/training/cohorts';
import {
  DEFAULT_SCHEDULE,
  roundCountWord,
  roundTimes,
  writeHolidays,
  zoneName,
} from '@/lib/training/schedule';
import { PROGRAMME } from '@/content/programme';
import { CohortForm } from './forms';

export const metadata: Metadata = { title: 'Cohorts' };

const day = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

/**
 * The firm's intakes. Each has its own dates, clock, round times and
 * holidays; a trainee in one runs on it, and anybody in none keeps the
 * programme's own (Kuala Lumpur, 7 to 10am, the holidays in holidays.ts).
 */
export default async function CohortsPage() {
  await requireFirmAdmin();
  const cohorts = await listCohorts();
  const { data: members } = await createServiceClient()
    .from('profiles')
    .select('*')
    .not('cohort_id', 'is', null)
    .limit(5000);
  const count = new Map<string, number>();
  for (const m of (members ?? []) as Array<{ cohort_id: string }>) {
    count.set(m.cohort_id, (count.get(m.cohort_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="eyebrow mb-2">Cohorts</p>
        <h1 className="text-3xl">Intakes and their rounds</h1>
        <p className="mt-3 max-w-2xl text-slate">
          A cohort is one intake: its first and last day, the city whose clock its rounds run on,
          the times they open and the public holidays it skips. Put each confirmed trainee in one
          and their homework, rounds and calendar follow it. Anybody in no cohort runs on{' '}
          {zoneName(DEFAULT_SCHEDULE)} at {roundTimes(DEFAULT_SCHEDULE)}.
        </p>
      </section>

      {cohorts.length > 0 ? (
        <Card>
          <h2 className="text-lg">Cohorts now</h2>
          <ul className="mt-3 divide-y divide-rule">
            {cohorts.map((c) => (
              <li key={c.id} className="py-3">
                <Link href={`/admin/cohorts/${c.id}`} className="font-medium underline-offset-4 hover:underline">
                  {c.name}
                </Link>
                <p className="text-sm text-slate">
                  {day(c.startsOn)} to {day(c.endsOn)} · {roundCountWord(c.schedule)} rounds at{' '}
                  {roundTimes(c.schedule)}, {zoneName(c.schedule)} · {count.get(c.id) ?? 0}{' '}
                  {(count.get(c.id) ?? 0) === 1 ? 'trainee' : 'trainees'}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <h2 className="text-lg">Make a cohort</h2>
        <p className="mt-1 mb-5 text-sm text-slate">
          Filled in with the programme as it runs now. Change whatever is different for this intake.
        </p>
        <CohortForm
          values={{
            name: '',
            startsOn: PROGRAMME.intakeStartsOn,
            endsOn: PROGRAMME.intakeEndsOn,
            timezone: DEFAULT_SCHEDULE.timezone,
            roundHours: DEFAULT_SCHEDULE.roundHours,
            holidays: writeHolidays(DEFAULT_SCHEDULE.holidays),
          }}
        />
      </Card>
    </div>
  );
}
