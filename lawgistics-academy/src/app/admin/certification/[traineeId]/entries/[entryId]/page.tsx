import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireCoach } from '@/lib/admin/guard';
import { entriesForTrainee, getTrainee } from '@/lib/certification/service';
import { certificationBox } from '@/content/seed/certification-boxes';
import { saveCertificationEntry } from '../../../actions';
import { EntryForm } from '../../../entry-form';

export const metadata: Metadata = { title: 'Edit entry' };
export const dynamic = 'force-dynamic';

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ traineeId: string; entryId: string }>;
}) {
  await requireCoach();
  const { traineeId, entryId } = await params;

  const trainee = await getTrainee(traineeId);
  if (!trainee) notFound();

  const entry = (await entriesForTrainee(traineeId)).find((e) => e.id === entryId);
  if (!entry) notFound();

  const box = certificationBox(entry.boxNumber);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">{trainee.fullName}</p>
        <h1 className="text-3xl">
          Box {entry.boxNumber}
          {box ? `: ${box.workProduct}` : ''}
        </h1>
      </div>

      <EntryForm
        action={saveCertificationEntry}
        submitLabel="Save"
        initial={{
          id: entry.id,
          traineeId: trainee.id,
          boxNumber: entry.boxNumber,
          caseNo: entry.caseNo,
          courtFileRef: entry.courtFileRef,
          caseTypeStage: entry.caseTypeStage,
          dateIn: entry.dateIn,
          draftBack: entry.draftBack ?? '',
          grade: entry.grade ?? '',
          screeningConfirmed: entry.screeningConfirmed,
          note: entry.note,
        }}
      />
    </div>
  );
}
