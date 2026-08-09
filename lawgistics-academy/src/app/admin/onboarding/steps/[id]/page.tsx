import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/guard';
import { getStepForAdmin } from '@/lib/onboarding/service';
import { listFirmModulesForAdmin } from '@/lib/firm/service';
import { saveStep } from '../../actions';
import { StepForm } from '../step-form';

export const metadata: Metadata = { title: 'Edit an item' };

export default async function EditStepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();

  const [step, modules] = await Promise.all([getStepForAdmin(id), listFirmModulesForAdmin()]);
  if (!step) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section>
        <p className="eyebrow mb-2">The checklist</p>
        <h1 className="text-3xl">{step.title}</h1>
        <p className="mt-3 text-slate">
          Editing this changes what everybody sees. It does not undo anything already
          recorded: what somebody has said they did, and what the firm confirmed, stay as they
          were.
        </p>
      </section>

      <StepForm
        action={saveStep}
        submitLabel="Save it"
        modules={modules.map((m) => ({
          id: m.id,
          name: m.name,
          published: m.published,
          hasContent: m.body.trim().length > 0,
        }))}
        initial={{
          stepId: step.id,
          slug: step.slug,
          title: step.title,
          detail: step.detail,
          kind: step.kind,
          firmModuleId: step.firmModuleId ?? '',
          needsFirmCheck: step.needsFirmCheck,
          country: step.country ?? 'ALL',
          required: step.required,
          position: step.position,
          published: step.published,
        }}
      />
    </div>
  );
}
