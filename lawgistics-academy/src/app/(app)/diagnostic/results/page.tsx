import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser, createSupabaseServerClient } from '@/lib/supabase/server';
import { diagnosticAreaCounts } from '@/lib/training/service';
import { masteryBand } from '@/lib/learning/mastery';
import { ButtonLink, Card, ScoreBar, SectionHeading, cn } from '@/components/ui';
import { requireAccess } from '@/lib/access/service';
import { SKILL_LEVELS, SKILL_LEVEL_ORDER, skillLevelFor } from '@/lib/learning/skill-level';

export const metadata: Metadata = { title: 'Your skill map' };

/** "3 of 4 questions right", or nothing for an area with no answers in this sitting. */
function answeredIn(area: { right: number; of: number } | undefined): string | undefined {
  if (!area) return undefined;
  return `${area.right} of ${area.of} ${area.of === 1 ? 'question' : 'questions'} right`;
}

export default async function DiagnosticResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  await requireAccess();
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

  // How many questions each area rests on, from this sitting's own answers:
  // a percentage from two questions is shown as the two questions it is.
  const tally = await diagnosticAreaCounts(user.id, result.session_id as string);

  const domainScores = (result.domain_scores ?? {}) as Record<string, number>;
  const priority = (result.priority_domains ?? []) as string[];
  const nameBySlug = new Map((domains ?? []).map((d) => [d.slug, d.name]));

  const rows = (domains ?? [])
    .map((domain) => ({
      slug: domain.slug,
      name: domain.name,
      score: domainScores[domain.slug] ?? 0,
      // An area the diagnostic asked nothing about has no score, not a zero.
      asked: domain.slug in domainScores,
    }))
    .sort((a, b) => b.score - a.score);

  const percent = result.total_questions > 0 ? Math.round((result.total_correct / result.total_questions) * 100) : 0;
  const level = skillLevelFor(percent);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* The level in a word, what it means, and where it sits on the
          scale (the owner, November 2026: "see what level you're at"). */}
      <section aria-labelledby="your-level" className="accent-surface rise-in rounded-2xl bg-ink px-6 py-9 text-center text-paper sm:px-10 sm:py-11">
        <p className="text-sm text-paper/60">
          Diagnostic complete · {result.total_correct} of {result.total_questions} right ({percent}%)
        </p>
        <p className="mt-6 text-sm text-paper/60">Your level</p>
        <h1 id="your-level" className="auth-hello auth-hello--small mt-1">
          {SKILL_LEVELS[level].name}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-paper/80 text-balance">{SKILL_LEVELS[level].meaning}</p>
        <ol className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-2 text-left" aria-label="The three levels">
          {SKILL_LEVEL_ORDER.map((key) => (
            <li
              key={key}
              aria-current={key === level ? 'true' : undefined}
              className={cn(
                'rounded-lg border px-3 py-2.5',
                key === level ? 'border-paper/70 bg-paper/10' : 'border-paper/15',
              )}
            >
              <span className={cn('block text-sm font-semibold', key === level ? 'text-paper' : 'text-paper/60')}>
                {SKILL_LEVELS[key].name}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-paper/50">{SKILL_LEVELS[key].range}</span>
            </li>
          ))}
        </ol>
        <p className="mx-auto mt-6 max-w-md text-xs text-paper/50 text-balance">
          A starting point from {result.total_questions} questions, not a verdict on you as a lawyer. It moves
          as you train, and Progress shows it as it changes. Areas assessed:{' '}
          {Object.keys(domainScores).length} of {(domains ?? []).length}.
        </p>
      </section>

      <section>
        <SectionHeading title="By area" />
        <Card>
          <div className="divide-y divide-rule">
            {rows.map((row) => (
              <ScoreBar
                key={row.slug}
                label={row.name}
                sublabel={answeredIn(tally.get(row.slug))}
                score={row.score}
                band={masteryBand(row.score)}
                unit="%"
                early={!row.asked}
                earlyText="Not asked"
              />
            ))}
          </div>
          {/* What these numbers are, and what they are not (the owner: "how
              the hell can it score my advocacy skills?"). */}
          <p className="mt-4 border-t border-rule pt-4 text-sm text-slate">
            Each area is the share right of the multiple-choice questions asked about it, so an area
            with two questions moves a long way on one answer. Advocacy and Drafting here are
            questions about them: they do not measure how you speak or write. Those are marked by
            your coach, and in the Advocacy Studio.
          </p>
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
          Go to Today
        </ButtonLink>
        <ButtonLink href="/skills" size="lg" variant="outline">
          See your progress
        </ButtonLink>
      </div>
    </div>
  );
}
