import type { Metadata } from 'next';
import { requireCoach } from '@/lib/admin/guard';
import { saveTrainee } from '../actions';
import { TraineeForm } from '../trainee-form';

export const metadata: Metadata = { title: 'Add trainee' };
export const dynamic = 'force-dynamic';

export default async function NewTraineePage() {
  await requireCoach();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">New</p>
        <h1 className="text-3xl">Add a trainee</h1>
      </div>

      <TraineeForm
        action={saveTrainee}
        submitLabel="Add"
        initial={{ fullName: '', firmName: '', notes: '' }}
      />
    </div>
  );
}
