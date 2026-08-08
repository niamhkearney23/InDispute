import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/guard';
import { getFirmModuleForAdmin } from '@/lib/firm/service';
import { ButtonLink } from '@/components/ui';
import { saveFirmModule } from '../actions';
import { FirmModuleForm } from '../firm-module-form';

export const metadata: Metadata = { title: 'Edit firm module' };

export default async function EditFirmModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const definition = await getFirmModuleForAdmin(id);
  if (!definition) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Firm induction</p>
          <h1 className="text-3xl">{definition.name}</h1>
        </div>
        <ButtonLink href={`/admin/firm/${definition.id}/record`} variant="outline" size="sm">
          Who has read it
        </ButtonLink>
      </div>

      <FirmModuleForm
        action={saveFirmModule}
        submitLabel="Save"
        initial={{
          moduleId: definition.id,
          slug: definition.slug,
          name: definition.name,
          summary: definition.summary,
          kind: definition.kind,
          country: definition.country ?? 'ALL',
          required: definition.required,
          position: definition.position,
          published: definition.published,
          body: definition.body,
          version: definition.version,
        }}
      />
    </div>
  );
}
