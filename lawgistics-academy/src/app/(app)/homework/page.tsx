import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser, createSupabaseServerClient } from '@/lib/supabase/server';
import { getLearnerProfile } from '@/lib/learner-overview';
import { HOMEWORK_TASKS } from '@/content/seed/homework';
import { homeworkDay, lastArrivedDay } from '@/lib/homework/rules';
import { Card, Pill, SectionHeading } from '@/components/ui';
import { HomeworkForm } from '../homework-form';

export const metadata: Metadata = { title: 'Homework' };

export default async function HomeworkPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const profile = await getLearnerProfile(user.id);
  if (!profile || !profile.startsOn) redirect('/dashboard');

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from('homework_declarations')
    .select('day')
    .eq('user_id', user.id);
  const declaredDays = new Set((rows ?? []).map((r) => r.day as number));

  const homework = homeworkDay(profile.startsOn, profile.endsOn, profile.timezone);
  const arrivedDay = lastArrivedDay(homework);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <p className="eyebrow mb-2">Your placement</p>
        <h1 className="text-3xl sm:text-4xl">Homework</h1>
        <p className="mt-3 text-slate">
          Twenty tasks, one for each working day. A day that has already come round can be
          ticked off any time after, so a day out of the office does not have to leave a gap.
        </p>
      </section>

      <section>
        <SectionHeading title="All twenty days" />
        <div className="space-y-3">
          {HOMEWORK_TASKS.map((t) => {
            const arrived = t.day <= arrivedDay;
            const done = declaredDays.has(t.day);
            return (
              <Card key={t.slug}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="eyebrow">Day {t.day}</p>
                  {done ? <Pill tone="correct">Done</Pill> : !arrived ? <Pill>Not yet</Pill> : null}
                </div>
                <p className="mt-2 font-serif text-lg leading-snug">{t.title}</p>
                {arrived ? (
                  <>
                    <p className="mt-2 text-slate">{t.task}</p>
                    <p className="mt-2 text-sm text-muted">{t.why}</p>
                    {!done ? <HomeworkForm day={t.day} /> : null}
                  </>
                ) : (
                  <p className="mt-2 text-sm text-muted">Not due yet.</p>
                )}
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
