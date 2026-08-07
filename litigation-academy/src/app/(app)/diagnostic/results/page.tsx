import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser, createSupabaseServerClient } from '@/lib/supabase/server';
import { masteryBand } from '@/lib/learning/mastery';
import { ButtonLink, Card, ScoreBar, SectionHeading, Stat } from '@/components/ui';

export const metadata: Metadata = { title: 'Your skill map' };

export default async function DiagnosticResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { session } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const query = supabase
    .from('diagnostic_results')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(1);

  const { data: results } = session ? await query.eq('session_id', session) : await query;
  const result = results?.[0];

  if (!result) redirect('/diagnostic');

  const { data: domains } = await supabase
    .from('domains')
    .select('slug, name, sort_order')
    .order('sort_order');

  const domainScores = (result.domain_scores ?? {}) as Record<string, number>;
  const priority = (result.priority_domains ?? []) as string[];
  const nameBySlug = new Map((domains ?? []).map((d) => [d.slug, d.name]));

  const rows = (domains ?? [])
    .map((domain) => ({
      slug: domain.slug,
      name: domain.name,
      score: domainScores[domain.slug] ?? 0,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <p className="eyebrow mb-2">Diagnostic complete</p>
        <h1 className="text-3xl sm:text-4xl">Your litigation skill map</h1>
        <p className="mt-3 text-slate">
          This is a starting position, not a verdict. Every score moves as you train, and
          the areas at the bottom are simply where the next few weeks are most worth
          spending.
        </p>
      </section>

      <Card>
        <div className="grid grid-cols-2 gap-5">
          <Stat
            label="Answered correctly"
            value={`${result.total_correct}/${result.total_questions}`}
          />
          <Stat
            label="Areas assessed"
            value={Object.keys(domainScores).length}
            hint="of six foundation areas"
          />
        </div>
      </Card>

      <section>
        <SectionHeading title="By area" />
        <Card>
          <div className="divide-y divide-rule">
            {rows.map((row) => (
              <ScoreBar
                key={row.slug}
                label={row.name}
                score={row.score}
                band={masteryBand(row.score)}
              />
            ))}
          </div>
        </Card>
      </section>

      {priority.length > 0 ? (
        <section>
          <SectionHeading eyebrow="Where to start" title="Your priority areas" />
          <Card>
            <ol className="space-y-3">
              {priority.map((slug, index) => (
                <li key={slug} className="flex items-baseline gap-3">
                  <span className="font-serif text-lg text-muted tabular-nums">
                    {index + 1}
                  </span>
                  <span>{nameBySlug.get(slug) ?? slug}</span>
                </li>
              ))}
            </ol>
            <p className="mt-5 border-t border-rule pt-4 text-sm text-slate">
              Your daily training will weight these most heavily, alongside anything
              scheduled for review. You do not need to do anything to make that happen.
            </p>
          </Card>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/dashboard" size="lg" variant="accent">
          Start training
        </ButtonLink>
        <ButtonLink href="/skills" size="lg" variant="outline">
          See the full breakdown
        </ButtonLink>
      </div>
    </div>
  );
}
