import type { Metadata } from 'next';
import { requireCoach } from '@/lib/admin/guard';
import { allSessions } from '@/lib/lessons/sessions';
import { saveWorkPost } from '../actions';
import { WorkPostForm } from '../work-post-form';

export const metadata: Metadata = { title: 'Post work' };
export const dynamic = 'force-dynamic';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The intake page links here with a certification piece's title,
 * instructions and due date in the address. It fills in fields the coach
 * can see and change; the save action validates everything as usual.
 */
export default async function NewWorkPostPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string; instructions?: string; dueOn?: string; maxClaims?: string }>;
}) {
  await requireCoach();
  const q = await searchParams;
  const prefilled = Boolean(q.title);
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
          title: (q.title ?? '').slice(0, 200),
          instructions: (q.instructions ?? '').slice(0, 5000),
          fileName: null,
          linkUrl: '',
          hasMemo: false,
          // Each trainee does their own certification piece.
          maxClaims: prefilled && q.maxClaims === '0' ? 0 : 1,
          expectedMinutes: null,
          traineesOnly: true,
          country: 'ALL',
          dueOn: q.dueOn && DAY_RE.test(q.dueOn) ? q.dueOn : '',
          sessionId: '',
          homeworkDay: null,
          published: prefilled,
        }}
      />
    </div>
  );
}
