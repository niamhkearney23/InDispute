import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireCoach } from '@/lib/admin/guard';
import { getTrainee } from '@/lib/certification/service';
import { saveTrainee } from '../../actions';
import { TraineeForm } from '../../trainee-form';

export const metadata: Metadata = { title: 'Edit trainee' };
export const dynamic = 'force-dynamic';

export default async function EditTraineePage({
  params,
}: {
  params: Promise<{ traineeId: string }>;
}) {
  await requireCoach();
  const { traineeId } = await params;

  const trainee = await getTrainee(traineeId);
  if (!trainee) notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">Editing</p>
        <h1 className="text-3xl">{trainee.fullName}</h1>
      </div>

      <TraineeForm
        action={saveTrainee}
        submitLabel="Save"
        initial={{
          id: trainee.id,
          fullName: trainee.fullName,
          firmName: trainee.firmName,
          notes: trainee.notes,
        }}
      />
    </div>
  );
}
