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
import { COUNTRY_LABELS } from '@/lib/types';
import Link from '@/components/app-link';
import { AreaBreakdown, type Area } from './area-breakdown';
import { FactCard } from './fact-card';
import { ButtonLink, PageHeader } from '@/components/ui';
import { requireAccess } from '@/lib/access/service';
import { ReviewLists, StreakSection } from '@/components/progress-details';
import { Disclosure } from '@/components/disclosure';
import { LeaderboardCard } from '@/components/leaderboard-card';
import { weeklyLeaderboard } from '@/lib/leaderboard';
import { essayFor, viewerIsStaff } from '@/lib/content/service';
import { longDate } from '@/lib/onboarding/rules';
import { LEVEL_MIN_ANSWERS, SKILL_LEVELS, currentSkillLevel } from '@/lib/learning/skill-level';

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
  // Where an area is practised: the first published module that draws on it.
  const moduleFor = (domainSlug: string) =>
    modules.find((m) => m.total > 0 && m.module.domains.includes(domainSlug)) ?? null;
  const domainSlugById = new Map((domains ?? []).map((d) => [d.id as string, d.slug as string]));
  const areas: Area[] = overview.skillMap.map((entry) => ({
    slug: entry.slug,
    name: entry.name,
    score: entry.score,
    attempts: entry.attempts,
    practice: moduleFor(entry.slug)
      ? { href: `/modules/${moduleFor(entry.slug)!.module.slug}`, label: `Practise in ${moduleFor(entry.slug)!.module.name}` }
      : null,
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
  const rightInAll = history.reduce((sum, d) => sum + d.right, 0);
  // The level in a word (skill-level.ts), from the same answers as Accuracy.
  const skill = marks === null ? null : currentSkillLevel(rightInAll, answeredInAll);
  const conceptsMet = concepts.length;
  const dueNow = concepts.filter((c) => {
    const due = dueByConcept.get(c.id);
    return due && new Date(due) <= new Date();
  }).length;

  // What to practise next, each one traceable to a result shown on this
  // page: certain-and-wrong concepts first (a belief to correct), then the
  // weakest area with enough answers to mean something, then reviews due,
  // then a module begun and not finished. Never more than three.
  const MIN_AREA_ANSWERS = 5;
  const weakest = [...areas]
    .filter((a) => a.attempts >= MIN_AREA_ANSWERS && a.score < 70)
    .sort((a, b) => a.score - b.score)[0];
  const inProgress = modules.find((m) => m.total > 0 && m.answered > 0 && !m.complete);
  const next: Array<{ key: string; title: string; why: string; href: string; action: string }> = [
    ...blindSpots.slice(0, 2).map((c) => {
      const m = moduleFor(domainSlugById.get(c.domainId) ?? '');
      return {
        key: `blind-${c.slug}`,
        title: c.name,
        why: `Answered wrong ${c.confidentAndWrong} ${c.confidentAndWrong === 1 ? 'time' : 'times'} while marked Certain`,
        href: m ? `/modules/${m.module.slug}` : '/dashboard#training',
        action: m ? 'Practise' : 'Today’s questions',
      };
    }),
    ...(weakest
      ? [
          {
            key: `area-${weakest.slug}`,
            title: weakest.name,
            why: `Right on ${weakest.score}% of ${weakest.attempts} answers, your lowest area`,
            href: weakest.practice?.href ?? '/dashboard#training',
            action: weakest.practice ? 'Practise' : 'Today’s questions',
          },
        ]
      : []),
    ...(overview.dueCount > 0
      ? [
          {
            key: 'due',
            title: `${overview.dueCount} ${overview.dueCount === 1 ? 'concept is' : 'concepts are'} due for review`,
            why: 'Your daily questions bring them back',
            href: '/dashboard#training',
            action: 'Today’s questions',
          },
        ]
      : []),
    ...(inProgress
      ? [
          {
            key: `module-${inProgress.module.slug}`,
            title: `Continue ${inProgress.module.name}`,
            why: `${inProgress.correctOnce} of ${inProgress.total} questions right`,
            href: `/modules/${inProgress.module.slug}`,
            action: 'Continue',
          },
        ]
      : []),
  ].slice(0, 3);
  const published = modules.filter((m) => m.total > 0);
  const modulesDone = published.filter((m) => m.complete).length;
  const days = history.length;

  const stat = 'rounded-xl border border-rule bg-paper-raised p-4';
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Progress"
        title="Your progress"
        description={`${COUNTRY_LABELS[profile.country]} · what you have answered, what you have finished, and what to practise next.`}
      />

      {/* Three different measures, side by side and named apart: how often
          right, how much finished, how steady, and the level in a word. XP is
          effort, not accuracy, and stays on the leaderboard. */}
      <section aria-labelledby="summary">
        <h2 id="summary" className="sr-only">
          Summary
        </h2>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className={stat}>
            <dt className="text-xs font-medium text-muted">Accuracy</dt>
            <dd className="mt-1 font-serif text-2xl leading-none tabular-nums">
              {marks === null || !last ? '–' : `${last.overall}%`}
            </dd>
            <dd className="mt-1.5 text-xs text-muted">
              {marks === null
                ? 'Could not be read just now'
                : answeredInAll === 0
                  ? 'No answers yet'
                  : `${rightInAll} of ${answeredInAll} answers right`}
            </dd>
          </div>
          <div className={stat}>
            <dt className="text-xs font-medium text-muted">Modules complete</dt>
            <dd className="mt-1 font-serif text-2xl leading-none tabular-nums">
              {published.length === 0 ? '–' : `${modulesDone} of ${published.length}`}
            </dd>
            <dd className="mt-1.5 text-xs text-muted">
              {published.length === 0 ? 'None published yet' : 'Every question right once'}
            </dd>
          </div>
          <div className={stat}>
            <dt className="text-xs font-medium text-muted">Streak</dt>
            <dd className="mt-1 font-serif text-2xl leading-none tabular-nums">
              {overview.currentStreak} {overview.currentStreak === 1 ? 'day' : 'days'}
            </dd>
            <dd className="mt-1.5 text-xs text-muted">Best {overview.longestStreak}</dd>
          </div>
          <div className={stat}>
            <dt className="text-xs font-medium text-muted">Your level</dt>
            <dd className="mt-1 font-serif text-2xl leading-none">
              {skill ? SKILL_LEVELS[skill].name : '–'}
            </dd>
            <dd className="mt-1.5 text-xs text-muted">
              {skill
                ? `${SKILL_LEVELS[skill].range}. ${SKILL_LEVELS[skill].meaning}`
                : marks === null
                  ? 'Could not be read just now'
                  : `Shows after ${LEVEL_MIN_ANSWERS} answers`}
            </dd>
          </div>
        </dl>
      </section>

      {!hasData ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rule bg-paper-raised px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="font-sans text-[0.9375rem] font-semibold">Nothing measured by topic yet</h2>
            <p className="text-sm text-slate">
              {!open
                ? 'This fills in once questions are published and you have trained on them.'
                : profile.diagnosticCompletedAt
                  ? 'Your diagnostic is done; scores by topic fill in as you train.'
                  : 'Take the diagnostic and a first session, and this fills in.'}
            </p>
          </div>
          {!open ? null : profile.diagnosticCompletedAt ? (
            <ButtonLink href="/dashboard" variant="outline" size="sm">
              Go to Today
            </ButtonLink>
          ) : (
            <ButtonLink href="/diagnostic" variant="accent" size="sm">
              Take the diagnostic
            </ButtonLink>
          )}
        </section>
      ) : (
        <section aria-labelledby="practise-next">
          <h2 id="practise-next" className="mb-3 text-xl">
            What to practise next
          </h2>
          {next.length === 0 ? (
            <p className="rounded-xl border border-rule bg-paper-raised px-4 py-3.5 text-sm text-slate sm:px-5">
              Nothing stands out yet. Keep answering your daily questions; this fills in as patterns appear.
            </p>
          ) : (
            <ul className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-paper-raised">
              {next.map((n) => (
                <li key={n.key}>
                  <Link
                    href={n.href}
                    className="pressable flex min-h-14 items-center gap-4 px-4 py-3 hover:bg-paper-sunk/60 sm:px-5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{n.title}</span>
                      <span className="block text-sm text-muted">{n.why}</span>
                    </span>
                    <span className="shrink-0 text-sm font-medium text-periwinkle-ink">{n.action} ›</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {hasData ? (
        <section aria-labelledby="by-topic">
          <h2 id="by-topic" className="text-xl">
            Progress by topic
          </h2>
          <p className="mt-1 mb-3 text-sm text-slate">The share of your answers in each area that were right, and how many it is based on.</p>
          {overview.areaScoresUnavailable ? (
            <p className="max-w-2xl text-sm text-slate">
              Scores by area could not be read just now. Try again in a moment; your answers are all still recorded.
            </p>
          ) : (
            <AreaBreakdown areas={areas} />
          )}
        </section>
      ) : null}

      {/* A trend needs a few days of answers to be a trend. Before then, say
          what there is rather than draw a line through one point. */}
      {days > 0 ? (
        <section aria-labelledby="over-time">
          <h2 id="over-time" className="text-xl">
            Accuracy over time
          </h2>
          <p className="mt-1 mb-3 max-w-2xl text-sm text-slate">
            The share of all your answers that were right, counted from your first. A right answer
            moves it up and a wrong one moves it down; the more you have answered, the less any one
            answer moves it.
          </p>
          {days >= 3 ? (
            <div className="rounded-xl border border-rule bg-paper-raised p-4 sm:p-5">
              <ScoreHistoryChart days={history} />
            </div>
          ) : (
            <p className="rounded-xl border border-rule bg-paper-raised px-4 py-3.5 text-sm text-slate sm:px-5">
              {last ? `${last.overall}% of ${answeredInAll} ${answeredInAll === 1 ? 'answer' : 'answers'} right` : ''}
              {days === 1 ? ', all on one day' : `, over ${days} days`}. A trend line appears once you have answered on three days.
            </p>
          )}
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
          title="Streak and XP"
          preview={`${overview.currentStreak} ${overview.currentStreak === 1 ? 'day' : 'days'} in a row · game level ${overview.level.level}, ${overview.level.name}`}
        >
          {/* The game: kept apart from the skill level above, because XP
              counts effort, not how often somebody is right. */}
          <p className="mb-4 text-sm text-slate">
            Game level {overview.level.level}, {overview.level.name} · {overview.weeklyXp} XP this week. XP
            counts effort, not accuracy.
          </p>
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
