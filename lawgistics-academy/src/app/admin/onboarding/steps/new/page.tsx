import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/guard';
import { listFirmModulesForAdmin } from '@/lib/firm/service';
import { saveStep } from '../../actions';
import { StepForm } from '../step-form';

export const metadata: Metadata = { title: 'Add an item' };

export default async function NewStepPage() {
  await requireAdmin();
  const modules = await listFirmModulesForAdmin();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section>
        <p className="eyebrow mb-2">The checklist</p>
        <h1 className="text-3xl">Add an item</h1>
      </section>

      <StepForm
        action={saveStep}
        submitLabel="Add it"
        modules={modules.map((m) => ({
          id: m.id,
          name: m.name,
          published: m.published,
          hasContent: m.body.trim().length > 0,
        }))}
        initial={{
          slug: '',
          title: '',
          detail: '',
          kind: 'task',
          firmModuleId: '',
          needsFirmCheck: true,
          country: 'ALL',
          required: true,
          position: 0,
          published: false,
        }}
      />
    </div>
  );
}
