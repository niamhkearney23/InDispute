import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/guard';
import { loadTaxonomy } from '@/lib/admin/taxonomy';
import { createServiceClient } from '@/lib/supabase/service';
import { Card, Notice, Pill } from '@/components/ui';
import { transitionFact, updateFact } from '../actions';
import { FactForm } from '../fact-form';

export const metadata: Metadata = { title: 'Edit fact' };

export default async function EditFactPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;

  const db = createServiceClient();

  const [{ data: fact }, { domains }] = await Promise.all([
    db.from('daily_facts').select('*').eq('id', id).maybeSingle(),
    loadTaxonomy(),
  ]);

  if (!fact) notFound();

  const verified = fact.verification_status === 'human_verified';

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Pill tone={fact.status === 'published' ? 'correct' : 'neutral'}>
            {fact.status}
          </Pill>
          <Pill tone={verified ? 'correct' : 'warn'}>
            {verified ? 'Human verified' : 'Not verified'}
          </Pill>
          <span className="text-xs text-muted">rotation #{fact.sort_order}</span>
        </div>
        <h1 className="max-w-2xl text-2xl">{fact.title}</h1>
        <p className="mt-1 font-mono text-xs text-muted">{fact.slug}</p>
      </div>

      {error === 'verify_first' ? (
        <Notice tone="error">
          This fact cannot be published until it has been verified. Verification is a
          statement by a person that the content is correct.
        </Notice>
      ) : null}

      <Card>
        <p className="eyebrow mb-3">Workflow</p>
        <div className="flex flex-wrap gap-2">
          <TransitionButton
            factId={id}
            action="verify"
            label="I have verified this content"
            disabled={verified}
            emphasis
          />
          <TransitionButton
            factId={id}
            action="publish"
            label="Publish"
            disabled={fact.status === 'published' || !verified}
          />
          <TransitionButton
            factId={id}
            action="unpublish"
            label="Unpublish"
            disabled={fact.status !== 'published'}
          />
          <TransitionButton
            factId={id}
            action="retire"
            label="Retire"
            disabled={fact.status === 'retired'}
          />
        </div>
        {!verified ? (
          <p className="mt-3 text-xs text-muted">
            Publishing is blocked until this fact is verified.
          </p>
        ) : null}
      </Card>

      <FactForm
        action={updateFact}
        submitLabel="Save changes"
        domains={domains}
        initial={{
          factId: id,
          slug: fact.slug,
          title: fact.title,
          body: fact.body,
          whyItMatters: fact.why_it_matters ?? '',
          jurisdiction: fact.jurisdiction,
          court: fact.court ?? '',
          domainId: fact.domain_id ?? '',
          sourceReference: fact.source_reference ?? '',
          sourceUrl: fact.source_url ?? '',
          sourceCheckedOn: fact.source_checked_on ?? '',
          sortOrder: fact.sort_order,
        }}
      />
    </div>
  );
}

function TransitionButton({
  factId,
  action,
  label,
  disabled,
  emphasis,
}: {
  factId: string;
  action: string;
  label: string;
  disabled?: boolean;
  emphasis?: boolean;
}) {
  return (
    <form action={transitionFact}>
      <input type="hidden" name="factId" value={factId} />
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
