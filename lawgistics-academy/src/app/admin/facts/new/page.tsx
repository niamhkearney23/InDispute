import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/guard';
import { loadTaxonomy } from '@/lib/admin/taxonomy';
import { createFact } from '../actions';
import { FactForm } from '../fact-form';
import { createServiceClient } from '@/lib/supabase/service';

export const metadata: Metadata = { title: 'New fact' };

export default async function NewFactPage() {
  await requireAdmin();
  const { domains } = await loadTaxonomy();

  // Append to the end of the rotation by default.
  const db = createServiceClient();
  const { data: last } = await db
    .from('daily_facts')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">New</p>
        <h1 className="text-3xl">Draft a fact</h1>
        <p className="mt-2 max-w-2xl text-slate">
          Saved as a draft. As with questions, publishing is refused until a person has
          verified it.
        </p>
      </div>

      <FactForm
        action={createFact}
        submitLabel="Save draft"
        domains={domains}
        initial={{
          slug: '',
          title: '',
          body: '',
          whyItMatters: '',
          jurisdiction: 'AU_GENERAL',
          court: '',
          domainId: '',
          sourceReference: '',
          sourceUrl: '',
          sourceCheckedOn: '',
          sortOrder: ((last?.sort_order as number) ?? -1) + 1,
        }}
      />
    </div>
  );
}
