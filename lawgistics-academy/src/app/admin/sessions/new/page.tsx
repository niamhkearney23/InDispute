import type { Metadata } from 'next';
import { requireCoach } from '@/lib/admin/guard';
import { saveSession } from '../actions';
import { SessionForm } from '../session-form';

export const metadata: Metadata = { title: 'New session' };
export const dynamic = 'force-dynamic';

export default async function NewSessionPage() {
  await requireCoach();

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">New</p>
        <h1 className="text-3xl">Put a session up</h1>
      </div>

      <SessionForm
        action={saveSession}
        submitLabel="Save"
        initial={{
          title: '',
          summary: '',
          url: '',
          country: 'ALL',
          airsOn: '',
          published: false,
        }}
      />
    </div>
  );
}
