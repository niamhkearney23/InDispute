import type { Metadata } from 'next';
import { requireCoach } from '@/lib/admin/guard';
import { allSessions } from '@/lib/lessons/sessions';
import { saveWorkPost } from '../actions';
import { WorkPostForm } from '../work-post-form';

export const metadata: Metadata = { title: 'Post work' };
export const dynamic = 'force-dynamic';

export default async function NewWorkPostPage() {
  await requireCoach();
  const sessions = (await allSessions()).map((s) => ({ id: s.id, title: s.title }));

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">New</p>
        <h1 className="text-3xl">Post a piece of work</h1>
      </div>

      <WorkPostForm
        action={saveWorkPost}
        sessions={sessions}
        submitLabel="Save"
        initial={{
          kind: 'task',
          title: '',
          instructions: '',
          fileName: null,
          linkUrl: '',
          hasMemo: false,
          maxClaims: 1,
          expectedMinutes: null,
          traineesOnly: true,
          country: 'ALL',
          dueOn: '',
          sessionId: '',
          homeworkDay: null,
          published: false,
        }}
      />
    </div>
  );
}
