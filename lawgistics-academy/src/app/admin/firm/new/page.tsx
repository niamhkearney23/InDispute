import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/admin/guard';
import { saveFirmModule } from '../actions';
import { FirmModuleForm } from '../firm-module-form';

export const metadata: Metadata = { title: 'New firm module' };

export default async function NewFirmModulePage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">Firm induction</p>
        <h1 className="text-3xl">Write one</h1>
      </div>

      <FirmModuleForm
        action={saveFirmModule}
        submitLabel="Create"
        initial={{
          slug: '',
          name: '',
          summary: '',
          kind: 'policy',
          country: 'ALL',
          required: true,
          position: 0,
          published: false,
          body: '',
          version: null,
        }}
      />
    </div>
  );
}
