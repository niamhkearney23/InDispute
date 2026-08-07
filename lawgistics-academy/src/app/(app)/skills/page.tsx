import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser, createSupabaseServerClient } from '@/lib/supabase/server';
import { getLearnerOverview } from '@/lib/learner-overview';
import { displayScore, masteryBand } from '@/lib/learning/mastery';
import {
  ButtonLink,
  Card,
  EmptyState,
  Pill,
  ScoreBar,
  SectionHeading,
} from '@/components/ui';

export const metadata: Metadata = { title: 'Skill map' };

export default async function SkillsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const overview = await getLearnerOverview(user.id);
  if (!overview) redirect('/login');

  const supabase = await createSupabaseServerClient();

  const [{ data: conceptRows }, { data: domains }, { data: schedule }] = await Promise.all([
    supabase
      .from('user_concept_mastery')
      .select(
        'mastery, attempts, correct, confident_and_wrong, concepts(id, slug, name, domain_id)',
      )
      .eq('user_id', user.id),
    supabase.from('domains').select('id, slug, name, sort_order').order('sort_order'),
    supabase.from('review_schedule').select('concept_id, next_review_at').eq('user_id', user.id),
  ]);

  const dueByConcept = new Map(
    (schedule ?? []).map((row) => [row.concept_id as string, row.next_review_at as string]),
  );

  type ConceptRef = { id: string; slug: string; name: string; domain_id: string };
  const concepts = (conceptRows ?? [])
    .map((row) => {
      const concept = (Array.isArray(row.concepts) ? row.concepts[0] : row.concepts) as
        | ConceptRef
        | null;
      return {
        id: concept?.id ?? '',
        slug: concept?.slug ?? '',
        name: concept?.name ?? '',
        domainId: concept?.domain_id ?? '',
        score: displayScore(Number(row.mastery), row.attempts as number),
        attempts: row.attempts as number,
        correct: row.correct as number,
        confidentAndWrong: row.confident_and_wrong as number,
      };
    })
    .filter((c) => c.slug);

  const hasData = concepts.length > 0;

  // Confidently wrong is the most actionable signal in the system; surface it.
  const blindSpots = concepts
    .filter((c) => c.confidentAndWrong > 0)
    .sort((a, b) => b.confidentAndWrong - a.confidentAndWrong)
    .slice(0, 5);

  return (
    <div className="space-y-9">
      <section>
        <p className="eyebrow mb-2">Your profile</p>
        <h1 className="text-3xl sm:text-4xl">Skill map</h1>
        <p className="mt-3 max-w-xl text-slate">
          Two views of the same training. By area, which is what you would call a subject.
          And by skill, which is the kind of thinking a question asked of you. That axis
          cuts across subjects.
        </p>
      </section>

      {!hasData ? (
        <EmptyState
          title="Nothing measured yet"
          description="Complete the diagnostic and your first few sessions, and this page fills in."
          action={
            <ButtonLink href="/diagnostic" variant="accent">
              Take the diagnostic
            </ButtonLink>
          }
        />
      ) : null}

      {hasData ? (
        <>
          <section>
            <SectionHeading eyebrow="By area" title="Foundation areas" />
            <Card>
              <div className="divide-y divide-rule">
                {overview.skillMap.map((entry) => (
                  <ScoreBar
                    key={entry.slug}
                    label={entry.name}
                    score={entry.score}
                    band={masteryBand(entry.score)}
                    sublabel={
                      entry.attempts === 0
                        ? 'Not yet assessed'
                        : `${entry.attempts} answer${entry.attempts === 1 ? '' : 's'}`
                    }
                  />
                ))}
              </div>
            </Card>
          </section>

          {overview.skillProfile.length > 0 ? (
            <section>
              <SectionHeading
                eyebrow="By skill"
                title="How you think, not what you know"
              />
              <Card>
                <div className="divide-y divide-rule">
                  {overview.skillProfile.map((entry) => (
                    <ScoreBar
                      key={entry.slug}
                      label={entry.name}
                      score={entry.score}
                      band={masteryBand(entry.score)}
                      sublabel={`${entry.attempts} answer${entry.attempts === 1 ? '' : 's'}`}
                    />
                  ))}
                </div>
              </Card>
            </section>
          ) : null}

          {blindSpots.length > 0 ? (
            <section>
              <SectionHeading
                eyebrow="Worth your attention"
                title="Confident and wrong"
              />
              <Card>
                <p className="mb-4 text-sm text-slate">
                  On these concepts you have answered incorrectly while marking yourself
                  certain. That is a belief that needs correcting rather than a gap that
                  needs filling, and it is weighted accordingly in your training.
                </p>
                <ul className="divide-y divide-rule">
                  {blindSpots.map((concept) => (
                    <li
                      key={concept.slug}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <span className="text-sm">{concept.name}</span>
                      <Pill tone="wrong">
                        {concept.confidentAndWrong}×
                      </Pill>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ) : null}

          <section>
            <SectionHeading eyebrow="Concept detail" title="Every concept you have met" />
            <Card>
              <div className="space-y-6">
                {(domains ?? []).map((domain) => {
                  const inDomain = concepts
                    .filter((c) => c.domainId === domain.id)
                    .sort((a, b) => a.score - b.score);
                  if (inDomain.length === 0) return null;

                  return (
                    <div key={domain.id}>
                      <p className="eyebrow mb-2">{domain.name}</p>
                      <ul className="divide-y divide-rule">
                        {inDomain.map((concept) => {
                          const due = dueByConcept.get(concept.id);
                          return (
                            <li
                              key={concept.slug}
                              className="flex items-center justify-between gap-3 py-2.5"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm">{concept.name}</p>
                                <p className="text-xs text-muted">
                                  {concept.correct}/{concept.attempts} correct
                                  {due && new Date(due) <= new Date() ? ' · due now' : ''}
                                </p>
                              </div>
                              <span className="font-serif text-base tabular-nums">
                                {concept.score}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Card>
          </section>
        </>
      ) : null}

      <Card className="border-dashed">
        <p className="eyebrow mb-2">Not yet built</p>
        <p className="text-sm text-slate">
          Once there are hundreds of answers behind a profile, this same data can suggest
          areas of practice you might enjoy exploring, framed as exactly that, and never
          as a determination about your career. It is deliberately not in this version.
        </p>
      </Card>
    </div>
  );
}
