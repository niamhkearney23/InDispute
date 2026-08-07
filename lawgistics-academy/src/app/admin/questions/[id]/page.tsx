import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/guard';
import { loadTaxonomy } from '@/lib/admin/taxonomy';
import { createServiceClient } from '@/lib/supabase/service';
import { Card, Notice, Pill } from '@/components/ui';
import { transitionQuestion, updateQuestion } from '../../actions';
import { QuestionForm } from '../../question-form';
import type { QuestionStatus, QuestionOption } from '@/lib/types';

export const metadata: Metadata = { title: 'Edit question' };

export default async function EditQuestionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { created, error } = await searchParams;

  const db = createServiceClient();

  const { data: question } = await db
    .from('questions')
    .select('id, slug, status, domain_id')
    .eq('id', id)
    .maybeSingle();

  if (!question) notFound();

  const [{ data: versions }, { data: conceptLinks }, { data: skillLinks }, taxonomy] =
    await Promise.all([
      db
        .from('question_versions')
        .select('*')
        .eq('question_id', id)
        .order('version', { ascending: false }),
      db.from('question_concepts').select('concept_id').eq('question_id', id),
      db.from('question_skills').select('skill_id').eq('question_id', id),
      loadTaxonomy(),
    ]);

  const current = (versions ?? []).find((v) => v.is_current);
  if (!current) notFound();

  const status = question.status as QuestionStatus;
  const verified = current.verification_status === 'human_verified';

  const { count: attemptCount } = await db
    .from('user_question_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('question_id', id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Pill tone={status === 'published' ? 'correct' : 'neutral'}>{status}</Pill>
            <Pill tone={verified ? 'correct' : 'warn'}>
              {verified ? 'Human verified' : 'Not verified'}
            </Pill>
            <span className="text-xs text-muted">
              v{current.version} · {versions?.length ?? 1} version
              {(versions?.length ?? 1) === 1 ? '' : 's'}
            </span>
          </div>
          <h1 className="max-w-2xl text-2xl">{current.stem}</h1>
          <p className="mt-1 font-mono text-xs text-muted">{question.slug}</p>
        </div>
      </div>

      {created ? <Notice tone="neutral">Draft created.</Notice> : null}
      {error === 'verify_first' ? (
        <Notice tone="error">
          This question cannot be published until it has been verified. Verification is a
          statement by a person that the legal content is correct; it is not something the
          system can do for you.
        </Notice>
      ) : null}

      {/* Workflow ------------------------------------------------------- */}
      <Card>
        <p className="eyebrow mb-3">Workflow</p>
        <p className="mb-4 text-sm text-slate">
          Draft → Requires review → Verified → Published. Verification is recorded against
          this version, so any later rewrite has to be signed off again.
        </p>
        <div className="flex flex-wrap gap-2">
          <TransitionButton
            questionId={id}
            action="submit_for_review"
            label="Send for review"
            disabled={status === 'requires_review'}
          />
          <TransitionButton
            questionId={id}
            action="verify"
            label="I have verified this content"
            disabled={verified}
            emphasis
          />
          <TransitionButton
            questionId={id}
            action="publish"
            label="Publish"
            disabled={status === 'published' || !verified}
          />
          <TransitionButton
            questionId={id}
            action="unpublish"
            label="Unpublish"
            disabled={status !== 'published'}
          />
          <TransitionButton
            questionId={id}
            action="retire"
            label="Retire"
            disabled={status === 'retired'}
          />
        </div>
        {!verified ? (
          <p className="mt-3 text-xs text-muted">
            Publishing is blocked until this version is verified.
          </p>
        ) : null}
      </Card>

      {/* Version history ------------------------------------------------ */}
      {(versions?.length ?? 0) > 1 ? (
        <Card>
          <p className="eyebrow mb-3">Version history</p>
          <p className="mb-3 text-sm text-slate">
            {attemptCount ?? 0} recorded attempt{(attemptCount ?? 0) === 1 ? '' : 's'} across
            all versions. Historical attempts stay bound to the version the learner saw.
          </p>
          <ul className="divide-y divide-rule text-sm">
            {(versions ?? []).map((version) => (
              <li key={version.id} className="flex items-baseline gap-3 py-2">
                <span className="font-serif tabular-nums">v{version.version}</span>
                <span className="min-w-0 flex-1 truncate text-slate">{version.stem}</span>
                {version.is_current ? <Pill tone="accent">Current</Pill> : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <QuestionForm
        action={updateQuestion}
        submitLabel="Save changes"
        domains={taxonomy.domains}
        concepts={taxonomy.concepts}
        skills={taxonomy.skills}
        initial={{
          questionId: id,
          slug: question.slug,
          domainId: question.domain_id,
          questionType: current.question_type,
          difficulty: current.difficulty,
          jurisdiction: current.jurisdiction,
          court: current.court ?? '',
          scenario: current.scenario ?? '',
          stem: current.stem,
          options: (current.options ?? []) as QuestionOption[],
          correctOptionIds: current.correct_option_ids ?? [],
          explanation: current.explanation,
          whyItMatters: current.why_it_matters ?? '',
          commonMisconception: current.common_misconception ?? '',
          memoryTrick: current.memory_trick ?? '',
          sourceReference: current.source_reference ?? '',
          sourceUrl: current.source_url ?? '',
          sourceCheckedOn: current.source_checked_on ?? '',
          conceptIds: (conceptLinks ?? []).map((l) => l.concept_id as string),
          skillIds: (skillLinks ?? []).map((l) => l.skill_id as string),
        }}
      />
    </div>
  );
}

function TransitionButton({
  questionId,
  action,
  label,
  disabled,
  emphasis,
}: {
  questionId: string;
  action: string;
  label: string;
  disabled?: boolean;
  emphasis?: boolean;
}) {
  return (
    <form action={transitionQuestion}>
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="action" value={action} />
      <button
        type="submit"
        disabled={disabled}
        className={
          emphasis
            ? 'rounded-[5px] bg-burgundy px-3.5 py-2 text-sm font-medium text-paper hover:bg-burgundy-soft disabled:opacity-40'
            : 'rounded-[5px] border border-rule-strong px-3.5 py-2 text-sm hover:bg-paper-sunk disabled:opacity-40'
        }
      >
        {label}
      </button>
    </form>
  );
}
