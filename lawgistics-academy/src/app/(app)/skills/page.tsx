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
import Link from '@/components/app-link';
import { AreaBreakdown, type Area } from './area-breakdown';
import { FactCard } from './fact-card';
import { ButtonLink, Card, EmptyState, Pill, SectionHeading } from '@/components/ui';
import { requireAccess } from '@/lib/access/service';
import { ProgressSummary, ReviewLists, StreakSection } from '@/components/progress-details';
import { Disclosure } from '@/components/disclosure';
import { LeaderboardCard } from '@/components/leaderboard-card';
import { weeklyLeaderboard } from '@/lib/leaderboard';
import { essayFor, viewerIsStaff } from '@/lib/content/service';
import { longDate } from '@/lib/onboarding/rules';

export const metadata: Metadata = { title: 'Your progress' };

export default async function SkillsPage() {
  await requireAccess();
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const overview = await getLearnerOverview(user.id);
  if (!overview) redirect('/account-problem');

  const supabase = await createSupabaseServerClient();
  const { profile } = overview;

  // A different fact from the one the dashboard is showing today.
  const hasPlacement = Boolean(profile.startsOn || profile.endsOn);
  const [fact, modules, open, marks, leaderboard, sittings] = await Promise.all([
    getFactOfTheDay(profile.timezone, profile.country, new Date(), 1),
    getModuleProgress(user.id, profile.country),
    trainingOpen(profile.country),
    // Their own answers, through their own session: RLS limits it to them.
    answerMarks(supabase, user.id),
    weeklyLeaderboard(),
    hasPlacement
      ? supabase
          .from('diagnostic_results')
          .select('essay_topic_slug, completed_at')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: true })
      : Promise.resolve({ data: null }),
  ]);
  const sittingCount = sittings.data?.length ?? 0;
  // The essay topic is legal content written in the code: a learner is shown
  // it only once a lawyer has signed off its wording (0046).
  const essay = await essayFor(
    sittings.data?.[0]?.essay_topic_slug as string | undefined,
    await viewerIsStaff(user.id),
  );
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

  type ConceptRef = {
    id: string;
    slug: string;
    name: string;
    domain_id: string;
  };
  const concepts = (conceptRows ?? [])
    .map((row) => {
      const concept = (
        Array.isArray(row.concepts) ? row.concepts[0] : row.concepts
      ) as ConceptRef | null;
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

  const last = history.length > 0 ? history[history.length - 1] : null;
  const answeredInAll = history.reduce((sum, d) => sum + d.answered, 0);
  const conceptsMet = concepts.length;
  const dueNow = concepts.filter((c) => {
    const due = dueByConcept.get(c.id);
    return due && new Date(due) <= new Date();
  }).length;

  return (
    <div className="space-y-7 sm:space-y-9">
      <header>
        <p className="eyebrow mb-1.5">Progress</p>
        <h1 className="text-3xl sm:text-4xl">How you are doing</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate">
          <span>
            {greeting(new Date(), profile.timezone)}
            {greetingName(profile.displayName) ? `, ${greetingName(profile.displayName)}` : ''}
          </span>
          <span aria-hidden className="text-muted">
            &middot;
          </span>
          <span>{COUNTRY_LABELS[profile.country]}</span>
        </p>
        {/* Its own line, a full 44px tall: pulled into the line above with
            negative margins it covered the greeting (the device sweep). */}
        <Link
          href="/onboarding?edit=1"
          className="mt-1 inline-flex min-h-11 items-center rounded-[5px] text-sm text-slate underline underline-offset-4 hover:text-ink"
        >
          Change country or goals
        </Link>
      </header>

      {/* The most meaningful numbers first, without opening anything. */}
      <ProgressSummary
        overview={overview}
        overall={last ? last.overall : null}
        answered={answeredInAll}
       unreadable={marks === null} />

      {!hasData ? (
        <EmptyState
          title="Nothing measured yet"
          description={
            !open
              ? 'This fills in once the questions are open and you have trained on them.'
              : profile.diagnosticCompletedAt
                ? 'Your diagnostic is done, but no scores have come through yet. They fill in as you train.'
                : 'Complete the diagnostic and your first few sessions, and this page fills in.'
          }
          action={
            !open ? undefined : profile.diagnosticCompletedAt ? (
              <ButtonLink href="/dashboard" variant="accent">
                Go to today
              </ButtonLink>
            ) : (
              <ButtonLink href="/diagnostic" variant="accent">
                Take the diagnostic
              </ButtonLink>
            )
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
            <SectionHeading eyebrow="By area" title="Open one to see what is underneath" />
            <p className="-mt-2 mb-4 max-w-2xl text-sm text-slate">
              The share of your answers that were right. Get them all right and it stays at 100%;
              each wrong answer brings it down.
            </p>
            {overview.areaScoresUnavailable ? (
              <p className="max-w-2xl text-sm text-slate">
                Scores by area could not be read just now. Try again in a moment; your answers are
                all still recorded.
              </p>
            ) : (
              <AreaBreakdown areas={areas} />
            )}
          </section>
        </>
      ) : null}

      {/* Worth acting on, so it stays in view rather than folded away. */}
      {hasData ? (
        <>
          {blindSpots.length > 0 ? (
            <section>
              <SectionHeading eyebrow="Worth your attention" title="Certain and wrong" />
              <Card>
                <p className="mb-4 text-sm text-slate">
                  On these concepts you have answered incorrectly while marking yourself Certain
                  (not Somewhat sure). That is a belief that needs correcting rather than a gap that
                  needs filling, and it is weighted accordingly in your training.
                </p>
                <ul className="divide-y divide-rule">
                  {blindSpots.map((concept) => (
                    <li
                      key={concept.slug}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <span className="text-sm">{concept.name}</span>
                      <Pill tone="wrong">{concept.confidentAndWrong}×</Pill>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ) : null}
        </>
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

      {/* The rest is detail: each section says what is inside before it is
          opened, and none of it is needed to know where you stand. */}
      <section aria-labelledby="more-detail" className="space-y-3">
        <h2 id="more-detail" className="eyebrow">
          More detail
        </h2>

        {hasData ? (
          <Disclosure
            id="concepts"
            title="Every concept you have met"
            preview={`${conceptsMet} ${conceptsMet === 1 ? 'concept' : 'concepts'}${dueNow > 0 ? `, ${dueNow} due now` : ''}`}
          >
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
          </Disclosure>
        ) : null}

        <Disclosure
          id="streak"
          title="Your streak"
          preview={`${overview.currentStreak} ${overview.currentStreak === 1 ? 'day' : 'days'} in a row · best ${overview.longestStreak}`}
        >
          <StreakSection overview={overview} timezone={profile.timezone} />
        </Disclosure>

        {leaderboard ? (
          <Disclosure
            id="leaderboard"
            title="This week at the firm"
            preview="XP in the last seven days, first names only"
          >
            <LeaderboardCard rows={leaderboard} />
          </Disclosure>
        ) : null}

        <Disclosure
          id="review"
          title="Review and mastered"
          preview={`${overview.dueCount} due · ${overview.recentlyMastered.length} recently mastered`}
        >
          <ReviewLists overview={overview} open={open} />
        </Disclosure>

        {hasPlacement ? (
          <Disclosure
            id="placement"
            title="Your placement"
            preview={[
              profile.startsOn ? `Begins ${longDate(profile.startsOn)}` : null,
              profile.endsOn ? `ends ${longDate(profile.endsOn)}` : null,
            ]
              .filter(Boolean)
              .join(', ')}
          >
            <p className="text-slate">
              {profile.startsOn ? `Begins ${longDate(profile.startsOn)}.` : ''}
              {profile.startsOn && profile.endsOn ? ' ' : ''}
              {profile.endsOn ? `Ends ${longDate(profile.endsOn)}.` : ''}
            </p>
            {essay.topic ? (
              <p className="mt-3 text-sm text-slate">
                <strong>Your comparison essay:</strong> {essay.topic.item.prompt}
                {!essay.topic.checked ? (
                  <span className="mt-1 block text-xs">
                    Not yet checked by a lawyer. Learners do not see this topic until a lawyer signs
                    it off.
                  </span>
                ) : null}
              </p>
            ) : essay.waiting ? (
              <p className="mt-3 text-sm text-slate">
                <strong>Your comparison essay:</strong> the topic is waiting for a lawyer&rsquo;s
                check, and appears here once it is signed off.
              </p>
            ) : null}
            {sittingCount >= 2 ? (
              <Link
                href="/diagnostic/compare"
                className="mt-2 inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-4"
              >
                See your day one against your latest
              </Link>
            ) : null}
          </Disclosure>
        ) : null}

        {fact ? (
          <Disclosure id="fact" title="A fact to take away" preview={fact.title}>
            <FactCard
              title={fact.title}
              body={fact.body}
              whyItMatters={fact.whyItMatters}
              source={fact.sourceReference}
            />
          </Disclosure>
        ) : null}
      </section>
    </div>
  );
}
