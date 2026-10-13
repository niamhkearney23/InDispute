import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser, createSupabaseServerClient } from '@/lib/supabase/server';
import { masteryBand } from '@/lib/learning/mastery';
import { essayFor, viewerIsStaff } from '@/lib/content/service';
import { ButtonLink, Card, Notice, Pill, ScoreBar, SectionHeading } from '@/components/ui';
import { requireAccess } from '@/lib/access/service';

export const metadata: Metadata = { title: 'Day one against the last day' };

export default async function DiagnosticComparePage() {
  await requireAccess();
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createSupabaseServerClient();

  const [{ data: results }, { data: domains }] = await Promise.all([
    supabase
      .from('diagnostic_results')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: true }),
    supabase.from('domains').select('slug, name, sort_order').order('sort_order'),
  ]);

  const rows = results ?? [];

  if (rows.length < 2) {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <section>
          <p className="eyebrow mb-2">Day one against the last day</p>
          <h1 className="text-3xl sm:text-4xl">Not enough sittings yet</h1>
        </section>
        <Notice>
          This page compares your first diagnostic against your most recent one, and needs
          two sittings to show anything. Retake the diagnostic nearer the end of your
          placement to see the two side by side.
        </Notice>
        <ButtonLink href="/diagnostic" size="lg" variant="accent">
          Retake the diagnostic
        </ButtonLink>
      </div>
    );
  }

  const first = rows[0];
  const last = rows[rows.length - 1];

  const firstScores = (first.domain_scores ?? {}) as Record<string, number>;
  const lastScores = (last.domain_scores ?? {}) as Record<string, number>;

  const comparisonRows = (domains ?? [])
    .filter((domain) => domain.slug in firstScores || domain.slug in lastScores)
    .map((domain) => {
      const before = firstScores[domain.slug] ?? 0;
      const after = lastScores[domain.slug] ?? 0;
      return {
        slug: domain.slug,
        name: domain.name,
        before,
        after,
        delta: after - before,
        // Not asked about is no score, not a zero.
        askedBefore: domain.slug in firstScores,
        askedAfter: domain.slug in lastScores,
      };
    });

  // Shown only once a lawyer has signed off the topic's wording (0046).
  const essay = await essayFor(
    first.essay_topic_slug as string | null,
    await viewerIsStaff(user.id),
  );

  const formatDate = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(
          new Date(value),
        )
      : 'an unknown date';

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section>
        <p className="eyebrow mb-2">Day one against the last day</p>
        <h1 className="text-3xl sm:text-4xl">Your skill map, then and now</h1>
        <p className="mt-3 text-slate">
          Your first sitting was on {formatDate(first.completed_at)}. Your most recent was on{' '}
          {formatDate(last.completed_at)}.
        </p>
      </section>

      {essay.topic || essay.waiting ? (
        <section>
          <SectionHeading eyebrow="Assigned on day one" title="Your comparison essay" />
          <Card>
            {essay.topic ? (
              <>
                <p className="text-slate">{essay.topic.item.prompt}</p>
                {!essay.topic.checked ? (
                  <p className="mt-3 text-sm text-slate">
                    <Pill tone="warn">Not yet checked by a lawyer</Pill> Learners do not see this
                    topic until a lawyer signs it off.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-slate">
                The topic is waiting for a lawyer&rsquo;s check, and appears here once it is
                signed off.
              </p>
            )}
          </Card>
        </section>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <section>
          <SectionHeading title="Day one" />
          <Card>
            <div className="divide-y divide-rule">
              {comparisonRows.map((row) => (
                <ScoreBar
                  key={row.slug}
                  label={row.name}
                  score={row.before}
                  band={masteryBand(row.before)}
                  unit="%"
                  early={!row.askedBefore}
                  earlyText="Not asked"
                />
              ))}
            </div>
          </Card>
        </section>

        <section>
          <SectionHeading title="Most recent" />
          <Card>
            <div className="divide-y divide-rule">
              {comparisonRows.map((row) => (
                <ScoreBar
                  key={row.slug}
                  label={row.name}
                  score={row.after}
                  band={masteryBand(row.after)}
                  unit="%"
                  early={!row.askedAfter}
                  earlyText="Not asked"
                  sublabel={
                    !row.askedBefore || !row.askedAfter
                      ? undefined
                      : row.delta === 0
                      ? 'No change'
                      : `${row.delta > 0 ? '+' : ''}${row.delta} since day one`
                  }
                />
              ))}
            </div>
          </Card>
        </section>
      </div>

      <div>
        <ButtonLink href="/dashboard" size="lg" variant="accent">
          Back to today
        </ButtonLink>
      </div>
    </div>
  );
}
