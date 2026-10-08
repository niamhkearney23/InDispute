import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser, createSupabaseServerClient } from '@/lib/supabase/server';
import { getLearnerOverview } from '@/lib/learner-overview';
import { rightShare } from '@/lib/learning/mastery';
import { scoreOverTime } from '@/lib/learning/score-history';
import { answerMarks } from '@/lib/learning/score-history-service';
import { ScoreHistoryChart } from '@/components/score-history-chart';
import { getFactOfTheDay } from '@/lib/facts/service';
import { getModuleProgress } from '@/lib/modules/service';
import { trainingOpen } from '@/lib/training/service';
import { greeting, greetingName } from '@/lib/greeting';
import { COUNTRY_LABELS } from '@/lib/types';
import Link from 'next/link';
import { AreaBreakdown, type Area } from './area-breakdown';
import { FactCard } from './fact-card';
import {
  ButtonLink,
  Card,
  EmptyState,
  Pill,
  SectionHeading,
} from '@/components/ui';
import { requireAccess } from '@/lib/access/service';

export const metadata: Metadata = { title: 'Your progress' };

export default async function SkillsPage() {
  await requireAccess();
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const overview = await getLearnerOverview(user.id);
  if (!overview) redirect('/login');

  const supabase = await createSupabaseServerClient();
  const { profile, level } = overview;

  // A different fact from the one the dashboard is showing today.
  const [fact, modules, open, marks] = await Promise.all([
    getFactOfTheDay(profile.timezone, profile.country, new Date(), 1),
    getModuleProgress(user.id, profile.country),
    trainingOpen(profile.country),
    // Their own answers, through their own session: RLS limits it to them.
    answerMarks(supabase, user.id),
  ]);
  const history = marks ? scoreOverTime(marks, profile.timezone) : [];

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
        score: rightShare(row.correct as number, row.attempts as number),
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

  // The area bars carry their concepts with them, so opening one shows the
  // level a learner can actually act on rather than a single number per subject.
  const domainIdBySlug = new Map((domains ?? []).map((d) => [d.slug as string, d.id as string]));
  const areas: Area[] = overview.skillMap.map((entry) => ({
    slug: entry.slug,
    name: entry.name,
    score: entry.score,
    attempts: entry.attempts,
    concepts: concepts
      .filter((c) => c.domainId === domainIdBySlug.get(entry.slug))
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        score: c.score,
        attempts: c.attempts,
        correct: c.correct,
        confidentAndWrong: c.confidentAndWrong,
      })),
  }));

  return (
    <div className="space-y-9">
      <section>
        <p className="eyebrow mb-2">
          {greeting(new Date(), profile.timezone)}
          {greetingName(profile.displayName) ? `, ${greetingName(profile.displayName)}` : ''}
        </p>
        <h1 className="text-3xl sm:text-4xl">Where you are</h1>
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-slate">
          <span className="text-muted">{COUNTRY_LABELS[profile.country]}</span>
          <span aria-hidden className="text-muted">
            &middot;
          </span>
          <span>
            Level {level.level}, <span className="text-ink">{level.name}</span>
          </span>
          <span aria-hidden className="text-muted">
            &middot;
          </span>
          <span className="tabular-nums">{overview.totalXp} XP</span>
        </p>
        <p className="mt-2 text-sm">
          <Link
            href="/onboarding?edit=1"
            className="-my-2 inline-block rounded-[5px] px-1 py-2 text-slate underline underline-offset-4 hover:text-ink"
          >
            Change country or goals
          </Link>
        </p>
      </section>

      {fact ? (
        <FactCard
          title={fact.title}
          body={fact.body}
          whyItMatters={fact.whyItMatters}
          source={fact.sourceReference}
        />
      ) : null}

      {modules.length > 0 ? (
        <section>
          <SectionHeading eyebrow="Modules" title="Things to have covered" />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {modules.map((entry) => (
              <ButtonLink
                key={entry.module.slug}
                href={`/modules/${entry.module.slug}`}
                variant="outline"
                className="h-auto w-full flex-col items-start gap-1 px-4 py-3.5 text-left"
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="font-medium">{entry.module.name}</span>
                  {entry.complete ? (
                    <Pill tone="correct">Done</Pill>
                  ) : entry.module.required ? (
                    <Pill tone="accent">Required</Pill>
                  ) : null}
                </span>
                <span className="text-xs font-normal text-slate">
                  {entry.total === 0
                    ? 'Not published yet'
                    : `${entry.correctOnce} of ${entry.total}`}
                </span>
              </ButtonLink>
            ))}
          </div>
        </section>
      ) : null}

      {!hasData ? (
        <EmptyState
          title="Nothing measured yet"
          description={
            open
              ? 'Complete the diagnostic and your first few sessions, and this page fills in.'
              : 'This fills in once the questions are open and you have trained on them.'
          }
          action={
            open ? (
              <ButtonLink href="/diagnostic" variant="accent">
                Take the diagnostic
              </ButtonLink>
            ) : undefined
          }
        />
      ) : null}

      {history.length > 0 ? (
        <section>
          <SectionHeading eyebrow="Overall" title="Your score over time" />
          <Card>
            <p className="mb-4 max-w-2xl text-sm text-slate">
              Every answer you have given, right or wrong, as a share. It starts at 100% and only
              comes down when you get one wrong.
            </p>
            <ScoreHistoryChart days={history} />
          </Card>
        </section>
      ) : null}

      {hasData ? (
        <>
          <section>
            <SectionHeading
              eyebrow="By area"
              title="Open one to see what is underneath"
            />
            <p className="-mt-2 mb-4 max-w-2xl text-sm text-slate">
              The share of your answers that were right. Get them all right and it stays at 100%;
              each wrong answer brings it down.
            </p>
            {overview.areaScoresUnavailable ? (
              <p className="max-w-2xl text-sm text-slate">
                Scores by area could not be read just now. Try again in a moment; your answers
                are all still recorded.
              </p>
            ) : (
              <AreaBreakdown areas={areas} />
            )}
          </section>

          {/* No "by skill" scores. Every question carries skill tags, but they
              were attached loosely when the questions were drafted (which
              court sits in the middle was tagged attention to detail; how
              to address a judge, oral communication), and a multiple-choice
              answer cannot show speaking or writing at all. A score built on
              that would be a number nobody can stand behind, so it is not
              shown until the tags have been checked question by question. */}

          {blindSpots.length > 0 ? (
            <section>
              <SectionHeading
                eyebrow="Worth your attention"
                title="Certain and wrong"
              />
              <Card>
                <p className="mb-4 text-sm text-slate">
                  On these concepts you have answered incorrectly while marking yourself
                  Certain (not Somewhat sure). That is a belief that needs correcting rather than a gap that
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
                                  {concept.correct} of {concept.attempts} right
                                  {due && new Date(due) <= new Date() ? ' · due now' : ''}
                                </p>
                              </div>
                              <span className="shrink-0 font-serif text-base tabular-nums">
                                {concept.score}%
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

    </div>
  );
}
